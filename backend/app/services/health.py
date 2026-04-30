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
    FeedIntakeRecordDO,
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
    FeedIntakeCreateDTO,
    FeedIntakeResponseDTO,
    FeedIntakeTrendPoint,
    FeedIntakeTrendResponseDTO,
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

    # ─── 采食量记录 ────────────────────────────────────────────

    @staticmethod
    def create_feed_intake(db: Session, data: FeedIntakeCreateDTO) -> FeedIntakeResponseDTO:
        """新增采食量记录（自动计算各项汇总数据）"""
        dump = data.model_dump()

        # 自动计算上午采食量
        if dump.get("morning_feeding_amount_kg") is not None and dump.get("morning_remaining_feed_kg") is not None:
            box = dump.get("morning_box_weight_kg") or 0
            dump["morning_feed_intake_kg"] = round(
                dump["morning_feeding_amount_kg"] - (dump["morning_remaining_feed_kg"] - box), 2
            )

        # 自动计算下午采食量
        if dump.get("afternoon_feeding_amount_kg") is not None and dump.get("afternoon_remaining_feed_kg") is not None:
            box = dump.get("afternoon_box_weight_kg") or 0
            dump["afternoon_feed_intake_kg"] = round(
                dump["afternoon_feeding_amount_kg"] - (dump["afternoon_remaining_feed_kg"] - box), 2
            )

        # 自动计算日总采食量
        morning = dump.get("morning_feed_intake_kg") or 0
        afternoon = dump.get("afternoon_feed_intake_kg") or 0
        if morning or afternoon:
            dump["daily_total_feed_intake_kg"] = round(morning + afternoon, 2)
            if dump.get("sheep_count") and dump["sheep_count"] > 0:
                dump["avg_individual_intake_kg"] = round(
                    dump["daily_total_feed_intake_kg"] / dump["sheep_count"], 3
                )

        record = FeedIntakeRecordDO(**dump)
        db.add(record)
        db.commit()
        db.refresh(record)
        return FeedIntakeResponseDTO.model_validate(record)

    @staticmethod
    def get_feed_intakes(
        db: Session,
        pen_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> "ListResponseData[FeedIntakeResponseDTO]":
        """获取采食量记录列表"""
        stmt = select(FeedIntakeRecordDO)
        if pen_id:
            stmt = stmt.where(FeedIntakeRecordDO.pen_id == pen_id)
        if start_date:
            stmt = stmt.where(FeedIntakeRecordDO.record_date >= start_date)
        if end_date:
            stmt = stmt.where(FeedIntakeRecordDO.record_date <= end_date)
        stmt = stmt.order_by(FeedIntakeRecordDO.record_date.desc())

        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[FeedIntakeResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    @staticmethod
    def get_feed_intake_trend(
        db: Session,
        pen_id: int,
        days: int = 30,
    ) -> FeedIntakeTrendResponseDTO:
        """获取采食量趋势（近N天）"""
        from datetime import timedelta
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        records = db.exec(
            select(FeedIntakeRecordDO)
            .where(FeedIntakeRecordDO.pen_id == pen_id)
            .where(FeedIntakeRecordDO.record_date >= start_date)
            .where(FeedIntakeRecordDO.record_date <= end_date)
            .order_by(FeedIntakeRecordDO.record_date.asc())
        ).all()

        data = [
            FeedIntakeTrendPoint(
                date=str(r.record_date),
                pen_id=r.pen_id,
                daily_total_feed_intake_kg=r.daily_total_feed_intake_kg or 0,
                avg_individual_intake_kg=r.avg_individual_intake_kg,
            )
            for r in records
        ]
        return FeedIntakeTrendResponseDTO(pen_id=pen_id, data=data)
