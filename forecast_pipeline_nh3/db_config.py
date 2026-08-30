# -*- coding: utf-8 -*-

import os
import sys
from getpass import getpass


def _get_db_password() -> str:
    """优先读环境变量 DB_PASSWORD；无则仅在交互式终端提示输入。
    后台定时任务(stdin 非 tty)下绝不交互, 避免卡死, 回落到 sparks 库默认密码。
    """
    pwd = os.getenv("DB_PASSWORD")
    if pwd:
        return pwd
    if sys.stdin and sys.stdin.isatty():
        return getpass("请输入数据库密码：")
    return "Anhui123"


DB_CONFIG = {
    "host": "gz-cynosdbmysql-grp-rblfo92p.sql.tencentcdb.com",
    "port": 26950,
    "user": "admin",
    "password": _get_db_password(),
    "database": "sparks",
    "charset": "utf8mb4",
}

GATEWAY_MAC = os.getenv("GATEWAY_MAC", "4529ecf8d0b5")
DEVICE_ID = os.getenv("DEVICE_ID", "PLC")

FORECAST_TABLE = "device_forecast_save"
HISTORY_HOURS = 24