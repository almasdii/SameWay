from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.db.models import PaymentStatus


class PaymentBase(BaseModel):
    booking_id: int
    amount: float


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: PaymentStatus
    created_at: datetime