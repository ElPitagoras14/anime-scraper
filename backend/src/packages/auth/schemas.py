from typing import Optional
from pydantic import BaseModel


class AuthInfo(BaseModel):
    username: str
    password: str
    avatar: Optional[str] = None
