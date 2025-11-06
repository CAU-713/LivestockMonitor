from typing import Union
from app.config import settings
import uvicorn
from fastapi import FastAPI
from .routers import test

app = FastAPI()

app.include_router(test.router)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
    )