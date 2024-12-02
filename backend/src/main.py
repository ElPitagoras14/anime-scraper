import uuid
import uvicorn
from jose import JWTError, jwt
from loguru import logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from config import general_settings
from databases.postgres.client import DatabaseSession
from databases.postgres.models import User
from routes import router
from log import configure_logs
from contextlib import asynccontextmanager
from watchgod import run_process

from packages.auth import get_password_hash

HOST = general_settings.HOST
PORT = general_settings.PORT
APP_NAME = general_settings.APP_NAME
SECRET_KEY = general_settings.AUTH_SECRET_KEY
ALGORITHM = general_settings.AUTH_ALGORITHM
APP_ADMIN_USER = general_settings.APP_ADMIN_USER
APP_ADMIN_PASS = general_settings.APP_ADMIN_PASS

configure_logs()


@asynccontextmanager
async def lifespan(app: FastAPI):
    with DatabaseSession() as db:
        root_user = (
            db.query(User).filter(User.is_admin).first()
        )
        if not root_user:
            hashed_password = get_password_hash(APP_ADMIN_PASS)
            root_user = User(
                username=APP_ADMIN_USER,
                password=hashed_password,
                is_admin=True,
                is_active=True,
            )
            db.add(root_user)
            db.commit()
            db.refresh(root_user)
    try:
        yield
    finally:
        logger.remove("request_id")
        logger.remove("user")


app = FastAPI(
    title="Anime Scraper API",
    description="Scraper for anime data and download links.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_logging_context(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    user = None
    token = request.headers.get("Authorization")
    if token:
        token = token.split(" ")[-1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user = payload.get("sub")
        except JWTError:
            user = None
    if user:
        user = user
    with logger.contextualize(request_id=request_id, user=user):
        response = await call_next(request)

    return response


app.include_router(router, prefix="/api/v2")


def start():
    uvicorn.run(app=APP_NAME, host=HOST, port=PORT, reload=False)


if __name__ == "__main__":
    run_process(".", start)
