"""
羊舍路由
定义羊舍相关的 API 接口
"""
from typing import Annotated
from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.shedDTO import (
    ShedCreateDTO,
    ShedUpdateDTO,
    ShedResponseDTO,
    ShedQueryDTO
)
from app.services.shed import ShedService
from app.utils.cache import get_cache, set_cache, delete_cache, delete_pattern

router = APIRouter(prefix="/api/sheds", tags=["羊舍管理"])


@router.post(
    "",
    response_model=ResponseDTO[ShedResponseDTO],
    summary="创建羊舍",
    description="创建一个新的羊舍"
)
def create_shed(
        shed_data: ShedCreateDTO,
        db: SessionDep
) -> ResponseDTO[ShedResponseDTO]:
    """创建羊舍"""
    shed = ShedService.create_shed(db, shed_data)
    delete_pattern("shed:list:*")

    return ResponseDTO(
        code=200,
        success=True,
        message="羊舍创建成功",
        data=ShedResponseDTO.model_validate(shed)
    )


@router.get(
    "",
    response_model=ResponseDTO[ListResponseData[ShedResponseDTO]],
    summary="获取羊舍列表",
    description="获取羊舍列表，支持分页和筛选"
)
def get_sheds(
        db: SessionDep,
        status: Annotated[str | None, Query(description="羊舍状态筛选")] = None,
        type: Annotated[int | None, Query(description="羊舍类型筛选", ge=1, le=4)] = None,
        search: Annotated[str | None, Query(description="搜索关键词")] = None,
        page: Annotated[int, Query(description="页码", ge=1)] = 1,
        page_size: Annotated[int, Query(description="每页数量", ge=1, le=10000)] = 10
) -> ResponseDTO[ListResponseData[ShedResponseDTO]]:
    """获取羊舍列表（带 300s Redis 缓存）"""
    cache_key = f"shed:list:{status}:{type}:{search}:{page}:{page_size}"
    cached = get_cache(cache_key)
    if cached is not None:
        items = [ShedResponseDTO(**item) for item in cached["items"]]
        data = ListResponseData(
            items=items,
            total=cached["total"],
            page=cached["page"],
            page_size=cached["page_size"],
        )
        return ResponseDTO(code=200, success=True, message="查询成功", data=data)

    query_params = ShedQueryDTO(
        status=status,
        type=type,
        search=search,
        page=page,
        page_size=page_size
    )

    result = ShedService.get_sheds(db, query_params)

    # 转换为响应DTO
    response_data = ListResponseData(
        items=[ShedResponseDTO.model_validate(shed) for shed in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size
    )
    set_cache(cache_key, response_data.model_dump(), ttl=300)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=response_data
    )


@router.get(
    "/{shed_id}",
    response_model=ResponseDTO[ShedResponseDTO],
    summary="获取羊舍详情",
    description="根据ID获取羊舍详细信息"
)
def get_shed(
        shed_id: int,
        db: SessionDep
) -> ResponseDTO[ShedResponseDTO]:
    """获取羊舍详情"""
    shed = ShedService.get_shed_by_id(db, shed_id)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=ShedResponseDTO.model_validate(shed)
    )


@router.put(
    "/{shed_id}",
    response_model=ResponseDTO[ShedResponseDTO],
    summary="更新羊舍",
    description="更新羊舍信息"
)
def update_shed(
        shed_id: int,
        shed_data: ShedUpdateDTO,
        db: SessionDep
) -> ResponseDTO[ShedResponseDTO]:
    """更新羊舍"""
    shed = ShedService.update_shed(db, shed_id, shed_data)
    delete_pattern("shed:list:*")

    return ResponseDTO(
        code=200,
        success=True,
        message="羊舍更新成功",
        data=ShedResponseDTO.model_validate(shed)
    )


@router.delete(
    "/{shed_id}",
    response_model=ResponseDTO[None],
    summary="删除羊舍",
    description="删除指定的羊舍"
)
def delete_shed(
        shed_id: int,
        db: SessionDep
) -> ResponseDTO[None]:
    """删除羊舍"""
    ShedService.delete_shed(db, shed_id)
    delete_pattern("shed:list:*")

    return ResponseDTO(
        code=200,
        success=True,
        message="羊舍删除成功",
        data=None
    )


@router.patch(
    "/{shed_id}/livestock-count",
    response_model=ResponseDTO[ShedResponseDTO],
    summary="更新牲畜数量",
    description="更新羊舍的牲畜数量"
)
def update_livestock_count(
        shed_id: int,
        count: Annotated[int, Query(description="新的牲畜数量", ge=0)],
        db: SessionDep
) -> ResponseDTO[ShedResponseDTO]:
    """更新牲畜数量"""
    shed = ShedService.update_livestock_count(db, shed_id, count)
    delete_pattern("shed:list:*")

    return ResponseDTO(
        code=200,
        success=True,
        message="牲畜数量更新成功",
        data=ShedResponseDTO.model_validate(shed)
    )
