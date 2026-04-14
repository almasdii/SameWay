import logging
import json
import time
from datetime import datetime
from fastapi import Request


logger = logging.getLogger(__name__)


async def log_request(request: Request, call_next):
    start = time.time()

    response = await call_next(request)

    process_time = (time.time() - start) * 1000

    client_ip = request.client.host
    client_port = request.client.port
    method = request.method
    url = request.url.path
    status_code = response.status_code
    timestamp = datetime.utcnow().isoformat()

    if status_code >= 500:
        log_level = logging.ERROR
        log_type = "ERROR"
    elif status_code >= 400:
        log_level = logging.DEBUG
        log_type = "DEBUG"
    else:
        log_level = logging.INFO
        log_type = "INFO"

    log_data = {
        "timestamp": timestamp,
        "log_type": log_type,
        "service": "taxi-api",
        "endpoint": url,
        "method": method,
        "status_code": status_code,
        "client": f"{client_ip}:{client_port}",
        "duration_ms": f"{process_time:.2f}",
    }

    logger.log(log_level, json.dumps(log_data))

    return response

