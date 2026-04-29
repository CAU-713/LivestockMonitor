"""
传感器服务层
处理传感器相关的业务逻辑
"""
from typing import List
from datetime import datetime
from sqlmodel import Session, select, func, or_
from fastapi import HTTPException, status

from app.models.DeviceDO import SensorDO, SensorTypeDO
from app.schemas.sensorDTO import SensorCreateDTO, SensorUpdateDTO, SensorQueryDTO
from app.schemas.responseDTO import ListResponseData


class SensorTypeService:
    """传感器类型服务类"""

    @staticmethod
    def get_all_sensor_types(db: Session) -> List[SensorTypeDO]:
        """
        获取所有传感器类型

        Args:
            db: 数据库会话

        Returns:
            传感器类型列表
        """
        statement = select(SensorTypeDO)
        sensor_types = db.exec(statement).all()
        return list(sensor_types)

    @staticmethod
    def get_sensor_type_by_id(db: Session, type_id: str) -> SensorTypeDO:
        """
        根据ID获取传感器类型

        Args:
            db: 数据库会话
            type_id: 传感器类型ID

        Returns:
            传感器类型对象

        Raises:
            HTTPException: 传感器类型不存在时抛出404错误
        """
        sensor_type = db.get(SensorTypeDO, type_id)

        if not sensor_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"传感器类型 '{type_id}' 不存在"
            )

        return sensor_type


class SensorService:
    """传感器服务类"""

    @staticmethod
    def create_sensor(db: Session, sensor_data: SensorCreateDTO) -> SensorDO:
        """
        创建传感器

        Args:
            db: 数据库会话
            sensor_data: 传感器创建数据

        Returns:
            创建的传感器对象
        """
        # 验证传感器类型是否存在
        SensorTypeService.get_sensor_type_by_id(db, sensor_data.type)

        # 验证羊舍是否存在
        from app.services.shed import ShedService
        ShedService.get_shed_by_id(db, sensor_data.shed_id)

        # 创建传感器对象
        sensor = SensorDO(**sensor_data.model_dump())

        db.add(sensor)
        db.commit()
        db.refresh(sensor)

        return sensor

    @staticmethod
    def get_sensor_by_id(db: Session, sensor_id: int) -> SensorDO:
        """
        根据ID获取传感器

        Args:
            db: 数据库会话
            sensor_id: 传感器ID

        Returns:
            传感器对象

        Raises:
            HTTPException: 传感器不存在时抛出404错误
        """
        sensor = db.get(SensorDO, sensor_id)

        if not sensor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"传感器 ID {sensor_id} 不存在"
            )

        return sensor

    @staticmethod
    def get_sensors(db: Session, query_params: SensorQueryDTO) -> ListResponseData[SensorDO]:
        """
        获取传感器列表（支持分页和筛选）

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            传感器列表和分页信息
        """
        # 构建基础查询
        statement = select(SensorDO)

        # 添加筛选条件
        if query_params.shed_id:
            statement = statement.where(SensorDO.shed_id == query_params.shed_id)

        if query_params.pen_id:
            statement = statement.where(SensorDO.pen_id == query_params.pen_id)

        if query_params.type:
            statement = statement.where(SensorDO.type == query_params.type)

        if query_params.status:
            statement = statement.where(SensorDO.status == query_params.status)

        if query_params.search:
            search_pattern = f"%{query_params.search}%"
            statement = statement.where(SensorDO.name.like(search_pattern))

        # 获取总数
        total_statement = select(func.count()).select_from(statement.subquery())
        total = db.exec(total_statement).one()

        # 添加分页
        offset = (query_params.page - 1) * query_params.page_size
        statement = statement.offset(offset).limit(query_params.page_size)

        # 执行查询
        sensors = db.exec(statement).all()

        return ListResponseData(
            items=list(sensors),
            total=total,
            page=query_params.page,
            page_size=query_params.page_size
        )

    @staticmethod
    def update_sensor(db: Session, sensor_id: int, sensor_data: SensorUpdateDTO) -> SensorDO:
        """
        更新传感器信息

        Args:
            db: 数据库会话
            sensor_id: 传感器ID
            sensor_data: 更新数据

        Returns:
            更新后的传感器对象
        """
        # 获取现有传感器
        sensor = SensorService.get_sensor_by_id(db, sensor_id)

        # 如果更新类型，验证新类型是否存在
        if sensor_data.type:
            SensorTypeService.get_sensor_type_by_id(db, sensor_data.type)

        # 如果更新羊舍，验证新羊舍是否存在
        if sensor_data.shed_id:
            from app.services.shed import ShedService
            ShedService.get_shed_by_id(db, sensor_data.shed_id)

        # 更新字段
        update_data = sensor_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(sensor, key, value)

        db.add(sensor)
        db.commit()
        db.refresh(sensor)

        return sensor

    @staticmethod
    def delete_sensor(db: Session, sensor_id: int) -> None:
        """
        删除传感器

        Args:
            db: 数据库会话
            sensor_id: 传感器ID
        """
        sensor = SensorService.get_sensor_by_id(db, sensor_id)

        db.delete(sensor)
        db.commit()

    @staticmethod
    def update_sensor_reading(db: Session, sensor_id: int, reading: float) -> SensorDO:
        """
        更新传感器读数

        Args:
            db: 数据库会话
            sensor_id: 传感器ID
            reading: 新的读数

        Returns:
            更新后的传感器对象
        """
        sensor = SensorService.get_sensor_by_id(db, sensor_id)

        sensor.last_reading = reading

        db.add(sensor)
        db.commit()
        db.refresh(sensor)

        return sensor

    @staticmethod
    def get_sensors_by_shed(db: Session, shed_id: int) -> List[SensorDO]:
        """
        获取指定羊舍的所有传感器

        Args:
            db: 数据库会话
            shed_id: 羊舍ID

        Returns:
            传感器列表
        """
        statement = select(SensorDO).where(SensorDO.shed_id == shed_id)
        sensors = db.exec(statement).all()
        return list(sensors)