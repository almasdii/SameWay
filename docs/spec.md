For development, limited hosts (localhost, 127.0.0.1) are allowed.
CORS is configured to allow requests from frontend (localhost:3000).

Wildcard "*" is avoided in production due to security risks.

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

### Optimization Strategies

- Use Redis caching
- Optimize database queries
- Use background tasks (Celery)

### Profiling Overhead

Profiling introduces performance overhead.

Solutions:

- Use only in development
- Use sampling profilers
- Profile selectively


# Taxi System – Email & Password Reset Plan

## 1. Endpoints

### 1.1 `/auth/register` – User Registration

* **Method:** `POST`
* **Request Body:**
* `email: str`
* `password: str`
* **Flow:**

1. Check if a user with the given email already exists.
2. Hash the password.
3. Create a new user in the database.
4. Generate a token for email verification.
5. Send an email with a verification link.

* **Response:**
* `{ "message": "User created successfully. Check your email to verify your account." }`

---

### 1.2 `/auth/verify-email/{token}` – Email Verification

* **Method:** `GET`
* **Parameters:** `token: str`
* **Flow:**

1. Validate the token.
2. If valid → mark the user's email as verified.

* **Response:**
* `{ "message": "Email verified successfully." }`

---

### 1.3 `/auth/password-reset-request` – Password Reset Request

* **Method:** `POST`
* **Request Body:**
* `email: str`
* **Flow:**

1. Generate a token for password reset.
2. Send an email with a link to reset the password.

* **Response:**
* `{ "message": "Password reset link sent to your email." }`

---

### 1.4 `/auth/password-reset-confirm/{token}` – Password Reset Confirmation

* **Method:** `POST`
* **Parameters:** `token: str`
* **Request Body:**
* `new_password: str`
* **Flow:**

1. Validate the token.
2. Hash the new password.
3. Update the password in the database.

* **Response:**
* `{ "message": "Password reset successfully." }`

---

## 2. Notes

* All emails are sent via **Gmail** or another SMTP service.
* For Gmail, an **App Password** is required.
* Email verification and password reset use  **URL-safe tokens** .
* Tokens have an expiration time for security.
* auth module changed
* middleware folder added with rate limit and logging
* and spec.md , mail.py , celery_task added
* main.py changed
