from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "Task Manager"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")


settings = Settings()
