import importlib
import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, create_db_and_tables

# redirect_slashes=False：禁止 FastAPI 对 /api/users 自动重定向到 /api/users/
# 避免 Next.js 代理不跟随 307 重定向导致的 500 错误
app = FastAPI(redirect_slashes=False)

# 添加 CORS 中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js 默认端口
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://120.53.24.48:3000",  # 服务器前端地址
        "http://120.53.24.48:8000",  # 服务器后端地址
    ],
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有 HTTP 方法
    allow_headers=["*"],  # 允许所有 HTTP 头
)


# 在启动时创建数据库表
@app.on_event("startup")
async def on_startup():
    create_db_and_tables()

    # 迁移存量明文密码为 bcrypt 哈希（幂等操作，已加密的密码不会重复处理）
    from app.utils.migrate_passwords import migrate_plain_passwords
    DB_URL_FOR_MIGRATION = f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    migrate_plain_passwords(DB_URL_FOR_MIGRATION)


# 自动发现并注册路由
routers_dir = os.path.join(os.path.dirname(__file__), "routers")
for filename in os.listdir(routers_dir):
    if filename.endswith(".py") and filename != "__init__.py":
        module_name = filename[:-3]  # 移除 .py 后缀
        module = importlib.import_module(f".routers.{module_name}", package="app")
        if hasattr(module, "router"):
            app.include_router(module.router)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
    )
