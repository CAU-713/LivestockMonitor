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
from passlib.context import CryptContext

router = APIRouter(prefix="/api/users", tags=["用户管理"])

# 密码哈希上下文，使用 bcrypt 算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserLoginDTO(SQLModel):
    """登录数据传输对象"""
    name: str = Field(description="用户名")
    password: str = Field(description="用户密码")


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
    user = session.exec(select(UserDO).where(UserDO.name == login_data.name)).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not pwd_context.verify(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    # 根据数据库中的 role 值自动映射到前端角色模式
    # role=0 → admin, role=1 → guest, role=2 → research
    role_mode_map = {0: "admin", 1: "guest", 2: "research"}
    role_mode = role_mode_map.get(user.role, "guest")
    return UserLoginResponseDTO(
        id=user.id,
        name=user.name,
        role=user.role,
        role_mode=role_mode
    )


# 注意：path 使用 "" 而非 "/"，配合 FastAPI(redirect_slashes=False) 避免 307 重定向问题
@router.post("", response_model=UserReadDTO, summary="创建新用户")
def create_user(user: UserCreateDTO, session: SessionDep) -> UserReadDTO:
    db_user = UserDO.model_validate(user)
    # 对密码进行 bcrypt 哈希加密
    db_user.password = pwd_context.hash(user.password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.get("", response_model=List[UserReadDTO], summary="获取用户列表")
def read_users(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100),
) -> List[UserReadDTO]:
    return session.exec(select(UserDO).offset(offset).limit(limit)).all()


@router.get("/{user_id}", response_model=UserReadDTO, summary="根据ID获取用户信息")
def read_user(user_id: int, session: SessionDep) -> UserReadDTO:
    user = session.get(UserDO, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.patch("/{user_id}", response_model=UserReadDTO, summary="更新用户信息")
def update_user(user_id: int, user: UserUpdateDTO, session: SessionDep) -> UserReadDTO:
    db_user = session.get(UserDO, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user_data = user.model_dump(exclude_unset=True)
    # 如果更新数据中包含密码，则对新密码进行哈希加密
    if "password" in user_data and user_data["password"]:
        user_data["password"] = pwd_context.hash(user_data["password"])
    db_user.sqlmodel_update(user_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.delete("/{user_id}", summary="删除用户")
def delete_user(user_id: int, session: SessionDep):
    user = session.get(UserDO, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    session.delete(user)
    session.commit()
    return {"ok": True}
