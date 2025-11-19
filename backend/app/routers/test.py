from typing import Union

from fastapi import APIRouter

from app.services.userService import get_all_users
router = APIRouter(tags=["测试接口"])
@router.get("/")
def read_root():
    return {"Hello": "World"}


@router.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@router.get("/users")
def get_users():
    """
    Fetch all users from the user_table
    """
    users = get_all_users()
    return {"users": users}