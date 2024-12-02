from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import datetime

from ..auth import Token

from utils.responses import SuccessResponse


class User(BaseModel):
    id: str
    username: str
    avatar: str | None
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserList(BaseModel):
    items: list[User]
    total: int


class UserToken(BaseModel):
    token: Token
    user: User


class UserOut(SuccessResponse):
    payload: User | None


class UserListOut(SuccessResponse):
    payload: UserList | None


class UserTokenOut(SuccessResponse):
    payload: UserToken | None
