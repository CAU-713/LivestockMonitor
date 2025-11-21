from typing import List
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from app.config import SessionDep
from app.models.userDO import UserDO
from app.schemas.userDTO import UserCreateDTO, UserReadDTO, UserUpdateDTO

router = APIRouter(prefix="/users", tags=["users相关接口"])

@router.post("/", response_model=UserReadDTO)
def create_user(user: UserCreateDTO, session: SessionDep) -> UserReadDTO:
    db_user = UserDO.model_validate(user)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserReadDTO])
def read_users(
    session: SessionDep,
    offset: int = 0,
    limit: int = Query(default=100, le=100),
) -> List[UserReadDTO]:
    users = session.exec(select(UserDO).offset(offset).limit(limit)).all()
    return users

@router.get("/{user_id}", response_model=UserReadDTO)
def read_user(user_id: int, session: SessionDep) -> UserReadDTO:
    user = session.get(UserDO, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserReadDTO)
def update_user(user_id: int, user: UserUpdateDTO, session: SessionDep) -> UserReadDTO:
    db_user = session.get(UserDO, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, session: SessionDep):
    user = session.get(UserDO, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"ok": True}
