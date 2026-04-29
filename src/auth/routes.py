from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timedelta

from src.users.service import UserService
from src.users.schema import UserLoginModel, UserCreateModel, UserUpdate
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
from src.celery_tasks import send_email
from src.config import settings

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
    
    verification_link = f"{settings.BASE_URL}/auth/verify-email/{token}"
    
    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                <h2>Welcome to Taxi System! </h2>
                <p>Your account has been created successfully.</p>
                <p>Please verify your email by clicking the button below:</p>
                <div style="margin: 20px 0;">
                    <a href="{verification_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p><code>{verification_link}</code></p>
                <p><small>This verification link expires in 1 hour.</small></p>
            </div>
        </body>
    </html>
    """
    
    send_email.delay(
        recipients=[new_user.email],
        subject="Verify your email - Taxi System",
        body=email_body
    )

    return {"message": "User created successfully. Check your email to verify your account."}

@auth_router.get("/verify-email/{token}")
async def verify_email(token: str, session: AsyncSession = Depends(get_session)):
    try:
        token_data = decode_url_safe_token(token, max_age=3600)
    except Exception as e:
        raise InvalidToken(detail=f"Token expired or invalid: {str(e)}")
    
    email = token_data.get("email")
    if not email:
        raise InvalidToken(detail="No email found in verification token")
    
    user = await user_service.get_user_by_email(session, email)
    if not user:
        raise UserNotFoundByEmail()
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    user.is_verified = True
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return {"message": "Email verified successfully! You can now log in."}


@auth_router.post("/login")
async def login(user_login: UserLoginModel, session: AsyncSession = Depends(get_session)):
    email = user_login.email
    password = user_login.password
    user = await user_service.get_user_by_email(session, email)
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentials()

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification link."
        )

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
async def password_reset_request(
    email_data: PasswordResetRequestModel,
    session: AsyncSession = Depends(get_session)
):
    
    email = email_data.email
    
    user = await user_service.get_user_by_email(session, email)
    if not user:
        raise UserNotFoundByEmail()
    
    token = create_url_safe_token({"email": email})
    reset_link = f"{settings.BASE_URL}/auth/password-reset-confirm/{token}"

    send_email.delay(
        recipients=[email],
        subject="Reset Your Password - Taxi System",
        body=f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password.</p>
                    <p>Click the button below to set a new password:</p>
                    <div style="margin: 20px 0;">
                        <a href="{reset_link}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p><code>{reset_link}</code></p>
                    <p><small>This link expires in 1 hour. If you did not request a password reset, ignore this email.</small></p>
                </div>
            </body>
        </html>
        """
    )

    return {"message": "Check your email for password reset instructions"}


@auth_router.post("/password-reset-confirm/{token}")
async def password_reset_confirm(
    token: str,
    passwords: PasswordResetConfirmModel,
    session: AsyncSession = Depends(get_session)
):
    if passwords.new_password != passwords.confirm_new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(passwords.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    token_data = decode_url_safe_token(token, max_age=3600)
    email = token_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = await user_service.get_user_by_email(session, email)
    if not user:
        raise UserNotFoundByEmail()

    new_hash = hash_password(passwords.new_password)
    await user_service.update_user(session, user, UserUpdate(hashed_password=new_hash))

    return {"message": "Password reset successfully"}