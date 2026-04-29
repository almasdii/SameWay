from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient

from tests.conftest import make_driver_with_car, make_trip, make_user
from src.db.models import UserRole


def future_iso(days: int = 1) -> str:
    return (datetime.utcnow() + timedelta(days=days)).isoformat()


@pytest.mark.asyncio
async def test_create_trip(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    resp = await client.post(
        "/trips",
        json={
            "origin": "Almaty",
            "destination": "Astana",
            "price_per_seat": 8000.0,
            "start_time": future_iso(),
            "car_id": car.id,
            "available_seats": 3,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["origin"] == "Almaty"
    assert data["destination"] == "Astana"
    assert data["status"] == "planned"


@pytest.mark.asyncio
async def test_create_trip_same_origin_destination(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    resp = await client.post(
        "/trips",
        json={
            "origin": "Almaty",
            "destination": "Almaty",
            "price_per_seat": 100.0,
            "start_time": future_iso(),
            "car_id": car.id,
            "available_seats": 2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_trip_past_start_time(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    past_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    resp = await client.post(
        "/trips",
        json={
            "origin": "Almaty",
            "destination": "Shymkent",
            "price_per_seat": 100.0,
            "start_time": past_time,
            "car_id": car.id,
            "available_seats": 2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_trip_passenger_forbidden(client: AsyncClient, db):
    _, token = await make_user(db, role=UserRole.passenger)
    resp = await client.post(
        "/trips",
        json={
            "origin": "A",
            "destination": "B",
            "price_per_seat": 100.0,
            "start_time": future_iso(),
            "car_id": 1,
            "available_seats": 2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_available_trips(client: AsyncClient):
    resp = await client.get("/trips/available")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_trip(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)

    resp = await client.get(f"/trips/{trip.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == trip.id


@pytest.mark.asyncio
async def test_get_trip_not_found(client: AsyncClient):
    resp = await client.get("/trips/999999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_start_trip(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)

    resp = await client.post(
        f"/trips/{trip.id}/start",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_start_trip_twice(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)

    await client.post(f"/trips/{trip.id}/start", headers={"Authorization": f"Bearer {token}"})
    resp = await client.post(f"/trips/{trip.id}/start", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_complete_trip(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)

    await client.post(f"/trips/{trip.id}/start", headers={"Authorization": f"Bearer {token}"})
    resp = await client.post(
        f"/trips/{trip.id}/complete",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_delete_planned_trip(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)

    resp = await client.delete(
        f"/trips/{trip.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_inprogress_trip_forbidden(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)

    await client.post(f"/trips/{trip.id}/start", headers={"Authorization": f"Bearer {token}"})
    resp = await client.delete(
        f"/trips/{trip.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_other_driver_cannot_start_trip(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    _, other_token = await make_user(db, role=UserRole.driver)

    resp = await client.post(
        f"/trips/{trip.id}/start",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert resp.status_code == 403
