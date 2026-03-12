"""
警告规则数据模型
"""
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class AlertRuleDO(SQLModel, table=True):
    """警告规则数据对象"""
    __tablename__ = "alert_rule"

    id: Optional[int] = Field(default=None, primary_key=True, description="规则唯一标识符")
    name: str = Field(max_length=100, description="规则名称")
    sensor_id: Optional[int] = Field(
        default=None,
        foreign_key="sensor.id",
        description="传感器ID，为空表示所有设备"
    )
    sensor_name: str = Field(max_length=100, description="传感器名称（冗余字段，便于查询）")
    rule_type: str = Field(
        max_length=20,
        description="规则类型: manual-手动规则, smart-智能规则"
    )
    condition: str = Field(
        max_length=10,
        description="条件: gt-大于, lt-小于, eq-等于, gte-大于等于, lte-小于等于, ne-不等于"
    )
    threshold: float = Field(description="阈值")
    notification_method: str = Field(
        max_length=20,
        description="通知方式: email-邮件, sms-短信, both-两者"
    )
    enabled: bool = Field(default=True, description="是否启用")
    description: Optional[str] = Field(default=None, max_length=500, description="规则描述")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="更新时间")

    class Config:
        """配置"""
        json_schema_extra = {
            "example": {
                "name": "温度过高",
                "sensor_id": 1,
                "sensor_name": "东侧温度计",
                "rule_type": "manual",
                "condition": "gt",
                "threshold": 28,
                "notification_method": "email",
                "enabled": True
            }
        }