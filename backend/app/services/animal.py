"""
动物档案服务层
处理动物档案相关的业务逻辑
"""
from datetime import date
from typing import Optional, List

from fastapi import HTTPException, status
from sqlmodel import Session, select, func, or_

from app.models.AnimalDO import AnimalDO
from app.models.FacilityDO import ShedDO
from app.schemas.animalDTO import (
    AnimalCreateDTO,
    AnimalUpdateDTO,
    AnimalHealthUpdateDTO,
    AnimalBreedingUpdateDTO,
    AnimalQueryDTO,
    AnimalResponseDTO,
    AnimalStatsDTO,
)
from app.schemas.responseDTO import ListResponseData


def _to_response_dto(animal: AnimalDO, shed_name: Optional[str] = None) -> AnimalResponseDTO:
    """将 AnimalDO 转换为 AnimalResponseDTO"""
    return AnimalResponseDTO(
        id=animal.id,
        name=animal.name,
        breed=animal.breed,
        age=animal.age,
        gender=animal.gender,
        health_status=animal.health_status,
        shed_id=animal.shed_id,
        shed_name=shed_name,
        current_pen_id=animal.current_pen_id,
        entry_date=animal.entry_date,
        birth_date=animal.birth_date,
        description=animal.description,
        dam_id=animal.dam_id,
        sire_id=animal.sire_id,
        production_type=animal.production_type,
        breeding_status=animal.breeding_status,
        delivery_date=animal.delivery_date,
        mating_date=animal.mating_date,
    )


class AnimalService:
    """动物档案服务类"""

    @staticmethod
    def create_animal(db: Session, data: AnimalCreateDTO) -> AnimalResponseDTO:
        """创建动物档案"""
        # 验证羊舍是否存在
        shed = db.get(ShedDO, data.shed_id)
        if not shed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"羊舍 ID {data.shed_id} 不存在"
            )

        # 编号唯一性检查
        existing = db.exec(select(AnimalDO).where(AnimalDO.name == data.name)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"编号 '{data.name}' 已存在"
            )

        animal = AnimalDO(**data.model_dump())
        db.add(animal)
        db.commit()
        db.refresh(animal)

        return _to_response_dto(animal, shed_name=shed.name)

    @staticmethod
    def get_animal_by_id(db: Session, animal_id: int) -> AnimalResponseDTO:
        """获取动物详情"""
        animal = db.get(AnimalDO, animal_id)
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"动物 ID {animal_id} 不存在"
            )
        shed = db.get(ShedDO, animal.shed_id)
        return _to_response_dto(animal, shed_name=shed.name if shed else None)

    @staticmethod
    def get_animals(
        db: Session,
        query_params: AnimalQueryDTO,
    ) -> ListResponseData[AnimalResponseDTO]:
        """获取动物列表（分页 + 筛选）"""
        stmt = select(AnimalDO)

        if query_params.shed_id is not None:
            stmt = stmt.where(AnimalDO.shed_id == query_params.shed_id)
        if query_params.health_status:
            stmt = stmt.where(AnimalDO.health_status == query_params.health_status)
        if query_params.gender:
            stmt = stmt.where(AnimalDO.gender == query_params.gender)
        if query_params.breed:
            stmt = stmt.where(AnimalDO.breed == query_params.breed)
        if query_params.production_type:
            stmt = stmt.where(AnimalDO.production_type == query_params.production_type)
        if query_params.breeding_status:
            stmt = stmt.where(AnimalDO.breeding_status == query_params.breeding_status)
        if query_params.search:
            kw = f"%{query_params.search}%"
            stmt = stmt.where(or_(AnimalDO.name.ilike(kw), AnimalDO.breed.ilike(kw)))

        stmt = stmt.order_by(AnimalDO.id.desc())

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.exec(count_stmt).one()

        offset = (query_params.page - 1) * query_params.page_size
        stmt = stmt.offset(offset).limit(query_params.page_size)
        animals = db.exec(stmt).all()

        shed_ids = list({a.shed_id for a in animals})
        sheds = {s.id: s.name for s in db.exec(select(ShedDO).where(ShedDO.id.in_(shed_ids))).all()}

        items = [_to_response_dto(a, shed_name=sheds.get(a.shed_id)) for a in animals]

        return ListResponseData(
            items=items,
            total=total,
            page=query_params.page,
            page_size=query_params.page_size,
        )

    @staticmethod
    def get_breeding_animals(
        db: Session,
        page: int = 1,
        page_size: int = 500,
    ) -> ListResponseData[AnimalResponseDTO]:
        """获取繁殖中的动物列表（breeding_status != null）"""
        stmt = (
            select(AnimalDO)
            .where(AnimalDO.breeding_status.isnot(None))
            .order_by(AnimalDO.id.desc())
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.exec(count_stmt).one()

        offset = (page - 1) * page_size
        animals = db.exec(stmt.offset(offset).limit(page_size)).all()

        shed_ids = list({a.shed_id for a in animals})
        sheds = {s.id: s.name for s in db.exec(select(ShedDO).where(ShedDO.id.in_(shed_ids))).all()}

        items = [_to_response_dto(a, shed_name=sheds.get(a.shed_id)) for a in animals]

        return ListResponseData(items=items, total=total, page=page, page_size=page_size)

    @staticmethod
    def update_animal(db: Session, animal_id: int, data: AnimalUpdateDTO) -> AnimalResponseDTO:
        """更新动物档案"""
        animal = db.get(AnimalDO, animal_id)
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"动物 ID {animal_id} 不存在"
            )

        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(animal, key, value)

        db.add(animal)
        db.commit()
        db.refresh(animal)

        shed = db.get(ShedDO, animal.shed_id)
        return _to_response_dto(animal, shed_name=shed.name if shed else None)

    @staticmethod
    def update_health_status(db: Session, animal_id: int, data: AnimalHealthUpdateDTO) -> AnimalResponseDTO:
        """更新动物健康状态"""
        animal = db.get(AnimalDO, animal_id)
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"动物 ID {animal_id} 不存在"
            )

        animal.health_status = data.health_status
        db.add(animal)
        db.commit()
        db.refresh(animal)

        shed = db.get(ShedDO, animal.shed_id)
        return _to_response_dto(animal, shed_name=shed.name if shed else None)

    @staticmethod
    def update_breeding_status(db: Session, animal_id: int, data: AnimalBreedingUpdateDTO) -> AnimalResponseDTO:
        """更新繁殖状态"""
        animal = db.get(AnimalDO, animal_id)
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"动物 ID {animal_id} 不存在"
            )

        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(animal, key, value)

        db.add(animal)
        db.commit()
        db.refresh(animal)

        shed = db.get(ShedDO, animal.shed_id)
        return _to_response_dto(animal, shed_name=shed.name if shed else None)

    @staticmethod
    def get_offspring(db: Session, animal_id: int) -> List[AnimalResponseDTO]:
        """获取动物的后代列表（通过 dam_id 关联）"""
        offspring = db.exec(select(AnimalDO).where(AnimalDO.dam_id == animal_id)).all()

        shed_ids = list({a.shed_id for a in offspring})
        sheds = {s.id: s.name for s in db.exec(select(ShedDO).where(ShedDO.id.in_(shed_ids))).all()} if shed_ids else {}

        return [_to_response_dto(a, shed_name=sheds.get(a.shed_id)) for a in offspring]

    @staticmethod
    def delete_animal(db: Session, animal_id: int) -> None:
        """删除动物档案"""
        animal = db.get(AnimalDO, animal_id)
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"动物 ID {animal_id} 不存在"
            )
        db.delete(animal)
        db.commit()

    @staticmethod
    def get_stats(db: Session) -> AnimalStatsDTO:
        """获取动物统计数据"""
        def count_by(field, value) -> int:
            return db.exec(
                select(func.count()).select_from(AnimalDO).where(field == value)
            ).one()

        total = db.exec(select(func.count()).select_from(AnimalDO)).one()

        return AnimalStatsDTO(
            total=total,
            good=count_by(AnimalDO.health_status, "good"),
            ill=count_by(AnimalDO.health_status, "ill"),
            under_treatment=count_by(AnimalDO.health_status, "under_treatment"),
            removal=count_by(AnimalDO.health_status, "removal"),
            breeding_count=count_by(AnimalDO.production_type, "breeding"),
            fattening_count=count_by(AnimalDO.production_type, "fattening"),
        )
