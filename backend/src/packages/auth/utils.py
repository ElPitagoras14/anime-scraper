from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError, jwt
from loguru import logger


from .config import auth_settings
from .responses import Token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v2/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = auth_settings.SECRET_KEY
ALGORITHM = auth_settings.ALGORITHM
EXPIRE_MINUTES = auth_settings.EXPIRE_MINUTES


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


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


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        user = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = user.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "Could not validate credentials",
                    "user_id": user_id,
                    "error_code": "invalid_token",
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user
    except JWTError as e:
        logger.error(f"Error decoding token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Token expired or invalid",
                "error_code": "jwt_error",
                "error_description": str(e),
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Internal server error",
                "error_code": "server_error",
                "error_description": str(e),
            },
        )
