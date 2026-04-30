"""
生产管理服务层
处理出栏、死亡记录相关业务逻辑
"""
from datetime import date
from typing import Optional
from calendar import monthrange

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.AnimalDO import AnimalDO
from app.models.ProductionDO import SlaughterRecordDO, MortalityRecordDO
from app.schemas.productionDTO import (
    SlaughterCreateDTO,
    SlaughterResponseDTO,
    MortalityCreateDTO,
    MortalityResponseDTO,
    ProductionStatsDTO,
)
from app.schemas.responseDTO import ListResponseData


def _ensure_active_animal(db: Session, animal_id: int) -> AnimalDO:
    """验证动物存在且尚未出栏/死亡"""
    animal = db.get(AnimalDO, animal_id)
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"动物 ID {animal_id} 不存在"
        )
    if animal.health_status == "removal":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"动物 {animal.name} 已处于出栏/死亡状态，无法重复记录"
        )
    return animal


class ProductionService:
    """生产管理服务类"""

    # ─── 出栏记录 ──────────────────────────────────────────────

    @staticmethod
    def create_slaughter(db: Session, data: SlaughterCreateDTO) -> SlaughterResponseDTO:
        """新增出栏记录，并将动物状态更新为 removal"""
        animal = _ensure_active_animal(db, data.animal_id)

        # 自动计算总价
        dump = data.model_dump()
        if dump.get("slaughter_weight_kg") and dump.get("price_per_kg") and not dump.get("total_price"):
            dump["total_price"] = round(dump["slaughter_weight_kg"] * dump["price_per_kg"], 2)

        record = SlaughterRecordDO(**dump)
        db.add(record)

        # 更新动物健康状态为 removal
        animal.health_status = "removal"
        db.add(animal)

        db.commit()
        db.refresh(record)

        result = SlaughterResponseDTO.model_validate(record)
        result.animal_name = animal.name
        return result

    @staticmethod
    def get_slaughters(
        db: Session,
        shed_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[SlaughterResponseDTO]:
        """获取出栏记录列表"""
        stmt = select(SlaughterRecordDO, AnimalDO).join(
            AnimalDO, SlaughterRecordDO.animal_id == AnimalDO.id
        )
        if shed_id:
            stmt = stmt.where(AnimalDO.shed_id == shed_id)
        if start_date:
            stmt = stmt.where(SlaughterRecordDO.slaughter_date >= start_date)
        if end_date:
            stmt = stmt.where(SlaughterRecordDO.slaughter_date <= end_date)
        stmt = stmt.order_by(SlaughterRecordDO.slaughter_date.desc())

        count_stmt = select(func.count()).select_from(
            select(SlaughterRecordDO, AnimalDO).join(
                AnimalDO, SlaughterRecordDO.animal_id == AnimalDO.id
            ).subquery()
        )
        if shed_id:
            count_stmt = select(func.count()).select_from(
                select(SlaughterRecordDO).join(
                    AnimalDO, SlaughterRecordDO.animal_id == AnimalDO.id
                ).where(AnimalDO.shed_id == shed_id).subquery()
            )

        # 简化查询
        all_stmt = select(SlaughterRecordDO, AnimalDO).join(
            AnimalDO, SlaughterRecordDO.animal_id == AnimalDO.id
        )
        if shed_id:
            all_stmt = all_stmt.where(AnimalDO.shed_id == shed_id)
        if start_date:
            all_stmt = all_stmt.where(SlaughterRecordDO.slaughter_date >= start_date)
        if end_date:
            all_stmt = all_stmt.where(SlaughterRecordDO.slaughter_date <= end_date)

        total_rows = db.exec(all_stmt).all()
        total = len(total_rows)

        paged_rows = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()

        items = []
        for slaughter, animal in paged_rows:
            dto = SlaughterResponseDTO.model_validate(slaughter)
            dto.animal_name = animal.name
            items.append(dto)

        return ListResponseData(items=items, total=total, page=page, page_size=page_size)

    # ─── 死亡记录 ──────────────────────────────────────────────

    @staticmethod
    def create_mortality(db: Session, data: MortalityCreateDTO) -> MortalityResponseDTO:
        """新增死亡记录，并将动物状态更新为 removal"""
        animal = _ensure_active_animal(db, data.animal_id)

        record = MortalityRecordDO(**data.model_dump())
        db.add(record)

        # 更新动物健康状态为 removal
        animal.health_status = "removal"
        db.add(animal)

        db.commit()
        db.refresh(record)

        result = MortalityResponseDTO.model_validate(record)
        result.animal_name = animal.name
        return result

    @staticmethod
    def get_mortalities(
        db: Session,
        shed_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[MortalityResponseDTO]:
        """获取死亡记录列表"""
        stmt = select(MortalityRecordDO, AnimalDO).join(
            AnimalDO, MortalityRecordDO.animal_id == AnimalDO.id
        )
        if shed_id:
            stmt = stmt.where(AnimalDO.shed_id == shed_id)
        if start_date:
            stmt = stmt.where(MortalityRecordDO.death_date >= start_date)
        if end_date:
            stmt = stmt.where(MortalityRecordDO.death_date <= end_date)
        stmt = stmt.order_by(MortalityRecordDO.death_date.desc())

        all_stmt = select(MortalityRecordDO, AnimalDO).join(
            AnimalDO, MortalityRecordDO.animal_id == AnimalDO.id
        )
        if shed_id:
            all_stmt = all_stmt.where(AnimalDO.shed_id == shed_id)
        if start_date:
            all_stmt = all_stmt.where(MortalityRecordDO.death_date >= start_date)
        if end_date:
            all_stmt = all_stmt.where(MortalityRecordDO.death_date <= end_date)

        total_rows = db.exec(all_stmt).all()
        total = len(total_rows)

        paged_rows = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()

        items = []
        for mortality, animal in paged_rows:
            dto = MortalityResponseDTO.model_validate(mortality)
            dto.animal_name = animal.name
            items.append(dto)

        return ListResponseData(items=items, total=total, page=page, page_size=page_size)

    # ─── 统计数据 ──────────────────────────────────────────────

    @staticmethod
    def get_stats(db: Session) -> ProductionStatsDTO:
        """获取出栏/死亡统计数据"""
        today = date.today()
        first_day = date(today.year, today.month, 1)

        # 本月出栏数
        month_slaughter = db.exec(
            select(func.count()).select_from(SlaughterRecordDO)
            .where(SlaughterRecordDO.slaughter_date >= first_day)
        ).one()

        # 本月死亡数
        month_mortality = db.exec(
            select(func.count()).select_from(MortalityRecordDO)
            .where(MortalityRecordDO.death_date >= first_day)
        ).one()

        # 本月出栏总收入
        revenue_result = db.exec(
            select(func.sum(SlaughterRecordDO.total_price))
            .where(SlaughterRecordDO.slaughter_date >= first_day)
        ).one()
        month_revenue = float(revenue_result or 0)

        # 累计
        total_slaughter = db.exec(select(func.count()).select_from(SlaughterRecordDO)).one()
        total_mortality = db.exec(select(func.count()).select_from(MortalityRecordDO)).one()

        # 本月死亡率 = 本月死亡数 / (本月出栏+死亡) * 100
        total_month = (month_slaughter or 0) + (month_mortality or 0)
        mortality_rate = round((month_mortality / total_month * 100) if total_month > 0 else 0, 2)

        return ProductionStatsDTO(
            month_slaughter_count=month_slaughter or 0,
            month_mortality_count=month_mortality or 0,
            month_total_revenue=month_revenue,
            mortality_rate=mortality_rate,
            total_slaughter_count=total_slaughter or 0,
            total_mortality_count=total_mortality or 0,
        )
