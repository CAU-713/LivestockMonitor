from typing import Optional, Dict, Any

from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel


class BehaviorRecordDO(SQLModel, table=True):
    """
    行为统计数据对象
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="行为统计唯一标识符")
    camera_id: int = Field(foreign_key="camerado.id", description="来源摄像头ID")
    timestamp: str = Field(description="时间戳")
    eating_count: int = Field(default=0, description="进食次数")
    drinking_count: int = Field(default=0, description="饮水次数")
    licking_count: int = Field(default=0, description="舔舐次数")
    standing_count: int = Field(default=0, description="站立次数")
    lying_count: int = Field(default=0, description="躺卧次数")


class SensorRecordDO(SQLModel, table=True):
    """
    传感器记录数据对象
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="记录唯一标识符")
    sensor_id: int = Field(foreign_key="sensordo.id", description="传感器ID")
    timestamp: str = Field(description="时间戳")
    data: Dict[Any, Any] = Field(default={}, sa_type=JSON, description="传感器读数数据，JSON格式")