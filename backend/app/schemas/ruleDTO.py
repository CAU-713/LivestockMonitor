"""
警告规则相关数据传输对象 (DTO)
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


class AlertRuleCreateDTO(BaseModel):
    """创建警告规则请求DTO"""
    name: str = Field(..., min_length=1, max_length=100, description="规则名称")
    sensor_name: str = Field(..., min_length=1, max_length=100, description="传感器名称")
    sensor_id: Optional[int] = Field(default=None, gt=0, description="传感器ID，为空表示所有设备")
    rule_type: Literal["manual", "smart"] = Field(..., description="规则类型")
    condition: Literal["gt", "lt", "eq", "gte", "lte", "ne"] = Field(..., description="条件")
    threshold: float = Field(..., description="阈值")
    notification_method: Literal["email", "sms", "both"] = Field(..., description="通知方式")
    enabled: bool = Field(default=True, description="是否启用")
    description: Optional[str] = Field(default=None, max_length=500, description="规则描述")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "高温预警",
                "sensor_name": "东侧温度计",
                "sensor_id": 1,
                "rule_type": "manual",
                "condition": "gt",
                "threshold": 30,
                "notification_method": "email",
                "enabled": True
            }
        }


class AlertRuleUpdateDTO(BaseModel):
    """更新警告规则请求DTO"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="规则名称")
    sensor_name: Optional[str] = Field(None, min_length=1, max_length=100, description="传感器名称")
    sensor_id: Optional[int] = Field(None, gt=0, description="传感器ID")
    rule_type: Optional[Literal["manual", "smart"]] = Field(None, description="规则类型")
    condition: Optional[Literal["gt", "lt", "eq", "gte", "lte", "ne"]] = Field(None, description="条件")
    threshold: Optional[float] = Field(None, description="阈值")
    notification_method: Optional[Literal["email", "sms", "both"]] = Field(None, description="通知方式")
    enabled: Optional[bool] = Field(None, description="是否启用")
    description: Optional[str] = Field(None, max_length=500, description="规则描述")


class AlertRuleResponseDTO(BaseModel):
    """警告规则响应DTO"""
    id: str = Field(..., description="规则ID")
    name: str = Field(..., description="规则名称")
    sensor_name: str = Field(..., description="传感器名称")
    rule_type: str = Field(..., description="规则类型")
    condition: str = Field(..., description="条件")
    threshold: float = Field(..., description="阈值")
    notification_method: str = Field(..., description="通知方式")
    enabled: bool = Field(..., description="是否启用")
    description: Optional[str] = Field(None, description="规则描述")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "1",
                "name": "温度过高",
                "sensor_name": "东侧温度计",
                "rule_type": "manual",
                "condition": "gt",
                "threshold": 28,
                "notification_method": "email",
                "enabled": True
            }
        }


class AlertRuleListResponseDTO(BaseModel):
    """警告规则列表响应DTO"""
    rules: list[AlertRuleResponseDTO] = Field(..., description="规则列表")

    class Config:
        json_schema_extra = {
            "example": {
                "rules": [
                    {
                        "id": "1",
                        "name": "温度过高",
                        "sensor_name": "东侧温度计",
                        "rule_type": "manual",
                        "condition": "gt",
                        "threshold": 28,
                        "notification_method": "email",
                        "enabled": True
                    }
                ]
            }
        }


class AlertRuleDeleteResponseDTO(BaseModel):
    """删除规则响应DTO"""
    deleted: bool = Field(..., description="是否删除成功")
    rule_id: str = Field(..., description="规则ID")

    class Config:
        json_schema_extra = {
            "example": {
                "deleted": True,
                "rule_id": "1"
            }
        }


class AlertRuleToggleResponseDTO(BaseModel):
    """启用/禁用规则响应DTO"""
    id: str = Field(..., description="规则ID")
    enabled: bool = Field(..., description="是否启用")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "1",
                "enabled": False
            }
        }


class AlertRuleQueryDTO(BaseModel):
    """警告规则查询参数DTO"""
    rule_type: Optional[str] = Field(None, description="规则类型筛选")
    enabled: Optional[bool] = Field(None, description="启用状态筛选")
    sensor_id: Optional[int] = Field(None, gt=0, description="传感器ID筛选")
    search: Optional[str] = Field(None, description="搜索关键词(规则名称)")
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")