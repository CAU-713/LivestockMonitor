"""
行为监控数据传输对象 (DTO)
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BehaviorRecordResponseDTO(BaseModel):
    """行为统计响应DTO"""
    id: int
    camera_id: int
    timestamp: datetime
    eating_count: int
    drinking_count: int
    licking_count: int
    standing_count: int
    lying_count: int

    class Config:
        from_attributes = True


class BehaviorLatestResponseDTO(BaseModel):
    """最新行为统计响应DTO"""
    camera_id: int
    timestamp: datetime
    eating_count: int
    drinking_count: int
    licking_count: int
    standing_count: int
    lying_count: int
    total_count: int = Field(..., description="总检测数")


class BehaviorTrendPoint(BaseModel):
    """行为趋势数据点"""
    timestamp: str
    eating_count: int
    drinking_count: int
    standing_count: int
    lying_count: int


class BehaviorTrendResponseDTO(BaseModel):
    """行为趋势响应DTO"""
    camera_id: int
    hours: int
    data: list[BehaviorTrendPoint]