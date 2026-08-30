"""
环境时序预测路由
提供预测结果展示相关 API
"""
import logging
from typing import Annotated, List, Optional

from fastapi import APIRouter, Query

from app.dao.spark_mysql_dao import (
    get_forecast_latest_batch,
    get_forecast_batch_rows,
    get_forecast_batches,
    get_env_sensor_last_nonzero,
    get_device_attributes_latest,
    get_forecast_point_ids,
    get_env_history_5min,
)
from app.schemas.responseDTO import ResponseDTO
from app.schemas.forecastDTO import (
    ForecastBatchDTO,
    ForecastPointDTO,
    ForecastHistoryPointDTO,
    ForecastOverviewDTO,
    ForecastBatchSummaryDTO,
    DeviceStatusDTO,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/forecast", tags=["环境预测"])


def _ts(value) -> str:
    """数据库 datetime 值转字符串；空值返回 None。"""
    return str(value) if value else None


@router.get(
    "/overview",
    response_model=ResponseDTO[ForecastOverviewDTO],
    summary="获取环境预测展示数据",
    description="返回最新预测批次、未来6小时预测明细以及设备/数据状态",
)
def get_forecast_overview(
    model: Annotated[Optional[str], Query(description="模型版本过滤，如 xlinear_nh3_26to27_v1")] = None,
) -> ResponseDTO[ForecastOverviewDTO]:
    """获取预测展示页一次性数据。"""
    try:
        batch = None
        forecast: List[ForecastPointDTO] = []

        latest = get_forecast_latest_batch(model)
        if latest:
            batch_id = latest["batch_id"]
            rows = get_forecast_batch_rows(batch_id)
            forecast = [
                ForecastPointDTO(
                    target_time=_ts(r.get("target_time")),
                    horizon_step=int(r.get("horizon_step") or 0),
                    point_id=r.get("point_id", ""),
                    point_name=r.get("point_name", ""),
                    predicted_value=float(r.get("predicted_value") or 0),
                )
                for r in rows
            ]
            targets = [r["target_time"] for r in rows if r.get("target_time")]
            batch = ForecastBatchDTO(
                batch_id=batch_id,
                forecast_time=_ts(latest.get("forecast_time")),
                input_end_time=_ts(latest.get("input_end_time")),
                model_name=latest.get("model_name") or "",
                model_version=latest.get("model_version") or "",
                rows=len(rows),
                target_start=_ts(targets[0]) if targets else None,
                target_end=_ts(targets[-1]) if targets else None,
            )

        # 过去24小时真实值（5分钟聚合，与预测同分辨率对齐）
        history = [
            ForecastHistoryPointDTO(
                time=_ts(r.get("record_time")),
                point_id=r.get("pointId", ""),
                point_name=r.get("pointName", ""),
                value=float(r.get("value") or 0),
            )
            for r in get_env_history_5min(get_forecast_point_ids(), 24)
        ]

        # 设备/数据状态（在线状态 + 传感器是否全 0）
        attr = get_device_attributes_latest()
        device = DeviceStatusDTO(
            is_online=bool(attr.get("isOnline", 0)) if attr else False,
            last_comm_time=_ts(attr.get("lastCommRTC")) if attr else None,
            last_nonzero_at=get_env_sensor_last_nonzero(),
        )

        data = ForecastOverviewDTO(batch=batch, history=history, forecast=forecast, device=device)
        return ResponseDTO(code=200, success=True, message="查询成功", data=data)
    except Exception as e:
        logger.error("Failed to get forecast overview: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)


@router.get(
    "/batches",
    response_model=ResponseDTO[List[ForecastBatchSummaryDTO]],
    summary="获取预测批次列表",
    description="返回最近预测批次列表，用于切换历史批次",
)
def get_forecast_batch_list(
    limit: Annotated[int, Query(description="返回批次数量", ge=1, le=100)] = 20,
    model: Annotated[Optional[str], Query(description="模型版本过滤")] = None,
) -> ResponseDTO[List[ForecastBatchSummaryDTO]]:
    """获取最近预测批次列表。"""
    try:
        rows = get_forecast_batches(limit, model)
        items = [
            ForecastBatchSummaryDTO(
                batch_id=r.get("batch_id", ""),
                forecast_time=_ts(r.get("forecast_time")),
                input_end_time=_ts(r.get("input_end_time")),
                model_name=r.get("model_name"),
                model_version=r.get("model_version"),
                rows=int(r.get("rows") or 0),
                target_start=_ts(r.get("target_start")),
                target_end=_ts(r.get("target_end")),
            )
            for r in rows
        ]
        return ResponseDTO(code=200, success=True, message="查询成功", data=items)
    except Exception as e:
        logger.error("Failed to get forecast batches: %s", e)
        return ResponseDTO(code=500, success=False, message=f"数据查询失败: {str(e)}", data=None)
