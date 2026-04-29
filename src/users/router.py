from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy import func
from sqlmodel import select
from src.errors.customErrors import UserNotFoundByEmail, AccessForbidden
from src.db.models import User, Trip, Booking, Payment, PaymentStatus
from src.dependencies import AsyncSessionDep, pagination_params, allow_admin, allow_driver, allow_driver_or_passenger, allow_passenger
from src.users.schema import UserCreateModel, UserRead, UserUpdate
from src.users.service import UserService
from src.auth.utils import AccessTokenBearer, RefreshTokenBearer, get_current_user

router = APIRouter(prefix="/users", tags=["users"])

user_service = (UserService())
access_token = (AccessTokenBearer())
refresh_token = (RefreshTokenBearer())


@router.get("", response_model=list[UserRead], dependencies=[Depends(access_token), Depends(allow_admin)])
async def list_all(
    session: AsyncSessionDep,
    pag: tuple[int, int] = Depends(pagination_params),
):
    limit, offset = pag
    stmt = select(User).limit(limit).offset(offset)
    res = await session.execute(stmt)
    return list(res.scalars().all())

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(access_token)])
async def remove_me(
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    await user_service.delete_user(session, current_user)
    return None

@router.patch("/me", response_model=UserRead, dependencies=[Depends(access_token)])
async def patch_me(
    data: UserUpdate,
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    return await user_service.update_user(session, current_user, data)

@router.get("/me", response_model=UserRead, dependencies=[Depends(access_token)])
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/search", response_model=list[UserRead], dependencies=[Depends(access_token)])
async def search(
    session: AsyncSessionDep,
    fullname: str = Query(..., min_length=1),
):
    if not session:
        raise HTTPException(status_code=500, detail="Database session not available")
    
    like = f"%{fullname}%"
    stmt = select(User).where((User.username.ilike(like)) | (User.surname.ilike(like)))
    res = await session.execute(stmt)
    return list(res.scalars().all())


@router.get("/{user_email}", response_model=UserRead, dependencies=[Depends(access_token)])
async def read(user_email: str, session: AsyncSessionDep, current_user: User = Depends(get_current_user)):
    user = await user_service.get_user_by_email(session, user_email)
    if current_user.email != user_email and current_user.role != "admin":
        raise AccessForbidden()
    if not user:
        raise UserNotFoundByEmail()
    return user

@router.patch("/{user_email}", response_model=UserRead, dependencies=[Depends(access_token)])
async def patch(user_email: str, data: UserUpdate, session: AsyncSessionDep, current_user: User = Depends(get_current_user)):
    user = await user_service.get_user_by_email(session, user_email)
    
    if not user:
        raise UserNotFoundByEmail()
    
    if current_user.email != user_email and current_user.role != "admin":
        raise AccessForbidden()
    
    return await user_service.update_user(session, user, data)


@router.delete("/{user_email}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(access_token)])
async def remove(user_email: str, session: AsyncSessionDep, current_user: User = Depends(get_current_user)):
    user = await user_service.get_user_by_email(session, user_email)
    if not user:
        raise UserNotFoundByEmail()

    if current_user.email != user_email and current_user.role != "admin":
        raise AccessForbidden()

    await user_service.delete_user(session, user)
    return None


@router.get("/me/driver-dashboard", dependencies=[Depends(access_token), Depends(allow_driver)])
async def driver_dashboard(
    session: AsyncSessionDep,
    current_user: User = Depends(get_current_user),
):
    trips_res = await session.execute(
        select(Trip.status, func.count(Trip.id))
        .where(Trip.driver_id == current_user.uid)
        .group_by(Trip.status)
    )
    trips_by_status = {str(k): v for k, v in trips_res.all()}

    completed_earnings = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0.0))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Trip, Booking.trip_id == Trip.id)
        .where(Trip.driver_id == current_user.uid, Payment.status == PaymentStatus.completed)
    )
    pending_earnings = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0.0))
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Trip, Booking.trip_id == Trip.id)
        .where(Trip.driver_id == current_user.uid, Payment.status == PaymentStatus.pending)
    )

    return {
        "trips_by_status": trips_by_status,
        "total_earnings": float(completed_earnings.scalar() or 0),
        "pending_earnings": float(pending_earnings.scalar() or 0),
    }


@router.get("/stats", dependencies=[Depends(access_token), Depends(allow_admin)])
async def admin_stats(session: AsyncSessionDep):
    users_res = await session.execute(
        select(User.role, func.count(User.uid)).group_by(User.role)
    )
    trips_res = await session.execute(
        select(Trip.status, func.count(Trip.id)).group_by(Trip.status)
    )
    bookings_res = await session.execute(
        select(Booking.status, func.count(Booking.id)).group_by(Booking.status)
    )
    total_revenue_res = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0.0))
        .where(Payment.status == PaymentStatus.completed)
    )
    pending_revenue_res = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0.0))
        .where(Payment.status == PaymentStatus.pending)
    )

    return {
        "users": {str(k): v for k, v in users_res.all()},
        "trips": {str(k): v for k, v in trips_res.all()},
        "bookings": {str(k): v for k, v in bookings_res.all()},
        "revenue": {
            "completed": float(total_revenue_res.scalar() or 0),
            "pending": float(pending_revenue_res.scalar() or 0),
        },
    }

