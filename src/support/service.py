from sqlalchemy.ext.asyncio import AsyncSession

from src.celery_tasks import send_email
from src.db.models import SupportRequest
from src.support.schema import SupportRequestCreate


async def create_support_request(
    session: AsyncSession,
    data: SupportRequestCreate,
) -> SupportRequest:

    request = SupportRequest(
        email=data.email,
        subject=data.subject,
        message=data.message,
        category=data.category,
    )

    session.add(request)
    await session.commit()
    await session.refresh(request)

    send_email.delay(
        recipients=[data.email],
        subject="Support Request Received - Taxi System",
        body=f"""
        Dear User,

        Thank you for contacting Taxi System support. We have received your request.

        Request Details:
        - Request ID: #{request.id}
        - Subject: {data.subject}
        - Category: {data.category}
        - Submitted at: {request.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC

        Your Message:
        {data.message}

        We will review your request and respond within 24-48 hours.

        Best regards,
        Taxi System Support Team
        """
    )

    send_email.delay(
        recipients=["support@taxisystem.com"],
        subject=f"[#{request.id}] New Support Request: {data.subject}",
        body=f"""
        New support request received!

        Request ID: #{request.id}
        User Email: {data.email}
        Category: {data.category}
        Subject: {data.subject}

        Message:
        {data.message}

        ---
        Submitted at: {request.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC
        """
    )

    return request
