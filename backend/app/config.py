import os
import warnings
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    PROJECT_NAME: str = "Amautia"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://amautia:amautia_dev@localhost:5432/amautia"
    REDIS_URL: str = "redis://localhost:6379/0"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET: str = "amautia"
    MINIO_SECURE: bool = False

    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # NOTE: For production, add the actual domain(s) here or override via
    # the CORS_ORIGINS env var, e.g. CORS_ORIGINS='["https://app.amautia.com"]'
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_UPLOAD_TYPES: list[str] = [
        "application/pdf", "image/png", "image/jpeg", "image/jpg",
        "text/plain", "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    # Trial limits (free tier)
    TRIAL_MAX_CORRECTIONS: int = 5
    TRIAL_MAX_GENERATIONS: int = 3

    # AI Providers (set via env)
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # SMTP Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_TLS: bool = True

    # Encryption
    FERNET_KEY: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings():
    s = Settings()
    # Validate critical settings
    if not s.SECRET_KEY or s.SECRET_KEY == "amautia-secret-key-change-in-production":
        if os.getenv("ENV", "development") == "production":
            raise RuntimeError("SECRET_KEY must be set in production. Generate with: openssl rand -base64 32")
        warnings.warn("SECRET_KEY not set — using insecure default. Set SECRET_KEY env var for production.")
        s.SECRET_KEY = "dev-only-insecure-key-change-in-production"
    return s


settings = get_settings()
