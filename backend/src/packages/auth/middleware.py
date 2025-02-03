from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError


from .config import auth_settings

SECRET_KEY = auth_settings.SECRET_KEY
ALGORITHM = auth_settings.ALGORITHM
EXPIRE_MINUTES = auth_settings.EXPIRE_MINUTES


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> dict:
        credentials: HTTPAuthorizationCredentials = await super().__call__(
            request
        )
        if not credentials:
            raise HTTPException(
                status_code=401, detail="Authorization header missing"
            )
        if credentials.scheme != "Bearer":
            raise HTTPException(
                status_code=401, detail="Invalid authentication scheme"
            )
        return self.verify_jwt(credentials.credentials)

    def verify_jwt(self, token: str) -> dict:
        try:
            user = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return user
        except JWTError:
            raise HTTPException(
                status_code=401, detail="Sesión inválida o expirada."
            )


auth_scheme = JWTBearer()


async def get_current_user(payload: dict = Depends(auth_scheme)):
    user_id = payload.get("sub")
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
    return payload
