import asyncio
import ssl
import logging

import resend
from celery import Celery

from src.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

if settings.REDIS_URL.startswith("rediss://"):
    _ssl_opts = {"ssl_cert_reqs": ssl.CERT_NONE}
    celery_app.conf.broker_use_ssl = _ssl_opts
    celery_app.conf.redis_backend_use_ssl = _ssl_opts

celery_app.conf.broker_pool_limit = 1
celery_app.conf.broker_connection_retry_on_startup = True


@celery_app.task
def send_email(recipients: list[str], subject: str, body: str):
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping email")
        return

    resend.api_key = settings.RESEND_API_KEY

    for recipient in recipients:
        try:
            resend.Emails.send({
                "from": settings.MAIL_FROM,
                "to": recipient,
                "subject": subject,
                "html": body,
            })
        except Exception as e:
            logger.error("Failed to send email to %s: %s", recipient, e)
