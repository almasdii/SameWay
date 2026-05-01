# Taxi System API

An asynchronous REST API for a ride-sharing platform built with FastAPI. Supports multi-role access (admin, driver, passenger), JWT authentication, trip and booking management, payments, reviews, and background email notifications.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Technology Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Framework      | FastAPI, Uvicorn                            |
| Language       | Python 3.11+                                |
| Database       | PostgreSQL 15+ (asyncpg), SQLite (tests)    |
| ORM            | SQLModel (Pydantic + SQLAlchemy)            |
| Auth           | JWT (python-jose), bcrypt (passlib)         |
| Caching        | Redis 7+ (token blocklist, rate limiting)   |
| Email          | FastMail (SMTP) via Celery                  |
| Migrations     | Alembic                                     |
| Tasks          | Celery + Redis                              |
| Deployment     | Docker, Docker Compose                      |
| API Docs       | Swagger UI (`/docs`), ReDoc (`/redoc`)      |

---

## Project Structure

```
taxiSystem/
├── src/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── celery_tasks.py
│   ├── auth/
│   │   ├── routes.py
│   │   ├── schema.py
│   │   ├── security.py
│   │   └── utils.py
│   ├── db/
│   │   ├── models.py
│   │   ├── session.py
│   │   └── redis.py
│   ├── middleware/
│   │   ├── logging.py
│   │   └── rate_limit.py
│   ├── errors/
│   │   └── customErrors.py
│   ├── users/
│   ├── cars/
│   ├── trips/
│   ├── booking/
│   ├── payments/
│   ├── reviews/
│   ├── routePoints/
│   └── support/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_bookings.py
│   ├── test_cars.py
│   ├── test_payments.py
│   ├── test_reviews.py
│   └── test_trips.py
├── alembic/
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

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taxi_system
SECRET_KEY=your-secret-key
ALGORITHM=HS256
REDIS_URL=redis://localhost:6379/0
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@taxisystem.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
USE_CREDENTIALS=True
VALIDATE_CERTS=False
```

For cloud-hosted PostgreSQL (e.g. Neon), append `?sslmode=require` to the `DATABASE_URL`.

**4. Run migrations**

```bash
alembic upgrade head
```

**5. Start the server**

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API available at `http://localhost:8000`. Interactive docs at `/docs`.

---

### Option 2: Docker

**Start all services (app, PostgreSQL, Redis, Celery, pgAdmin, MailHog)**

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

| Method | Path      | Description   |
| ------ | --------- | ------------- |
| GET    | `/health` | Health check  |

### Authentication (`/auth`)

| Method | Path                              | Description                  | Auth |
| ------ | --------------------------------- | ---------------------------- | ---- |
| POST   | `/auth/register`                  | Register a new user          | No   |
| GET    | `/auth/verify-email/{token}`      | Verify email address         | No   |
| POST   | `/auth/login`                     | Login, returns JWT tokens    | No   |
| POST   | `/auth/refresh`                   | Refresh access token         | No   |
| POST   | `/auth/logout`                    | Logout (revoke token)        | Yes  |
| GET    | `/auth/me`                        | Get current user             | Yes  |
| POST   | `/auth/password-reset-request`    | Request password reset email | No   |
| POST   | `/auth/password-reset-confirm/{token}` | Confirm password reset  | No   |

### Users (`/users`)

| Method | Path                      | Description              | Auth  |
| ------ | ------------------------- | ------------------------ | ----- |
| GET    | `/users/`                 | List all users           | Admin |
| GET    | `/users/me`               | Get own profile          | Yes   |
| PATCH  | `/users/me`               | Update own profile       | Yes   |
| DELETE | `/users/me`               | Delete own account       | Yes   |
| GET    | `/users/me/driver-dashboard` | Driver statistics     | Driver |
| GET    | `/users/search`           | Search users             | Yes   |
| GET    | `/users/stats`            | User statistics          | Admin |
| GET    | `/users/{user_email}`     | Get user by email        | Admin |
| PATCH  | `/users/{user_email}`     | Update user by email     | Admin |
| DELETE | `/users/{user_email}`     | Delete user by email     | Admin |

### Cars (`/cars`)

| Method | Path               | Description            | Auth   |
| ------ | ------------------ | ---------------------- | ------ |
| POST   | `/cars/`           | Register a vehicle     | Driver |
| GET    | `/cars/`           | List all vehicles      | Yes    |
| GET    | `/cars/me/active`  | Get own active vehicle | Driver |
| GET    | `/cars/{car_id}`   | Get vehicle by ID      | Yes    |
| PATCH  | `/cars/{car_id}`   | Update vehicle         | Driver |
| DELETE | `/cars/{car_id}`   | Delete vehicle         | Driver |

### Trips (`/trips`)

| Method | Path                      | Description           | Auth   |
| ------ | ------------------------- | --------------------- | ------ |
| POST   | `/trips/`                 | Create a trip         | Driver |
| GET    | `/trips/available`        | List available trips  | Yes    |
| GET    | `/trips/search`           | Search trips          | Yes    |
| GET    | `/trips/{trip_id}`        | Get trip details      | Yes    |
| PATCH  | `/trips/{trip_id}`        | Update trip           | Driver |
| DELETE | `/trips/{trip_id}`        | Cancel trip           | Driver |
| POST   | `/trips/{trip_id}/start`  | Start trip            | Driver |
| POST   | `/trips/{trip_id}/complete` | Complete trip       | Driver |

### Bookings (`/bookings`)

| Method | Path                         | Description                  | Auth      |
| ------ | ---------------------------- | ---------------------------- | --------- |
| POST   | `/bookings/`                 | Create a booking             | Passenger |
| GET    | `/bookings/me`               | List own bookings            | Yes       |
| GET    | `/bookings/trips/{trip_id}`  | List bookings for a trip     | Driver    |
| POST   | `/bookings/{booking_id}/cancel` | Cancel a booking          | Passenger |

### Payments (`/payments`)

| Method | Path                              | Description               | Auth |
| ------ | --------------------------------- | ------------------------- | ---- |
| POST   | `/payments/`                      | Create a payment          | Yes  |
| POST   | `/payments/{payment_id}/confirm`  | Confirm payment           | Yes  |
| POST   | `/payments/{payment_id}/fail`     | Mark payment as failed    | Yes  |
| GET    | `/payments/{payment_id}`          | Get payment by ID         | Yes  |
| GET    | `/payments/booking/{booking_id}`  | Get payment for a booking | Yes  |

### Reviews (`/reviews`)

| Method | Path                      | Description            | Auth      |
| ------ | ------------------------- | ---------------------- | --------- |
| POST   | `/reviews/`               | Create a review        | Passenger |
| GET    | `/reviews/users/{user_id}` | List reviews for user | Yes       |
| PATCH  | `/reviews/{review_id}`    | Update a review        | Passenger |
| DELETE | `/reviews/{review_id}`    | Delete a review        | Passenger |

### Route Points (`/routepoints`)

| Method | Path                             | Description                    | Auth   |
| ------ | -------------------------------- | ------------------------------ | ------ |
| POST   | `/routepoints/trips/{trip_id}`   | Add route point to a trip      | Driver |
| GET    | `/routepoints/trips/{trip_id}`   | List route points for a trip   | Yes    |
| PATCH  | `/routepoints/{rp_id}`           | Update a route point           | Driver |
| DELETE | `/routepoints/{rp_id}`           | Delete a route point           | Driver |

### Support (`/support`)

| Method | Path               | Description          | Auth |
| ------ | ------------------ | -------------------- | ---- |
| POST   | `/support/requests` | Submit support request | Yes |

---

## Authentication

The API uses JWT bearer tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Token flow:**

1. `POST /auth/register` — create an account; verification email is sent
2. Click the verification link in the email
3. `POST /auth/login` — returns `access_token` (10 min) and `refresh_token` (7 days)
4. Use `access_token` in the `Authorization` header for protected requests
5. When the access token expires, call `POST /auth/refresh` with the refresh token to get a new one
6. `POST /auth/logout` — adds the token's JTI to the Redis blocklist

**Register payload:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "surname": "Doe",
  "password": "securepassword123",
  "phone": "+70000000000",
  "role": "passenger"
}
```

Allowed roles on registration: `passenger`, `driver`. The `admin` role cannot be self-assigned.

---

## Configuration

All settings are read from environment variables (`.env` file):

| Variable        | Default                    | Description                        |
| --------------- | -------------------------- | ---------------------------------- |
| `DATABASE_URL`  | (required)                 | PostgreSQL async connection string |
| `SECRET_KEY`    | (required)                 | JWT signing secret                 |
| `ALGORITHM`     | `HS256`                    | JWT algorithm                      |
| `REDIS_URL`     | `redis://localhost:6379/0` | Redis connection URL               |
| `MAIL_USERNAME` | —                          | SMTP account username              |
| `MAIL_PASSWORD` | —                          | SMTP account password              |
| `MAIL_FROM`     | —                          | Sender address                     |
| `MAIL_PORT`     | `587`                      | SMTP port                          |
| `MAIL_SERVER`   | `smtp.gmail.com`           | SMTP host                          |
| `MAIL_STARTTLS` | `True`                     | Enable STARTTLS                    |
| `MAIL_SSL_TLS`  | `False`                    | Enable SSL/TLS                     |
| `BASE_URL`      | `http://localhost:8000`    | Base URL for email links           |

**Rate limiting:** 10 write requests per minute and 50 per hour per IP address (enforced via Redis).

---

## Troubleshooting

**Database connection refused**

```bash
psql -U postgres -d taxi_system -c "SELECT 1"
```

Check that PostgreSQL is running and the `DATABASE_URL` in `.env` is correct. For cloud databases (Neon, Supabase), ensure `?sslmode=require` is appended to the URL.

**Redis connection refused**

```bash
redis-cli ping
```

Should return `PONG`. Check that Redis is running and `REDIS_URL` is correct.

**Port 8000 already in use**

```bash
# Linux / macOS
lsof -ti:8000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
```

**Reset the database**

```bash
alembic downgrade base
alembic upgrade head
```

**Docker: clean rebuild**

```bash
docker-compose down -v
docker-compose up -d --build
```

---

**Python:** 3.11+  
**FastAPI:** 0.100+  
**Last updated:** May 2026
681234567
```

## 📧 Email Notifications

The system sends emails for:

- User registration (email verification)
- Password reset
- Trip confirmations
- Payment receipts
- Support requests

Configure SMTP credentials in `.env` to enable email sending.

## 🚀 Deployment

### Docker

```bash
docker build -t taxi-system .
docker run -p 8000:8000 --env-file .env taxi-system
```

### Production Checklist

- [ ] Set `JWT_SECRET` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Use PostgreSQL with SSL connection
- [ ] Enable HTTPS (CORS should be updated)
- [ ] Configure Alembic for migrations
- [ ] Set up Redis for caching/rate limiting
- [ ] Configure email with production SMTP
- [ ] Set up monitoring/logging aggregation
- [ ] Use `gunicorn` instead of `uvicorn` dev server
- [ ] Review and update `ALLOWED_ORIGINS` for CORS
681234567
```

## 📧 Email Notifications

The system sends emails for:

- User registration (email verification)
- Password reset
- Trip confirmations
- Payment receipts
- Support requests

Configure SMTP credentials in `.env` to enable email sending.

## 🚀 Deployment

### Docker

```bash
docker build -t taxi-system .
docker run -p 8000:8000 --env-file .env taxi-system
```

### Production Checklist

- [ ] Set `JWT_SECRET` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Use PostgreSQL with SSL connection
- [ ] Enable HTTPS (CORS should be updated)
- [ ] Configure Alembic for migrations
- [ ] Set up Redis for caching/rate limiting
- [ ] Configure email with production SMTP
- [ ] Set up monitoring/logging aggregation
- [ ] Use `gunicorn` instead of `uvicorn` dev server
- [ ] Review and update `ALLOWED_ORIGINS` for CORS
681234567
```

## 📧 Email Notifications

The system sends emails for:

- User registration (email verification)
- Password reset
- Trip confirmations
- Payment receipts
- Support requests

Configure SMTP credentials in `.env` to enable email sending.

## 🚀 Deployment

### Docker

```bash
docker build -t taxi-system .
docker run -p 8000:8000 --env-file .env taxi-system
```

### Production Checklist

- [ ] Set `JWT_SECRET` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Use PostgreSQL with SSL connection
- [ ] Enable HTTPS (CORS should be updated)
- [ ] Configure Alembic for migrations
- [ ] Set up Redis for caching/rate limiting
- [ ] Configure email with production SMTP
- [ ] Set up monitoring/logging aggregation
- [ ] Use `gunicorn` instead of `uvicorn` dev server
- [ ] Review and update `ALLOWED_ORIGINS` for CORS
