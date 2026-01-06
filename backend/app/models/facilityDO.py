from typing import Optional

from sqlmodel import Field, SQLModel


class ShedDO(SQLModel, table=True):
    """
    羊舍数据对象
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="羊舍唯一标识符")
    name: str = Field(description="羊舍名称")
    location: str = Field(description="羊舍位置")
    livestock_count: int = Field(default=0, description="牲畜数量")


class PenDO(SQLModel, table=True):
    """
    圈数据对象
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="圈唯一标识符")
    name: str = Field(description="圈名称")
    shed_id: int = Field(foreign_key="sheddo.id", description="所属羊舍ID")