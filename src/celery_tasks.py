
from celery import Celery
from src.mail import mail, create_message
from src.config import settings
import asyncio

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

@celery_app.task
def send_email(recipients: list[str], subject: str, body: str):
    loop = asyncio.get_event_loop()
    message = create_message(recipients, subject, body)
    loop.run_until_complete(mail.send_message(message))