"""
告警中心相关数据传输对象 (DTO)
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class AlertCreateDTO(BaseModel):
    """创建告警请求DTO"""
    shed_id: int = Field(..., gt=0, description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, gt=0, description="所属圈ID（可选）")
    severity: Literal["low", "medium", "high"] = Field(..., description="严重程度: low-低, medium-中, high-高")
    description: str = Field(..., min_length=1, max_length=500, description="告警描述")

    class Config:
        json_schema_extra = {
            "example": {
                "shed_id": 1,
                "pen_id": None,
                "severity": "high",
                "description": "舍内温度超过35°C，请及时处理"
            }
        }


class AlertResolveDTO(BaseModel):
    """解决告警请求DTO"""
    resolved_by: str = Field(..., min_length=1, max_length=50, description="处理人员姓名")

    class Config:
        json_schema_extra = {
            "example": {
                "resolved_by": "张三"
            }
        }


class AlertResponseDTO(BaseModel):
    """告警响应DTO"""
    id: int = Field(..., description="告警ID")
    shed_id: int = Field(..., description="所属羊舍ID")
    shed_name: Optional[str] = Field(None, description="羊舍名称")
    pen_id: Optional[int] = Field(None, description="所属圈ID")
    severity: str = Field(..., description="严重程度")
    description: str = Field(..., description="告警描述")
    alert_time: datetime = Field(..., description="报警时间")
    resolved: bool = Field(..., description="是否已解决")
    resolved_by: Optional[str] = Field(None, description="解决人员")
    resolve_time: Optional[datetime] = Field(None, description="解决时间")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "shed_id": 1,
                "shed_name": "1号羊舍",
                "pen_id": None,
                "severity": "high",
                "description": "温度超过35°C",
                "alert_time": "2026-04-28T10:00:00Z",
                "resolved": False,
                "resolved_by": None,
                "resolve_time": None
            }
        }


class AlertQueryDTO(BaseModel):
    """告警查询参数DTO"""
    shed_id: Optional[int] = Field(None, gt=0, description="羊舍ID筛选")
    severity: Optional[str] = Field(None, description="严重程度筛选")
    resolved: Optional[bool] = Field(None, description="是否已解决筛选")
    start_time: Optional[datetime] = Field(None, description="开始时间筛选")
    end_time: Optional[datetime] = Field(None, description="结束时间筛选")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=20, ge=1, le=1000, description="每页数量")


class AlertStatsDTO(BaseModel):
    """告警统计DTO"""
    total: int = Field(..., description="告警总数")
    unresolved: int = Field(..., description="未解决数量")
    high: int = Field(..., description="高危告警数量")
    medium: int = Field(..., description="中危告警数量")
    low: int = Field(..., description="低危告警数量")
    high_unresolved: int = Field(..., description="未解决高危数量")
    medium_unresolved: int = Field(..., description="未解决中危数量")
    low_unresolved: int = Field(..., description="未解决低危数量")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 25,
                "unresolved": 8,
                "high": 5,
                "medium": 12,
                "low": 8,
                "high_unresolved": 3,
                "medium_unresolved": 4,
                "low_unresolved": 1
            }
        }
