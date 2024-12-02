from typing import Optional
from pydantic import BaseModel


class NewUser(BaseModel):
    username: str
    password: str
    avatar: Optional[str] = None


class UpdateUser(BaseModel):
    username: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
