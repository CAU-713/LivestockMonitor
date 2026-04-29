"""
告警中心路由
定义告警相关的 API 接口
"""
from typing import Annotated, Optional
from datetime import datetime

from fastapi import APIRouter, Query, Body

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.alertDTO import (
    AlertCreateDTO,
    AlertResolveDTO,
    AlertResponseDTO,
    AlertQueryDTO,
    AlertStatsDTO,
)
from app.services.alert import AlertService
from app.utils.cache import get_cache, set_cache, delete_cache, delete_pattern

router = APIRouter(prefix="/api/alerts", tags=["告警中心"])


@router.get(
    "/stats",
    response_model=ResponseDTO[AlertStatsDTO],
    summary="获取告警统计",
    description="获取各严重程度告警数量及未解决告警数量统计"
)
def get_alert_stats(db: SessionDep) -> ResponseDTO[AlertStatsDTO]:
    """获取告警统计数据（带 60s Redis 缓存）"""
    cache_key = "alert:stats"
    cached = get_cache(cache_key)
    if cached is not None:
        return ResponseDTO(code=200, success=True, message="查询成功", data=AlertStatsDTO(**cached))

    stats = AlertService.get_alert_stats(db)
    set_cache(cache_key, stats.model_dump(), ttl=60)
    return ResponseDTO(code=200, success=True, message="查询成功", data=stats)


@router.get(
    "",
    response_model=ResponseDTO[ListResponseData[AlertResponseDTO]],
    summary="获取告警列表",
    description="获取告警列表，支持分页及多维度筛选"
)
def get_alerts(
    db: SessionDep,
    shed_id: Annotated[Optional[int], Query(description="羊舍ID筛选", gt=0)] = None,
    severity: Annotated[Optional[str], Query(description="严重程度筛选: low/medium/high")] = None,
    resolved: Annotated[Optional[bool], Query(description="是否已解决筛选")] = None,
    start_time: Annotated[Optional[datetime], Query(description="开始时间筛选 (ISO8601)")] = None,
    end_time: Annotated[Optional[datetime], Query(description="结束时间筛选 (ISO8601)")] = None,
    page: Annotated[int, Query(description="页码", ge=1)] = 1,
    page_size: Annotated[int, Query(description="每页数量", ge=1, le=1000)] = 20,
) -> ResponseDTO[ListResponseData[AlertResponseDTO]]:
    """获取告警列表（带 30s Redis 缓存）"""
    cache_key = (
        f"alert:list:{shed_id}:{severity}:{resolved}:"
        f"{start_time}:{end_time}:{page}:{page_size}"
    )
    cached = get_cache(cache_key)
    if cached is not None:
        items = [AlertResponseDTO(**item) for item in cached["items"]]
        data = ListResponseData(
            items=items,
            total=cached["total"],
            page=cached["page"],
            page_size=cached["page_size"],
        )
        return ResponseDTO(code=200, success=True, message="查询成功", data=data)

    query_params = AlertQueryDTO(
        shed_id=shed_id,
        severity=severity,
        resolved=resolved,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
    )
    result = AlertService.get_alerts(db, query_params)
    set_cache(cache_key, result.model_dump(), ttl=30)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.post(
    "",
    response_model=ResponseDTO[AlertResponseDTO],
    summary="手动创建告警",
    description="手动创建一条告警记录，并实时推送至 WebSocket 客户端"
)
async def create_alert(
    alert_data: AlertCreateDTO,
    db: SessionDep,
) -> ResponseDTO[AlertResponseDTO]:
    """手动创建告警"""
    alert = AlertService.create_alert(db, alert_data)

    # 失效相关缓存
    delete_cache("alert:stats")
    delete_pattern("alert:list:*")

    # 通过 WebSocket 实时推送告警到所有连接的客户端
    try:
        from app.main import alert_manager
        await alert_manager.broadcast_alert({
            "type": "alert",
            "data": alert.model_dump(),
        })
    except Exception:
        pass  # WebSocket 推送失败不影响 HTTP 响应

    return ResponseDTO(code=200, success=True, message="告警创建成功", data=alert)


@router.get(
    "/{alert_id}",
    response_model=ResponseDTO[AlertResponseDTO],
    summary="获取告警详情",
    description="根据ID获取告警详细信息"
)
def get_alert(alert_id: int, db: SessionDep) -> ResponseDTO[AlertResponseDTO]:
    """获取告警详情"""
    alert = AlertService.get_alert_by_id(db, alert_id)
    return ResponseDTO(code=200, success=True, message="查询成功", data=alert)


@router.patch(
    "/{alert_id}/resolve",
    response_model=ResponseDTO[AlertResponseDTO],
    summary="解决告警",
    description="标记告警为已解决，并记录处理人"
)
def resolve_alert(
    alert_id: int,
    resolve_data: AlertResolveDTO,
    db: SessionDep,
) -> ResponseDTO[AlertResponseDTO]:
    """解决告警"""
    alert = AlertService.resolve_alert(db, alert_id, resolve_data)
    # 解决告警后，统计和列表缓存均需失效
    delete_cache("alert:stats")
    delete_pattern("alert:list:*")
    return ResponseDTO(code=200, success=True, message="告警已解决", data=alert)


@router.delete(
    "/{alert_id}",
    response_model=ResponseDTO[None],
    summary="删除告警",
    description="删除指定的告警记录"
)
def delete_alert(alert_id: int, db: SessionDep) -> ResponseDTO[None]:
    """删除告警"""
    AlertService.delete_alert(db, alert_id)
    # 删除告警后，统计和列表缓存均需失效
    delete_cache("alert:stats")
    delete_pattern("alert:list:*")
    return ResponseDTO(code=200, success=True, message="告警删除成功", data=None)
