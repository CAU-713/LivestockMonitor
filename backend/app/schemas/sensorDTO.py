"""
传感器相关数据传输对象 (DTO)
"""
from typing import Optional
from datetime import date
from pydantic import BaseModel, Field, field_validator


class SensorTypeResponseDTO(BaseModel):
    """传感器类型响应DTO"""
    id: str = Field(..., description="传感器类型ID")
    name: str = Field(..., description="传感器类型名称")
    unit: str = Field(..., description="传感器单位")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "temperature",
                "name": "温度",
                "unit": "°C"
            }
        }


class SensorCreateDTO(BaseModel):
    """创建传感器请求DTO"""
    name: str = Field(..., min_length=1, max_length=100, description="传感器名称")
    shed_id: int = Field(..., gt=0, description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, gt=0, description="所属圈ID")
    type: str = Field(..., description="传感器类型")
    status: Optional[str] = Field(default="active", description="传感器状态")
    last_reading: Optional[float] = Field(default=None, description="最新读数")
    last_calibration: Optional[date] = Field(default=None, description="最后校准日期")
    location: Optional[str] = Field(default=None, max_length=200, description="传感器安装位置")
    description: Optional[str] = Field(default=None, max_length=500, description="传感器描述")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        allowed_statuses = ["active", "inactive", "error"]
        if v not in allowed_statuses:
            raise ValueError(f"状态必须是以下之一: {', '.join(allowed_statuses)}")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        allowed_types = [
            "Temperature", "Humidity", "Ammonia", "WindSpeed",
            "CO2", "CH4", "Oxygen", "H2S", "PM", "Light"
        ]
        if v not in allowed_types:
            raise ValueError(f"类型必须是以下之一: {', '.join(allowed_types)}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "A区-东侧温度计",
                "shed_id": 1,
                "pen_id": 1,
                "type": "Temperature",
                "status": "active",
                "last_reading": 22.5,
                "location": "东侧墙壁",
                "description": "监测羊舍温度"
            }
        }


class SensorUpdateDTO(BaseModel):
    """更新传感器请求DTO"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="传感器名称")
    shed_id: Optional[int] = Field(None, gt=0, description="所属羊舍ID")
    pen_id: Optional[int] = Field(None, gt=0, description="所属圈ID")
    type: Optional[str] = Field(None, description="传感器类型")
    status: Optional[str] = Field(None, description="传感器状态")
    last_reading: Optional[float] = Field(None, description="最新读数")
    last_calibration: Optional[date] = Field(None, description="最后校准日期")
    location: Optional[str] = Field(None, max_length=200, description="传感器安装位置")
    description: Optional[str] = Field(None, max_length=500, description="传感器描述")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ["active", "inactive", "error"]
            if v not in allowed_statuses:
                raise ValueError(f"状态必须是以下之一: {', '.join(allowed_statuses)}")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v is not None:
            allowed_types = [
                "Temperature", "Humidity", "Ammonia", "WindSpeed",
                "CO2", "CH4", "Oxygen", "H2S", "PM", "Light"
            ]
            if v not in allowed_types:
                raise ValueError(f"类型必须是以下之一: {', '.join(allowed_types)}")
        return v


class SensorResponseDTO(BaseModel):
    """传感器响应DTO"""
    id: int = Field(..., description="传感器ID")
    name: str = Field(..., description="传感器名称")
    shed_id: int = Field(..., description="所属羊舍ID")
    pen_id: Optional[int] = Field(None, description="所属圈ID")
    type: str = Field(..., description="传感器类型")
    status: str = Field(..., description="传感器状态")
    last_reading: Optional[float] = Field(None, description="最新读数")
    last_calibration: Optional[date] = Field(None, description="最后校准日期")
    location: Optional[str] = Field(None, description="传感器安装位置")
    description: Optional[str] = Field(None, description="传感器描述")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "A区-东侧温度计",
                "shed_id": 1,
                "pen_id": 1,
                "type": "Temperature",
                "status": "active",
                "last_reading": 22.5,
                "last_calibration": "2026-01-15",
                "location": "东侧墙壁",
                "description": "监测羊舍温度"
            }
        }


class SensorQueryDTO(BaseModel):
    """传感器查询参数DTO"""
    shed_id: Optional[int] = Field(None, gt=0, description="羊舍ID筛选")
    pen_id: Optional[int] = Field(None, gt=0, description="圈ID筛选")
    type: Optional[str] = Field(None, description="传感器类型筛选")
    status: Optional[str] = Field(None, description="传感器状态筛选")
    search: Optional[str] = Field(None, description="搜索关键词(名称)")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=10000, description="每页数量")