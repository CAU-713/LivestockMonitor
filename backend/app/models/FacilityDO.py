from typing import Optional

from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class ShedDO(SQLModel, table=True):
    """羊舍信息数据对象"""
    __tablename__ = "shed"

    id: Optional[int] = Field(default=None, primary_key=True, description="羊舍唯一标识符")
    name: str = Field(max_length=100, description="羊舍名称")
    location: str = Field(max_length=200, description="羊舍位置")
    livestock_count: Optional[int] = Field(default=0, description="当前牲畜数量")
    capacity: Optional[int] = Field(default=None, description="羊舍最大容量")
    area: Optional[float] = Field(default=None, description="羊舍面积(平方米)")
    status: str = Field(default="active", max_length=20,
                        description="羊舍状态: active-使用中, inactive-空闲, maintenance-维护中")
    type: Optional[int] = Field(default=None, description="羊舍类型: 1-育肥舍, 2-繁殖舍, 3-羔羊舍, 4-其他")
    description: Optional[str] = Field(default=None, max_length=500, description="羊舍描述")

class PenDO(SQLModel, table=True):
    """羊圈信息数据对象"""
    __tablename__ = "pen"

    id: Optional[int] = Field(default=None, primary_key=True, description="圈唯一标识符")
    name: str = Field(max_length=100, description="圈名称")
    shed_id: int = Field(foreign_key="shed.id", description="所属羊舍ID")
    capacity: Optional[int] = Field(default=None, description="圈最大容量")
    area: Optional[float] = Field(default=None, description="圈面积(平方米)")
    status: str = Field(default="active", max_length=20,
                        description="圈状态: active-使用中, inactive-空闲, maintenance-维护中")
    description: Optional[str] = Field(default=None, max_length=500, description="圈描述")

