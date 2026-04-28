"""
动物档案路由
定义动物档案相关的 API 接口
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.animalDTO import (
    AnimalCreateDTO,
    AnimalUpdateDTO,
    AnimalHealthUpdateDTO,
    AnimalBreedingUpdateDTO,
    AnimalResponseDTO,
    AnimalQueryDTO,
    AnimalStatsDTO,
)
from app.services.animal import AnimalService

router = APIRouter(prefix="/api/animals", tags=["动物档案管理"])


@router.get(
    "/stats",
    response_model=ResponseDTO[AnimalStatsDTO],
    summary="获取动物统计数据",
    description="获取各健康状态、生产类别的动物数量统计"
)
def get_animal_stats(db: SessionDep) -> ResponseDTO[AnimalStatsDTO]:
    """获取动物统计"""
    stats = AnimalService.get_stats(db)
    return ResponseDTO(code=200, success=True, message="查询成功", data=stats)


@router.get(
    "/breeding",
    response_model=ResponseDTO[ListResponseData[AnimalResponseDTO]],
    summary="获取繁殖动物列表",
    description="获取 breeding_status 不为空的动物列表"
)
def get_breeding_animals(
    db: SessionDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=1000)] = 500,
) -> ResponseDTO[ListResponseData[AnimalResponseDTO]]:
    """获取繁殖动物列表"""
    result = AnimalService.get_breeding_animals(db, page=page, page_size=page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.get(
    "",
    response_model=ResponseDTO[ListResponseData[AnimalResponseDTO]],
    summary="获取动物列表",
    description="获取动物档案列表，支持分页及多维度筛选"
)
def get_animals(
    db: SessionDep,
    shed_id: Annotated[Optional[int], Query(description="羊舍ID筛选", gt=0)] = None,
    health_status: Annotated[Optional[str], Query(description="健康状态筛选")] = None,
    gender: Annotated[Optional[str], Query(description="性别筛选: male/female")] = None,
    breed: Annotated[Optional[str], Query(description="品种筛选")] = None,
    production_type: Annotated[Optional[str], Query(description="生产类别筛选")] = None,
    breeding_status: Annotated[Optional[str], Query(description="繁殖状态筛选")] = None,
    search: Annotated[Optional[str], Query(description="关键词搜索（编号/品种）")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=1000)] = 20,
) -> ResponseDTO[ListResponseData[AnimalResponseDTO]]:
    """获取动物列表"""
    query_params = AnimalQueryDTO(
        shed_id=shed_id,
        health_status=health_status,
        gender=gender,
        breed=breed,
        production_type=production_type,
        breeding_status=breeding_status,
        search=search,
        page=page,
        page_size=page_size,
    )
    result = AnimalService.get_animals(db, query_params)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.post(
    "",
    response_model=ResponseDTO[AnimalResponseDTO],
    summary="新增动物档案",
    description="创建一条新的动物档案"
)
def create_animal(
    data: AnimalCreateDTO,
    db: SessionDep,
) -> ResponseDTO[AnimalResponseDTO]:
    """新增动物档案"""
    animal = AnimalService.create_animal(db, data)
    return ResponseDTO(code=200, success=True, message="动物档案创建成功", data=animal)


@router.get(
    "/{animal_id}",
    response_model=ResponseDTO[AnimalResponseDTO],
    summary="获取动物详情",
    description="根据ID获取动物详细信息"
)
def get_animal(animal_id: int, db: SessionDep) -> ResponseDTO[AnimalResponseDTO]:
    """获取动物详情"""
    animal = AnimalService.get_animal_by_id(db, animal_id)
    return ResponseDTO(code=200, success=True, message="查询成功", data=animal)


@router.put(
    "/{animal_id}",
    response_model=ResponseDTO[AnimalResponseDTO],
    summary="更新动物档案",
    description="更新动物档案信息"
)
def update_animal(
    animal_id: int,
    data: AnimalUpdateDTO,
    db: SessionDep,
) -> ResponseDTO[AnimalResponseDTO]:
    """更新动物档案"""
    animal = AnimalService.update_animal(db, animal_id, data)
    return ResponseDTO(code=200, success=True, message="动物档案更新成功", data=animal)


@router.patch(
    "/{animal_id}/health",
    response_model=ResponseDTO[AnimalResponseDTO],
    summary="更新健康状态",
    description="快速更新动物的健康状态"
)
def update_health_status(
    animal_id: int,
    data: AnimalHealthUpdateDTO,
    db: SessionDep,
) -> ResponseDTO[AnimalResponseDTO]:
    """更新健康状态"""
    animal = AnimalService.update_health_status(db, animal_id, data)
    return ResponseDTO(code=200, success=True, message="健康状态更新成功", data=animal)


@router.post(
    "/{animal_id}/breeding",
    response_model=ResponseDTO[AnimalResponseDTO],
    summary="更新繁殖状态",
    description="更新动物的繁殖状态、配种日期、分娩日期等"
)
def update_breeding_status(
    animal_id: int,
    data: AnimalBreedingUpdateDTO,
    db: SessionDep,
) -> ResponseDTO[AnimalResponseDTO]:
    """更新繁殖状态"""
    animal = AnimalService.update_breeding_status(db, animal_id, data)
    return ResponseDTO(code=200, success=True, message="繁殖状态更新成功", data=animal)


@router.get(
    "/{animal_id}/offspring",
    response_model=ResponseDTO[list[AnimalResponseDTO]],
    summary="获取动物后代列表",
    description="获取以该动物为母本的后代列表"
)
def get_offspring(animal_id: int, db: SessionDep) -> ResponseDTO[list[AnimalResponseDTO]]:
    """获取后代列表"""
    offspring = AnimalService.get_offspring(db, animal_id)
    return ResponseDTO(code=200, success=True, message="查询成功", data=offspring)


@router.delete(
    "/{animal_id}",
    response_model=ResponseDTO[None],
    summary="删除动物档案",
    description="删除指定动物的档案"
)
def delete_animal(animal_id: int, db: SessionDep) -> ResponseDTO[None]:
    """删除动物档案"""
    AnimalService.delete_animal(db, animal_id)
    return ResponseDTO(code=200, success=True, message="动物档案删除成功", data=None)
