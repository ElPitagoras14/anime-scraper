from dotenv import find_dotenv
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class RedisSettings(BaseSettings):
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_QUEUE_NAME: str
    ANIME_FOLDER: str

    model_config = SettingsConfigDict(
        env_file=find_dotenv(filename=".env", usecwd=True),
        env_file_encoding="utf-8",
        extra="ignore",
    )


redis_settings = RedisSettings()
