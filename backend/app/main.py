import importlib
import os
import json
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理（替代已弃用的 @app.on_event("startup")）
    yield 之前为 startup 逻辑，yield 之后为 shutdown 逻辑。
    """
    # startup
    create_db_and_tables()

    # 迁移存量明文密码为 bcrypt 哈希（幂等操作，已加密的密码不会重复处理）
    from app.utils.migrate_passwords import migrate_plain_passwords
    DB_URL_FOR_MIGRATION = (
        f"postgresql://{settings.db_user}:{settings.db_password}"
        f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    )
    migrate_plain_passwords(DB_URL_FOR_MIGRATION)

    yield
    # shutdown：如需清理资源（关闭连接池等）可在此添加


# redirect_slashes=False：禁止 FastAPI 对 /api/users 自动重定向到 /api/users/
# 避免 Next.js 代理不跟随 307 重定向导致的 500 错误
app = FastAPI(redirect_slashes=False, lifespan=lifespan)

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


# ─── WebSocket 告警推送 ────────────────────────────────────────

# 全局连接管理器
class AlertConnectionManager:
    """管理 WebSocket 连接，用于实时告警推送"""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alert(self, alert_data: dict):
        """向所有连接的客户端推送告警消息"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(alert_data)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


alert_manager = AlertConnectionManager()


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """
    WebSocket 告警推送端点

    前端连接后可实时接收告警消息。
    消息格式: { "type": "alert", "data": { ... } }
    心跳格式: { "type": "ping" } → 服务端回 { "type": "pong" }
    """
    await alert_manager.connect(websocket)
    try:
        while True:
            # 接收客户端消息（心跳或业务消息）
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)


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