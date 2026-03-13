"""
摄像头管理 Schemas
定义摄像头相关的请求/响应数据结构
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


# ==================== 请求 Schema ====================

class CameraCreateDTO(BaseModel):
    """创建摄像头请求"""
    name: str = Field(..., max_length=100, description="摄像头名称")
    shed_id: int = Field(..., description="所属羊舍ID")
    pen_id: Optional[int] = Field(None, description="所属圈ID")
    status: str = Field(default="online", max_length=20, description="摄像头状态: online-在线, offline-离线")
    stream_url: str = Field(..., max_length=500, description="视频流地址")
    thumbnail_url: str = Field(..., max_length=500, description="缩略图地址")
    last_maintenance: Optional[date] = Field(None, description="最后维护日期")
    location: Optional[str] = Field(None, max_length=200, description="摄像头安装位置")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "羊舍1号摄像头",
                "shed_id": 1,
                "pen_id": 2,
                "status": "online",
                "stream_url": "rtsp://192.168.1.100:554/stream1",
                "thumbnail_url": "http://192.168.1.100/thumbnail/1.jpg",
                "last_maintenance": "2024-01-01",
                "location": "羊舍北侧入口上方"
            }
        }


class CameraUpdateDTO(BaseModel):
    """更新摄像头请求（所有字段可选）"""
    name: Optional[str] = Field(None, max_length=100, description="摄像头名称")
    shed_id: Optional[int] = Field(None, description="所属羊舍ID")
    pen_id: Optional[int] = Field(None, description="所属圈ID")
    status: Optional[str] = Field(None, max_length=20, description="摄像头状态: online-在线, offline-离线")
    stream_url: Optional[str] = Field(None, max_length=500, description="视频流地址")
    thumbnail_url: Optional[str] = Field(None, max_length=500, description="缩略图地址")
    last_maintenance: Optional[date] = Field(None, description="最后维护日期")
    location: Optional[str] = Field(None, max_length=200, description="摄像头安装位置")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "offline",
                "last_maintenance": "2024-03-12",
                "location": "羊舍南侧"
            }
        }


class CameraQueryDTO(BaseModel):
    """查询摄像头列表请求"""
    shed_id: Optional[int] = Field(None, description="按羊舍ID筛选")
    pen_id: Optional[int] = Field(None, description="按圈ID筛选")
    status: Optional[str] = Field(None, description="按状态筛选: online/offline")
    name: Optional[str] = Field(None, description="按名称模糊搜索")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")


# ==================== 响应 Schema ====================

class CameraVO(BaseModel):
    """摄像头响应视图对象"""
    id: int = Field(..., description="摄像头唯一标识符")
    name: str = Field(..., description="摄像头名称")
    shed_id: int = Field(..., description="所属羊舍ID")
    pen_id: Optional[int] = Field(None, description="所属圈ID")
    status: str = Field(..., description="摄像头状态: online-在线, offline-离线")
    stream_url: str = Field(..., description="视频流地址")
    thumbnail_url: str = Field(..., description="缩略图地址")
    last_maintenance: Optional[date] = Field(None, description="最后维护日期")
    location: Optional[str] = Field(None, description="摄像头安装位置")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "羊舍1号摄像头",
                "shed_id": 1,
                "pen_id": 2,
                "status": "online",
                "stream_url": "rtsp://192.168.1.100:554/stream1",
                "thumbnail_url": "http://192.168.1.100/thumbnail/1.jpg",
                "last_maintenance": "2024-01-01",
                "location": "羊舍北侧入口上方"
            }
        }