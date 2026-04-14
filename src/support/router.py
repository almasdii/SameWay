from fastapi import APIRouter

from src.support.schema import SupportRequestCreate, SupportRequestRead
from src.support.service import create_support_request

support_router = APIRouter(prefix="/support", tags=["Support"])


@support_router.post("/requests", response_model=dict)
async def submit_support_request(data: SupportRequestCreate):
 
    return await create_support_request(data)
