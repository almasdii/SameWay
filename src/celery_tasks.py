import asyncio
import ssl

from celery import Celery

from src.config import settings
from src.mail import mail, create_message

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

if settings.REDIS_URL.startswith("rediss://"):
    _ssl_opts = {"ssl_cert_reqs": ssl.CERT_NONE}
    celery_app.conf.broker_use_ssl = _ssl_opts
    celery_app.conf.redis_backend_use_ssl = _ssl_opts


@celery_app.task
def send_email(recipients: list[str], subject: str, body: str):
    if not mail:
        return
    message = create_message(recipients, subject, body)
    asyncio.run(mail.send_message(message))
