from pydantic import BaseModel


class LoginInfo(BaseModel):
    username: str
    password: str


class CreateInfo(BaseModel):
    username: str
    password: str
