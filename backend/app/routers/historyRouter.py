"""
历史数据路由
定义传感器历史数据和视频历史数据相关的 API 接口
"""
from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.historyDTO import (
    SensorHistoryDataDTO,
    VideoInfoDTO,
    VideoListResponseDTO,
    SensorHistoryQueryDTO,
    VideoHistoryQueryDTO
)
from app.services.history import SensorHistoryService, VideoHistoryService

router = APIRouter(prefix="/api/history", tags=["历史数据"])


# ==================== 传感器历史数据接口 ====================

@router.get(
    "/sensor-data",
    response_model=ResponseDTO[List[SensorHistoryDataDTO]],
    summary="查询历史环境数据",
    description="查询传感器历史环境数据，支持按羊舍、传感器类型、时间范围筛选，支持不同粒度的数据聚合"
)
def get_sensor_history_data(
        db: SessionDep,
        shed_ids: Annotated[
            Optional[List[int]],
            Query(description="羊舍ID列表")
        ] = None,
        sensor_types: Annotated[
            Optional[List[str]],
            Query(description="传感器类型列表，如：Temperature, Humidity")
        ] = None,
        start: Annotated[
            Optional[datetime],
            Query(description="起始时间 (ISO 8601格式)")
        ] = None,
        end: Annotated[
            Optional[datetime],
            Query(description="截止时间 (ISO 8601格式)")
        ] = None,
        granularity: Annotated[
            str,
            Query(description="数据粒度: raw-原始数据, hour-小时平均, day-日平均")
        ] = "raw",
) -> ResponseDTO[List[SensorHistoryDataDTO]]:
    """查询历史环境数据"""

    # 验证粒度参数
    if granularity not in ["raw", "hour", "day"]:
        granularity = "raw"

    query_params = SensorHistoryQueryDTO(
        shed_ids=shed_ids,
        sensor_types=sensor_types,
        start=start,
        end=end,
        granularity=granularity
    )

    data = SensorHistoryService.get_sensor_history_data(db, query_params)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=data
    )


# ==================== 视频历史数据接口 ====================

@router.get(
    "/videos",
    response_model=ResponseDTO[VideoListResponseDTO],
    summary="获取历史视频数据",
    description="查询历史视频记录，支持按羊舍、摄像头、时间范围筛选"
)
def get_video_history(
        db: SessionDep,
        shed_id: Annotated[
            Optional[int],
            Query(description="羊舍ID")
        ] = None,
        camera_id: Annotated[
            Optional[int],
            Query(description="摄像头ID")
        ] = None,
        start_time: Annotated[
            Optional[datetime],
            Query(description="开始时间 (ISO 8601格式)")
        ] = None,
        end_time: Annotated[
            Optional[datetime],
            Query(description="结束时间 (ISO 8601格式)")
        ] = None,
        page: Annotated[
            int,
            Query(description="页码", ge=1)
        ] = 1,
        page_size: Annotated[
            int,
            Query(description="每页数量", ge=1, le=10000)
        ] = 20,
) -> ResponseDTO[VideoListResponseDTO]:
    """获取历史视频数据"""

    query_params = VideoHistoryQueryDTO(
        shed_id=shed_id,
        camera_id=camera_id,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size
    )

    result = VideoHistoryService.get_video_list_only(db, query_params)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=result
    )


@router.get(
    "/videos/list",
    response_model=ResponseDTO[ListResponseData[VideoInfoDTO]],
    summary="获取历史视频列表（带分页信息）",
    description="查询历史视频记录，返回包含分页信息的完整数据"
)
def get_video_history_with_pagination(
        db: SessionDep,
        shed_id: Annotated[Optional[int], Query(description="羊舍ID")] = None,
        camera_id: Annotated[Optional[int], Query(description="摄像头ID")] = None,
        start_time: Annotated[Optional[datetime], Query(description="开始时间")] = None,
        end_time: Annotated[Optional[datetime], Query(description="结束时间")] = None,
        page: Annotated[int, Query(description="页码", ge=1)] = 1,
        page_size: Annotated[int, Query(description="每页数量", ge=1, le=10000)] = 20,
) -> ResponseDTO[ListResponseData[VideoInfoDTO]]:
    """获取历史视频列表（带分页信息）"""

    query_params = VideoHistoryQueryDTO(
        shed_id=shed_id,
        camera_id=camera_id,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size
    )

    result = VideoHistoryService.get_video_history(db, query_params)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=result
    )