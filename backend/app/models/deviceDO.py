from typing import Optional

from sqlmodel import Field, SQLModel


class SensorDO(SQLModel, table=True):
    """
    传感器数据对象
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="传感器唯一标识符")
    name: str = Field(description="传感器名称")
    shed_id: int = Field(foreign_key="sheddo.id", description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, foreign_key="pendo.id", description="所属圈ID")
    type: str = Field(description="传感器类型：Temperature-温度，Humidity-湿度，Ammonia-氨气")
    status: str = Field(description="传感器状态：active-正常，inactive-未激活，error-错误")
    last_reading: Optional[float] = Field(default=None, description="最新读数")


class CameraDO(SQLModel, table=True):
    """
    摄像头数据对象
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="摄像头唯一标识符")
    name: str = Field(description="摄像头名称")
    shed_id: int = Field(foreign_key="sheddo.id", description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, foreign_key="pendo.id", description="所属圈ID")
    status: str = Field(description="摄像头状态：online-在线，offline-离线")
    stream_url: str = Field(description="视频流地址")
    thumbnail_url: str = Field(description="缩略图地址")


