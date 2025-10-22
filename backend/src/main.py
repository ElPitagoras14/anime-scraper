import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from contextlib import asynccontextmanager

from databases.postgres import DatabaseSession, User
from packages.auth import get_hash
from utils.exception_handlers import (
    custom_http_exception_handler,
    general_exception_handler,
)
from scalar_fastapi import get_scalar_api_reference
from utils.exceptions import CustomHTTPException
from log import configure_logs
from config import general_settings
from routes import router
from watchgod import run_process
from middleware import add_logging_and_timing

PORT = general_settings.API_PORT
ADMIN_USER = general_settings.ADMIN_USER
ADMIN_PASS = general_settings.ADMIN_PASS


configure_logs()


@asynccontextmanager
async def lifespan(app: FastAPI):
    with DatabaseSession() as db:
        root_user = db.query(User).filter(User.role_id == 1).first()
        if not root_user:
            logger.info("Admin user not found, creating...")
            hashed_password = get_hash(ADMIN_PASS)
            root_user = User(
                username=ADMIN_USER,
                password=hashed_password,
                role_id=1,
                is_active=True,
            )
            db.add(root_user)
            db.commit()
            db.refresh(root_user)
            logger.success(f"Admin user '{ADMIN_USER}' created successfully")
        guest_user = db.query(User).filter(User.role_id == 3).first()
        if not guest_user:
            logger.info("Guest user not found, creating...")
            hashed_password = get_hash("guest123")
            guest_user = User(
                username="guest",
                password=hashed_password,
                role_id=3,
                is_active=True,
            )
            db.add(guest_user)
            db.commit()
            db.refresh(guest_user)
            logger.success("Guest user 'guest' created successfully")

    logger.info("Application starting up...")
    yield

    logger.info("Application shutting down...")


version = "1.0.0"

app = FastAPI(
    title="Ani Seek API",
    description="API for scraped anime data from various sources.",
    version=version,
    lifespan=lifespan,
)

app.middleware("http")(add_logging_and_timing)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(CustomHTTPException, custom_http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": version, "service": "Ani Seek API"}


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
    )


def start():
    logger.info(f"Server starting on port {PORT}")

    uvicorn.run(app="main:app", host="0.0.0.0", port=PORT, reload=False)


if __name__ == "__main__":
    run_process(".", start)
