"""
羊舍相关数据传输对象 (DTO)
"""
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ShedCreateDTO(BaseModel):
    """创建羊舍请求DTO"""
    name: str = Field(..., min_length=1, max_length=100, description="羊舍名称")
    location: str = Field(..., min_length=1, max_length=200, description="羊舍位置")
    livestock_count: Optional[int] = Field(default=0, ge=0, description="当前牲畜数量")
    capacity: Optional[int] = Field(default=None, ge=0, description="羊舍最大容量")
    area: Optional[float] = Field(default=None, ge=0, description="羊舍面积(平方米)")
    status: Optional[str] = Field(default="active", description="羊舍状态")
    type: Optional[int] = Field(default=None, ge=1, le=4, description="羊舍类型")
    description: Optional[str] = Field(default=None, max_length=500, description="羊舍描述")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        allowed_statuses = ["active", "inactive", "maintenance"]
        if v not in allowed_statuses:
            raise ValueError(f"状态必须是以下之一: {', '.join(allowed_statuses)}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "A区-育肥羊舍",
                "location": "畜舍南区",
                "livestock_count": 80,
                "capacity": 100,
                "area": 600,
                "status": "active",
                "type": 1,
                "description": "主要用于育肥羊饲养"
            }
        }


class ShedUpdateDTO(BaseModel):
    """更新羊舍请求DTO"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="羊舍名称")
    location: Optional[str] = Field(None, min_length=1, max_length=200, description="羊舍位置")
    livestock_count: Optional[int] = Field(None, ge=0, description="当前牲畜数量")
    capacity: Optional[int] = Field(None, ge=0, description="羊舍最大容量")
    area: Optional[float] = Field(None, ge=0, description="羊舍面积(平方米)")
    status: Optional[str] = Field(None, description="羊舍状态")
    type: Optional[int] = Field(None, ge=1, le=4, description="羊舍类型")
    description: Optional[str] = Field(None, max_length=500, description="羊舍描述")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ["active", "inactive", "maintenance"]
            if v not in allowed_statuses:
                raise ValueError(f"状态必须是以下之一: {', '.join(allowed_statuses)}")
        return v


class ShedResponseDTO(BaseModel):
    """羊舍响应DTO"""
    id: int = Field(..., description="羊舍ID")
    name: str = Field(..., description="羊舍名称")
    location: str = Field(..., description="羊舍位置")
    livestock_count: int = Field(..., description="当前牲畜数量")
    capacity: Optional[int] = Field(None, description="羊舍最大容量")
    area: Optional[float] = Field(None, description="羊舍面积(平方米)")
    status: str = Field(..., description="羊舍状态")
    type: Optional[int] = Field(None, description="羊舍类型")
    description: Optional[str] = Field(None, description="羊舍描述")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "A区-育肥羊舍",
                "location": "畜舍南区",
                "livestock_count": 80,
                "capacity": 100,
                "area": 600,
                "status": "active",
                "type": 1,
                "description": "主要用于育肥羊饲养"
            }
        }


class ShedQueryDTO(BaseModel):
    """羊舍查询参数DTO"""
    status: Optional[str] = Field(None, description="羊舍状态筛选")
    type: Optional[int] = Field(None, ge=1, le=4, description="羊舍类型筛选")
    search: Optional[str] = Field(None, description="搜索关键词(名称或位置)")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")