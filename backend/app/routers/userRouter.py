"""
用户管理相关接口
用于创建、查询、更新和删除用户信息
"""

from typing import List
from datetime import datetime

from app.config import SessionDep
from app.models.UserDO import UserDO
from app.schemas.userDTO import UserCreateDTO, UserReadDTO, UserUpdateDTO
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select, SQLModel, Field

router = APIRouter(prefix="/api/users", tags=["用户管理"])


class UserLoginDTO(SQLModel):
    """登录数据传输对象"""
    name: str = Field(description="用户名")
    password: str = Field(description="用户密码")
    role_mode: str = Field(default="guest", description="前端登录角色模式: admin/research/guest")


class UserLoginResponseDTO(SQLModel):
    """登录响应数据传输对象"""
    id: int = Field(description="用户唯一标识符")
    name: str = Field(description="用户名")
    role: int = Field(description="用户角色: 0=管理员, 1=普通访客, 2=科研用户")
    role_mode: str = Field(description="前端登录角色模式")


@router.post("/login", response_model=UserLoginResponseDTO, summary="用户登录")
def login_user(
    login_data: UserLoginDTO,
    session: SessionDep
) -> UserLoginResponseDTO:
    """
    用户登录接口
    - **name**: 用户名
    - **password**: 用户密码  
    - **role_mode**: 前端选择的角色模式 (admin/research/guest)
    """
    user = session.exec(select(UserDO).where(UserDO.name == login_data.name)).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if user.password != login_data.password:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)

    return UserLoginResponseDTO(
        id=user.id,
        name=user.name,
        role=user.role,
        role_mode=login_data.role_mode
    )


@router.post("/", response_model=UserReadDTO, summary="创建新用户", description="根据提供的用户信息创建一个新的用户账户")
def create_user(
    user: UserCreateDTO,
    session: SessionDep
) -> UserReadDTO:
    """
    创建一个新用户

    - **name**: 用户名
    - **password**: 用户密码
    - **role**: 用户角色 (0=管理员, 1=普通访客, 2=科研用户)
    """
    db_user = UserDO.model_validate(user)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserReadDTO], summary="获取用户列表", description="分页获取用户列表信息")
def read_users(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100, description="每页数量，最大100条"),
) -> List[UserReadDTO]:
    """
    获取用户列表

    - **offset**: 偏移量，默认为 0
    - **limit**: 每页数量，最大不能超过 100 条
    """
    users = session.exec(select(UserDO).offset(offset).limit(limit)).all()
    return users

@router.get("/{user_id}", response_model=UserReadDTO, summary="根据ID获取用户信息", description="通过用户ID获取特定用户的详细信息")
def read_user(
    user_id: int,
    session: SessionDep
) -> UserReadDTO:
    """
    根据用户ID获取用户信息

    - **user_id**: 用户ID
    """
    user = session.get(UserDO, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@router.patch("/{user_id}", response_model=UserReadDTO, summary="更新用户信息", description="根据用户ID部分更新用户信息")
def update_user(
    user_id: int,
    user: UserUpdateDTO,
    session: SessionDep
) -> UserReadDTO:
    """
    更新指定用户的信息（部分更新）

    - **user_id**: 要更新的用户ID
    - **name**: 新用户名（可选）
    - **password**: 新密码（可选）
    - **role**: 新角色（可选）
    """
    db_user = session.get(UserDO, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user_data = user.model_dump(exclude_unset=True)
    db_user.sqlmodel_update(user_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{user_id}", summary="删除用户", description="根据用户ID删除特定用户")
def delete_user(
    user_id: int,
    session: SessionDep
):
    """
    删除指定用户

    - **user_id**: 要删除的用户ID
    """
    user = session.get(UserDO, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    session.delete(user)
    session.commit()
    return {"ok": True}
