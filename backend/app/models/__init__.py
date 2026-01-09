# 自动导入所有模型
from .DeviceDO import SensorDO, CameraDO
from .FacilityDO import ShedDO, PenDO
from .RecordDataDO import BehaviorRecordDO, SensorRecordDO, EnvironmentRecordDO, FatteningEnvironmentRecordDO
from .UserDO import UserDO
from .AlertDO import AlertDO
from .AnimalDO import AnimalDO
from .HealthDataDO import WeightRecordDO, FeedIntakeRecordDO, BodyTemperatureRecordDO, RespirationRecordDO, SerumRecordDO

# 添加新模型时在这里导入
# from .product import ProductDO

# 为了让这些模型在其他地方可以通过 app.models 访问
__all__ = [
    "SensorDO",
    "CameraDO",
    "ShedDO",
    "PenDO",
    "BehaviorRecordDO",
    "SensorRecordDO",
    "EnvironmentRecordDO",
    "FatteningEnvironmentRecordDO",
    "UserDO",
    "AlertDO",
    "AnimalDO",
    "WeightRecordDO",
    "FeedIntakeRecordDO",
    "BodyTemperatureRecordDO",
    "RespirationRecordDO",
    "SerumRecordDO",
    # "ProductDO",
]
