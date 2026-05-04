from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from src.db.models import Trip,User
from src.dependencies import AsyncSessionDep, get_or_404, pagination_params,allow_driver
from src.trips.schema import TripCreate, TripRead, TripUpdate
from src.auth.utils import AccessTokenBearer,get_current_user
from src.trips.service import (
    create_trip,
    get_trip,
    list_trips,
    list_available_trips,
    update_trip,
    delete_trip,
    mark_trip_in_progress,
    mark_trip_completed,
    search_trips_by_routepoints,
)

router = APIRouter(prefix="/trips", tags=["trips"])
access_token = AccessTokenBearer()


def _enrich(trip: Trip) -> dict:
    d = TripRead.model_validate(trip).model_dump()
    if trip.driver:
        d['driver_username'] = trip.driver.username
        d['driver_phone'] = trip.driver.phone
        d['driver_rating'] = trip.driver.average_rating
    if trip.car:
        d['car_model'] = trip.car.model
        d['car_plate'] = trip.car.plate_number
    return d

@router.post(
    "",
    response_model=TripRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(access_token), Depends(allow_driver)],
)
async def create(
    data: TripCreate,
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    return await create_trip(session, current_user, data)


@router.get(
    "/me",
    response_model=list[TripRead],
    dependencies=[Depends(access_token), Depends(allow_driver)],
)
async def my_trips(
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    from sqlmodel import select as _sel
    stmt = _sel(Trip).where(Trip.driver_id == current_user.uid).order_by(Trip.created_at.desc())
    result = await session.execute(stmt)
    return [_enrich(t) for t in result.scalars().all()]


@router.get("/available", response_model=list[TripRead])
async def available(
    session: AsyncSessionDep,
    pag: tuple[int, int] = Depends(pagination_params),
):
    limit, offset = pag
    trips = await list_available_trips(session, limit=limit, offset=offset)
    return [_enrich(t) for t in trips]


@router.get("/search", response_model=list[TripRead])
async def search(
    session: AsyncSessionDep,
    from_location: str = Query(..., min_length=1, alias="from"),
    to_location: str = Query(..., min_length=1, alias="to"),
):
    trips = await search_trips_by_routepoints(session, from_location, to_location)
    return [_enrich(t) for t in trips]


@router.get("/{trip_id}", response_model=TripRead)
async def read(trip_id: int, session: AsyncSessionDep):
    trip = await get_trip(session, trip_id)
    if not trip:
        return await get_or_404(Trip, trip_id, session)
    return _enrich(trip)


@router.patch(
    "/{trip_id}",
    response_model=TripRead,
    dependencies=[Depends(access_token), Depends(allow_driver)],
)
async def patch(
    trip_id: int,
    data: TripUpdate,
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    trip = await get_or_404(Trip, trip_id, session)
    return await update_trip(session, current_user, trip, data)

@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(access_token), Depends(allow_driver)],
)
async def remove(
    trip_id: int,
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    trip = await get_or_404(Trip, trip_id, session)
    await delete_trip(session, current_user, trip)


@router.post(
    "/{trip_id}/start",
    response_model=TripRead,
    dependencies=[Depends(access_token), Depends(allow_driver)],
)
async def start(
    trip_id: int,
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    trip = await get_or_404(Trip, trip_id, session)
    return await mark_trip_in_progress(session, current_user, trip)


@router.post(
    "/{trip_id}/complete",
    response_model=TripRead,
    dependencies=[Depends(access_token), Depends(allow_driver)],
)
async def complete(
    trip_id: int,
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    trip = await get_or_404(Trip, trip_id, session)
    return await mark_trip_completed(session, current_user, trip)