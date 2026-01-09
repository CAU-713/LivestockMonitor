from typing import Optional, Dict, Any
from datetime import datetime, date, time
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class BehaviorRecordDO(SQLModel, table=True):
    """行为统计数据对象"""
    __tablename__ = "behavior_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="行为统计唯一标识符")
    camera_id: int = Field(foreign_key="camera.id", description="来源摄像头ID")
    timestamp: datetime = Field(description="时间戳")
    eating_count: int = Field(default=0, description="进食数量")
    drinking_count: int = Field(default=0, description="饮水数量")
    licking_count: int = Field(default=0, description="舔舐数量")
    standing_count: int = Field(default=0, description="站立数量")
    lying_count: int = Field(default=0, description="躺卧数量")

class SensorRecordDO(SQLModel, table=True):
    """传感器记录数据对象"""
    __tablename__ = "sensor_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="记录唯一标识符")
    sensor_id: int = Field(foreign_key="sensor.id", description="传感器ID")
    timestamp: datetime = Field(description="时间戳")
    data: Dict[Any, Any] = Field(default={}, sa_type=JSON, description="传感器读数数据，JSON格式")

class EnvironmentRecordDO(SQLModel, table=True):
    """环境监测综合记录数据对象"""
    __tablename__ = "environment_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="记录唯一标识")
    shed_id: int = Field(foreign_key="shed.id", description="棚舍ID")
    record_time: datetime = Field(description="记录时间(间隔5分钟)")

    # 区域一
    co2_area1: Optional[float] = Field(default=None, description="区域一二氧化碳浓度(ppm)")
    temperature_area1: Optional[float] = Field(default=None, description="区域一温度(℃)")
    humidity_area1: Optional[float] = Field(default=None, description="区域一湿度(%)")
    wind_speed_area1: Optional[float] = Field(default=None, description="区域一风速(m/s)")
    black_globe_temp_area1: Optional[float] = Field(default=None, description="区域一黑球温度(℃)")
    illuminance_area1: Optional[float] = Field(default=None, description="区域一光照强度(lux)")

    # 区域二
    co2_area2: Optional[float] = Field(default=None, description="区域二二氧化碳浓度(ppm)")
    temperature_area2: Optional[float] = Field(default=None, description="区域二温度(℃)")
    humidity_area2: Optional[float] = Field(default=None, description="区域二湿度(%)")
    wind_speed_area2: Optional[float] = Field(default=None, description="区域二风速(m/s)")
    black_globe_temp_area2: Optional[float] = Field(default=None, description="区域二黑球温度(℃)")
    illuminance_area2: Optional[float] = Field(default=None, description="区域二光照强度(lux)")

    # 区域三
    co2_area3: Optional[float] = Field(default=None, description="区域三二氧化碳浓度(ppm)")
    temperature_area3: Optional[float] = Field(default=None, description="区域三温度(℃)")
    humidity_area3: Optional[float] = Field(default=None, description="区域三湿度(%)")
    wind_speed_area3: Optional[float] = Field(default=None, description="区域三风速(m/s)")
    black_globe_temp_area3: Optional[float] = Field(default=None, description="区域三黑球温度(℃)")
    illuminance_area3: Optional[float] = Field(default=None, description="区域三光照强度(lux)")

    # 室外数据
    outdoor_temperature: Optional[float] = Field(default=None, description="室外温度(℃)")
    outdoor_humidity: Optional[float] = Field(default=None, description="室外湿度(%)")
    outdoor_illuminance: Optional[float] = Field(default=None, description="室外光照强度(lux)")
    outdoor_black_globe_temp: Optional[float] = Field(default=None, description="室外黑球温度(℃)")
    pressure_difference: Optional[float] = Field(default=None, description="舍内外气压差(Pa)")

    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="记录创建时间")