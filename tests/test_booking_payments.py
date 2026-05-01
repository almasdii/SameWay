import pytest
from httpx import AsyncClient

from tests.conftest import (
    make_driver_with_car,
    make_route_points,
    make_trip,
    make_user,
)
from src.db.models import UserRole



@pytest.mark.asyncio
async def test_create_booking(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)

    passenger, token = await make_user(db, role=UserRole.passenger)

    resp = await client.post(
        "/bookings",
        json={
            "trip_id": trip.id,
            "pickup_route_id": pickup.id,
            "dropoff_route_id": dropoff.id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["trip_id"] == trip.id
    assert data["status"] == "confirmed"


@pytest.mark.asyncio
async def test_duplicate_booking_forbidden(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, token = await make_user(db, role=UserRole.passenger)

    await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_driver_cannot_book_own_trip(client: AsyncClient, db):
    driver, token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)

    resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cancel_booking(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    booking_id = book_resp.json()["id"]

    resp = await client.post(
        f"/bookings/{booking_id}/cancel",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_cancel_booking_after_trip_started(client: AsyncClient, db):
    driver, driver_token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, pass_token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    booking_id = book_resp.json()["id"]

    await client.post(f"/trips/{trip.id}/start", headers={"Authorization": f"Bearer {driver_token}"})

    resp = await client.post(
        f"/bookings/{booking_id}/cancel",
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_my_bookings(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, token = await make_user(db, role=UserRole.passenger)

    await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )

    resp = await client.get("/bookings/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1



@pytest.mark.asyncio
async def test_create_payment_pending(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    booking_id = book_resp.json()["id"]

    resp = await client.post(
        "/payments",
        json={"booking_id": booking_id, "amount": 5000.0},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_duplicate_payment_forbidden(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    booking_id = book_resp.json()["id"]

    await client.post("/payments", json={"booking_id": booking_id, "amount": 5000.0},
                      headers={"Authorization": f"Bearer {token}"})
    resp = await client.post("/payments", json={"booking_id": booking_id, "amount": 5000.0},
                              headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_driver_confirms_payment(client: AsyncClient, db):
    driver, driver_token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, pass_token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    booking_id = book_resp.json()["id"]

    pay_resp = await client.post(
        "/payments",
        json={"booking_id": booking_id, "amount": 5000.0},
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    payment_id = pay_resp.json()["id"]

    resp = await client.post(
        f"/payments/{payment_id}/confirm",
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_driver_fails_payment(client: AsyncClient, db):
    driver, driver_token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, pass_token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    booking_id = book_resp.json()["id"]

    pay_resp = await client.post(
        "/payments",
        json={"booking_id": booking_id, "amount": 5000.0},
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    payment_id = pay_resp.json()["id"]

    resp = await client.post(
        f"/payments/{payment_id}/fail",
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "failed"


@pytest.mark.asyncio
async def test_passenger_cannot_confirm_payment(client: AsyncClient, db):
    driver, _, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    booking_id = book_resp.json()["id"]
    pay_resp = await client.post(
        "/payments",
        json={"booking_id": booking_id, "amount": 5000.0},
        headers={"Authorization": f"Bearer {token}"},
    )
    payment_id = pay_resp.json()["id"]

    resp = await client.post(
        f"/payments/{payment_id}/confirm",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_confirm_already_completed_payment(client: AsyncClient, db):
    driver, driver_token, car = await make_driver_with_car(db)
    trip = await make_trip(db, driver, car)
    pickup, dropoff = await make_route_points(db, trip)
    passenger, pass_token = await make_user(db, role=UserRole.passenger)

    book_resp = await client.post(
        "/bookings",
        json={"trip_id": trip.id, "pickup_route_id": pickup.id, "dropoff_route_id": dropoff.id},
        headers={"Authorization": f"Bearer {pass_token}"},
    )
    booking_id = book_resp.json()["id"]
    pay_resp = await client.post("/payments", json={"booking_id": booking_id, "amount": 5000.0},
                                  headers={"Authorization": f"Bearer {pass_token}"})
    payment_id = pay_resp.json()["id"]

    await client.post(f"/payments/{payment_id}/confirm", headers={"Authorization": f"Bearer {driver_token}"})
    resp = await client.post(f"/payments/{payment_id}/confirm", headers={"Authorization": f"Bearer {driver_token}"})
    assert resp.status_code == 400
