from typing import Optional, Dict, Any
from datetime import datetime, date, time
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class SensorDO(SQLModel, table=True):
    """传感器信息数据对象"""
    __tablename__ = "sensor"

    id: Optional[int] = Field(default=None, primary_key=True, description="传感器唯一标识符")
    name: str = Field(max_length=100, description="传感器名称")
    shed_id: int = Field(foreign_key="shed.id", description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, foreign_key="pen.id", description="所属圈ID")
    type: str = Field(max_length=50,
                      description="传感器类型: Temperature, Humidity, Ammonia, WindSpeed, CO2, CH4, Oxygen, H2S, PM, Light")
    status: str = Field(default="active", max_length=20,
                        description="传感器状态: active-正常, inactive-未激活, error-错误")
    last_reading: Optional[float] = Field(default=None, description="最新读数")
    last_calibration: Optional[date] = Field(default=None, description="最后校准日期")
    location: Optional[str] = Field(default=None, max_length=200, description="传感器安装位置")
    description: Optional[str] = Field(default=None, max_length=500, description="传感器描述")

class CameraDO(SQLModel, table=True):
    """摄像头信息数据对象"""
    __tablename__ = "camera"

    id: Optional[int] = Field(default=None, primary_key=True, description="摄像头唯一标识符")
    name: str = Field(max_length=100, description="摄像头名称")
    shed_id: int = Field(foreign_key="shed.id", description="所属羊舍ID")
    pen_id: Optional[int] = Field(default=None, foreign_key="pen.id", description="所属圈ID")
    status: str = Field(default="online", max_length=20, description="摄像头状态: online-在线, offline-离线")
    stream_url: str = Field(max_length=500, description="视频流地址")
    thumbnail_url: str = Field(max_length=500, description="缩略图地址")
    last_maintenance: Optional[date] = Field(default=None, description="最后维护日期")
    location: Optional[str] = Field(default=None, max_length=200, description="摄像头安装位置")
