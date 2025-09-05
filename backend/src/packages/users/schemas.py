from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class PasswordInfo(BaseModel):
    current_password: str | None = None
    new_password: str | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserInfo(BaseModel):
    username: str | None = None
    password: PasswordInfo | None = None
    avatar_id: int | None = None
    role: str | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
