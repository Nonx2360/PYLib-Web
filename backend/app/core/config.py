from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Smart Library API"
    environment: str = "development"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_minutes: int = 60 * 24 * 7
    student_access_token_expire_minutes: int = 15
    database_url: str = "sqlite+aiosqlite:///./smart_library.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    sarabun_font_path: str = "resources/fonts/THSarabunNew.ttf"
    encryption_secret: str = "library-encryption-key"
    hmac_secret: str = "library-hmac-secret"
    default_admin_username: str = "admin"
    default_admin_password: str = "changeme123"
    door_scanner_api_key: str = "library-door-access"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
