from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class User(BaseModel):
    id: uuid.UUID
    username: str
    avatar_url: str | None = None
    avatar_label: str | None = None
    role: str
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserOut(BaseModel):
    payload: User | None


class UserList(BaseModel):
    items: list[User]
    total: int


class UserListOut(BaseModel):
    payload: UserList | None


class Avatar(BaseModel):
    id: int
    label: str
    url: str


class AvatarList(BaseModel):
    items: list[Avatar]
    total: int


class AvatarListOut(BaseModel):
    payload: AvatarList | None


class Statistics(BaseModel):
    saved_animes: int
    downloaded_episodes: int
    in_emission_animes: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class StatisticsOut(BaseModel):
    payload: Statistics | None
