from celery import Celery
from src.mail import mail, create_message
from src.config import settings
import asyncio

from src.config import settings
from src.mail import mail, create_message

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

@celery_app.task
def send_email(recipients: list[str], subject: str, body: str):
    if not mail:
        return
    message = create_message(recipients, subject, body)
    asyncio.run(mail.send_message(message))