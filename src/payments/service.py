from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.db.models import (
    Booking,
    BookingStatus,
    Payment,
    PaymentStatus,
    User,
    Trip,
)
from src.celery_tasks import send_email


async def create_payment(
    session: AsyncSession,
    current_user: User,
    data,
) -> Payment:

    booking = await session.get(Booking, data.booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.passenger_id != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot pay for another user's booking",
        )

    if booking.status == BookingStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is cancelled",
        )

    existing = await session.execute(
        select(Payment).where(
            Payment.booking_id == data.booking_id,
            Payment.status.in_([PaymentStatus.pending, PaymentStatus.completed]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending or completed payment already exists for this booking",
        )

    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive",
        )

    payment = Payment(
        booking_id=data.booking_id,
        amount=data.amount,
        status=PaymentStatus.pending,
    )

    session.add(payment)
    await session.commit()
    await session.refresh(payment)

    return payment


async def confirm_payment(
    session: AsyncSession,
    current_user: User,
    payment_id: int,
) -> Payment:

    payment = await session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status != PaymentStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is already {payment.status}",
        )

    booking = await session.get(Booking, payment.booking_id)
    trip = await session.get(Trip, booking.trip_id)

    if trip.driver_id != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip driver can confirm payment",
        )

    payment.status = PaymentStatus.completed
    session.add(payment)
    await session.commit()
    await session.refresh(payment)

    passenger = await session.get(User, booking.passenger_id)
    send_email.delay(
        recipients=[passenger.email],
        subject="Payment Confirmed - Taxi System",
        body=f"""
        Dear {passenger.username},

        Your payment for booking #{booking.id} has been confirmed by the driver.

        Payment Details:
        - Payment ID: #{payment.id}
        - Amount: ${payment.amount}
        - Trip: {trip.origin} -> {trip.destination}
        - Status: Completed

        Thank you for using Taxi System!
        """,
    )

    return payment


async def fail_payment(
    session: AsyncSession,
    current_user: User,
    payment_id: int,
) -> Payment:

    payment = await session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status != PaymentStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is already {payment.status}",
        )

    booking = await session.get(Booking, payment.booking_id)
    trip = await session.get(Trip, booking.trip_id)

    if trip.driver_id != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip driver can mark payment as failed",
        )

    payment.status = PaymentStatus.failed
    session.add(payment)
    await session.commit()
    await session.refresh(payment)

    passenger = await session.get(User, booking.passenger_id)
    send_email.delay(
        recipients=[passenger.email],
        subject="Payment Failed - Taxi System",
        body=f"""
        Dear {passenger.username},

        Your payment for booking #{booking.id} has been marked as failed.

        Please contact the driver or support for assistance.

        Trip: {trip.origin} -> {trip.destination}

        Taxi System Support Team
        """,
    )

    return payment


async def get_payment(
    session: AsyncSession,
    current_user: User,
    payment_id: int,
) -> Payment:

    payment = await session.get(Payment, payment_id)

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    booking = await session.get(Booking, payment.booking_id)

    if booking.passenger_id != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this payment",
        )

    return payment


async def list_payments(
    session: AsyncSession,
    current_user: User,
    booking_id: int,
):

    booking = await session.get(Booking, booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    trip = await session.get(Trip, booking.trip_id)
    is_passenger = booking.passenger_id == current_user.uid
    is_driver = trip and trip.driver_id == current_user.uid

    if not is_passenger and not is_driver:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access payments for this booking",
        )

    res = await session.execute(
        select(Payment).where(Payment.booking_id == booking_id)
    )

    return res.scalars().all()
