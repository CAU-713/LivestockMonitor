"""
操作日志相关数据传输对象 (DTO)
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OperationLogResponseDTO(BaseModel):
    id: int
    operator_name: str
    operator_role: int
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    resource_name: Optional[str] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditStatsItemDTO(BaseModel):
    action: str
    count: int


class AuditStatsDTO(BaseModel):
    total_7days: int = Field(description="近7天操作总数")
    by_action: List[AuditStatsItemDTO] = Field(description="按操作类型统计")
    by_resource_type: List[AuditStatsItemDTO] = Field(description="按资源类型统计")
