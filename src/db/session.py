from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.config import settings

_raw_url = settings.database_url

# asyncpg does not accept sslmode/ssl as URL query params — strip them and
# translate to connect_args instead.  This makes the code work with Neon,
# Railway-provisioned Postgres, and plain local/Docker Postgres.
_require_ssl = "sslmode=require" in _raw_url or "ssl=true" in _raw_url.lower()

_db_url = _raw_url
for _p in ("?sslmode=require", "&sslmode=require",
           "?ssl=true", "&ssl=true",
           "?ssl=false", "&ssl=false"):
    _db_url = _db_url.replace(_p, "")

engine: AsyncEngine = create_async_engine(
    _db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": True} if _require_ssl else {},
)

AsyncSessionFactory = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        yield session


async def create_db_and_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
