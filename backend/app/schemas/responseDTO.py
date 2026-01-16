"""
统一响应格式 DTO
定义所有 API 接口的统一返回格式
"""

from typing import Optional, Any, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

# 泛型类型变量
T = TypeVar('T')


class ResponseDTO(BaseModel, Generic[T]):
    """
    统一响应格式

    所有 API 接口都应该使用此格式返回数据
    """
    code: int = Field(..., description="业务状态码: 200-成功, 400-客户端错误, 500-服务器错误")
    success: bool = Field(..., description="操作是否成功")
    message: str = Field(..., description="提示信息")
    data: Optional[T] = Field(None, description="响应数据")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="时间戳 (ISO 8601 格式)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "success": True,
                "message": "操作成功",
                "data": {"id": 1, "name": "示例数据"},
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class ListResponseData(BaseModel, Generic[T]):
    """
    列表数据响应格式

    用于返回分页列表数据
    """
    items: list[T] = Field(..., description="数据列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(1, ge=1, description="当前页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [{"id": 1, "name": "项目1"}, {"id": 2, "name": "项目2"}],
                "total": 100,
                "page": 1,
                "page_size": 10
            }
        }


class ErrorDetail(BaseModel):
    """
    错误详情

    用于提供更详细的错误信息
    """
    field: Optional[str] = Field(None, description="出错的字段名")
    message: str = Field(..., description="错误消息")
    code: Optional[str] = Field(None, description="错误代码")

    class Config:
        json_schema_extra = {
            "example": {
                "field": "name",
                "message": "名称不能为空",
                "code": "REQUIRED_FIELD"
            }
        }