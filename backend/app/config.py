import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from sqlmodel import create_engine, Session, SQLModel
from typing import Generator

load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", 8000))
    # Database Configuration
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", 5432))
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "password")
    db_name: str = os.getenv("DB_NAME", "postgres_db_name")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 如果 db_host 是 "db"，则替换为 "localhost"
        if self.db_host == "db":
            self.db_host = "localhost"

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()

# 数据库相关
# 移除了 check_same_thread 参数，因为它仅适用于 SQLite
engine = create_engine(settings.database_url, echo=True)


def create_db_and_tables():
    # 导入models包会自动加载所有模型
    from backend.app import models
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


# Session依赖类型
from typing import Annotated
from fastapi import Depends
SessionDep = Annotated[Session, Depends(get_session)]