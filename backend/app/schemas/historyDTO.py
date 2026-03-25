"""
历史数据相关数据传输对象 (DTO)
"""
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


# ==================== 传感器历史数据 DTO ====================

class TimeValuePairDTO(BaseModel):
    """时间-数值对"""
    time: str = Field(..., description="时间")
    value: float = Field(..., description="数值")

    class Config:
        json_schema_extra = {
            "example": {
                "time": "2023-10-31T14:20:00Z",
                "value": 22.5
            }
        }


class SensorHistoryDataDTO(BaseModel):
    """单个传感器的历史数据"""
    sensor_id: str = Field(..., description="传感器ID")
    shed_id: str = Field(..., description="羊舍ID")
    sensor_name: str = Field(..., description="传感器名称")
    sensor_type: str = Field(..., description="传感器类型")
    unit: str = Field(..., description="单位")
    data: List[TimeValuePairDTO] = Field(..., description="数据点列表")

    class Config:
        json_schema_extra = {
            "example": {
                "sensor_id": "sensor-a-t1",
                "shed_id": "shed-a",
                "sensor_name": "A区-东侧温度计",
                "sensor_type": "Temperature",
                "unit": "°C",
                "data": [
                    {"time": "2023-10-31T14:20:00Z", "value": 22.5},
                    {"time": "2023-10-31T14:25:00Z", "value": 22.6}
                ]
            }
        }


class SensorHistoryQueryDTO(BaseModel):
    """传感器历史数据查询参数"""
    shed_ids: Optional[List[int]] = Field(
        default=None,
        description="羊舍ID列表"
    )
    sensor_types: Optional[List[str]] = Field(
        default=None,
        description="传感器类型列表"
    )
    start: Optional[datetime] = Field(
        default=None,
        description="起始时间"
    )
    end: Optional[datetime] = Field(
        default=None,
        description="截止时间"
    )
    granularity: Optional[Literal["raw", "hour", "day"]] = Field(
        default="raw",
        description="数据粒度: raw-原始数据, hour-小时平均, day-日平均"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "shed_ids": [1, 2],
                "sensor_types": ["Temperature", "Humidity"],
                "start": "2023-10-31T00:00:00Z",
                "end": "2023-10-31T23:59:59Z",
                "granularity": "hour"
            }
        }


# ==================== 视频历史数据 DTO ====================

class VideoInfoDTO(BaseModel):
    """视频信息"""
    id: str = Field(..., description="视频ID")
    camera_id: str = Field(..., description="摄像头ID")
    shed_id: str = Field(..., description="羊舍ID")
    start_time: str = Field(..., description="视频开始时间")
    end_time: str = Field(..., description="视频结束时间")
    duration: int = Field(..., description="视频时长(秒)")
    thumbnail_url: Optional[str] = Field(None, description="缩略图URL")
    file_size: Optional[int] = Field(None, description="文件大小(字节)")
    resolution: Optional[str] = Field(None, description="视频分辨率")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "video-a-001",
                "camera_id": "cam-a-01",
                "shed_id": "shed-a",
                "start_time": "2026-03-10T08:00:00.000Z",
                "end_time": "2026-03-10T08:05:00.000Z",
                "duration": 300,
                "thumbnail_url": "https://picsum.photos/seed/video-a-001/400/300"
            }
        }


class VideoListResponseDTO(BaseModel):
    """视频列表响应"""
    videos: List[VideoInfoDTO] = Field(..., description="视频列表")

    class Config:
        json_schema_extra = {
            "example": {
                "videos": [
                    {
                        "id": "video-a-001",
                        "camera_id": "cam-a-01",
                        "shed_id": "shed-a",
                        "start_time": "2026-03-10T08:00:00.000Z",
                        "end_time": "2026-03-10T08:05:00.000Z",
                        "duration": 300,
                        "thumbnail_url": "https://picsum.photos/seed/video-a-001/400/300"
                    }
                ]
            }
        }


class VideoHistoryQueryDTO(BaseModel):
    """视频历史查询参数"""
    shed_id: Optional[int] = Field(default=None, description="羊舍ID")
    camera_id: Optional[int] = Field(default=None, description="摄像头ID")
    start_time: Optional[datetime] = Field(default=None, description="开始时间")
    end_time: Optional[datetime] = Field(default=None, description="结束时间")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=20, ge=1, le=10000, description="每页数量")

    class Config:
        json_schema_extra = {
            "example": {
                "shed_id": 1,
                "camera_id": 1,
                "start_time": "2026-03-10T00:00:00Z",
                "end_time": "2026-03-10T23:59:59Z",
                "page": 1,
                "page_size": 20
            }
        }