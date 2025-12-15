# 自动导入所有模型
from .userDO import UserDO
from .ragflowDO import ChatDO, SessionDO, DatasetDO
# 添加新模型时在这里导入
# from .product import ProductDO

# 为了让这些模型在其他地方可以通过 app.models 访问
__all__ = [
    "UserDO",
    "ChatDO",
    "SessionDO",
    "DatasetDO"
]
