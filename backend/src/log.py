import sys
from loguru import logger

from config import general_settings

LOG_APP_PATH = general_settings.LOG_APP_PATH
LOG_ERROR_PATH = general_settings.LOG_ERROR_PATH


def configure_logs():
    logger_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level> | {extra}"
    )

    logger.remove()
    logger.add(sys.stderr, format=logger_format)
    logger.remove()

    logger.add(
        sys.stdout,
        level="DEBUG",
        format=logger_format,
    )

    if LOG_APP_PATH:
        logger.add(
            LOG_APP_PATH,
            rotation="10 MB",
            retention="30 days",
            level="INFO",
            format=logger_format,
        )

    if LOG_ERROR_PATH:
        logger.add(
            LOG_ERROR_PATH,
            rotation="1 day",
            retention="30 days",
            level="ERROR",
            format=logger_format,
        )
