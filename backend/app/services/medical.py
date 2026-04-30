"""
疫病防治服务层
处理疫苗接种、用药、驱虫相关业务逻辑
"""
from datetime import date, timedelta
from typing import Optional, List

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.AnimalDO import AnimalDO
from app.models.MedicalDO import VaccinationRecordDO, MedicationRecordDO, DewormingRecordDO
from app.schemas.medicalDTO import (
    VaccinationCreateDTO,
    VaccinationResponseDTO,
    MedicationCreateDTO,
    MedicationResponseDTO,
    DewormingCreateDTO,
    DewormingResponseDTO,
    UpcomingReminderDTO,
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


class MedicalService:
    """疫病防治服务类"""

    # ─── 疫苗接种记录 ────────────────────────────────────────────

    @staticmethod
    def create_vaccination(db: Session, data: VaccinationCreateDTO) -> VaccinationResponseDTO:
        """新增疫苗接种记录"""
        _ensure_animal(db, data.animal_id)
        record = VaccinationRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return VaccinationResponseDTO.model_validate(record)

    @staticmethod
    def get_vaccinations(
        db: Session,
        animal_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[VaccinationResponseDTO]:
        """获取疫苗接种记录列表"""
        stmt = select(VaccinationRecordDO)
        if animal_id:
            stmt = stmt.where(VaccinationRecordDO.animal_id == animal_id)
        if start_date:
            stmt = stmt.where(VaccinationRecordDO.vaccination_date >= start_date)
        if end_date:
            stmt = stmt.where(VaccinationRecordDO.vaccination_date <= end_date)
        stmt = stmt.order_by(VaccinationRecordDO.vaccination_date.desc())

        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[VaccinationResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    @staticmethod
    def delete_vaccination(db: Session, record_id: int) -> None:
        """删除疫苗接种记录"""
        record = db.get(VaccinationRecordDO, record_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"接种记录 ID {record_id} 不存在")
        db.delete(record)
        db.commit()

    # ─── 用药记录 ────────────────────────────────────────────────

    @staticmethod
    def create_medication(db: Session, data: MedicationCreateDTO) -> MedicationResponseDTO:
        """新增用药记录"""
        _ensure_animal(db, data.animal_id)
        record = MedicationRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return MedicationResponseDTO.model_validate(record)

    @staticmethod
    def get_medications(
        db: Session,
        animal_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[MedicationResponseDTO]:
        """获取用药记录列表"""
        stmt = select(MedicationRecordDO)
        if animal_id:
            stmt = stmt.where(MedicationRecordDO.animal_id == animal_id)
        if start_date:
            stmt = stmt.where(MedicationRecordDO.treatment_start >= start_date)
        if end_date:
            stmt = stmt.where(MedicationRecordDO.treatment_start <= end_date)
        stmt = stmt.order_by(MedicationRecordDO.treatment_start.desc())

        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[MedicationResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    @staticmethod
    def delete_medication(db: Session, record_id: int) -> None:
        """删除用药记录"""
        record = db.get(MedicationRecordDO, record_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"用药记录 ID {record_id} 不存在")
        db.delete(record)
        db.commit()

    # ─── 驱虫记录 ────────────────────────────────────────────────

    @staticmethod
    def create_deworming(db: Session, data: DewormingCreateDTO) -> DewormingResponseDTO:
        """新增驱虫记录"""
        _ensure_animal(db, data.animal_id)
        record = DewormingRecordDO(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return DewormingResponseDTO.model_validate(record)

    @staticmethod
    def get_dewormings(
        db: Session,
        animal_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[DewormingResponseDTO]:
        """获取驱虫记录列表"""
        stmt = select(DewormingRecordDO)
        if animal_id:
            stmt = stmt.where(DewormingRecordDO.animal_id == animal_id)
        if start_date:
            stmt = stmt.where(DewormingRecordDO.deworming_date >= start_date)
        if end_date:
            stmt = stmt.where(DewormingRecordDO.deworming_date <= end_date)
        stmt = stmt.order_by(DewormingRecordDO.deworming_date.desc())

        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return ListResponseData(
            items=[DewormingResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )

    @staticmethod
    def delete_deworming(db: Session, record_id: int) -> None:
        """删除驱虫记录"""
        record = db.get(DewormingRecordDO, record_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"驱虫记录 ID {record_id} 不存在")
        db.delete(record)
        db.commit()

    # ─── 即将到期提醒 ────────────────────────────────────────────

    @staticmethod
    def get_upcoming_reminders(db: Session, days: int = 7) -> List[UpcomingReminderDTO]:
        """获取未来 N 天内即将到期的疫苗/驱虫提醒"""
        today = date.today()
        deadline = today + timedelta(days=days)
        reminders: List[UpcomingReminderDTO] = []

        # 疫苗到期提醒
        vax_records = db.exec(
            select(VaccinationRecordDO, AnimalDO)
            .join(AnimalDO, VaccinationRecordDO.animal_id == AnimalDO.id)
            .where(VaccinationRecordDO.next_due_date != None)
            .where(VaccinationRecordDO.next_due_date >= today)
            .where(VaccinationRecordDO.next_due_date <= deadline)
            .order_by(VaccinationRecordDO.next_due_date.asc())
        ).all()

        for vax, animal in vax_records:
            reminders.append(UpcomingReminderDTO(
                type="vaccination",
                animal_id=animal.id,
                animal_name=animal.name,
                item_name=vax.vaccine_name,
                due_date=vax.next_due_date,
                days_until_due=(vax.next_due_date - today).days,
            ))

        # 驱虫到期提醒
        dew_records = db.exec(
            select(DewormingRecordDO, AnimalDO)
            .join(AnimalDO, DewormingRecordDO.animal_id == AnimalDO.id)
            .where(DewormingRecordDO.next_due_date != None)
            .where(DewormingRecordDO.next_due_date >= today)
            .where(DewormingRecordDO.next_due_date <= deadline)
            .order_by(DewormingRecordDO.next_due_date.asc())
        ).all()

        for dew, animal in dew_records:
            reminders.append(UpcomingReminderDTO(
                type="deworming",
                animal_id=animal.id,
                animal_name=animal.name,
                item_name=dew.drug_name,
                due_date=dew.next_due_date,
                days_until_due=(dew.next_due_date - today).days,
            ))

        # 按到期日期排序
        reminders.sort(key=lambda r: r.due_date)
        return reminders
