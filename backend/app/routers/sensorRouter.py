"""
传感器路由
定义传感器相关的 API 接口
"""
from typing import Annotated
from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.sensorDTO import (
    SensorCreateDTO,
    SensorUpdateDTO,
    SensorResponseDTO,
    SensorTypeResponseDTO,
    SensorQueryDTO
)
from app.services.sensor import SensorService, SensorTypeService
from app.utils.cache import get_cache, set_cache, delete_cache, delete_pattern


router = APIRouter(prefix="/api/sensors", tags=["传感器管理"])


# ==================== 传感器类型接口 ====================

@router.get(
    "/types",
    response_model=ResponseDTO[list[SensorTypeResponseDTO]],
    summary="获取传感器类型列表",
    description="获取所有可用的传感器类型"
)
def get_sensor_types(
        db: SessionDep
) -> ResponseDTO[list[SensorTypeResponseDTO]]:
    """获取传感器类型列表"""
    sensor_types = SensorTypeService.get_all_sensor_types(db)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=[SensorTypeResponseDTO.model_validate(st) for st in sensor_types]
    )


@router.get(
    "/types/{type_id}",
    response_model=ResponseDTO[SensorTypeResponseDTO],
    summary="获取传感器类型详情",
    description="根据ID获取传感器类型详细信息"
)
def get_sensor_type(
        type_id: str,
        db: SessionDep
) -> ResponseDTO[SensorTypeResponseDTO]:
    """获取传感器类型详情"""
    sensor_type = SensorTypeService.get_sensor_type_by_id(db, type_id)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=SensorTypeResponseDTO.model_validate(sensor_type)
    )


# ==================== 传感器接口 ====================

@router.post(
    "",
    response_model=ResponseDTO[SensorResponseDTO],
    summary="创建传感器",
    description="创建一个新的传感器"
)
def create_sensor(
        sensor_data: SensorCreateDTO,
        db: SessionDep
) -> ResponseDTO[SensorResponseDTO]:
    """创建传感器"""
    sensor = SensorService.create_sensor(db, sensor_data)
    # 失效列表缓存
    delete_pattern("sensor:list:*")
    if sensor_data.shed_id:
        delete_cache(f"sensor:by_shed:{sensor_data.shed_id}")

    return ResponseDTO(
        code=200,
        success=True,
        message="传感器创建成功",
        data=SensorResponseDTO.model_validate(sensor)
    )


@router.get(
    "",
    response_model=ResponseDTO[ListResponseData[SensorResponseDTO]],
    summary="获取传感器列表",
    description="获取传感器列表，支持分页和筛选"
)
def get_sensors(
        db: SessionDep,
        shed_id: Annotated[int | None, Query(description="羊舍ID筛选", gt=0)] = None,
        pen_id: Annotated[int | None, Query(description="圈ID筛选", gt=0)] = None,
        type: Annotated[str | None, Query(description="传感器类型筛选")] = None,
        status: Annotated[str | None, Query(description="传感器状态筛选")] = None,
        search: Annotated[str | None, Query(description="搜索关键词")] = None,
        page: Annotated[int, Query(description="页码", ge=1)] = 1,
        page_size: Annotated[int, Query(description="每页数量", ge=1, le=10000)] = 10
) -> ResponseDTO[ListResponseData[SensorResponseDTO]]:
    """获取传感器列表（带 120s Redis 缓存）"""
    cache_key = f"sensor:list:{shed_id}:{pen_id}:{type}:{status}:{search}:{page}:{page_size}"
    cached = get_cache(cache_key)
    if cached is not None:
        items = [SensorResponseDTO(**item) for item in cached["items"]]
        data = ListResponseData(
            items=items,
            total=cached["total"],
            page=cached["page"],
            page_size=cached["page_size"],
        )
        return ResponseDTO(code=200, success=True, message="查询成功", data=data)

    query_params = SensorQueryDTO(
        shed_id=shed_id,
        pen_id=pen_id,
        type=type,
        status=status,
        search=search,
        page=page,
        page_size=page_size
    )

    result = SensorService.get_sensors(db, query_params)

    # 转换为响应DTO
    response_data = ListResponseData(
        items=[SensorResponseDTO.model_validate(sensor) for sensor in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size
    )
    set_cache(cache_key, response_data.model_dump(), ttl=120)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=response_data
    )


@router.get(
    "/{sensor_id}",
    response_model=ResponseDTO[SensorResponseDTO],
    summary="获取传感器详情",
    description="根据ID获取传感器详细信息"
)
def get_sensor(
        sensor_id: int,
        db: SessionDep
) -> ResponseDTO[SensorResponseDTO]:
    """获取传感器详情"""
    sensor = SensorService.get_sensor_by_id(db, sensor_id)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=SensorResponseDTO.model_validate(sensor)
    )


@router.put(
    "/{sensor_id}",
    response_model=ResponseDTO[SensorResponseDTO],
    summary="更新传感器",
    description="更新传感器信息"
)
def update_sensor(
        sensor_id: int,
        sensor_data: SensorUpdateDTO,
        db: SessionDep
) -> ResponseDTO[SensorResponseDTO]:
    """更新传感器"""
    sensor = SensorService.update_sensor(db, sensor_id, sensor_data)
    # 失效列表和 by-shed 缓存
    delete_pattern("sensor:list:*")
    delete_cache(f"sensor:by_shed:{sensor.shed_id}")

    return ResponseDTO(
        code=200,
        success=True,
        message="传感器更新成功",
        data=SensorResponseDTO.model_validate(sensor)
    )


@router.delete(
    "/{sensor_id}",
    response_model=ResponseDTO[None],
    summary="删除传感器",
    description="删除指定的传感器"
)
def delete_sensor(
        sensor_id: int,
        db: SessionDep
) -> ResponseDTO[None]:
    """删除传感器"""
    # 删除前先获取 shed_id 以便精准失效缓存
    sensor = SensorService.get_sensor_by_id(db, sensor_id)
    shed_id = sensor.shed_id
    SensorService.delete_sensor(db, sensor_id)
    delete_pattern("sensor:list:*")
    delete_cache(f"sensor:by_shed:{shed_id}")

    return ResponseDTO(
        code=200,
        success=True,
        message="传感器删除成功",
        data=None
    )


@router.patch(
    "/{sensor_id}/reading",
    response_model=ResponseDTO[SensorResponseDTO],
    summary="更新传感器读数",
    description="更新传感器的最新读数"
)
def update_sensor_reading(
        sensor_id: int,
        reading: Annotated[float, Query(description="新的读数值")],
        db: SessionDep
) -> ResponseDTO[SensorResponseDTO]:
    """更新传感器读数"""
    sensor = SensorService.update_sensor_reading(db, sensor_id, reading)
    # 读数更新频繁，只失效列表缓存（by-shed 缓存不含读数，无需失效）
    delete_pattern("sensor:list:*")

    return ResponseDTO(
        code=200,
        success=True,
        message="传感器读数更新成功",
        data=SensorResponseDTO.model_validate(sensor)
    )


@router.get(
    "/shed/{shed_id}",
    response_model=ResponseDTO[list[SensorResponseDTO]],
    summary="获取羊舍的所有传感器",
    description="获取指定羊舍的所有传感器"
)
def get_sensors_by_shed(
        shed_id: int,
        db: SessionDep
) -> ResponseDTO[list[SensorResponseDTO]]:
    """获取羊舍的所有传感器（带 120s Redis 缓存）"""
    cache_key = f"sensor:by_shed:{shed_id}"
    cached = get_cache(cache_key)
    if cached is not None:
        return ResponseDTO(
            code=200,
            success=True,
            message="查询成功",
            data=[SensorResponseDTO(**item) for item in cached]
        )

    sensors = SensorService.get_sensors_by_shed(db, shed_id)
    sensor_dtos = [SensorResponseDTO.model_validate(sensor) for sensor in sensors]
    set_cache(cache_key, [s.model_dump() for s in sensor_dtos], ttl=120)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=sensor_dtos
    )
