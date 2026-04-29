from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv


load_dotenv() 


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/taxi_system",
    )
    JWT_SECRET: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "test@example.com")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "test")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@taxisystem.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "1025"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "mailhog")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Taxi System")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "False") == "True"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False") == "True"
    USE_CREDENTIALS: bool = os.getenv("USE_CREDENTIALS", "True") == "True"
    VALIDATE_CERTS: bool = os.getenv("VALIDATE_CERTS", "False") == "True"

    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@taxisystem.com")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

settings = Settings()