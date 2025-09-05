from starlette import status
from loguru import logger

from databases.postgres import DatabaseSession, Avatar, User
from utils.exceptions import ConflictException, NotFoundException
from packages.auth import get_hash, verify_password
from .schemas import UserInfo
from .utils import cast_avatars, cast_user, cast_users


async def get_users_controller(user_id: str):
    logger.debug("Getting users")
    with DatabaseSession() as db:
        users = db.query(User).all()

        specific_user = None
        other_users = []

        for user in users:
            user_data = {
                "id": user.id,
                "username": user.username,
                "avatar_url": user.avatar.url if user.avatar else None,
                "avatar_label": user.avatar.label if user.avatar else None,
                "role": user.role.name,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }

            if user.id == user_id:
                specific_user = user_data
            else:
                other_users.append(user_data)

        all_users = []
        if specific_user:
            all_users.append(specific_user)
        all_users.extend(other_users)

        casted_users = cast_users(all_users, len(all_users))

        return status.HTTP_200_OK, casted_users


async def get_me_controller(user_id: str, request_id: str):
    logger.debug("Getting me")
    with DatabaseSession() as db:
        user = db.query(User).where(User.id == user_id).first()
        if not user:
            raise NotFoundException("User not found", request_id=request_id)
        avatar = db.query(Avatar).where(Avatar.id == user.avatar_id).first()
        if not avatar:
            raise NotFoundException("Avatar not found", request_id=request_id)

        user_data = {
            "id": user.id,
            "username": user.username,
            "avatar_url": avatar.url,
            "avatar_label": avatar.label,
            "role": user.role.name,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

        casted_user = cast_user(user_data)
        return status.HTTP_200_OK, casted_user


async def check_username_controller(username: str):
    logger.debug(f"Checking username {username}")
    with DatabaseSession() as db:
        user = db.query(User).where(User.username == username).first()
        if user:
            return status.HTTP_200_OK, False
        return status.HTTP_200_OK, True


async def get_avatars_controller():
    logger.debug("Getting avatars")
    with DatabaseSession() as db:
        avatars = db.query(Avatar).all()

        avatars = [
            {
                "id": avatar.id,
                "label": avatar.label,
                "url": avatar.url,
            }
            for avatar in avatars
        ]

        casted_avatars = cast_avatars(avatars, len(avatars))

        return status.HTTP_200_OK, casted_avatars


async def update_user_controller(
    user_info: UserInfo, user_id: str, request_id: str
):
    logger.debug(f"Updating user with id: {user_id}")
    with DatabaseSession() as db:
        user = db.query(User).where(User.id == user_id).first()
        if not user:
            raise NotFoundException("User not found", request_id=request_id)

        if user_info.username:
            user.username = user_info.username

        if user_info.password:
            if not verify_password(
                user_info.password.current_password, user.password
            ):
                raise ConflictException(
                    "Current password is incorrect", request_id=request_id
                )
            user.password = get_hash(user_info.password.new_password)

        if user_info.avatar_id:
            user.avatar_id = user_info.avatar_id

        db.add(user)
        db.flush()

        return status.HTTP_200_OK, "User updated successfully"
