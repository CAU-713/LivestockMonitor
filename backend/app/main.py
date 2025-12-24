import asyncio
import threading
from typing import Union
from backend.app.config import settings
import uvicorn
from fastapi import FastAPI
from backend.app.config import create_db_and_tables
import os
import importlib
from backend.app.routers import userRouter, detectRouter, ragflowRouter
from backend.app.config import settings
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    # create_db_and_tables()
    yield
    # Shutdown event
    # global camera_monitor_task
    # if camera_monitor_task:
    #     await camera_monitor_task.stop()

app = FastAPI(lifespan=lifespan)

# 注册路由
app.include_router(userRouter.router, prefix="/api")
app.include_router(detectRouter.router, prefix="/api")
app.include_router(ragflowRouter.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
