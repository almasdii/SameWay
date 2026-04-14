# 🚕 Taxi System API

A modern, asynchronous **FastAPI**-based taxi booking and management platform with role-based access control, real-time tracking, comprehensive payment processing, and multi-feature support for drivers and passengers.

---

## 📖 Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage Instructions](#usage-instructions)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)

---

## 🎯 Problem Statement

The taxi booking industry faces critical challenges in **ride coordination**, **payment tracking**, **driver-passenger matching**, and **service quality assurance**. Traditional systems struggle with:

- ❌ **Race conditions** during concurrent ride bookings
- ❌ **No transparent payment tracking** or dispute resolution
- ❌ **Lack of quality feedback** mechanisms for accountability
- ❌ **Inefficient route planning** and trip management
- ❌ **Poor authentication/authorization** for multi-role systems
- ❌ **Limited scalability** for high-volume transactions

This **Taxi System API** solves these problems with a **robust, scalable, and production-ready** backend solution.

---

## 🚀 Features

### Core Functionality

- **User Management**: Multi-role system (Admin, Driver, Passenger) with email verification and role-based access control
- **Ride Booking**: Complex transaction handling with optimistic locking to prevent race conditions
- **Trip Management**: Plan, execute, and track trips with customizable route points
- **Vehicle Management**: Driver fleet management with seat capacity and availability tracking
- **Payment Processing**: Secure transaction tracking with multiple payment methods and history
- **Reviews & Ratings**: Post-trip reviews and driver/passenger ratings with feedback system

### Security & Performance

- **Authentication**: JWT-based auth with access/refresh token pattern and token revocation
- **Password Security**: bcrypt password hashing via passlib
- **Rate Limiting**: Redis-backed rate limiting (10 req/min, 50 req/hr per IP)
- **CORS & Middleware**: Trusted host validation and structured request logging
- **Token Revocation**: Redis-backed token blocklist for secure logout

### Infrastructure & Operations

- **Asynchronous Processing**: Full async/await support with FastAPI and asyncio
- **Structured Logging**: Request tracing and JSON logging for debugging
- **Database Migrations**: Alembic for schema versioning and rollback support
- **Email Support**: FastMail integration for transactional emails and notifications
- **Background Tasks**: Celery integration for async job queuing
- **Docker Support**: Complete Docker and Docker Compose setup for containerized deployment
- **Health Checks**: Built-in health endpoints and service status monitoring

---

## 📋 Technology Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| **Framework**  | FastAPI 0.100+, Uvicorn                     |
| **Language**   | Python 3.11+                                |
| **Database**   | PostgreSQL 15+ with async support (asyncpg) |
| **ORM**        | SQLModel (combines Pydantic + SQLAlchemy)   |
| **Auth**       | JWT (python-jose), bcrypt (passlib)         |
| **Caching**    | Redis 7+ (token blocklist, rate limiting)   |
| **Email**      | FastMail (SMTP)                             |
| **Migrations** | Alembic                                     |
| **Tasks**      | Celery + Redis                              |
| **Deployment** | Docker, Docker Compose                      |
| **API Docs**   | Swagger UI, ReDoc                           |

---

## 🏗️ Project Structure

```
taxiSystem/
├── src/
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Configuration management (Settings dataclass)
│   ├── dependencies.py         # Dependency injection helpers
│   ├── mail.py                 # Email service
│   ├── celery_tasks.py         # Background tasks
│   │
│   ├── auth/                   # Authentication & Authorization
│   │   ├── routes.py           # Auth endpoints (login, register, refresh)
│   │   ├── schema.py           # Pydantic schemas (TokenResponse, Credentials)
│   │   ├── security.py         # JWT token creation/verification
│   │   └── utils.py            # Auth utilities (password hashing)
│   │
│   ├── db/                     # Database Layer
│   │   ├── models.py           # SQLModel definitions (User, Booking, Trip, etc.)
│   │   ├── session.py          # DB connection & engine initialization
│   │   └── redis.py            # Redis client & token blocklist
│   │
│   ├── middleware/             # Custom Middleware
│   │   ├── logging.py          # Structured request/response logging
│   │   └── rate_limit.py       # Rate limiting enforcement
│   │
│   ├── errors/                 # Error Handling
│   │   └── customErrors.py     # Custom exception classes
│   │
│   ├── users/                  # User Management Module
│   │   ├── router.py           # User endpoints
│   │   ├── schema.py           # User request/response schemas
│   │   ├── service.py          # User business logic
│   │   └── __init__.py
│   │
│   ├── cars/                   # Vehicle Management Module
│   │   ├── router.py           # Car endpoints
│   │   ├── schema.py           # Car schemas
│   │   ├── service.py          # Car business logic
│   │   └── __init__.py
│   │
│   ├── trips/                  # Trip Management Module
│   │   ├── router.py           # Trip endpoints
│   │   ├── schema.py           # Trip schemas
│   │   ├── service.py          # Trip business logic
│   │   └── __init__.py
│   │
│   ├── booking/                # Ride Booking Module
│   │   ├── router.py           # Booking endpoints
│   │   ├── schema.py           # Booking schemas
│   │   ├── service.py          # Booking business logic (race condition handling)
│   │   └── __init__.py
│   │
│   ├── payments/               # Payment Processing Module
│   │   ├── router.py           # Payment endpoints
│   │   ├── schema.py           # Payment schemas
│   │   ├── service.py          # Payment business logic
│   │   └── __init__.py
│   │
│   ├── reviews/                # Reviews & Ratings Module
│   │   ├── router.py           # Review endpoints
│   │   ├── schema.py           # Review schemas
│   │   ├── service.py          # Review business logic
│   │   └── __init__.py
│   │
│   ├── routePoints/            # Route Points Module
│   │   ├── router.py           # Route endpoints
│   │   ├── schema.py           # Route schemas
│   │   ├── service.py          # Route business logic
│   │   └── __init__.py
│   │
│   └── support/                # Support Tickets Module
│       ├── router.py           # Support endpoints
│       ├── schema.py           # Support schemas
│       ├── service.py          # Support business logic
│       └── __init__.py
│
├── alembic/                    # Database Migrations
│   ├── env.py                  # Migration environment
│   ├── script.py.mako          # Migration template
│   └── versions/               # Migration scripts
│
├── Dockerfile                  # Multi-stage Docker image
├── docker-compose.yml          # Docker Compose services (app, postgres, redis)
├── alembic.ini                 # Alembic configuration
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (template)
└── README.md                   # This file
```

---

## 📦 Installation

### Prerequisites

- **Python 3.11+**
- **PostgreSQL 15+**
- **Redis 7+**
- **pip** or **poetry** for dependency management
- **Docker & Docker Compose** (optional, for containerized setup)

### Option 1: Local Setup (Development)

#### Step 1: Clone and Navigate to Project

```bash
cd taxiSystem
```

#### Step 2: Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\Activate.ps1
```

#### Step 3: Install Dependencies

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

#### Step 4: Set Up Environment Variables

Create a `.env` file in the `taxiSystem` directory:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taxi_system

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (FastMail)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@taxisystem.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_FROM_NAME=Taxi System
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
USE_CREDENTIALS=True
VALIDATE_CERTS=False
```

#### Step 5: Set Up PostgreSQL & Redis

Ensure PostgreSQL and Redis are running and accessible:

```bash
# Start PostgreSQL (if not running as a service)
# On macOS: brew services start postgresql
# On Windows: Services > PostgreSQL > Start

# Start Redis (if not running as a service)
# On macOS: brew services start redis
# On Windows: redis-server.exe
```

#### Step 6: Run Database Migrations

```bash
alembic upgrade head
```

#### Step 7: Start the Development Server

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: **http://localhost:8000**

- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

---

### Option 2: Docker Setup (Production-Ready)

#### Step 1: Build and Start Services

```bash
docker-compose up -d
```

This will start:

- **PostgreSQL 15** (port 5432)
- **Redis 7** (port 6379)
- **Taxi System API** (port 8000)

#### Step 2: Run Migrations

```bash
docker-compose exec app alembic upgrade head
```

#### Step 3: Access the Application

- API: **http://localhost:8000**
- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

#### Step 4: View Logs

```bash
docker-compose logs -f app
```

#### Step 5: Stop Services

```bash
docker-compose down
```

---

## 🎯 Usage Instructions

### 1. Authentication

#### Register a New User

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "John Doe",
    "role": "passenger"
  }'
```

**Response:**

```json
{
	"id": "uuid",
	"email": "user@example.com",
	"full_name": "John Doe",
	"role": "passenger",
	"is_active": true
}
```

#### Login and Get Tokens

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Response:**

```json
{
	"access_token": "eyJhbGc...",
	"refresh_token": "eyJhbGc...",
	"token_type": "bearer"
}
```

#### Refresh Access Token

```bash
curl -X POST "http://localhost:8000/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGc..."
  }'
```

### 2. Create a Booking

```bash
curl -X POST "http://localhost:8000/booking/create" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "passenger_id": "uuid",
    "pickup_location": "123 Main St",
    "dropoff_location": "456 Oak Ave",
    "scheduled_time": "2026-04-15T10:30:00Z"
  }'
```

### 3. View All Trips

```bash
curl -X GET "http://localhost:8000/trips/all" \
  -H "Authorization: Bearer {access_token}"
```

### 4. Add a Review

```bash
curl -X POST "http://localhost:8000/reviews/create" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "uuid",
    "rating": 5,
    "comment": "Great ride, very clean car!"
  }'
```

### 5. Process Payment

```bash
curl -X POST "http://localhost:8000/payments/process" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "uuid",
    "amount": 25.50,
    "payment_method": "credit_card"
  }'
```

---

## 📡 API Endpoints

### Authentication Endpoints (`/auth`)

| Method | Endpoint    | Description          | Auth Required |
| ------ | ----------- | -------------------- | ------------- |
| POST   | `/register` | Register new user    | ❌            |
| POST   | `/login`    | User login           | ❌            |
| POST   | `/refresh`  | Refresh access token | ❌            |
| POST   | `/logout`   | Logout user          | ✅            |

### User Endpoints (`/users`)

| Method | Endpoint     | Description         | Auth Required |
| ------ | ------------ | ------------------- | ------------- |
| GET    | `/profile`   | Get user profile    | ✅            |
| PUT    | `/profile`   | Update user profile | ✅            |
| GET    | `/{user_id}` | Get user by ID      | ✅            |
| DELETE | `/profile`   | Delete user account | ✅            |

### Booking Endpoints (`/booking`)

| Method | Endpoint        | Description        | Auth Required |
| ------ | --------------- | ------------------ | ------------- |
| POST   | `/create`       | Create new booking | ✅            |
| GET    | `/all`          | Get all bookings   | ✅            |
| GET    | `/{booking_id}` | Get booking by ID  | ✅            |
| PUT    | `/{booking_id}` | Update booking     | ✅            |
| DELETE | `/{booking_id}` | Cancel booking     | ✅            |

### Trip Endpoints (`/trips`)

| Method | Endpoint     | Description     | Auth Required |
| ------ | ------------ | --------------- | ------------- |
| POST   | `/create`    | Create new trip | ✅            |
| GET    | `/all`       | Get all trips   | ✅            |
| GET    | `/{trip_id}` | Get trip by ID  | ✅            |
| PUT    | `/{trip_id}` | Update trip     | ✅            |
| DELETE | `/{trip_id}` | Delete trip     | ✅            |

### Vehicle Endpoints (`/cars`)

| Method | Endpoint    | Description          | Auth Required |
| ------ | ----------- | -------------------- | ------------- |
| POST   | `/create`   | Register new vehicle | ✅            |
| GET    | `/all`      | Get all vehicles     | ✅            |
| GET    | `/{car_id}` | Get vehicle by ID    | ✅            |
| PUT    | `/{car_id}` | Update vehicle       | ✅            |
| DELETE | `/{car_id}` | Delete vehicle       | ✅            |

### Payment Endpoints (`/payments`)

| Method | Endpoint        | Description         | Auth Required |
| ------ | --------------- | ------------------- | ------------- |
| POST   | `/process`      | Process payment     | ✅            |
| GET    | `/history`      | Get payment history | ✅            |
| GET    | `/{payment_id}` | Get payment by ID   | ✅            |

### Review Endpoints (`/reviews`)

| Method | Endpoint       | Description       | Auth Required |
| ------ | -------------- | ----------------- | ------------- |
| POST   | `/create`      | Create new review | ✅            |
| GET    | `/all`         | Get all reviews   | ✅            |
| GET    | `/{review_id}` | Get review by ID  | ✅            |
| PUT    | `/{review_id}` | Update review     | ✅            |
| DELETE | `/{review_id}` | Delete review     | ✅            |

### Support Endpoints (`/support`)

| Method | Endpoint          | Description             | Auth Required |
| ------ | ----------------- | ----------------------- | ------------- |
| POST   | `/tickets/create` | Create support ticket   | ✅            |
| GET    | `/tickets`        | Get all support tickets | ✅            |
| GET    | `/tickets/{id}`   | Get ticket by ID        | ✅            |
| PUT    | `/tickets/{id}`   | Update ticket status    | ✅            |

---

## 📸 Screenshots

While this project is primarily a backend API, you can interact with it via:

1. **Swagger UI Documentation**: Navigate to `http://localhost:8000/docs` to explore all endpoints interactively
2. **ReDoc Documentation**: Navigate to `http://localhost:8000/redoc` for a cleaner documentation view
3. **Frontend Integration**: The application includes `frontend_full.html` for testing the API from a web interface

### API Documentation Features

- ✅ Interactive request/response testing
- ✅ Parameter validation and schema documentation
- ✅ Authorization token management
- ✅ Real-time API response previews
- ✅ Code generation for different languages

---

## 🔒 Security Considerations

### Password Security

- All passwords are hashed using bcrypt (10 salt rounds)
- Passwords are never stored in plain text

### Token Management

- JWT tokens have expiration times
- Refresh tokens enable secure token rotation
- Token revocation via Redis blocklist on logout

### Rate Limiting

- Global rate limiting: **10 requests/minute** per IP
- Burst limiting: **50 requests/hour** per IP
- Helps prevent abuse and DDoS attacks

### CORS & Hosts

- Configured trusted hosts (localhost, taxiSystem.com)
- CORS enabled for specific origins
- Prevents unauthorized cross-site requests

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
psql -U postgres -d taxi_system -c "SELECT 1"

# Reset database
alembic downgrade base
alembic upgrade head
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process  # Windows
```

### Clear Docker Cache

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 📝 Environment Variables Reference

| Variable      | Default Value          | Description                  |
| ------------- | ---------------------- | ---------------------------- |
| DATABASE_URL  | (required)             | PostgreSQL connection string |
| SECRET_KEY    | your-super-secret-key  | JWT signing secret           |
| ALGORITHM     | HS256                  | JWT algorithm                |
| REDIS_URL     | redis://localhost:6379 | Redis connection URL         |
| MAIL_USERNAME | test@example.com       | Email account for sending    |
| MAIL_PASSWORD | test                   | Email account password       |
| MAIL_FROM     | noreply@taxisystem.com | Email sender address         |
| MAIL_PORT     | 1025                   | SMTP port                    |
| MAIL_SERVER   | mailhog                | SMTP server address          |
| MAIL_STARTTLS | False                  | Enable STARTTLS for email    |
| MAIL_SSL_TLS  | False                  | Enable SSL/TLS for email     |

---

## 📞 Support & Contribution

For issues, questions, or contributions, please:

1. Check the API documentation at `http://localhost:8000/docs`
2. Review the code structure in [src/](src/)
3. Check existing error handling in [src/errors/](src/errors/customErrors.py)
4. Submit issues or pull requests to the repository

---

## 📄 License

This project is provided "as-is" for educational and commercial purposes.

**Last Updated**: April 2026  
**Python Version**: 3.11+  
**FastAPI Version**: 0.100+
pip install -r requirements.txt

````

4. **Configure environment**

```bash
cp .env.example .env  # Create from example
# Edit .env with your settings:
# - DATABASE_URL=postgresql+asyncpg://user:password@localhost/taxi_db
# - JWT_SECRET=your-secret-key
# - REDIS_URL=redis://localhost:6379
# - SMTP_HOST, SMTP_USER, SMTP_PASSWORD for email
````

5. **Create database**

```bash
alembic upgrade head
```

6. **Run migrations (optional)**

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

7. **Start the server**

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: **http://localhost:8000**

- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

## 📚 API Endpoints

### Health Check

```
GET /health
```

### Authentication

```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # Login with email/password
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Logout (revoke token)
GET    /api/auth/me                # Get current user
```

### Users

```
GET    /api/users/me               # Current user profile
GET    /api/users/{user_id}        # Get user by ID
GET    /api/users/search           # Search users
PUT    /api/users/{user_id}        # Update user
DELETE /api/users/{user_id}        # Delete user
```

### Cars

```
POST   /api/cars                   # Register vehicle
GET    /api/cars                   # List vehicles
GET    /api/cars/{car_id}          # Get vehicle
PUT    /api/cars/{car_id}          # Update vehicle
DELETE /api/cars/{car_id}          # Delete vehicle
```

### Trips

```
POST   /api/trips                  # Create trip
GET    /api/trips                  # List trips
GET    /api/trips/{trip_id}        # Get trip details
PUT    /api/trips/{trip_id}        # Update trip
DELETE /api/trips/{trip_id}        # Cancel trip
```

### Bookings

```
POST   /api/bookings               # Create booking
GET    /api/bookings               # List bookings
GET    /api/bookings/{booking_id}  # Get booking
PUT    /api/bookings/{booking_id}  # Update booking
DELETE /api/bookings/{booking_id}  # Cancel booking
```

### Payments

```
POST   /api/payments               # Create payment
GET    /api/payments               # List payments
GET    /api/payments/{payment_id}  # Get payment
```

### Reviews

```
POST   /api/reviews                # Create review
GET    /api/reviews                # List reviews
GET    /api/reviews/{review_id}    # Get review
```

### Route Points

```
POST   /api/route-points           # Create route point
GET    /api/route-points           # List route points
GET    /api/route-points/{rp_id}   # Get route point
```

## 🔐 Authentication

The API uses JWT tokens for authentication. All protected endpoints require the `Authorization` header:

```bash
Authorization: Bearer <access_token>
```

### Token Flow

1. **Register/Login** → Get `access_token` (10 min) + `refresh_token` (7 days)
2. **Access API** → Use `access_token` in Authorization header
3. **Token Expires** → Use `refresh_token` to get new `access_token`
4. **Logout** → Token added to blocklist, refresh returns 401

### User Roles

- **admin**: Full system access
- **driver**: Manage vehicles, trips, receive bookings
- **passenger**: Search trips, create bookings, reviews

## ⚙️ Configuration

All configuration is managed via environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/taxi_db
DATABASE_ECHO=False

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379/0

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=noreply@taxisystem.com

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://taxiSystem.com

# App
APP_NAME=Taxi System API
DEBUG=False
```

## 📊 Database Schema

Key models include:

- **User**: id, email, name, role, phone, avatar_url
- **Car**: id, driver_id, plate, make, model, color, seats
- **Trip**: id, driver_id, status, start_point, end_point, scheduled_at
- **Booking**: id, passenger_id, trip_id, status, seat_count
- **Payment**: id, booking_id, amount, status, method
- **Review**: id, booking_id, rating, comment
- **RoutePoint**: id, trip_id, type (pickup/dropoff/stop), latitude, longitude

## 📝 Error Handling

```json
{
	"detail": "User with this email already exists",
	"error_code": "USER_ALREADY_EXISTS"
}
```

Common error codes:

- `USER_NOT_FOUND` - User doesn't exist
- `INVALID_CREDENTIALS` - Wrong email/password
- `UNAUTHORIZED` - Missing/invalid token
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE_BOOKING` - Booking already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests

See `src/errors/customErrors.py` for full list.

## 🔄 Rate Limiting

API enforces rate limits per IP address:

- **Write operations (POST, PUT, DELETE)**: 10 requests per minute
- **Hourly limit**: 50 requests per hour
- **Read operations (GET)**: Not rate-limited

Rate limit headers in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1681234567
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
