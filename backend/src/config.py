from dotenv import find_dotenv
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class GeneralSettings(BaseSettings):
    HOST: str
    PORT: int
    APP_NAME: str

    APP_ADMIN_USER: str
    APP_ADMIN_PASS: str

    LOG_APP_PATH: str
    LOG_ERROR_PATH: str

    AUTH_SECRET_KEY: str
    AUTH_ALGORITHM: str

    model_config = SettingsConfigDict(
        env_file=find_dotenv(filename=".env", usecwd=True),
        env_file_encoding="utf-8",
        extra="ignore",
    )


general_settings = GeneralSettings()
