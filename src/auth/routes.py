from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timedelta

from src.users.service import UserService
from src.users.schema import UserLoginModel, UserCreateModel
from src.auth.utils import (
    RefreshTokenBearer,
    AccessTokenBearer,
    create_access_token,
    decode_token,
    get_current_user,
    create_url_safe_token,
    decode_url_safe_token
)
from src.auth.security import verify_password, hash_password
from src.db.session import get_session
from src.db.redis import add_jti_to_blocklist, token_in_blocklist
from src.dependencies import RoleChecker
from src.errors.customErrors import (
    InvalidToken,
    UserAlreadyExists,
    InvalidCredentials,
    UserNotFoundByEmail
)
from src.mail import mail, create_message

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

user_service = UserService()
role_checker = RoleChecker(allowed_roles=["admin", "driver", "passenger"])


@auth_router.get("/me", dependencies=[Depends(role_checker)])
async def current_user(user=Depends(get_current_user)):
    return user


@auth_router.post("/register")
async def register(
    user_create: UserCreateModel,
    session: AsyncSession = Depends(get_session),
):
    existing_user = await user_service.get_user_by_email(session, user_create.email)
    if existing_user:
        raise UserAlreadyExists()

    new_user = await user_service.create_user(session, user_create)

    token = create_url_safe_token({"email": new_user.email})

    message = create_message(
        recipients=[new_user.email],
        subject="Verify your email",
         body="Welcome to Taxi System! Your account has been created successfully."
    )
    if mail:
        await mail.send_message(message)

    return {"message": "User created successfully. Check your email to verify your account."}

@auth_router.get("/verify-email/{token}")
async def verify_email(token: str, session: AsyncSession = Depends(get_session)):
    token_data = decode_url_safe_token(token, max_age=3600)
    email = token_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = await user_service.get_user_by_email(session, email)
    if not user:
        raise UserNotFoundByEmail()
    await user_service.update_user(user, {"is_verified": True}, session)
    return {"message": "Email verified successfully"}


@auth_router.post("/login")
async def login(user_login: UserLoginModel, session: AsyncSession = Depends(get_session)):
    email = user_login.email
    password = user_login.password
    user = await user_service.get_user_by_email(session, email)
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentials()

    user_data = {"email": user.email, "uid": str(user.uid), "roles": user.role}

    access_token = create_access_token(user_data=user_data)
    refresh_token = create_access_token(
        user_data=user_data,
        expiry=timedelta(days=7),
        refresh=True
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@auth_router.post("/refresh")
async def refresh_token(token_details: dict = Depends(RefreshTokenBearer())):
    jti = token_details.get("jti")
    if await token_in_blocklist(jti):
        raise InvalidToken()

    expiry_timestamp = token_details["exp"]
    if datetime.fromtimestamp(expiry_timestamp) <= datetime.now():
        raise InvalidToken()

    user_data = token_details["user_data"]
    new_access_token = create_access_token(user_data=user_data)

    return JSONResponse(content={"access_token": new_access_token}, status_code=200)

@auth_router.post("/logout")
async def logout(token_details: dict = Depends(AccessTokenBearer())):
    jti = token_details.get("jti")
    if not jti:
        raise InvalidToken()

    await add_jti_to_blocklist(jti)
    return JSONResponse(content={"message": "Logout successful"}, status_code=200)


from src.auth.schema import PasswordResetRequestModel, PasswordResetConfirmModel

@auth_router.post("/password-reset-request")
async def password_reset_request(email_data: PasswordResetRequestModel):
    email = email_data.email
    token = create_url_safe_token({"email": email})
    subject = "Reset Your Password"
    if mail:
        await mail.send_message(create_message([email], subject, "HELLO"))
    return {"message": "Check your email for password reset instructions"}


@auth_router.post("/password-reset-confirm/{token}")
async def password_reset_confirm(
    token: str,
    passwords: PasswordResetConfirmModel,
    session: AsyncSession = Depends(get_session)
):
    if passwords.new_password != passwords.confirm_new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    token_data = decode_url_safe_token(token, max_age=3600)
    email = token_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await user_service.get_user_by_email(session, email)
    if not user:
        raise UserNotFoundByEmail()

    new_hash = hash_password(passwords.new_password)
    await user_service.update_user(user, {"hashed_password": new_hash}, session)

    return {"message": "Password reset successfully"}