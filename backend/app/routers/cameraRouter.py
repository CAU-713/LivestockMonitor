"""
摄像头管理 Router
定义摄像头相关 API 路由
"""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.cameraDTO import (
    CameraCreateDTO,
    CameraUpdateDTO,
    CameraQueryDTO,
    CameraVO,
)
from app.services.camera import camera_service

router = APIRouter(prefix="/cameras", tags=["摄像头管理"])


# ==================== 列表查询 ====================

@router.get(
    "",
    response_model=ResponseDTO[ListResponseData[CameraVO]],
    summary="获取摄像头列表",
    description="支持按羊舍、圈、状态、名称进行筛选，支持分页。",
)
def list_cameras(
    session: SessionDep,
    shed_id: int | None = Query(None, description="按羊舍ID筛选"),
    pen_id: int | None = Query(None, description="按圈ID筛选"),
    status: str | None = Query(None, description="按状态筛选: online/offline"),
    name: str | None = Query(None, description="按名称模糊搜索"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=10000, description="每页数量"),
):
    query = CameraQueryDTO(
        shed_id=shed_id,
        pen_id=pen_id,
        status=status,
        name=name,
        page=page,
        page_size=page_size,
    )
    data = camera_service.get_camera_list(session, query)
    return ResponseDTO(code=200, success=True, message="获取成功", data=data)


# ==================== 详情查询 ====================

@router.get(
    "/{camera_id}",
    response_model=ResponseDTO[CameraVO],
    summary="获取摄像头详情",
    description="根据摄像头 ID 查询详细信息。",
)
def get_camera(
    camera_id: int,
    session: SessionDep,
):
    data = camera_service.get_camera_by_id(session, camera_id)
    return ResponseDTO(code=200, success=True, message="获取成功", data=data)


# ==================== 创建 ====================

@router.post(
    "",
    response_model=ResponseDTO[CameraVO],
    status_code=201,
    summary="创建摄像头",
    description="新增一条摄像头记录。",
)
def create_camera(
    dto: CameraCreateDTO,
    session: SessionDep,
):
    data = camera_service.create_camera(session, dto)
    return ResponseDTO(code=200, success=True, message="创建成功", data=data)


# ==================== 更新 ====================

@router.put(
    "/{camera_id}",
    response_model=ResponseDTO[CameraVO],
    summary="更新摄像头",
    description="局部更新摄像头信息，仅修改请求体中传入的字段。",
)
def update_camera(
    camera_id: int,
    dto: CameraUpdateDTO,
    session: SessionDep,
):
    data = camera_service.update_camera(session, camera_id, dto)
    return ResponseDTO(code=200, success=True, message="更新成功", data=data)


# ==================== 删除 ====================

@router.delete(
    "/{camera_id}",
    response_model=ResponseDTO[None],
    summary="删除摄像头",
    description="根据 ID 删除摄像头记录。",
)
def delete_camera(
    camera_id: int,
    session: SessionDep,
):
    camera_service.delete_camera(session, camera_id)
    return ResponseDTO(code=200, success=True, message="删除成功", data=None)