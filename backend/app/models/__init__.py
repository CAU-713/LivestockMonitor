# 自动导入所有模型
from .deviceDO import SensorDO, CameraDO
from .facilityDO import ShedDO, PenDO
from .recordDataDO import BehaviorRecordDO, SensorRecordDO
from .userDO import UserDO

# 添加新模型时在这里导入
# from .product import ProductDO

# 为了让这些模型在其他地方可以通过 app.models 访问
__all__ = [
    "UserDO",
    "SensorDO",
    "CameraDO",
    "ShedDO",
    "PenDO",
    "BehaviorRecordDO",
    "SensorRecordDO",
    # "ProductDO",
]
