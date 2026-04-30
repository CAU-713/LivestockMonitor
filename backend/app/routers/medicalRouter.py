"""
疫病防治路由
定义疫苗接种、用药记录、驱虫记录相关的 API 接口
"""
from datetime import date
from typing import Annotated, Optional, List

from fastapi import APIRouter, Query

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.medicalDTO import (
    VaccinationCreateDTO,
    VaccinationResponseDTO,
    MedicationCreateDTO,
    MedicationResponseDTO,
    DewormingCreateDTO,
    DewormingResponseDTO,
    UpcomingReminderDTO,
)
from app.services.medical import MedicalService

router = APIRouter(prefix="/api/medical", tags=["疫病防治管理"])


# ─── 疫苗接种接口 ──────────────────────────────────────────────

@router.post(
    "/vaccination",
    response_model=ResponseDTO[VaccinationResponseDTO],
    summary="新增疫苗接种记录"
)
def create_vaccination(
    data: VaccinationCreateDTO,
    db: SessionDep,
) -> ResponseDTO[VaccinationResponseDTO]:
    record = MedicalService.create_vaccination(db, data)
    return ResponseDTO(code=200, success=True, message="疫苗接种记录创建成功", data=record)


@router.get(
    "/vaccination",
    response_model=ResponseDTO[ListResponseData[VaccinationResponseDTO]],
    summary="获取疫苗接种记录列表"
)
def get_vaccinations(
    db: SessionDep,
    animal_id: Annotated[Optional[int], Query(description="羊只ID", gt=0)] = None,
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[VaccinationResponseDTO]]:
    result = MedicalService.get_vaccinations(db, animal_id, start_date, end_date, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.delete(
    "/vaccination/{record_id}",
    response_model=ResponseDTO[None],
    summary="删除疫苗接种记录"
)
def delete_vaccination(record_id: int, db: SessionDep) -> ResponseDTO[None]:
    MedicalService.delete_vaccination(db, record_id)
    return ResponseDTO(code=200, success=True, message="删除成功", data=None)


# ─── 用药记录接口 ──────────────────────────────────────────────

@router.post(
    "/medication",
    response_model=ResponseDTO[MedicationResponseDTO],
    summary="新增用药记录"
)
def create_medication(
    data: MedicationCreateDTO,
    db: SessionDep,
) -> ResponseDTO[MedicationResponseDTO]:
    record = MedicalService.create_medication(db, data)
    return ResponseDTO(code=200, success=True, message="用药记录创建成功", data=record)


@router.get(
    "/medication",
    response_model=ResponseDTO[ListResponseData[MedicationResponseDTO]],
    summary="获取用药记录列表"
)
def get_medications(
    db: SessionDep,
    animal_id: Annotated[Optional[int], Query(description="羊只ID", gt=0)] = None,
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[MedicationResponseDTO]]:
    result = MedicalService.get_medications(db, animal_id, start_date, end_date, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.delete(
    "/medication/{record_id}",
    response_model=ResponseDTO[None],
    summary="删除用药记录"
)
def delete_medication(record_id: int, db: SessionDep) -> ResponseDTO[None]:
    MedicalService.delete_medication(db, record_id)
    return ResponseDTO(code=200, success=True, message="删除成功", data=None)


# ─── 驱虫记录接口 ──────────────────────────────────────────────

@router.post(
    "/deworming",
    response_model=ResponseDTO[DewormingResponseDTO],
    summary="新增驱虫记录"
)
def create_deworming(
    data: DewormingCreateDTO,
    db: SessionDep,
) -> ResponseDTO[DewormingResponseDTO]:
    record = MedicalService.create_deworming(db, data)
    return ResponseDTO(code=200, success=True, message="驱虫记录创建成功", data=record)


@router.get(
    "/deworming",
    response_model=ResponseDTO[ListResponseData[DewormingResponseDTO]],
    summary="获取驱虫记录列表"
)
def get_dewormings(
    db: SessionDep,
    animal_id: Annotated[Optional[int], Query(description="羊只ID", gt=0)] = None,
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
) -> ResponseDTO[ListResponseData[DewormingResponseDTO]]:
    result = MedicalService.get_dewormings(db, animal_id, start_date, end_date, page, page_size)
    return ResponseDTO(code=200, success=True, message="查询成功", data=result)


@router.delete(
    "/deworming/{record_id}",
    response_model=ResponseDTO[None],
    summary="删除驱虫记录"
)
def delete_deworming(record_id: int, db: SessionDep) -> ResponseDTO[None]:
    MedicalService.delete_deworming(db, record_id)
    return ResponseDTO(code=200, success=True, message="删除成功", data=None)


# ─── 到期提醒接口 ──────────────────────────────────────────────

@router.get(
    "/upcoming",
    response_model=ResponseDTO[List[UpcomingReminderDTO]],
    summary="获取即将到期的疫苗/驱虫提醒（未来N天）"
)
def get_upcoming_reminders(
    db: SessionDep,
    days: Annotated[int, Query(description="提前天数", ge=1, le=90)] = 7,
) -> ResponseDTO[List[UpcomingReminderDTO]]:
    reminders = MedicalService.get_upcoming_reminders(db, days)
    return ResponseDTO(code=200, success=True, message="查询成功", data=reminders)
