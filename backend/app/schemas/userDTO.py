from typing import Optional

from sqlmodel import Field, SQLModel


class UserCreateDTO(SQLModel):
    """
    创建用户数据传输对象
    用于接收创建用户请求的数据
    """
    name: str = Field(description="用户名")
    password: str = Field(description="用户密码")
    role: int = Field(default=0, description="用户角色：0-普通用户，1-管理员")

class UserReadDTO(SQLModel):
    """
    读取用户数据传输对象
    用于返回用户信息给客户端
    """
    id: int = Field(description="用户唯一标识符")
    name: str = Field(description="用户名")
    role: int = Field(description="用户角色")

class UserUpdateDTO(SQLModel):
    """
    更新用户数据传输对象
    用于接收更新用户信息请求的数据
    """
    name: Optional[str] = Field(default=None, description="用户名")
    password: Optional[str] = Field(default=None, description="用户密码")
    role: Optional[int] = Field(default=None, description="用户角色")
