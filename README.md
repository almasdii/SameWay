# Taxi System API

---

## 1. Project Title

**Taxi System** — Asynchronous Ride-Sharing Backend API

---

## 2. Topic Area

Enterprise Software / Transportation Technology

---

## 3. Problem Statement

Urban transportation lacks accessible, developer-ready backend infrastructure for building ride-sharing platforms. Existing solutions are either proprietary or do not expose structured APIs for multi-role access control, booking lifecycle management, and real-time seat availability. Drivers have no reliable way to publish routes and manage passenger demand, while passengers lack a unified interface to discover, book, and pay for trips. This gap prevents small teams and startups from building ride-sharing products without investing in large-scale infrastructure from scratch.

---

## 4. Proposed Solution

A production-ready REST API backend for a ride-sharing platform. The system handles the full lifecycle of a trip: driver registration and vehicle management, route and trip creation, passenger booking and seat reservation, payment processing, and post-trip reviews. Authentication is JWT-based with role separation (admin, driver, passenger). Background tasks handle email notifications without blocking request handling.

---

## 5. Target Users

- **Drivers** — register vehicles, create trips with route points, manage bookings, and track earnings
- **Passengers** — search and book available trips, make payments, and leave reviews
- **Administrators** — monitor platform statistics, manage users, and oversee platform health

---

## 6. Technology Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Backend**        | FastAPI, Uvicorn, Python 3.11+                  |
| **Database**       | PostgreSQL 15+ via asyncpg, SQLModel (SQLAlchemy + Pydantic) |
| **Cache**          | Redis 7+ (token blocklist, rate limiting)        |
| **Task Queue**     | Celery + Redis                                  |
| **Email**          | Resend API (HTTP-based, no SMTP required)       |
| **Auth**           | JWT (PyJWT), bcrypt (passlib)                   |
| **Migrations**     | Alembic                                         |
| **Cloud / Hosting**| Railway (API + Celery worker), Neon (PostgreSQL), Upstash (Redis) |
| **Containerization** | Docker, Docker Compose                        |
| **API Docs**       | Swagger UI (`/docs`), ReDoc (`/redoc`)          |
| **Testing**        | pytest, pytest-asyncio, httpx                   |

---

## 7. Key Features

- Role-based access control with three distinct roles: admin, driver, and passenger
- Full trip lifecycle management: create, start, complete, and cancel trips with route points
- Real-time seat availability tracking with automatic decrement on booking
- JWT authentication with access token (10 min) and refresh token (7 days), plus Redis-backed token revocation on logout
- Background email notifications for registration verification and password reset via Resend API
- Redis-based rate limiting: 10 write requests per minute and 50 per hour per IP
- Payment lifecycle: create, confirm, and fail payments linked to bookings
- Driver earnings dashboard with trip statistics broken down by status
- Full review system allowing passengers to rate and comment on drivers

---

## 8. Team Members

| Student ID |
| ---------- |
| 230103383  |
| 230103124  |
| 230103042  |
| 230103177  |

---

---

## Project Structure

```
taxiSystem/
├── src/
│   ├── main.py               # App entry point, middleware, router registration
│   ├── config.py             # Environment-based settings
│   ├── dependencies.py       # Shared FastAPI dependencies
│   ├── celery_tasks.py       # Background email tasks
│   ├── auth/                 # JWT auth, token utilities, password reset
│   ├── db/                   # SQLModel models, async session, Redis client
│   ├── middleware/           # Request logging, rate limiting
│   ├── errors/               # Custom exception classes and handlers
│   ├── users/                # User CRUD, admin stats, driver dashboard
│   ├── cars/                 # Vehicle registration and management
│   ├── trips/                # Trip creation, search, lifecycle
│   ├── booking/              # Booking creation, cancellation
│   ├── payments/             # Payment creation, confirmation, failure
│   ├── reviews/              # Review creation, update, delete
│   ├── routePoints/          # Route point management per trip
│   └── support/              # Support request submission
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_bookings.py
│   ├── test_cars.py
│   ├── test_payments.py
│   ├── test_reviews.py
│   └── test_trips.py
├── alembic/                  # Database migration scripts
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── requirements.txt
└── .env
```

---

## Installation

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

### Option 1: Local Development

**1. Create and activate a virtual environment**

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate
```

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Configure environment variables**

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taxi_system
SECRET_KEY=your-secret-key
ALGORITHM=HS256
REDIS_URL=redis://localhost:6379/0
RESEND_API_KEY=your-resend-api-key
MAIL_FROM=onboarding@resend.dev
BASE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000
```

For cloud-hosted PostgreSQL (Neon, Supabase), append `?sslmode=require` to `DATABASE_URL`.

**4. Run migrations**

```bash
alembic upgrade head
```

**5. Start the API server**

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**6. Start the Celery worker (separate terminal)**

```bash
celery -A src.celery_tasks worker --loglevel=info -c 2
```

API available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

### Option 2: Docker

**Start all services**

```bash
docker-compose up -d
```

**Run migrations**

```bash
docker-compose exec app alembic upgrade head
```

**Stop services**

```bash
docker-compose down
```

---

## API Endpoints

### Health

| Method | Path      | Description  | Auth |
| ------ | --------- | ------------ | ---- |
| GET    | `/health` | Health check | No   |

### Authentication (`/auth`)

| Method | Path                                   | Description                  | Auth |
| ------ | -------------------------------------- | ---------------------------- | ---- |
| POST   | `/auth/register`                       | Register a new user          | No   |
| GET    | `/auth/verify-email/{token}`           | Verify email address         | No   |
| POST   | `/auth/login`                          | Login, returns JWT tokens    | No   |
| POST   | `/auth/refresh`                        | Refresh access token         | No   |
| POST   | `/auth/logout`                         | Logout and revoke token      | Yes  |
| GET    | `/auth/me`                             | Get current authenticated user | Yes |
| POST   | `/auth/password-reset-request`         | Request password reset email | No   |
| POST   | `/auth/password-reset-confirm/{token}` | Confirm new password         | No   |

### Users (`/users`)

| Method | Path                         | Description              | Auth      |
| ------ | ---------------------------- | ------------------------ | --------- |
| GET    | `/users`                     | List all users           | Admin     |
| GET    | `/users/me`                  | Get own profile          | Yes       |
| PATCH  | `/users/me`                  | Update own profile       | Yes       |
| DELETE | `/users/me`                  | Delete own account       | Yes       |
| GET    | `/users/me/driver-dashboard` | Driver earnings stats    | Driver    |
| GET    | `/users/search`              | Search users by name     | Yes       |
| GET    | `/users/stats`               | Platform-wide statistics | Admin     |
| GET    | `/users/{user_email}`        | Get user by email        | Admin     |
| PATCH  | `/users/{user_email}`        | Update user by email     | Admin     |
| DELETE | `/users/{user_email}`        | Delete user by email     | Admin     |

### Cars (`/cars`)

| Method | Path              | Description            | Auth   |
| ------ | ----------------- | ---------------------- | ------ |
| POST   | `/cars`           | Register a vehicle     | Driver |
| GET    | `/cars`           | List own vehicles      | Driver |
| GET    | `/cars/me/active` | Get active vehicle     | Driver |
| GET    | `/cars/{car_id}`  | Get vehicle by ID      | Yes    |
| PATCH  | `/cars/{car_id}`  | Update vehicle details | Driver |
| DELETE | `/cars/{car_id}`  | Delete vehicle         | Driver |

### Trips (`/trips`)

| Method | Path                        | Description                | Auth   |
| ------ | --------------------------- | -------------------------- | ------ |
| POST   | `/trips`                    | Create a trip              | Driver |
| GET    | `/trips/available`          | List available trips       | No     |
| GET    | `/trips/search`             | Search trips by route      | No     |
| GET    | `/trips/{trip_id}`          | Get trip details           | No     |
| PATCH  | `/trips/{trip_id}`          | Update trip                | Driver |
| DELETE | `/trips/{trip_id}`          | Cancel trip                | Driver |
| POST   | `/trips/{trip_id}/start`    | Mark trip as in progress   | Driver |
| POST   | `/trips/{trip_id}/complete` | Mark trip as completed     | Driver |

### Bookings (`/bookings`)

| Method | Path                            | Description              | Auth      |
| ------ | ------------------------------- | ------------------------ | --------- |
| POST   | `/bookings`                     | Book seats on a trip     | Passenger |
| GET    | `/bookings/me`                  | List own bookings        | Yes       |
| GET    | `/bookings/trips/{trip_id}`     | List bookings for a trip | Driver    |
| POST   | `/bookings/{booking_id}/cancel` | Cancel a booking         | Yes       |

### Payments (`/payments`)

| Method | Path                               | Description                  | Auth |
| ------ | ---------------------------------- | ---------------------------- | ---- |
| POST   | `/payments`                        | Create a payment             | Yes  |
| POST   | `/payments/{payment_id}/confirm`   | Confirm payment (paid)       | Driver |
| POST   | `/payments/{payment_id}/fail`      | Mark payment as failed       | Driver |
| GET    | `/payments/{payment_id}`           | Get payment by ID            | Yes  |
| GET    | `/payments/booking/{booking_id}`   | List payments for a booking  | Yes  |

### Reviews (`/reviews`)

| Method | Path                        | Description             | Auth |
| ------ | --------------------------- | ----------------------- | ---- |
| POST   | `/reviews`                  | Create a review         | Yes  |
| GET    | `/reviews/users/{user_id}`  | List reviews for a user | No   |
| PATCH  | `/reviews/{review_id}`      | Update own review       | Yes  |
| DELETE | `/reviews/{review_id}`      | Delete own review       | Yes  |

### Route Points (`/routepoints`)

| Method | Path                             | Description                  | Auth   |
| ------ | -------------------------------- | ---------------------------- | ------ |
| POST   | `/routepoints/trips/{trip_id}`   | Add route point to trip      | Driver |
| GET    | `/routepoints/trips/{trip_id}`   | List route points for trip   | No     |
| PATCH  | `/routepoints/{rp_id}`           | Update route point           | Driver |
| DELETE | `/routepoints/{rp_id}`           | Delete route point           | Driver |

### Support (`/support`)

| Method | Path               | Description            | Auth |
| ------ | ------------------ | ---------------------- | ---- |
| POST   | `/support/requests` | Submit support request | No   |

---

## Authentication Flow

The API uses JWT bearer tokens. Include the token in every protected request:

```
Authorization: Bearer <access_token>
```

1. `POST /auth/register` — create account; verification email is dispatched via Celery
2. Click the verification link in the email (`GET /auth/verify-email/{token}`)
3. `POST /auth/login` — returns `access_token` (10 min TTL) and `refresh_token` (7 days TTL)
4. When the access token expires, call `POST /auth/refresh` with the refresh token
5. `POST /auth/logout` — invalidates the token by adding its JTI to the Redis blocklist

Allowed roles on registration: `passenger`, `driver`. The `admin` role cannot be self-assigned.

---

## Environment Variables

| Variable          | Description                                    |
| ----------------- | ---------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL async connection string             |
| `SECRET_KEY`      | JWT signing secret                             |
| `ALGORITHM`       | JWT algorithm (default: `HS256`)               |
| `REDIS_URL`       | Redis connection URL                           |
| `RESEND_API_KEY`  | API key for Resend email service               |
| `MAIL_FROM`       | Sender email address                           |
| `BASE_URL`        | Base URL used in email links                   |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins   |

---

## Running Tests

```bash
pytest tests/ -v
```

Tests use an in-memory SQLite database and do not require a running PostgreSQL or Redis instance.

---

## Live Deployment

The application is deployed on Railway.

- API: served via Uvicorn on a dynamically assigned port
- Celery worker: separate Railway service connected to Upstash Redis
- Database: Neon serverless PostgreSQL with SSL
- Email: Resend HTTP API (SMTP is not used)
