from loguru import logger

from databases.postgres import DatabaseSession, User

from .utils import create_access_token, get_password_hash, verify_password


def login_controller(username: str, password: str):
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
