import os
from functools import lru_cache
from typing import Generator

from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from sqlmodel import create_engine, Session, SQLModel

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
    # 生产环境默认关闭 SQL 日志，开发时可在 .env 中设置 DB_ECHO=true
    db_echo: bool = False

    # RAGFlow 配置
    RAGFLOW_API_KEY: str = "ragflow--xJIhv2FgUOMSltDf_qVhQtKdZcWwnZgyepE7E2S7ls"
    RAGFLOW_BASE_URL: str = "http://127.0.0.1:8666"

    # Redis 配置（容器内服务名为 redis，本地开发可改为 localhost）
    redis_host: str = "redis"
    redis_port: int = 6379

    # sparks MySQL 配置（真实物联网数据源）
    sparks_mysql_host: str = os.getenv("SPARKS_MYSQL_HOST", "gz-cynosdbmysql-grp-rblfo92p.sql.tencentcdb.com")
    sparks_mysql_port: int = int(os.getenv("SPARKS_MYSQL_PORT", "26950"))
    sparks_mysql_user: str = os.getenv("SPARKS_MYSQL_USER", "admin")
    sparks_mysql_password: str = os.getenv("SPARKS_MYSQL_PASSWORD", "Anhui123")
    sparks_mysql_database: str = os.getenv("SPARKS_MYSQL_DATABASE", "sparks")
    sparks_mysql_pool_min: int = 2
    sparks_mysql_pool_max: int = 10

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
engine = create_engine(settings.database_url, echo=settings.db_echo)


def create_db_and_tables():
    # 导入models包会自动加载所有模型
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


# Session依赖类型
from typing import Annotated
from fastapi import Depends
SessionDep = Annotated[Session, Depends(get_session)]