"""
行为监控路由
定义行为统计数据相关的 API 接口
"""
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.behaviorDTO import (
    BehaviorRecordResponseDTO,
    BehaviorLatestResponseDTO,
    BehaviorTrendResponseDTO,
)
from app.services.behavior import BehaviorService

router = APIRouter(prefix="/api/behavior", tags=["行为监控"])


@router.get(
    "/latest",
    response_model=ResponseDTO[BehaviorLatestResponseDTO],
    summary="获取最新行为统计",
    description="获取指定摄像头的最新一条行为统计数据"
)
def get_latest(
    db: SessionDep,
    camera_id: Annotated[int, Query(description="摄像头ID", gt=0)],
) -> ResponseDTO[BehaviorLatestResponseDTO]:
    """获取最新行为统计"""
    result = BehaviorService.get_latest(db, camera_id)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.get(
    "/records",
    response_model=ResponseDTO[ListResponseData[BehaviorRecordResponseDTO]],
    summary="获取行为历史记录",
    description="获取指定摄像头的历史行为记录，支持时间范围筛选"
)
def get_records(
    db: SessionDep,
    camera_id: Annotated[int, Query(description="摄像头ID", gt=0)],
    start_time: Annotated[Optional[datetime], Query(description="开始时间")] = None,
    end_time: Annotated[Optional[datetime], Query(description="结束时间")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[BehaviorRecordResponseDTO]]:
    """获取行为历史记录"""
    result = BehaviorService.get_records(db, camera_id, start_time, end_time, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.get(
    "/trend",
    response_model=ResponseDTO[BehaviorTrendResponseDTO],
    summary="获取行为趋势数据",
    description="获取近 N 小时的行为趋势数据，用于折线图展示"
)
def get_trend(
    db: SessionDep,
    camera_id: Annotated[int, Query(description="摄像头ID", gt=0)],
    hours: Annotated[int, Query(description="回溯小时数", ge=1, le=720)] = 24,
) -> ResponseDTO[BehaviorTrendResponseDTO]:
    """获取行为趋势数据"""
    result = BehaviorService.get_trend(db, camera_id, hours)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)