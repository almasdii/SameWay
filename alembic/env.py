from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
import os

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from sqlmodel import SQLModel
from src.db.models import *  

target_metadata = SQLModel.metadata



def run_migrations_offline() -> None:

    url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
    url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    url = url.replace("?ssl=false", "")
    
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    database_url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
    
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    database_url = database_url.replace("?ssl=false", "") 
    
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = database_url
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
