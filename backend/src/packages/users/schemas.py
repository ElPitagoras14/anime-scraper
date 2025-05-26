from pydantic import BaseModel


class UserInfo(BaseModel):
    username: str | None = None
    password: str | None = None
    avatar_id: str | None = None
    role: str | None = None
