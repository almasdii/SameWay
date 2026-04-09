import fastapi
from fastapi import FastAPI , Request
import time
from datetime import datetime


from httpx import request

async def log_request(request: Request,call_next):
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
    log_type = "ERROR"
  elif status_code >= 400:
      log_type = "DEBUG"
  else:
      log_type = "INFO"

  log = {
     "timestamp": timestamp,
     "log_type": log_type,
     "service": "taxi-api",
     "endpoint": url,
     "message": f"{client_ip}:{client_port} - {method} - {status_code} - {process_time:.2f}ms"
  }
  print(log)
  return response

