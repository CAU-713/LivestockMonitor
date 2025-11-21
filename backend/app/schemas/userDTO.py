from sqlmodel import Field, SQLModel
from typing import Optional

class UserCreateDTO(SQLModel):
    name: str
    password: str
    role: int = 0

class UserReadDTO(SQLModel):
    id: int
    name: str
    role: int

class UserUpdateDTO(SQLModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[int] = None
