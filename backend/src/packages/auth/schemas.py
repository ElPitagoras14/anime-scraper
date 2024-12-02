from pydantic import BaseModel


class AuthInfo(BaseModel):
    username: str
    password: str
