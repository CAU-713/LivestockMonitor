from typing import Optional

from sqlmodel import Field, SQLModel


class UserDO(SQLModel, table=True):
    """
    用户数据对象（Data Object）
    对应数据库中的 users 表
    """
    id: Optional[int] = Field(default=None, primary_key=True, description="用户唯一标识符")
    name: str = Field(index=True, description="用户名")
    password: str = Field(description="用户密码")
    role: int = Field(default=0, index=True, description="用户角色：0-普通用户，1-管理员")
