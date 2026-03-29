from functools import lru_cache

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    secret_key: str = Field(default="change-me", env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    database_url: str = Field(default="sqlite:///./dakshtra.db", env="DATABASE_URL")
    cors_origins: str = Field(default="http://localhost:5173", env="CORS_ORIGINS")
    mail_username: str = Field(default="", env="MAIL_USERNAME")
    mail_password: str = Field(default="", env="MAIL_PASSWORD")
    mail_from: str = Field(default="", env="MAIL_FROM")
    mail_server: str = Field(default="", env="MAIL_SERVER")
    mail_port: int = Field(default=587, env="MAIL_PORT")
    mail_starttls: bool = Field(default=True, env="MAIL_STARTTLS")
    mail_ssl_tls: bool = Field(default=False, env="MAIL_SSL_TLS")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
