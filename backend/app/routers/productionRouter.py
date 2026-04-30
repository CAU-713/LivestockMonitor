"""
生产管理路由
定义出栏记录、死亡记录相关的 API 接口
"""
from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.productionDTO import (
    SlaughterCreateDTO,
    SlaughterResponseDTO,
    MortalityCreateDTO,
    MortalityResponseDTO,
    ProductionStatsDTO,
)
from app.services.production import ProductionService

router = APIRouter(prefix="/api/production", tags=["生产管理"])


# ─── 出栏记录接口 ──────────────────────────────────────────────

@router.post(
    "/slaughter",
    response_model=ResponseDTO[SlaughterResponseDTO],
    summary="新增出栏记录（自动更新动物状态为已出栏）"
)
def create_slaughter(
    data: SlaughterCreateDTO,
    db: SessionDep,
) -> ResponseDTO[SlaughterResponseDTO]:
    record = ProductionService.create_slaughter(db, data)
    return ResponseDTO(code=200, success=True, message="出栏记录创建成功", data=record)


@router.get(
    "/slaughter",
    response_model=ResponseDTO[ListResponseData[SlaughterResponseDTO]],
    summary="获取出栏记录列表"
)
def get_slaughters(
    db: SessionDep,
    shed_id: Annotated[Optional[int], Query(description="羊舍ID", gt=0)] = None,
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[SlaughterResponseDTO]]:
    result = ProductionService.get_slaughters(db, shed_id, start_date, end_date, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


# ─── 死亡记录接口 ──────────────────────────────────────────────

@router.post(
    "/mortality",
    response_model=ResponseDTO[MortalityResponseDTO],
    summary="新增死亡记录（自动更新动物状态为已出栏）"
)
def create_mortality(
    data: MortalityCreateDTO,
    db: SessionDep,
) -> ResponseDTO[MortalityResponseDTO]:
    record = ProductionService.create_mortality(db, data)
    return ResponseDTO(code=200, success=True, message="死亡记录创建成功", data=record)


@router.get(
    "/mortality",
    response_model=ResponseDTO[ListResponseData[MortalityResponseDTO]],
    summary="获取死亡记录列表"
)
def get_mortalities(
    db: SessionDep,
    shed_id: Annotated[Optional[int], Query(description="羊舍ID", gt=0)] = None,
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[MortalityResponseDTO]]:
    result = ProductionService.get_mortalities(db, shed_id, start_date, end_date, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


# ─── 统计接口 ──────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=ResponseDTO[ProductionStatsDTO],
    summary="获取出栏/死亡统计数据"
)
def get_stats(db: SessionDep) -> ResponseDTO[ProductionStatsDTO]:
    stats = ProductionService.get_stats(db)
    return ResponseDTO(code=200, success=True, message="查询成功", data=stats)
