import asyncio
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.auth.security import hash_password
from src.auth.utils import create_access_token
from src.db.models import Car, RoutePoint, RoutePointType, Trip, TripStatus, User, UserRole
from src.db.session import get_session
from src.main import app

TEST_DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/taxi_system_test"

test_engine = create_async_engine(TEST_DB_URL, echo=False, connect_args={"ssl": False})
TestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture()
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture()
async def client(db: AsyncSession):
    async def override_session():
        yield db

    app.dependency_overrides[get_session] = override_session

    with (
        patch("src.celery_tasks.send_email.delay"),
        patch("src.auth.utils.token_in_blocklist", new=AsyncMock(return_value=False)),
        patch("src.db.redis.add_jti_to_blocklist", new=AsyncMock()),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as c:
            yield c

    app.dependency_overrides.clear()


# ── helpers ──────────────────────────────────────────────────────────────────

def unique_email() -> str:
    return f"u_{uuid.uuid4().hex[:8]}@test.com"


async def make_user(
    db: AsyncSession,
    role: UserRole = UserRole.passenger,
    password: str = "password123",
    verified: bool = True,
) -> tuple[User, str]:
    """Insert a user directly and return (user, access_token)."""
    user = User(
        email=unique_email(),
        username=f"user_{uuid.uuid4().hex[:6]}",
        surname="Testov",
        phone="+70000000000",
        hashed_password=hash_password(password),
        role=role,
        is_verified=verified,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(
        user_data={"email": user.email, "uid": str(user.uid), "roles": user.role}
    )
    return user, token


async def make_driver_with_car(db: AsyncSession) -> tuple[User, str, Car]:
    driver, token = await make_user(db, role=UserRole.driver)
    car = Car(
        driver_id=driver.uid,
        model="Toyota Camry",
        plate_number=f"T{uuid.uuid4().hex[:7].upper()}",
        total_seats=4,
        is_active=True,
    )
    db.add(car)
    await db.commit()
    await db.refresh(car)
    return driver, token, car


async def make_trip(db: AsyncSession, driver: User, car: Car) -> Trip:
    trip = Trip(
        driver_id=driver.uid,
        car_id=car.id,
        origin="Almaty",
        destination="Shymkent",
        price_per_seat=5000.0,
        start_time=datetime.utcnow() + timedelta(days=1),
        available_seats=3,
        status=TripStatus.planned,
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


async def make_route_points(db: AsyncSession, trip: Trip) -> tuple[RoutePoint, RoutePoint]:
    """Create pickup and dropoff route points for a trip."""
    stop_time = trip.start_time + timedelta(hours=1)

    pickup = RoutePoint(
        trip_id=trip.id,
        location="Almaty Bus Station",
        time=stop_time,
        order=1,
        type=RoutePointType.pickup,
    )
    dropoff = RoutePoint(
        trip_id=trip.id,
        location="Shymkent Bus Station",
        time=stop_time + timedelta(hours=5),
        order=2,
        type=RoutePointType.dropoff,
    )
    db.add(pickup)
    db.add(dropoff)
    await db.commit()
    await db.refresh(pickup)
    await db.refresh(dropoff)
    return pickup, dropoff
