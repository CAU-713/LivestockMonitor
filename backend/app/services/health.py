"""
健康数据服务层
处理动物健康数据相关业务逻辑
"""
from datetime import date, time
from typing import Optional, List

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.AnimalDO import AnimalDO
from app.models.HealthDataDO import (
    WeightRecordDO,
    BodyTemperatureRecordDO,
    RespirationRecordDO,
    SerumRecordDO,
)
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
    WeightTrendPoint,
)
from app.schemas.responseDTO import ListResponseData


def _ensure_animal(db: Session, animal_id: int) -> AnimalDO:
    """验证动物是否存在"""
    animal = db.get(AnimalDO, animal_id)
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"动物 ID {animal_id} 不存在"
        )
    return animal


class HealthService:
    """健康数据服务类"""

    # ─── 体重记录 ────────────────────────────────────────────

    @staticmethod
    def create_weight_record(db: Session, data: WeightRecordCreateDTO) -> WeightRecordResponseDTO:
        """新增体重记录"""
        _ensure_animal(db, data.animal_id)
        record = WeightRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return WeightRecordResponseDTO.model_validate(record)

    @staticmethod
    def get_weight_records(
        db: Session,
        animal_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[WeightRecordResponseDTO]:
        """获取体重记录列表"""
        stmt = select(WeightRecordDO).where(WeightRecordDO.animal_id == animal_id)
        if start_date:
            stmt = stmt.where(WeightRecordDO.record_date >= start_date)
        if end_date:
            stmt = stmt.where(WeightRecordDO.record_date <= end_date)
        stmt = stmt.order_by(WeightRecordDO.record_date.desc())

        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()

        return ListResponseData(
            items=[WeightRecordResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    @staticmethod
    def get_weight_trend(db: Session, animal_id: int) -> WeightTrendResponseDTO:
        """获取体重趋势数据（用于折线图）"""
        _ensure_animal(db, animal_id)
        records = db.exec(
            select(WeightRecordDO)
            .where(WeightRecordDO.animal_id == animal_id)
            .order_by(WeightRecordDO.record_date.asc())
        ).all()
        data = [WeightTrendPoint(date=str(r.record_date), weight_kg=r.weight_kg) for r in records]
        return WeightTrendResponseDTO(animal_id=animal_id, data=data)

    # ─── 体温记录 ────────────────────────────────────────────

    @staticmethod
    def create_temperature_record(db: Session, data: BodyTemperatureCreateDTO) -> BodyTemperatureResponseDTO:
        """新增体温记录"""
        _ensure_animal(db, data.animal_id)
        record = BodyTemperatureRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return BodyTemperatureResponseDTO.model_validate(record)

    @staticmethod
    def get_temperature_records(
        db: Session,
        animal_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[BodyTemperatureResponseDTO]:
        """获取体温记录列表"""
        stmt = (
            select(BodyTemperatureRecordDO)
            .where(BodyTemperatureRecordDO.animal_id == animal_id)
            .order_by(BodyTemperatureRecordDO.record_date.desc())
        )
        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[BodyTemperatureResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    # ─── 呼吸记录 ────────────────────────────────────────────

    @staticmethod
    def create_respiration_record(db: Session, data: RespirationRecordCreateDTO) -> RespirationRecordResponseDTO:
        """新增呼吸记录"""
        _ensure_animal(db, data.animal_id)
        record = RespirationRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return RespirationRecordResponseDTO.model_validate(record)

    @staticmethod
    def get_respiration_records(
        db: Session,
        animal_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[RespirationRecordResponseDTO]:
        """获取呼吸记录列表"""
        stmt = (
            select(RespirationRecordDO)
            .where(RespirationRecordDO.animal_id == animal_id)
            .order_by(RespirationRecordDO.record_date.desc())
        )
        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[RespirationRecordResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    # ─── 血清记录 ────────────────────────────────────────────

    @staticmethod
    def create_serum_record(db: Session, data: SerumRecordCreateDTO) -> SerumRecordResponseDTO:
        """新增血清记录"""
        _ensure_animal(db, data.animal_id)
        record = SerumRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return SerumRecordResponseDTO.model_validate(record)

    @staticmethod
    def get_serum_records(
        db: Session,
        animal_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[SerumRecordResponseDTO]:
        """获取血清记录列表"""
        stmt = (
            select(SerumRecordDO)
            .where(SerumRecordDO.animal_id == animal_id)
            .order_by(SerumRecordDO.record_date.desc())
        )
        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[SerumRecordResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )
