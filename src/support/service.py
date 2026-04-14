from src.celery_tasks import send_email
from src.support.schema import SupportRequestCreate
from datetime import datetime


async def create_support_request(data: SupportRequestCreate) -> dict:
    
    send_email.delay(
        recipients=[data.email],
        subject="Support Request Received - Taxi System",
        body=f"""
        Dear User,
        
        Thank you for contacting Taxi System support. We have received your request.
        
        Request Details:
        - Subject: {data.subject}
        - Category: {data.category}
        - Submitted at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
        
        Your Message:
        {data.message}
        
        We will review your request and respond within 24-48 hours.
        
        Best regards,
        Taxi System Support Team
        """
    )
    
    send_email.delay(
        recipients=["support@taxisystem.com"],
        subject=f"New Support Request: {data.subject}",
        body=f"""
        New support request received!
        
        User Email: {data.email}
        Category: {data.category}
        Subject: {data.subject}
        
        Message:
        {data.message}
        
        ---
        Submitted at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
        """
    )
    return {
        "status": "received",
        "message": "Your support request has been received. We will contact you soon.",
        "email": data.email,
        "timestamp": datetime.utcnow().isoformat()
    }
