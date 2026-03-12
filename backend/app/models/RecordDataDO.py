from datetime import datetime
from typing import Optional, Dict, Any

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
    """传感器数据历史记录"""
    __tablename__ = "sensor_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="记录唯一标识符")
    sensor_id: int = Field(foreign_key="sensor.id", description="传感器ID")
    value: float = Field(description="传感器读数值")
    timestamp: datetime = Field(description="数据采集时间")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="记录创建时间")

    class Config:
        """配置"""
        json_schema_extra = {
            "example": {
                "sensor_id": 1,
                "value": 22.5,
                "timestamp": "2023-10-31T14:20:00Z"
            }
        }


class VideoRecordDO(SQLModel, table=True):
    """视频数据历史记录"""
    __tablename__ = "video_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="视频唯一标识符")
    camera_id: int = Field(foreign_key="camera.id", description="摄像头ID")
    shed_id: int = Field(foreign_key="shed.id", description="所属羊舍ID")
    start_time: datetime = Field(description="视频开始时间")
    end_time: datetime = Field(description="视频结束时间")
    duration: int = Field(description="视频时长(秒)")
    file_path: Optional[str] = Field(default=None, max_length=500, description="视频文件路径")
    thumbnail_url: Optional[str] = Field(default=None, max_length=500, description="缩略图URL")
    file_size: Optional[int] = Field(default=None, description="文件大小(字节)")
    resolution: Optional[str] = Field(default=None, max_length=20, description="视频分辨率")
    description: Optional[str] = Field(default=None, max_length=500, description="视频描述")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="创建时间")

    class Config:
        """配置"""
        json_schema_extra = {
            "example": {
                "camera_id": 1,
                "shed_id": 1,
                "start_time": "2026-03-10T08:00:00Z",
                "end_time": "2026-03-10T08:05:00Z",
                "duration": 300,
                "thumbnail_url": "https://example.com/thumbnail.jpg"
            }
        }

class HouseComprehensiveEnvironmentDO(SQLModel, table=True):
    """环境监测综合记录数据对象"""
    __tablename__ = "house_comprehensive_environment"

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

class EnterpriseFatteningEnvironmentDO(SQLModel, table=True):
    """企业育肥环境数据记录对象"""
    __tablename__ = "enterprise_fattening_environment"

    id: Optional[int] = Field(default=None, primary_key=True, description="记录唯一标识")
    record_time: datetime = Field(description="记录时间")

    # 基础信息
    age_days: Optional[int] = Field(default=None, description="日龄(天)")
    target_temperature: Optional[float] = Field(default=None, description="目标温度(℃)")
    phase: Optional[int] = Field(default=None, description="阶段")

    # 通风需求
    required_airflow: Optional[float] = Field(default=None, description="需求风量(m3/h)")
    actual_airflow: Optional[float] = Field(default=None, description="实际风量(m3/h)")

    # 温度相关
    indoor_temperature: Optional[float] = Field(default=None, description="舍内温度(℃)")
    outdoor_temperature: Optional[float] = Field(default=None, description="舍外温度(℃)")

    # 湿度
    indoor_humidity: Optional[float] = Field(default=None, description="舍内湿度(%)")

    # 温度传感器数据
    temperature_sensor_1: Optional[float] = Field(default=None, description="温度传感器1(℃)")
    temperature_sensor_2: Optional[float] = Field(default=None, description="温度传感器2(℃)")
    temperature_sensor_3: Optional[float] = Field(default=None, description="温度传感器3(℃)")
    temperature_sensor_4: Optional[float] = Field(default=None, description="温度传感器4(℃)")

    # 变速风机控制
    variable_speed_fan_1: Optional[int] = Field(default=None, description="变速风机1(%)")
    variable_speed_fan_2: Optional[int] = Field(default=None, description="变速风机2(%)")
    variable_speed_fan_3: Optional[int] = Field(default=None, description="变速风机3(%)")
    variable_speed_fan_4: Optional[int] = Field(default=None, description="变速风机4(%)")
    variable_speed_fan_5: Optional[int] = Field(default=None, description="变速风机5(%)")

    # 定速风机状态
    fixed_speed_fan_1: Optional[str] = Field(default=None, max_length=10, description="定速风机1状态(ON/OFF)")
    fixed_speed_fan_2: Optional[str] = Field(default=None, max_length=10, description="定速风机2状态(ON/OFF)")
    fixed_speed_fan_3: Optional[str] = Field(default=None, max_length=10, description="定速风机3状态(ON/OFF)")
    fixed_speed_fan_4: Optional[str] = Field(default=None, max_length=10, description="定速风机4状态(ON/OFF)")
    fixed_speed_fan_5: Optional[str] = Field(default=None, max_length=10, description="定速风机5状态(ON/OFF)")
    fixed_speed_fan_6: Optional[str] = Field(default=None, max_length=10, description="定速风机6状态(ON/OFF)")
    fixed_speed_fan_7: Optional[str] = Field(default=None, max_length=10, description="定速风机7状态(ON/OFF)")

    # 加热设备状态
    heater_1: Optional[str] = Field(default=None, max_length=10, description="加热器1状态(ON/OFF)")
    heater_2: Optional[str] = Field(default=None, max_length=10, description="加热器2状态(ON/OFF)")

    # 通风设备
    roof_window: Optional[int] = Field(default=None, description="屋顶小窗开度(%)")
    sliding_curtain: Optional[int] = Field(default=None, description="滑帘开度(%)")

    # 报警状态
    alarm_status: Optional[str] = Field(default=None, max_length=10, description="报警器状态(ON/OFF)")

    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="记录创建时间")
