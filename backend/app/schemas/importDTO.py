"""
批量导入相关数据传输对象 (DTO)
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class ImportErrorItem(BaseModel):
    row: int = Field(description="错误所在行号（从1开始）")
    reason: str = Field(description="错误原因")


class ImportResultDTO(BaseModel):
    success_count: int = Field(description="成功导入条数")
    fail_count: int = Field(description="失败条数")
    errors: List[ImportErrorItem] = Field(default_factory=list, description="错误详情列表")
