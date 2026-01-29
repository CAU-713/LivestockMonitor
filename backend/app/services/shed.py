"""
羊舍服务层
处理羊舍相关的业务逻辑
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select, func, or_
from fastapi import HTTPException, status

from app.models.FacilityDO import ShedDO
from app.schemas.shedDTO import ShedCreateDTO, ShedUpdateDTO, ShedQueryDTO
from app.schemas.responseDTO import ListResponseData


class ShedService:
    """羊舍服务类"""

    @staticmethod
    def create_shed(db: Session, shed_data: ShedCreateDTO) -> ShedDO:
        """
        创建羊舍

        Args:
            db: 数据库会话
            shed_data: 羊舍创建数据

        Returns:
            创建的羊舍对象
        """
        # 检查名称是否已存在
        existing_shed = db.exec(
            select(ShedDO).where(ShedDO.name == shed_data.name)
        ).first()

        if existing_shed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"羊舍名称 '{shed_data.name}' 已存在"
            )

        # 创建羊舍对象
        shed = ShedDO(**shed_data.model_dump())
        shed.created_at = datetime.utcnow()
        shed.updated_at = datetime.utcnow()

        db.add(shed)
        db.commit()
        db.refresh(shed)

        return shed

    @staticmethod
    def get_shed_by_id(db: Session, shed_id: int) -> ShedDO:
        """
        根据ID获取羊舍

        Args:
            db: 数据库会话
            shed_id: 羊舍ID

        Returns:
            羊舍对象

        Raises:
            HTTPException: 羊舍不存在时抛出404错误
        """
        shed = db.get(ShedDO, shed_id)

        if not shed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"羊舍 ID {shed_id} 不存在"
            )

        return shed

    @staticmethod
    def get_sheds(db: Session, query_params: ShedQueryDTO) -> ListResponseData[ShedDO]:
        """
        获取羊舍列表（支持分页和筛选）

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            羊舍列表和分页信息
        """
        # 构建基础查询
        statement = select(ShedDO)

        # 添加筛选条件
        if query_params.status:
            statement = statement.where(ShedDO.status == query_params.status)

        if query_params.type:
            statement = statement.where(ShedDO.type == query_params.type)

        if query_params.search:
            search_pattern = f"%{query_params.search}%"
            statement = statement.where(
                or_(
                    ShedDO.name.like(search_pattern),
                    ShedDO.location.like(search_pattern)
                )
            )

        # 获取总数
        total_statement = select(func.count()).select_from(statement.subquery())
        total = db.exec(total_statement).one()

        # 添加分页
        offset = (query_params.page - 1) * query_params.page_size
        statement = statement.offset(offset).limit(query_params.page_size)

        # 执行查询
        sheds = db.exec(statement).all()

        return ListResponseData(
            items=list(sheds),
            total=total,
            page=query_params.page,
            page_size=query_params.page_size
        )

    @staticmethod
    def update_shed(db: Session, shed_id: int, shed_data: ShedUpdateDTO) -> ShedDO:
        """
        更新羊舍信息

        Args:
            db: 数据库会话
            shed_id: 羊舍ID
            shed_data: 更新数据

        Returns:
            更新后的羊舍对象
        """
        # 获取现有羊舍
        shed = ShedService.get_shed_by_id(db, shed_id)

        # 如果更新名称，检查新名称是否已存在
        if shed_data.name and shed_data.name != shed.name:
            existing_shed = db.exec(
                select(ShedDO).where(ShedDO.name == shed_data.name)
            ).first()

            if existing_shed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"羊舍名称 '{shed_data.name}' 已存在"
                )

        # 更新字段
        update_data = shed_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(shed, key, value)

        shed.updated_at = datetime.utcnow()

        db.add(shed)
        db.commit()
        db.refresh(shed)

        return shed

    @staticmethod
    def delete_shed(db: Session, shed_id: int) -> None:
        """
        删除羊舍

        Args:
            db: 数据库会话
            shed_id: 羊舍ID
        """
        shed = ShedService.get_shed_by_id(db, shed_id)

        # 这里可以添加级联检查，比如检查是否有传感器关联
        # 暂时简单删除

        db.delete(shed)
        db.commit()

    @staticmethod
    def update_livestock_count(db: Session, shed_id: int, count: int) -> ShedDO:
        """
        更新羊舍牲畜数量

        Args:
            db: 数据库会话
            shed_id: 羊舍ID
            count: 新的牲畜数量

        Returns:
            更新后的羊舍对象
        """
        shed = ShedService.get_shed_by_id(db, shed_id)

        if count < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="牲畜数量不能为负数"
            )

        if shed.capacity and count > shed.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"牲畜数量 {count} 超过羊舍容量 {shed.capacity}"
            )

        shed.livestock_count = count
        shed.updated_at = datetime.utcnow()

        db.add(shed)
        db.commit()
        db.refresh(shed)

        return shed