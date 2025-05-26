import time
from psycopg2 import OperationalError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from loguru import logger

from .config import postgres_settings

POSTGRES_URL = postgres_settings.POSTGRES_URL

host = POSTGRES_URL.split("@")[1].split(":")[0]
port = POSTGRES_URL.split(":")[2].split("/")[0]
user = POSTGRES_URL.split(":")[1].split("@")[0]
database = POSTGRES_URL.split("/")[1]

RETRIES = 5
DELAY = 5

for _ in range(RETRIES):
    try:
        engine = create_engine(
            POSTGRES_URL,
            pool_size=10,
            max_overflow=5,
            pool_timeout=30,
            pool_recycle=1800,
        )
        with engine.connect() as connection:
            logger.info(
                f"Connected to the database {database} on "
                + f"{host}:{port} as {user}"
            )
        break
    except OperationalError:
        logger.error(
            f"Could not connect to the database {database} on "
            + f"{host}:{port} as {user}. Retrying in {DELAY} seconds."
        )
        time.sleep(DELAY)
else:
    logger.error(
        f"Could not connect to the database {database} on "
        + f"{host}:{port} as {user}. Exiting."
    )
    exit(1)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class DatabaseSession:
    def __init__(self):
        self.db = None

    def __enter__(self) -> Session:
        self.db = SessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is None:
                self.db.commit()
            else:
                self.db.rollback()
        finally:
            self.db.close()
