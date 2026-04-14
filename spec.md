assigment 5 For development, limited hosts (localhost, 127.0.0.1) are allowed.
CORS is configured to allow requests from frontend (localhost:3000).

Wildcard "\*" is avoided in production due to security risks.

## Logging Middleware

Custom middleware implemented to log each HTTP request.

Log format:
`<IP>`:`<Port>` - `<Method>` - `<URL>` - `<Status Code>` - `<Processing Time>`

Additional fields:

- timestamp
- log_type (INFO, DEBUG, ERROR)
- service name (taxi-api)
- endpoint name

## Rate Limiting

Rate limiting is implemented using Redis.

- Per IP address tracking
- 10 requests per minute
- 50 requests per hour
- Only write operations (POST, PUT, DELETE) are restricted

Redis is used for:

- Atomic counters (INCR)
- Expiration (EXPIRE)

This implementation uses a fixed window algorithm.

Profiling

### Call Stack Profiling

cProfile was used to analyze function calls and execution time.

### Latency Tracking

Latency is measured using custom logging middleware.
Each request logs processing time in milliseconds.

### Profiling Overhead

Profiling introduces performance overhead.

Solutions:

- Use only in development
- Use sampling profilers
- Profile selectively

# Email & Password Reset Plan

## 1. Endpoints

### 1.1 `/auth/register` – User Registration

- **Method:** `POST`
- **Request Body:**
- `email: str`
- `password: str`
- **Flow:**

1. Check if a user with the given email already exists.
2. Hash the password.
3. Create a new user in the database.
4. Generate a token for email verification.
5. Send an email with a verification link.

- **Response:**
- `{ "message": "User created successfully. Check your email to verify your account." }`

---

### 1.2 `/auth/verify-email/{token}` – Email Verification

- **Method:** `GET`
- **Parameters:** `token: str`
- **Flow:**

1. Validate the token.
2. If valid → mark the user's email as verified.

- **Response:**
- `{ "message": "Email verified successfully." }`

---

**Stage 1: Builder**

- Base: `python:3.11-slim` (370MB)
- Purpose: Install build dependencies and compile Python packages
- Installs: gcc, build-essential, postgresql-client
- Creates: Python virtual environment with all dependencies
- Output: /opt/venv directory with pip packages

**Stage 2: Runtime**

- Base: `python:3.11-slim` (370MB)
- Purpose: Run the application
- Copies: Compiled venv from Stage 1
- Installs: Only runtime dependencies (postgresql-client, curl)
- User: Non-root user (appuser, UID 1000) for security
- Output: Final image ~220-250MB

### Size Optimization Techniques

1. **Multi-stage build**: Removes build dependencies from final image

   - Builder temp layer: ~800MB (discarded)
   - Runtime final image: ~220-250MB
   - Savings: ~70% reduction
2. **Slim base image**: `python:3.11-slim` instead of `python:3.11`

   - Slim: 370MB
   - Full: 1GB
   - Savings: 630MB per layer
3. **.dockerignore**: Exclude unnecessary files

   - Excludes: git, docs, tests, IDE configs
   - Reduces build context transfer
   - Faster layer processing
4. **Layer optimization**: Combine RUN commands

   - Clean apt cache after install
   - Single RUN per logical operation
   - Fewer layer copies = smaller image
5. **Non-root user**: Security best practice

   - Runs as appuser (UID 1000)
   - No privilege escalation
   - Better container isolation

### Performance Features

- **Health check**: Endpoint `/health` with 30s interval
- **Startup period**: 40s before health checks start
- **Restart policy**: Auto-restart on failure
- **Signal handling**: Graceful shutdown

## 2. Docker Compose Architecture

### Services Configuration

```yaml
Services:
├─ postgres (Database)
│  ├─ Image: postgres:15-alpine
│  ├─ Port: 5432
│  ├─ Health: pg_isready
│  ├─ Volumes: postgres_data (persistent)
│  └─ Network: taxi-network
│
├─ redis (Cache & Queue)
│  ├─ Image: redis:7-alpine
│  ├─ Port: 6379
│  ├─ Command: redis-server --appendonly yes
│  ├─ Volumes: redis_data (persistent)
│  └─ Network: taxi-network
│
├─ app (FastAPI Application)
│  ├─ Build: Dockerfile (./taxiSystem)
│  ├─ Port: 8000
│  ├─ Depends on: postgres, redis (healthy)
│  ├─ Volumes: ./src (live reload in dev)
│  ├─ Health: GET /health
│  ├─ Startup: alembic upgrade head + uvicorn
│  └─ Network: taxi-network
│
├─ celery_worker (Background Tasks)
│  ├─ Build: Dockerfile
│  ├─ Command: celery -A src.celery_tasks worker
│  ├─ Depends on: postgres, redis, app
│  └─ Network: taxi-network
│
├─ celery_beat (Task Scheduler)
│  ├─ Build: Dockerfile
│  ├─ Command: celery -A src.celery_tasks beat
│  ├─ Depends on: postgres, redis, app
│  └─ Network: taxi-network
│
├─ flower (Celery UI)
│  ├─ Build: Dockerfile
│  ├─ Port: 5555
│  ├─ Access: http://localhost:5555
│  ├─ Depends on: redis, celery_worker
│  └─ Network: taxi-network
│
├─ pgadmin (Database UI)
│  ├─ Image: dpage/pgadmin4:latest
│  ├─ Port: 5050
│  ├─ Access: http://localhost:5050
│  ├─ Volumes: pgadmin_data (persistent)
│  ├─ Credentials: admin@example.com / admin
│  └─ Network: taxi-network
│
├─ redis-commander (Cache UI)
│  ├─ Image: rediscommander/redis-commander:latest
│  ├─ Port: 8081
│  ├─ Access: http://localhost:8081
│  └─ Network: taxi-network
│
└─ mailhog (Email Testing)
   ├─ Image: mailhog/mailhog:latest
   ├─ SMTP Port: 1025
   ├─ Web Port: 8025
   ├─ Access: http://localhost:8025
   └─ Network: taxi-network
```

### Dependency Management

- **depends_on with health checks**:

  ```yaml
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  ```

  This ensures services start in correct order and are ready before dependent services start.
- **Health check configuration**:

  - PostgreSQL: `pg_isready -U postgres`
  - Redis: `redis-cli ping`
  - App: `curl http://localhost:8000/health`

## 3. Data Persistence

### Named Volumes

```yaml
volumes:
  postgres_data: # PostgreSQL data files
  postgres_logs: # PostgreSQL logs
  redis_data: # Redis dump.rdb (AOF)
  pgadmin_data: # pgAdmin configurations
```

### Persistence Strategy

1. **Database**: `postgres_data` volume

   - Mount point: `/var/lib/postgresql/data`
   - Driver: local (host filesystem)
   - Survives: Container removal with `docker-compose down`
   - Lost only with: `docker-compose down -v`
2. **Configuration**: `pgadmin_data` volume

   - Stores: Server connections, queries history
   - Survives: Container restart
3. **Cache**: `redis_data` volume (with AOF)

   - Command: `redis-server --appendonly yes`
   - Persistent RDB format
   - Survives: Container restart

### Backup Strategy

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump \
  -U postgres taxi_system > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql \
  -U postgres taxi_system < backup.sql

# Access volume directly (on host)
ls /var/lib/docker/volumes/taxi_postgres_data/_data/
```

## 4. Database UI - pgAdmin

### Configuration

- **Image**: dpage/pgadmin4:latest
- **Port**: 5050 (http://localhost:5050)
- **Default credentials**:
  - Email: admin@example.com
  - Password: admin
- **Auto-configured servers**: None (manual setup required)

### Setup in pgAdmin

1. Access http://localhost:5050
2. Login with admin@example.com / admin
3. Click "Add New Server"
4. Configuration:
   - Name: "Taxi System"
   - Hostname: `postgres` (Docker DNS)
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres` (from .env.docker)
   - Database: `taxi_system`
5. Test connection and save

### Features Available

- Query editor
- Schema browser
- Backup/Restore
- Monitoring
- User management
- Maintenance tasks

## 5. Background Tasks - Flower & Celery

### Flower (Celery Monitoring UI)

- **Image**: Built from Dockerfile
- **Port**: 5555 (http://localhost:5555)
- **Features**:
  - Real-time task monitoring
  - Task history
  - Worker status
  - Queue visualization
  - Task routing
  - Rate limiting display

### Celery Components

1. **Celery Worker**:

   ```bash
   celery -A src.celery_tasks worker --loglevel=info
   ```

   - Executes tasks from queue
   - Processes background jobs
   - Async email sending
   - Report generation
2. **Celery Beat** (Scheduler):

   ```bash
   celery -A src.celery_tasks beat --loglevel=info
   ```

   - Schedules periodic tasks
   - Cron-like functionality
   - Task auto-retry
3. **Celery Configuration** (src/celery_tasks.py):

   ```python
   broker = REDIS_URL  # redis://redis:6379/0
   backend = REDIS_URL  # redis://redis:6379/0
   tasks = [...]       # Registered tasks
   ```

### Monitoring in Flower

1. Access http://localhost:5555
2. **Dashboard**:
   - Active tasks count
   - Worker status
   - Task success/failure rate
3. **Tasks** tab:
   - Task name and ID
   - Start/end time
   - Runtime duration
   - Status (SUCCESS, FAILURE, RETRY)
4. **Workers** tab:
   - Worker hostname
   - Active tasks
   - Processing rate (tasks/minute)

### Background Tasks Implemented

- Email sending (registration, password reset)
- Report generation
- Scheduled maintenance
- User activity cleanup

## 6. Cache Views - Redis Commander

### Configuration

- **Image**: rediscommander/redis-commander:latest
- **Port**: 8081 (http://localhost:8081)
- **Connection**: Automatically connects to redis:6379

### Features

1. **Data Exploration**:

   - Browse all Redis keys
   - View key values
   - Check expiration times
   - Memory usage per key
2. **Data Types**:

   - Strings (JWT blocklist)
   - Lists (Celery queues)
   - Sets (Rate limit counters)
   - Hashes (Session data)
   - Sorted Sets (Leaderboards)
3. **Commands**:

   - Execute arbitrary Redis commands
   - Flush databases
   - Set/Get keys
   - Monitor operations in real-time
4. **Monitoring**:

   - Current connected clients
   - Memory statistics
   - Command executed count
   - Key space information

### Current Data in Redis

- **JWT Blocklist**: `jti:*` keys (1 hour TTL)
- **Rate Limits**: `rate_limit:*` keys (1 hour TTL)
- **Celery Tasks**: `celery-task-meta-*` (result backend)
- **Celery Queue**: `celery` queue (broker)

## 7. Additional Services

### Mailhog (Email Testing)

- **Purpose**: Development email testing without real SMTP
- **Ports**:
  - SMTP: 1025 (accepts emails from app)
  - Web UI: 8025 (http://localhost:8025)
- **Configuration** (.env.docker):
  ```
  MAIL_SERVER=mailhog
  MAIL_PORT=1025
  MAIL_STARTTLS=False
  ```
- **Usage**: All emails sent by app appear in Mailhog UI
- **Features**:
  - Email preview
  - HTML rendering
  - Download as EML
  - Release to real SMTP

## Usage Instructions

### Build and Start

```bash
# Build the app image (first time only, ~2-3 minutes)
docker-compose build

# Start all services in background
docker-compose up -d

# View startup logs
docker-compose logs -f app

# Wait for all services (~20-30 seconds)
```

### Access Services

```
FastAPI API:         http://localhost:8000
Swagger UI:          http://localhost:8000/docs
ReDoc:               http://localhost:8000/redoc
Health Check:        http://localhost:8000/health

pgAdmin:             http://localhost:5050
Flower:              http://localhost:5555
Redis Commander:     http://localhost:8081
Mailhog:             http://localhost:8025
```

### Common Commands

```bash
# View logs
docker-compose logs app          # App logs
docker-compose logs -f celery_worker  # Follow worker logs
docker-compose logs postgres     # Database logs

# Execute commands in containers
docker-compose exec app bash     # Shell in app
docker-compose exec postgres psql -U postgres  # psql

# Restart service
docker-compose restart app

# Stop services
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes (DELETE DATA!)

# Remove everything
docker-compose down -v --remove-orphans
```

### Database Migrations

```bash
# Migrations run automatically on app startup
# To run manually:
docker-compose exec app alembic upgrade head

# Create new migration
docker-compose exec app alembic revision --autogenerate -m "Description"
```

## Performance Metrics

```
Build Time:        ~2-3 minutes (first build)
                   ~30 seconds (rebuild with cache)

Image Size:        ~250MB (app image)
                   ~400MB (total all images)

Startup Time:      ~20-30 seconds (all services ready)

Memory Usage:      ~1.5-2GB (all services running)

Disk Space:        ~5GB (volumes + images + caches)
```

## Security Considerations

1. **Non-root user**: App runs as appuser (UID 1000)
2. **Network isolation**: Internal network `taxi-network`
3. **Credentials**: Environment variables in .env.docker
4. **Health checks**: Auto-restart on failure
5. **Thin image**: Minimal attack surface

### Production Recommendations

- Use secrets management (HashiCorp Vault, Docker secrets)
- Enable container scanning (Trivy, Grype)
- Add log aggregation (ELK, Datadog)
- Implement resource limits
- Use image registry authentication
- Enable monitoring (Prometheus, Grafana)

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Use different port in docker-compose.yml:
ports:
  - "8001:8000"
```

### Cannot Connect to PostgreSQL

```bash
# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Celery Tasks Not Running

```bash
# Check worker is alive
docker-compose logs celery_worker

# Check Redis connection
docker-compose exec redis redis-cli ping

# Restart worker
docker-compose restart celery_worker
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase Docker memory limit
# (Docker Desktop settings)
```

## Implementation Checklist

- [X] Dockerfile with multi-stage build
- [X] docker-compose.yml with all services
- [X] Health checks for all services
- [X] Persistent volumes
- [X] Environment variables (.env.docker)
- [X] Network configuration
- [X] .dockerignore for optimization
- [X] pgAdmin for database UI
- [X] Flower for Celery monitoring
- [X] Redis Commander for cache viewing
- [X] Mailhog for email testing
- [X] Proper dependency ordering

## Files Created/Modified

1. `Dockerfile` - Multi-stage application image
2. `docker-compose.yml` - Service orchestration
3. `.dockerignore` - Build optimization
4. `.env.docker` - Environment configuration
5. `spec.md` - This specification document

### 1.3 `/auth/password-reset-request` – Password Reset Request

- **Method:** `POST`
- **Request Body:**
- `email: str`
- **Flow:**

1. Generate a token for password reset.
2. Send an email with a link to reset the password.

- **Response:**
- `{ "message": "Password reset link sent to your email." }`

---

### 1.4 `/auth/password-reset-confirm/{token}` – Password Reset Confirmation

- **Method:** `POST`
- **Parameters:** `token: str`
- **Request Body:**
- `new_password: str`
- **Flow:**

1. Validate the token.
2. Hash the new password.
3. Update the password in the database.

- **Response:**
- `{ "message": "Password reset successfully." }`

---

## 2. Notes

- All emails are sent via **Gmail** or another SMTP service.
- For Gmail, an **App Password** is required.
- Email verification and password reset use **URL-safe tokens** .
- Tokens have an expiration time for security.
- auth module changed
- middleware folder added with rate limit and logging
- and spec.md , mail.py , celery_task added
- main.py changed
