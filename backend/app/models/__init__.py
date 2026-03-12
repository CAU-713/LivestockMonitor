# 自动导入所有模型
from .AlertDO import AlertDO
from .AnimalDO import AnimalDO
from .DeviceDO import SensorDO, CameraDO, SensorTypeDO
from .FacilityDO import ShedDO, PenDO
from .HealthDataDO import WeightRecordDO, FeedIntakeRecordDO, BodyTemperatureRecordDO, RespirationRecordDO, \
    SerumRecordDO
from .RecordDataDO import BehaviorRecordDO, SensorRecordDO, VideoRecordDO, HouseComprehensiveEnvironmentDO, \
    EnterpriseFatteningEnvironmentDO
from .UserDO import UserDO

# 添加新模型时在这里导入
# from .product import ProductDO

# 为了让这些模型在其他地方可以通过 app.models 访问
__all__ = [
    "SensorDO",
    "CameraDO",
    "SensorTypeDO",
    "ShedDO",
    "PenDO",
    "BehaviorRecordDO",
    "SensorRecordDO",
    "VideoRecordDO",
    "HouseComprehensiveEnvironmentDO",
    "EnterpriseFatteningEnvironmentDO",
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
