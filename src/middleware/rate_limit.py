from fastapi import Request
from starlette.responses import JSONResponse
from src.db.redis import redis_client  

LIMIT_PER_MINUTE = 10
LIMIT_PER_HOUR = 50

WRITE_METHODS = {"POST", "PUT", "DELETE"}

async def rate_limit_middleware(request: Request, call_next):
    if request.method not in WRITE_METHODS:
        return await call_next(request)

    ip = request.client.host

    minute_key = f"rate_limit:minute:{ip}"
    hour_key = f"rate_limit:hour:{ip}"

    minute_count = await redis_client.incr(minute_key)
    hour_count = await redis_client.incr(hour_key)

    if minute_count == 1:
        await redis_client.expire(minute_key, 60)

    if hour_count == 1:
        await redis_client.expire(hour_key, 3600)
        
    if minute_count > LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests per minute"}
        )

    if hour_count > LIMIT_PER_HOUR:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests per hour"}
        )

    return await call_next(request)