import time
from psycopg2 import OperationalError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from loguru import logger

from .config import postgres_settings

HOST = postgres_settings.HOST
USER = postgres_settings.USER
PASS = postgres_settings.PASS
PORT = postgres_settings.PORT
DATABASE = postgres_settings.DATABASE

postgres_url = f"postgresql+psycopg2://{USER}:{PASS}@{HOST}:{PORT}/{DATABASE}"
RETRIES = 5
DELAY = 5

for _ in range(RETRIES):
    try:
        engine = create_engine(
            postgres_url,
            pool_size=10,
            max_overflow=5,
            pool_timeout=30,
            pool_recycle=1800,
        )
        with engine.connect() as connection:
            logger.info(
                f"Connected to the database {DATABASE} on "
                + f"{HOST}:{PORT} as {USER}"
            )
        break
    except OperationalError:
        logger.error(
            f"Could not connect to the database {DATABASE} on "
            + f"{HOST}:{PORT} as {USER}. Retrying in {DELAY} seconds."
        )
        time.sleep(DELAY)
else:
    logger.error(
        f"Could not connect to the database {DATABASE} on "
        + f"{HOST}:{PORT} as {USER}. Exiting."
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
