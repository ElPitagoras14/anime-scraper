from datetime import datetime, timezone
from loguru import logger

from databases.postgres import DatabaseSession, User

from packages.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from .utils import cast_single_user, cast_user_token, cast_users_list


def get_all_users_controller(
    sort_by: str, desc: bool, page: str, size: str, user_id: str
):
    logger.debug(
        f"Getting all users with sort_by: {sort_by}, "
        + f"desc: {desc}, page: {page}, size: {size}"
    )
    with DatabaseSession() as db:
        order_by_clause = None
        if sort_by is not None:
            order_by_column = getattr(User, sort_by)
            order_by_clause = (
                order_by_column.desc() if desc else order_by_column.asc()
            )

        prioritized_order = (User.id == user_id).desc()

        page = int(page)
        size = int(size)
        if size == -1:
            offset = None
            limit = None
        else:
            offset = page * size
            limit = size

        query = db.query(User)
        if order_by_clause is not None:
            query = query.order_by(prioritized_order, order_by_clause)
        else:
            query = query.order_by(prioritized_order)
        if offset is not None:
            query = query.offset(offset)
        total = query.count()
        if limit is not None:
            query = query.limit(limit)

        users = query.all()

        return cast_users_list(users, total)


def get_user_controller(user_id: str):
    logger.debug(f"Getting user with id: {user_id}")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        return cast_single_user(user)


def create_user_controller(user: dict):
    logger.debug(f"Creating user with username: {user.username}")
    with DatabaseSession() as db:
        user_exists = (
            db.query(User).filter(User.username == user.username).first()
        )
        if user_exists:
            return False
        new_user = User(
            username=user.username,
            password=user.password,
        )
        if user.avatar:
            new_user.avatar = user.avatar
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return cast_single_user(new_user)


def update_user_info_controller(user_id: str, user: dict):
    logger.debug(f"Updating user with id: {user_id}")
    with DatabaseSession() as db:
        user_db = db.query(User).filter(User.id == user_id).first()
        if not user_db:
            return False, "User not found"
        if user.username:
            user_db.username = user.username
        if user.new_password:
            if not verify_password(user.current_password, user_db.password):
                return False, "Password is incorrect"
            if user.new_password:
                user_db.password = get_password_hash(user.new_password)
        user_db.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user_db)
        token_data = {
            "sub": str(user_db.id),
            "username": user_db.username,
            "is_active": user_db.is_active,
            "is_admin": user_db.is_admin,
            "avatar": user_db.avatar,
        }
        token = create_access_token(token_data)
        return True, cast_user_token(user_db, token)


def change_user_avatar_controller(user_id: str, avatar: str):
    logger.debug(f"Changing avatar for user with id: {user_id}")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "User not found"
        user.avatar = avatar
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return True, cast_single_user(user)


def change_user_status_controller(
    user_id: str, is_active: bool = None, is_admin: bool = None
):
    logger.debug(f"Changing status for user with id: {user_id}")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "User not found"
        if is_active is not None:
            user.is_active = is_active
        if is_admin is not None:
            user.is_admin = is_admin
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return cast_single_user(user)


def delete_user_controller(user_id: str):
    logger.debug(f"Deleting user with id: {user_id}")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True
