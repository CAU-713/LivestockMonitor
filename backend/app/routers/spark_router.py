"""
sparks API 路由
提供 sparks MySQL 真实数据的查询接口。
"""
import logging
from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Query

from app.dao.spark_mysql_dao import (
    get_points_latest,
    get_point_history,
    get_point_types,
    get_gateway_latest,
    get_device_attributes_latest,
    get_device_attributes_history,
    get_overview_stats,
)
from app.schemas.responseDTO import ResponseDTO
from app.schemas.spark_dto import (
    SparkPointDTO,
    SparkPointListDTO,
    SparkHistoryItemDTO,
    SparkGatewayDTO,
    SparkDeviceStatusDTO,
    SparkDeviceStatusHistoryDTO,
    SparkOverviewDTO,
    SparkHistoryQueryDTO,
)
from app.services.spark_adapter import spark_adapter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sparks", tags=["sparks真实数据"])


# ==================== 测点接口 ====================

@router.get(
    "/points",
    response_model=ResponseDTO[SparkPointListDTO],
    summary="获取所有测点及最新值",
    description="从 device_data_update 表获取全部 47 个测点的最新数据",
)
def get_all_points() -> ResponseDTO[SparkPointListDTO]:
    """获取所有测点列表及其最新值"""
    try:
        raw_points = get_points_latest()
        sensors = spark_adapter.points_to_sensor_list(raw_points)
        raw_types = get_point_types()
        # 用 _infer_sensor_type 归一化类型前缀，聚合 Q00→Q01→Q02→Q03→Q、TEM→Temperature 等
        seen = set()
        types: List[str] = []
        for t in raw_types:
            normalized = spark_adapter._infer_sensor_type(t)
            if normalized not in seen:
                seen.add(normalized)
                types.append(normalized)

        data = SparkPointListDTO(
            points=[SparkPointDTO(**s) for s in sensors],
            point_types=types,
            total=len(sensors),
        )

        return ResponseDTO(code=200, success=True, message="查询成功", data=data)
    except Exception as e:
        logger.error("Failed to get points: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


# ==================== 历史数据接口 ====================

@router.get(
    "/points/{point_id}/history",
    response_model=ResponseDTO[List[SparkHistoryItemDTO]],
    summary="获取单个测点历史数据",
    description="从 device_data_save 表获取指定测点的历史时序数据",
)
def get_single_point_history(
    point_id: str,
    start: Annotated[Optional[datetime], Query(description="起始时间 (ISO 8601)")] = None,
    end: Annotated[Optional[datetime], Query(description="截止时间 (ISO 8601)")] = None,
    granularity: Annotated[str, Query(description="数据粒度: raw | hour | day")] = "raw",
    limit: Annotated[int, Query(description="最大返回行数", ge=1, le=50000)] = 5000,
) -> ResponseDTO[List[SparkHistoryItemDTO]]:
    """获取单个测点的历史数据"""
    try:
        if granularity not in ("raw", "hour", "day"):
            granularity = "raw"

        rows = get_point_history(
            point_ids=[point_id],
            start=start,
            end=end,
            granularity=granularity,
            limit=limit,
        )
        items = spark_adapter.history_to_chart_data(rows, granularity)

        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=[SparkHistoryItemDTO(**item) for item in items],
        )
    except Exception as e:
        logger.error("Failed to get point history: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


@router.get(
    "/history",
    response_model=ResponseDTO[List[SparkHistoryItemDTO]],
    summary="获取多测点历史数据",
    description="从 device_data_save 表获取多个测点的历史时序数据，支持时间范围和粒度筛选",
)
def get_multi_point_history(
    point_ids: Annotated[
        Optional[List[str]],
        Query(description="测点ID列表，如 CO2-N1,LIG-N1")
    ] = None,
    start: Annotated[Optional[datetime], Query(description="起始时间 (ISO 8601)")] = None,
    end: Annotated[Optional[datetime], Query(description="截止时间 (ISO 8601)")] = None,
    granularity: Annotated[str, Query(description="数据粒度: raw | hour | day")] = "raw",
    limit: Annotated[int, Query(description="最大返回行数", ge=1, le=50000)] = 5000,
) -> ResponseDTO[List[SparkHistoryItemDTO]]:
    """获取多测点历史数据"""
    try:
        if granularity not in ("raw", "hour", "day"):
            granularity = "raw"

        # 默认查询所有测点
        ids = point_ids if point_ids else [p.point_id for p in SparkPointListDTO.__fields__]

        rows = get_point_history(
            point_ids=ids,
            start=start,
            end=end,
            granularity=granularity,
            limit=limit,
        )
        items = spark_adapter.history_to_chart_data(rows, granularity)

        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=[SparkHistoryItemDTO(**item) for item in items],
        )
    except Exception as e:
        logger.error("Failed to get history: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


# ==================== 网关接口 ====================

@router.get(
    "/gateway",
    response_model=ResponseDTO[SparkGatewayDTO],
    summary="获取网关最新状态",
    description="从 gateway_attribute 表获取网关的最新状态（SIM、信号、GPS等）",
)
def get_gateway() -> ResponseDTO[SparkGatewayDTO]:
    """获取网关最新状态"""
    try:
        raw = get_gateway_latest()
        if raw is None:
            return ResponseDTO(code=200, success=True, message="暂无网关数据", data=None)

        shed = spark_adapter.gateway_to_shed(raw)
        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=SparkGatewayDTO(**shed),
        )
    except Exception as e:
        logger.error("Failed to get gateway: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


# ==================== 设备通信状态接口 ====================

@router.get(
    "/device-status",
    response_model=ResponseDTO[SparkDeviceStatusDTO],
    summary="获取设备最新通信状态",
    description="从 device_attribute 表获取设备的最新通信状态（在线状态、丢包率等）",
)
def get_device_status(
    gateway_mac: Annotated[Optional[str], Query(description="网关MAC")] = None,
    device_id: Annotated[Optional[str], Query(description="设备ID")] = None,
) -> ResponseDTO[SparkDeviceStatusDTO]:
    """获取设备最新通信状态"""
    try:
        raw = get_device_attributes_latest(gateway_mac=gateway_mac, device_id=device_id)
        if raw is None:
            return ResponseDTO(code=200, success=True, message="暂无设备状态数据", data=None)

        status = spark_adapter.device_attr_to_status(raw)
        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=SparkDeviceStatusDTO(**status),
        )
    except Exception as e:
        logger.error("Failed to get device status: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


@router.get(
    "/device-status/history",
    response_model=ResponseDTO[SparkDeviceStatusHistoryDTO],
    summary="获取设备通信状态历史",
    description="从 device_attribute 表获取设备通信状态的历史记录",
)
def get_device_status_history(
    gateway_mac: Annotated[Optional[str], Query(description="网关MAC")] = None,
    device_id: Annotated[Optional[str], Query(description="设备ID")] = None,
    start: Annotated[Optional[datetime], Query(description="起始时间")] = None,
    end: Annotated[Optional[datetime], Query(description="截止时间")] = None,
    limit: Annotated[int, Query(description="最大返回行数", ge=1, le=1000)] = 100,
) -> ResponseDTO[SparkDeviceStatusHistoryDTO]:
    """获取设备通信状态历史"""
    try:
        rows = get_device_attributes_history(
            gateway_mac=gateway_mac,
            device_id=device_id,
            start=start,
            end=end,
            limit=limit,
        )
        items = spark_adapter.device_attrs_to_list(rows)

        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=SparkDeviceStatusHistoryDTO(
                items=[SparkDeviceStatusDTO(**item) for item in items],
                total=len(items),
            ),
        )
    except Exception as e:
        logger.error("Failed to get device status history: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


# ==================== 概览统计接口 ====================

@router.get(
    "/overview",
    response_model=ResponseDTO[SparkOverviewDTO],
    summary="获取系统概览统计",
    description="获取测点总数、设备在线状态、网关信号强度等概览数据",
)
def get_overview() -> ResponseDTO[SparkOverviewDTO]:
    """获取系统概览统计"""
    try:
        stats = get_overview_stats()
        overview = spark_adapter.overview_stats(stats)
        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=SparkOverviewDTO(**overview),
        )
    except Exception as e:
        logger.error("Failed to get overview: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)
