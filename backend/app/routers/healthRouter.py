"""
健康数据路由
定义动物健康数据相关的 API 接口
"""
from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.healthDTO import (
    WeightRecordCreateDTO,
    WeightRecordResponseDTO,
    BodyTemperatureCreateDTO,
    BodyTemperatureResponseDTO,
    RespirationRecordCreateDTO,
    RespirationRecordResponseDTO,
    SerumRecordCreateDTO,
    SerumRecordResponseDTO,
    WeightTrendResponseDTO,
)
from app.services.health import HealthService

router = APIRouter(prefix="/api/health", tags=["健康数据管理"])


# ─── 体重接口 ────────────────────────────────────────────────

@router.post(
    "/weight",
    response_model=ResponseDTO[WeightRecordResponseDTO],
    summary="新增体重记录"
)
def create_weight_record(
    data: WeightRecordCreateDTO,
    db: SessionDep,
) -> ResponseDTO[WeightRecordResponseDTO]:
    record = HealthService.create_weight_record(db, data)
    return ResponseDTO(code=200, success=True, message="体重记录创建成功", data=record)


@router.get(
    "/weight",
    response_model=ResponseDTO[ListResponseData[WeightRecordResponseDTO]],
    summary="获取体重记录列表"
)
def get_weight_records(
    db: SessionDep,
    animal_id: Annotated[int, Query(description="羊只ID", gt=0)],
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[WeightRecordResponseDTO]]:
    result = HealthService.get_weight_records(db, animal_id, start_date, end_date, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.get(
    "/trend/{animal_id}",
    response_model=ResponseDTO[WeightTrendResponseDTO],
    summary="获取动物体重趋势"
)
def get_weight_trend(animal_id: int, db: SessionDep) -> ResponseDTO[WeightTrendResponseDTO]:
    trend = HealthService.get_weight_trend(db, animal_id)
    return ResponseDTO(code=200, success=True, message="查询成功", data=trend)


# ─── 体温接口 ────────────────────────────────────────────────

@router.post(
    "/temperature",
    response_model=ResponseDTO[BodyTemperatureResponseDTO],
    summary="新增体温记录"
)
def create_temperature_record(
    data: BodyTemperatureCreateDTO,
    db: SessionDep,
) -> ResponseDTO[BodyTemperatureResponseDTO]:
    record = HealthService.create_temperature_record(db, data)
    return ResponseDTO(code=200, success=True, message="体温记录创建成功", data=record)


@router.get(
    "/temperature",
    response_model=ResponseDTO[ListResponseData[BodyTemperatureResponseDTO]],
    summary="获取体温记录列表"
)
def get_temperature_records(
    db: SessionDep,
    animal_id: Annotated[int, Query(description="羊只ID", gt=0)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[BodyTemperatureResponseDTO]]:
    result = HealthService.get_temperature_records(db, animal_id, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


# ─── 呼吸接口 ────────────────────────────────────────────────

@router.post(
    "/respiration",
    response_model=ResponseDTO[RespirationRecordResponseDTO],
    summary="新增呼吸记录"
)
def create_respiration_record(
    data: RespirationRecordCreateDTO,
    db: SessionDep,
) -> ResponseDTO[RespirationRecordResponseDTO]:
    record = HealthService.create_respiration_record(db, data)
    return ResponseDTO(code=200, success=True, message="呼吸记录创建成功", data=record)


@router.get(
    "/respiration",
    response_model=ResponseDTO[ListResponseData[RespirationRecordResponseDTO]],
    summary="获取呼吸记录列表"
)
def get_respiration_records(
    db: SessionDep,
    animal_id: Annotated[int, Query(description="羊只ID", gt=0)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[RespirationRecordResponseDTO]]:
    result = HealthService.get_respiration_records(db, animal_id, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


# ─── 血清接口 ────────────────────────────────────────────────

@router.post(
    "/serum",
    response_model=ResponseDTO[SerumRecordResponseDTO],
    summary="新增血清记录"
)
def create_serum_record(
    data: SerumRecordCreateDTO,
    db: SessionDep,
) -> ResponseDTO[SerumRecordResponseDTO]:
    record = HealthService.create_serum_record(db, data)
    return ResponseDTO(code=200, success=True, message="血清记录创建成功", data=record)


@router.get(
    "/serum",
    response_model=ResponseDTO[ListResponseData[SerumRecordResponseDTO]],
    summary="获取血清记录列表"
)
def get_serum_records(
    db: SessionDep,
    animal_id: Annotated[int, Query(description="羊只ID", gt=0)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[SerumRecordResponseDTO]]:
    result = HealthService.get_serum_records(db, animal_id, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)
