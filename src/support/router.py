from fastapi import APIRouter, status

from src.dependencies import AsyncSessionDep
from src.support.schema import SupportRequestCreate, SupportRequestRead
from src.support.service import create_support_request

support_router = APIRouter(prefix="/support", tags=["Support"])


@support_router.post(
    "/requests",
    response_model=SupportRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_support_request(
    data: SupportRequestCreate,
    session: AsyncSessionDep,
):
    return await create_support_request(session, data)
