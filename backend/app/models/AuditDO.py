from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class OperationLogDO(SQLModel, table=True):
    """操作日志数据对象"""
    __tablename__ = "operation_log"

    id: Optional[int] = Field(default=None, primary_key=True, description="日志唯一标识")
    operator_name: str = Field(max_length=50, description="操作人员名称")
    operator_role: int = Field(description="操作人员角色: 0-管理员, 1-普通用户, 2-科研用户")
    action: str = Field(max_length=20, description="操作类型: CREATE/UPDATE/DELETE/LOGIN/RESOLVE")
    resource_type: str = Field(max_length=30, description="资源类型: animal/shed/sensor/alert/user/rule/medical/production")
    resource_id: Optional[int] = Field(default=None, description="资源ID")
    resource_name: Optional[str] = Field(default=None, max_length=100, description="资源名称/描述")
    detail: Optional[str] = Field(default=None, description="操作详情(JSON文本)")
    ip_address: Optional[str] = Field(default=None, max_length=50, description="操作者IP地址")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="操作时间")
