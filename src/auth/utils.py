from datetime import datetime, timedelta
import uuid
import logging
import jwt
from fastapi import Depends, HTTPException, Request, status
from dotenv import load_dotenv
from fastapi.security import HTTPBearer

from src.config import settings
from src.errors.customErrors import AccessTokenRequired, InvalidToken, RefreshTokenRequired
from src.db.redis import token_in_blocklist
from src.db.session import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from src.users.service import UserService
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired


load_dotenv() 
user_service = UserService()

def create_access_token(user_data:dict,expiry:timedelta = None,refresh:bool=False) -> str:
	payload = {
		"user_data" : user_data,
		"exp" : datetime.utcnow() + (expiry if expiry else timedelta(minutes=10)),
		"jti" : str(uuid.uuid4()),
		"refresh" : refresh
	}
	token = jwt.encode(
		payload=payload,
		key=settings.JWT_SECRET,
		algorithm=settings.JWT_ALGORITHM
	)
	return token

def decode_token(token:str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload

    except jwt.PyJWTError:
        return None
		

class TokenBearer(HTTPBearer):
	def __init__(self, auto_error: bool = True):
		super(TokenBearer, self).__init__(auto_error=auto_error)

	async def __call__(self, request: Request):
		creds = await super().__call__(request)

		token = creds.credentials
		if not token:
			raise AccessTokenRequired()
		
		token_data = decode_token(token)

		if not token_data:
			raise InvalidToken()
		
		self.verify_token_data(token_data)
		if await token_in_blocklist(token_data['jti']):
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN, detail={
				"error":"This token is invalid or has been revoked",
				"resolution":"Please get new token"
			}
		)
		return token_data

	def verify_token_data(self, token_data: dict):
		raise NotImplementedError("Subclasses must implement this method to verify token data")
	
class AccessTokenBearer(TokenBearer):
	def verify_token_data(self, token_data: dict) -> None:
		if token_data.get("refresh"):
			raise AccessTokenRequired("Expected access token but got refresh token")

class RefreshTokenBearer(TokenBearer):
	def verify_token_data(self, token_data: dict) -> None:
		if not token_data.get("refresh"):
			raise RefreshTokenRequired()
		
	

async def get_current_user(
    token_details: dict = Depends(AccessTokenBearer()),
    session: AsyncSession = Depends(get_session),
):
		
    user_email = token_details["user_data"]["email"]

    user = await user_service.get_user_by_email(session, user_email)

    return user



serializer = URLSafeTimedSerializer(secret_key=settings.JWT_SECRET, salt="email-configuration")

def create_url_safe_token(data: dict, expiration=3600) -> str:
    return serializer.dumps(data)

def decode_url_safe_token(token: str, max_age=3600) -> dict:
    try:
        data = serializer.loads(token, max_age=max_age)
        return data
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="Token has expired")
    except BadSignature:
        raise HTTPException(status_code=400, detail="Invalid token")