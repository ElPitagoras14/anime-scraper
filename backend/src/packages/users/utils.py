from databases.postgres.models import User as UserModel
from utils.utils import convert_to_local

from .responses import UserList, User, UserToken


def cast_single_user(user: UserModel):
    return User(
        id=str(user.id),
        username=user.username,
        avatar=user.avatar,
        is_admin=user.is_admin,
        is_active=user.is_active,
        created_at=convert_to_local(user.created_at),
        updated_at=convert_to_local(user.updated_at),
    )


def cast_users_list(users: list[UserModel], total: int):
    return UserList(
        items=[cast_single_user(user) for user in users],
        total=total,
    )


def cast_user_token(user: UserModel, token: dict):
    return UserToken(
        token=token,
        user=cast_single_user(user),
    )
