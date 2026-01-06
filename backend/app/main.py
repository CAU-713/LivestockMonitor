import asyncio
import importlib
import os
import threading

import uvicorn
from fastapi import FastAPI

from app.config import settings, create_db_and_tables

app = FastAPI()



# 在启动时创建数据库表
@app.on_event("startup")
async def on_startup():
    create_db_and_tables();


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