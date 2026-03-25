from datetime import datetime
from typing import Optional

from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class UserDO(SQLModel, table=True):
    """用户信息数据对象"""
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True, description="用户唯一标识符")
    name: str = Field(max_length=50, description="用户名")
    password: str = Field(max_length=255, description="用户密码")
    role: int = Field(default=0, description="用户角色: 0-管理员，1-普通访客，2-科研用户")
    email: Optional[str] = Field(default=None, max_length=100, description="电子邮箱")
    phone: Optional[str] = Field(default=None, max_length=20, description="联系电话")
    last_login: Optional[datetime] = Field(default=None, description="最后登录时间")
