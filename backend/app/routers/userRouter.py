"""
用户管理相关接口
用于创建、查询、更新和删除用户信息
"""

from typing import List

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.config import SessionDep
from app.models.UserDO import UserDO
from app.schemas.userDTO import UserCreateDTO, UserReadDTO, UserUpdateDTO

router = APIRouter(prefix="/users", tags=["用户管理"])

@router.post("/", response_model=UserReadDTO, summary="创建新用户", description="根据提供的用户信息创建一个新的用户账户")
def create_user(
    user: UserCreateDTO, 
    session: SessionDep
) -> UserReadDTO:
    """
    创建一个新用户
    
    - **name**: 用户名
    - **password**: 用户密码
    - **role**: 用户角色 (默认为 0 - 普通用户, 1 - 管理员)
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

    user_data = user.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{user_id}", response_model=dict, summary="删除用户", description="根据用户ID删除指定用户")
def delete_user(
    user_id: int, 
    session: SessionDep
) -> dict:
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
