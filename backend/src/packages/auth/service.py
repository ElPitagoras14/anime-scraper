from loguru import logger
from starlette import status

from databases.postgres import DatabaseSession, User
from utils.exceptions import NotFoundException, ConflictException
from .utils import (
    get_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    cast_tokens,
    cast_access_token,
)


def login_controller(username: str, password: str, request_id: str):
    logger.debug(f"User {username} is trying to log in")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            logger.debug(f"User {username} not found")
            raise NotFoundException("User not found", request_id=request_id)
        if not verify_password(password, user.password):
            logger.debug(f"Password for user {username} is wrong")
            raise ConflictException("Password is wrong", request_id=request_id)
        if not user.is_active:
            logger.debug(f"User {username} is not active")
            raise ConflictException(
                "User is not active", request_id=request_id
            )
        logger.info(f"User {username} logged in")
        access_token = create_access_token(
            {
                "id": str(user.id),
                "username": user.username,
                "isActive": user.is_active,
                "role": user.role.name,
                "avatarUrl": user.avatar.url if user.avatar else None,
                "avatarLabel": user.avatar.label if user.avatar else None,
            },
        )
        refresh_token = create_refresh_token(
            {
                "id": str(user.id),
                "username": user.username,
                "isActive": user.is_active,
                "role": user.role.name,
                "avatarUrl": user.avatar.url if user.avatar else None,
                "avatarLabel": user.avatar.label if user.avatar else None,
            },
        )
        casted_tokens = cast_tokens(access_token, refresh_token)
        return status.HTTP_200_OK, casted_tokens


def register_controller(username: str, password: str, request_id: str):
    logger.debug(f"User {username} is trying to register")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.username == username).first()
        if user:
            logger.debug(f"User {username} already exists")
            raise ConflictException(
                "User already exists", request_id=request_id
            )
        hashed_password = get_hash(password)
        user = User(username=username, password=hashed_password)
        db.add(user)
        logger.info(f"User {username} registered")
        return status.HTTP_200_OK, "User registered successfully"


def refresh_controller(refresh_token: str, request_id: str):
    logger.debug("Refreshing token")
    if not refresh_token:
        logger.debug("No refresh token provided")
        raise ConflictException(
            "No refresh token provided", request_id=request_id
        )
    payload = verify_token(refresh_token)
    if not payload:
        logger.debug("Invalid refresh token")
        raise ConflictException("Invalid refresh token", request_id=request_id)
    new_access_token = create_access_token(payload)
    casted_access_token = cast_access_token(new_access_token)
    return status.HTTP_200_OK, casted_access_token
