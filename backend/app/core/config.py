import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    ENV: str = "development"
    SECRET_KEY: str = "supersecretkeyfortokengenerationandencryption123!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 1440

    # PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "marketplace"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/marketplace"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_PATH: str = "./uploads"
    S3_BUCKET_NAME: str = "marketplace-bucket"
    AWS_ACCESS_KEY_ID: str = "mock_access_key"
    AWS_SECRET_ACCESS_KEY: str = "mock_secret_key"
    AWS_ENDPOINT_URL: str = "http://localhost:9000"

    # Platform Config
    PLATFORM_FEE_PERCENTAGE: float = 10.0

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
