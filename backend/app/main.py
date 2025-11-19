from typing import Union
from app.config import settings
import uvicorn
from fastapi import FastAPI
from app.routers import test, detect

app = FastAPI()

app.include_router(test.router, prefix="/test")
app.include_router(detect.router, prefix="/detect")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
    )