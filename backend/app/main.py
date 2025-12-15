import asyncio
import threading
from typing import Union
from app.config import settings
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chatRouter, datasetRouter
from app.config import create_db_and_tables
import os
import importlib

app = FastAPI()

# 全局变量存储监控任务
camera_monitor_task = None
camera_monitor_thread = None

# 在启动时创建数据库表
@app.on_event("startup")
async def on_startup():
    create_db_and_tables()
    
    # 注释掉摄像头监控任务启动代码，因为 tasks 目录不存在
    # from app.tasks.camera_monitor import CameraMonitorTask
    # global camera_monitor_task, camera_monitor_thread
    # camera_monitor_task = CameraMonitorTask(interval=30)  # 每30秒执行一次
    
    # # 在单独的线程中运行异步任务
    # camera_monitor_thread = threading.Thread(
    #     target=lambda: asyncio.run(camera_monitor_task.start()),
    #     daemon=True
    # )
    # camera_monitor_thread.start()

@app.on_event("shutdown")
async def on_shutdown():
    # 停止摄像头监控任务
    # global camera_monitor_task
    # if camera_monitor_task:
    #     await camera_monitor_task.stop()
    pass


# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chatRouter)
app.include_router(datasetRouter)

@app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "ok",
        "message": "RAGFlow FastAPI Server",
        "version": settings.APP_VERSION
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


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