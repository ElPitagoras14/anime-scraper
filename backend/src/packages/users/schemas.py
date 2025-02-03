from typing import Optional
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class NewUser(BaseModel):
    username: str
    password: str
    avatar: Optional[str] = None


class UpdateUser(BaseModel):
    username: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UpdateStatus(BaseModel):
    is_active: bool
    is_admin: bool

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
