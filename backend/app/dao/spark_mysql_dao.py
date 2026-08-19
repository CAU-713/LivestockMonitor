"""
sparks MySQL 数据访问层
封装对 sparks MySQL 数据库五张表的查询操作，使用 pymysql + 简易连接池。
"""
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import pymysql
from dbutils.pooled_db import PooledDB

logger = logging.getLogger(__name__)

# 全局连接池（懒加载）
_pool: Optional[PooledDB] = None

# MySQL 连接参数（优先从环境变量读取，fallback 到硬编码默认值）
_SPARKS_MYSQL_HOST = os.getenv("SPARKS_MYSQL_HOST", "gz-cynosdbmysql-grp-rblfo92p.sql.tencentcdb.com")
_SPARKS_MYSQL_PORT = int(os.getenv("SPARKS_MYSQL_PORT", "26950"))
_SPARKS_MYSQL_USER = os.getenv("SPARKS_MYSQL_USER", "admin")
_SPARKS_MYSQL_PASSWORD = os.getenv("SPARKS_MYSQL_PASSWORD", "Anhui123")
_SPARKS_MYSQL_DATABASE = os.getenv("SPARKS_MYSQL_DATABASE", "sparks")


def _get_pool() -> PooledDB:
    """获取或创建 pymysql 连接池"""
    global _pool
    if _pool is None:
        _pool = PooledDB(
            creator=pymysql,
            mincached=2,
            maxcached=10,
            maxconnections=20,
            blocking=True,
            host=_SPARKS_MYSQL_HOST,
            port=_SPARKS_MYSQL_PORT,
            user=_SPARKS_MYSQL_USER,
            password=_SPARKS_MYSQL_PASSWORD,
            database=_SPARKS_MYSQL_DATABASE,
            charset="utf8mb4",
            connect_timeout=10,
            cursorclass=pymysql.cursors.DictCursor,
        )
        logger.info("sparks MySQL connection pool initialized")
    return _pool


def _execute_query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """执行查询并返回字典列表，失败时返回空列表"""
    pool = _get_pool()
    conn = None
    try:
        conn = pool.connection()
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchall()
    except Exception as e:
        logger.error("sparks MySQL query failed: %s | sql=%s", e, sql[:200])
        return []
    finally:
        if conn:
            conn.close()


def _execute_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """执行查询并返回单行字典，失败时返回 None"""
    rows = _execute_query(sql, params)
    return rows[0] if rows else None


# ==================== 测点相关 ====================

def get_points_latest() -> List[Dict[str, Any]]:
    """
    从 device_data_update 获取所有测点最新值。
    返回：47 条记录，每条包含 pointId, pointName, value, updated_at 等。
    """
    sql = """
        SELECT id, created_at, updated_at, gatewayMac, deviceId,
               pointId, pointName, value
        FROM device_data_update
        ORDER BY pointId
    """
    return _execute_query(sql)


def get_point_history(
    point_ids: List[str],
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    granularity: str = "raw",
    limit: int = 5000,
) -> List[Dict[str, Any]]:
    """
    从 device_data_save 获取测点历史数据。

    Args:
        point_ids: 测点 ID 列表
        start: 起始时间
        end: 截止时间
        granularity: raw | hour | day
        limit: 最大返回行数
    """
    if not point_ids:
        return []

    placeholders = ",".join(["%s"] * len(point_ids))
    params: list = list(point_ids)

    if granularity == "hour":
        sql = f"""
            SELECT pointId, pointName,
                   DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:00:00') AS record_time,
                   ROUND(AVG(CAST(value AS DECIMAL(12,4))), 2) AS avg_value,
                   MIN(CAST(value AS DECIMAL(12,4))) AS min_value,
                   MAX(CAST(value AS DECIMAL(12,4))) AS max_value,
                   COUNT(*) AS sample_count
            FROM device_data_save
            WHERE pointId IN ({placeholders})
        """
        group_clause = "GROUP BY pointId, pointName, DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:00:00')"
        order_clause = "ORDER BY record_time ASC, pointId ASC"
        limit_clause = f"LIMIT {limit}"

    elif granularity == "day":
        sql = f"""
            SELECT pointId, pointName,
                   DATE(created_at) AS record_time,
                   ROUND(AVG(CAST(value AS DECIMAL(12,4))), 2) AS avg_value,
                   MIN(CAST(value AS DECIMAL(12,4))) AS min_value,
                   MAX(CAST(value AS DECIMAL(12,4))) AS max_value,
                   COUNT(*) AS sample_count
            FROM device_data_save
            WHERE pointId IN ({placeholders})
        """
        group_clause = "GROUP BY pointId, pointName, DATE(created_at)"
        order_clause = "ORDER BY record_time ASC, pointId ASC"
        limit_clause = f"LIMIT {limit}"

    else:  # raw
        # 注意：降序取数 + LIMIT 保证截断时保留最新数据，返回前在 _execute_query 后反转
        sql = f"""
            SELECT id, created_at, gatewayMac, deviceId,
                   pointId, pointName, value
            FROM device_data_save
            WHERE pointId IN ({placeholders})
        """
        group_clause = ""
        order_clause = "ORDER BY created_at DESC, pointId ASC"
        limit_clause = f"LIMIT {limit}"

    # 时间范围过滤
    # 前端传的是 UTC 时间（带 Z），数据库存的是服务器本地时间（CST UTC+8）
    # 需要把 UTC 时间转换为 Asia/Shanghai 时区，否则查询范围会偏移 8 小时
    tz_sh = ZoneInfo("Asia/Shanghai")
    if start:
        sql += " AND created_at >= %s"
        start_local = start.astimezone(tz_sh) if start.tzinfo else start
        params.append(start_local.strftime("%Y-%m-%d %H:%M:%S"))
    if end:
        sql += " AND created_at <= %s"
        end_local = end.astimezone(tz_sh) if end.tzinfo else end
        params.append(end_local.strftime("%Y-%m-%d %H:%M:%S"))

    if group_clause:
        sql += " " + group_clause
    sql += " " + order_clause
    sql += " " + limit_clause

    rows = _execute_query(sql, tuple(params))

    # raw 模式：SQL 是降序取数（保证 LIMIT 截断保留最新），这里反转回时间正序
    if granularity == "raw":
        rows.reverse()

    return rows


def get_point_types() -> List[str]:
    """获取所有唯一的测点类型前缀（用于筛选）"""
    sql = """
        SELECT DISTINCT SUBSTRING_INDEX(pointId, '-', 1) AS point_type
        FROM device_data_update
        ORDER BY point_type
    """
    rows = _execute_query(sql)
    return [r["point_type"] for r in rows]


# ==================== 网关相关 ====================

def get_gateway_latest() -> Optional[Dict[str, Any]]:
    """从 gateway_attribute 获取网关最新状态（按 created_at 倒序取第一条）"""
    sql = """
        SELECT id, created_at, gatewayMac, simInsert, iccid,
               csq, latitude, longitude
        FROM gateway_attribute
        ORDER BY created_at DESC
        LIMIT 1
    """
    return _execute_one(sql)


# ==================== 设备通信状态 ====================

def get_device_attributes_latest(
    gateway_mac: Optional[str] = None,
    device_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    从 device_attribute 获取设备最新通信状态。

    Args:
        gateway_mac: 网关 MAC（可选）
        device_id: 设备 ID（可选）
    """
    sql = """
        SELECT id, created_at, gatewayMac, deviceId,
               lastCommRTC, commTotalCnt, commFailCnt,
               lossRate, isOnline, code, message
        FROM device_attribute
    """
    conditions = []
    params: list = []

    if gateway_mac:
        conditions.append("gatewayMac = %s")
        params.append(gateway_mac)
    if device_id:
        conditions.append("deviceId = %s")
        params.append(device_id)

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    sql += " ORDER BY created_at DESC LIMIT 1"

    return _execute_one(sql, tuple(params)) if params else _execute_one(sql)


def get_device_attributes_history(
    gateway_mac: Optional[str] = None,
    device_id: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """
    获取设备通信状态历史记录。
    """
    sql = """
        SELECT id, created_at, gatewayMac, deviceId,
               lastCommRTC, commTotalCnt, commFailCnt,
               lossRate, isOnline, code, message
        FROM device_attribute
    """
    conditions = []
    params: list = []

    if gateway_mac:
        conditions.append("gatewayMac = %s")
        params.append(gateway_mac)
    if device_id:
        conditions.append("deviceId = %s")
        params.append(device_id)
    if start:
        conditions.append("created_at >= %s")
        params.append(start.strftime("%Y-%m-%d %H:%M:%S"))
    if end:
        conditions.append("created_at <= %s")
        params.append(end.strftime("%Y-%m-%d %H:%M:%S"))

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    sql += " ORDER BY created_at DESC"
    sql += f" LIMIT {limit}"

    return _execute_query(sql, tuple(params))


# ==================== 统计相关 ====================

def get_overview_stats() -> Dict[str, Any]:
    """获取系统概览统计"""
    # 测点总数
    points_sql = "SELECT COUNT(DISTINCT pointId) AS cnt FROM device_data_update"
    points = _execute_one(points_sql)

    # 网关总数
    gateway_sql = "SELECT COUNT(DISTINCT gatewayMac) AS cnt FROM gateway_attribute"
    gateways = _execute_one(gateway_sql)

    # 设备总数
    device_sql = "SELECT COUNT(DISTINCT deviceId) AS cnt FROM device_attribute"
    devices = _execute_one(device_sql)

    # 最近通信状态
    attr = get_device_attributes_latest()

    # 网关最新信号
    gw = get_gateway_latest()

    return {
        "total_points": points["cnt"] if points else 0,
        "total_gateways": gateways["cnt"] if gateways else 0,
        "total_devices": devices["cnt"] if devices else 0,
        "device_online": attr["isOnline"] if attr else 0,
        "device_loss_rate": attr["lossRate"] if attr else 0,
        "last_comm_time": str(attr["lastCommRTC"]) if attr and attr.get("lastCommRTC") else None,
        "gateway_csq": gw["csq"] if gw else -1,
        "gateway_latitude": gw["latitude"] if gw else 0,
        "gateway_longitude": gw["longitude"] if gw else 0,
        "gateway_sim_insert": gw["simInsert"] if gw else 0,
    }


def get_data_save_count(
    point_ids: Optional[List[str]] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> int:
    """获取 device_data_save 表中符合条件的数据行数"""
    sql = "SELECT COUNT(*) AS cnt FROM device_data_save"
    conditions = []
    params: list = []

    if point_ids:
        placeholders = ",".join(["%s"] * len(point_ids))
        conditions.append(f"pointId IN ({placeholders})")
        params.extend(point_ids)
    if start:
        conditions.append("created_at >= %s")
        params.append(start.strftime("%Y-%m-%d %H:%M:%S"))
    if end:
        conditions.append("created_at <= %s")
        params.append(end.strftime("%Y-%m-%d %H:%M:%S"))

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    row = _execute_one(sql, tuple(params))
    return row["cnt"] if row else 0


# ==================== 预测结果相关 ====================

# 27 个环境传感器 pointId（与预测模型 feature_cols.json 一致）
_FORECAST_POINT_IDS = [
    "BGT-N1", "BGT-N", "BGT-S",
    "CO2-N1", "CO2-N", "CO2-S1", "CO2-S",
    "HUM-N1", "HUM-N", "HUM-S1",
    "LIG-N1", "LIG-N", "LIG-S1", "LIG-S",
    "NH3-S",
    "PM10-N", "PM10-S", "PM25-N",
    "TEM-N1", "TEM-N", "TEM-S1",
    "TSP-S1", "TSP-S",
    "WIN-N1", "WIN-N", "WIN-S1", "WIN-S",
]


def get_forecast_latest_batch() -> Optional[Dict[str, Any]]:
    """从 device_forecast_save 获取最新一批预测的元信息（单行）。"""
    sql = """
        SELECT batch_id, forecast_time, input_end_time,
               model_name, model_version
        FROM device_forecast_save
        ORDER BY forecast_time DESC, id DESC
        LIMIT 1
    """
    return _execute_one(sql)


def get_forecast_batch_rows(batch_id: str) -> List[Dict[str, Any]]:
    """获取指定批次的全部预测明细（长表，按目标时间与测点排序）。"""
    sql = """
        SELECT target_time, horizon_step, point_id, point_name, predicted_value
        FROM device_forecast_save
        WHERE batch_id = %s
        ORDER BY target_time, point_id
    """
    return _execute_query(sql, (batch_id,))


def get_forecast_batches(limit: int = 20) -> List[Dict[str, Any]]:
    """获取最近预测批次列表（按批次聚合）。"""
    sql = """
        SELECT batch_id,
               MAX(forecast_time)  AS forecast_time,
               MAX(input_end_time) AS input_end_time,
               MAX(model_name)     AS model_name,
               MAX(model_version)  AS model_version,
               COUNT(*)            AS `rows`,
               MIN(target_time)    AS target_start,
               MAX(target_time)    AS target_end
        FROM device_forecast_save
        GROUP BY batch_id
        ORDER BY forecast_time DESC
        LIMIT %s
    """
    return _execute_query(sql, (limit,))


def get_env_sensor_last_nonzero() -> Optional[str]:
    """获取 27 个环境测点最后一次非 0 值的时间（用于判断传感器是否全 0）。"""
    placeholders = ",".join(["%s"] * len(_FORECAST_POINT_IDS))
    sql = (
        "SELECT MAX(created_at) AS last_nonzero FROM device_data_save "
        f"WHERE pointId IN ({placeholders}) "
        r"AND value NOT REGEXP '^0(\.0*)?$'"
    )
    row = _execute_one(sql, tuple(_FORECAST_POINT_IDS))
    return str(row["last_nonzero"]) if row and row.get("last_nonzero") else None
