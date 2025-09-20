from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Task Manager"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    ALEMBIC_INI: str = "alembic.ini"


settings = Settings()
