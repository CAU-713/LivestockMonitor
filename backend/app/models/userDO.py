from sqlmodel import Field, SQLModel
from typing import Optional

class UserDO(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    password: str
    role: int = Field(default=0, index=True)
