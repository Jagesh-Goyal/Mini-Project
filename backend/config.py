from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./dakshtra.db"
    cors_origins: str = "http://localhost:5173"
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_server: str = ""
    mail_port: int = 587
    mail_starttls: bool = True
    mail_ssl_tls: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
