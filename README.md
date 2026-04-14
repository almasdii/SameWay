# SameWay

FastAPI backend for a carpooling service connecting drivers and passengers.

## Problem statement

Drivers need a way to publish rides and passengers need a way to book seats, pay securely, and leave feedback. The backend should manage authentication, bookings, payments, trips, and notifications while supporting PostgreSQL and Redis.

## Features

- User registration and authentication
- Trip creation and search
- Booking management
- Integrated payment flow
- Reviews and ratings
- Redis-based rate limiting and token revocation
- Email notifications via Celery
- Database migrations with Alembic

## Installation

1. Install Python 3.11+.
2. Clone the repository.
3. Create and activate a virtual environment:

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Copy environment example and configure values:

```bash
copy .env.example .env
```

Required environment variables include:
- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `REDIS_URL`

## Usage

1. Start PostgreSQL and Redis.
2. Run database migrations:

```bash
alembic upgrade head
```

3. Start the FastAPI server:

```bash
uvicorn src.main:app --reload
```

4. Open API documentation in your browser:

- `http://127.0.0.1:8000/docs`

5. Health check endpoint:

- `GET /health`

### Optional email worker

If you want background email delivery:

```bash
celery -A src.celery_tasks.celery_app worker --loglevel=info
```

## Screenshots

No screenshots available.

## Technology stack

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- Celery
- Alembic

## Notes

Project plans and specifications are stored in `docs/plan.md` and `docs/spec.md`.

