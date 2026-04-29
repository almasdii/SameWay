from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional
from datetime import datetime


class SupportRequestCreate(BaseModel):
    email: EmailStr = Field(..., description="User email")
    subject: str = Field(..., min_length=5, max_length=200, description="Support request subject")
    message: str = Field(..., min_length=10, max_length=2000, description="Detailed message")
    category: str = Field(..., description="Category: bug, feature_request, complaint, other")


class SupportRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    email: str
    subject: str
    message: str
    category: str
    status: str = "new"
    created_at: datetime
