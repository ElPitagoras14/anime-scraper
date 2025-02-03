from datetime import datetime, timedelta, timezone
from jose import jwt
from loguru import logger

from databases.postgres import DatabaseSession, User

from .utils import get_password_hash, verify_password
from .config import auth_settings
from .responses import Token


SECRET_KEY = auth_settings.SECRET_KEY
ALGORITHM = auth_settings.ALGORITHM
EXPIRE_MINUTES = auth_settings.EXPIRE_MINUTES


def login_controller(username: str, password: str):
    logger.debug(f"User {username} is trying to log in")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return False, "User not found"
        if not verify_password(password, user.password):
            return False, "Invalid password"
        if not user.is_active:
            return False, "User is not active, please contact an admin"
        logger.info(f"User {username} logged in")
        return True, create_access_token(
            {
                "sub": str(user.id),
                "username": user.username,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "avatar": user.avatar,
            }
        )


def register_controller(username: str, password: str, avatar: str = None):
    logger.debug(f"User {username} is trying to register")
    with DatabaseSession() as db:
        user = db.query(User).filter(User.username == username).first()
        if user:
            return False, "User already exists"
        hashed_password = get_password_hash(password)
        user = User(username=username, password=hashed_password)
        if avatar:
            user.avatar = avatar
        db.add(user)
        db.commit()
        logger.info(f"User {username} registered")
        return True, "User registered"


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return Token(
        token=encoded_jwt,
        type="bearer",
    )


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.JWTError:
        return False
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return False
