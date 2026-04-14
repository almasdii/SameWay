
from typing import List
from pydantic import BaseModel, EmailStr


class EmailModel(BaseModel):
    addresses: List[str]


class PasswordResetRequestModel(BaseModel):
    email: EmailStr


class PasswordResetConfirmModel(BaseModel):
    new_password: str
    confirm_new_password: str
    
    def check_passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("Passwords do not match")