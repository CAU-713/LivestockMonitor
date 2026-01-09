from typing import Optional, Dict, Any
from datetime import datetime, date, time
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class AlertDO(SQLModel, table=True):
    """报警记录数据对象"""
    __tablename__ = "alert"

    id: Optional[int] = Field(default=None, primary_key=True, description="警报唯一标识符")
    shed_id: int = Field(foreign_key="shed.id", description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, foreign_key="pen.id", description="所属圈ID")
    severity: str = Field(default="medium", max_length=20, description="严重程度: low-低, medium-中, high-高")
    description: str = Field(max_length=500, description="警报描述")
    alert_time: datetime = Field(description="报警时间")
    resolved: bool = Field(default=False, description="是否已解决")
    resolved_by: Optional[str] = Field(default=None, max_length=50, description="解决人员")
    resolve_time: Optional[datetime] = Field(default=None, description="解决时间")
