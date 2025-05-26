from celery import Celery
from celery.signals import worker_ready
from config import general_settings
from loguru import logger

REDIS_URL = general_settings.REDIS_URL

celery_app = Celery(
    "worker_client",
    broker=f"{REDIS_URL}/0",
    backend=f"{REDIS_URL}/1",
)


@worker_ready.connect
def on_worker_ready(**kwargs):
    logger.info("Celery published worker ready")
