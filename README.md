# SameWay (TaxiSystem) — FastAPI backend

Backend для сервиса совместных поездок (carpooling): водители создают поездки, пассажиры бронируют места, оплачивают и оставляют отзывы.

## Требования

- Python 3.11+ (рекомендуется)
- PostgreSQL
- Redis (нужен для rate limit и token blocklist; также используется Celery)

## Быстрый старт

1) Создай виртуальное окружение и установи зависимости:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

2) Скопируй и заполни переменные окружения:

```bash
copy .env.example .env
```

Минимально нужны: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `REDIS_URL`.

3) Запусти PostgreSQL и Redis локально.

4) Запусти API:

```bash
uvicorn src.main:app --reload
```

Проверка:
- `GET /health` → `{ "status": "ok" }`
- Swagger: `/docs`

## Почта (опционально)

Если `MAIL_USERNAME` пустой, отправка писем автоматически отключается (эндпоинты не будут падать).

## Celery (опционально)

Если хочешь отправлять email в фоне:

```bash
celery -A src.celery_tasks.celery_app worker --loglevel=info
```

## О проекте / требования

Сценарии и требования описаны в `plan.md`.

