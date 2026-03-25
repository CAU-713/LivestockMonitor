import importlib
import os
import threading
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, create_db_and_tables
from app.utils.importToHouseComprehensiveEnvironmentDO import import_HouseComprehensiveEnvironmentDO_from_excel
from app.utils.importToEnterpriseFatteningEnvironmentDO import import_EnterpriseFatteningEnvironmentDO_from_csv

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
    ],
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有 HTTP 方法
    allow_headers=["*"],  # 允许所有 HTTP 头
)


# 在启动时创建数据库表
@app.on_event("startup")
async def on_startup():
    create_db_and_tables();

    # 获取配置参数
    base_data_dir = Path("/app/app/datas")  # Docker容器内的数据目录
    csv_file_path = base_data_dir / "企业育肥环境数据.csv"
    excel_file_path = base_data_dir / "envs.xlsx"
    DB_URL = "postgresql://postgres:password@db:5432/postgres_db_name"
    shed_id = 9999

    # 创建线程执行数据导入任务
    def run_data_import():
        try:
            print("开始导入企业育肥环境数据...")
            import_EnterpriseFatteningEnvironmentDO_from_csv(csv_file_path, DB_URL)
            print("企业育肥环境数据导入完成！")

            print("开始导入综合环境数据...")
            import_HouseComprehensiveEnvironmentDO_from_excel(excel_file_path, DB_URL, shed_id)
            print("综合环境数据导入完成！")
        except Exception as e:
            print(f"数据导入过程中出现错误: {str(e)}")

    # 在后台线程中运行数据导入，避免阻塞服务器启动
    import_thread = threading.Thread(target=run_data_import)
    import_thread.start()


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
