"""
警告规则服务层
处理警告规则相关的业务逻辑
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select, func, or_
from fastapi import HTTPException, status

from app.models.RuleDO import AlertRuleDO
from app.models.DeviceDO import SensorDO
from app.schemas.ruleDTO import (
    AlertRuleCreateDTO,
    AlertRuleUpdateDTO,
    AlertRuleQueryDTO,
    AlertRuleResponseDTO,
    AlertRuleListResponseDTO,
    AlertRuleDeleteResponseDTO,
    AlertRuleToggleResponseDTO
)
from app.schemas.responseDTO import ListResponseData


class AlertRuleService:
    """警告规则服务类"""

    @staticmethod
    def create_alert_rule(db: Session, rule_data: AlertRuleCreateDTO) -> AlertRuleDO:
        """
        创建警告规则

        Args:
            db: 数据库会话
            rule_data: 规则创建数据

        Returns:
            创建的规则对象
        """
        # 如果指定了传感器ID，验证传感器是否存在
        if rule_data.sensor_id:
            sensor = db.get(SensorDO, rule_data.sensor_id)
            if not sensor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"传感器 ID {rule_data.sensor_id} 不存在"
                )

            # 如果传感器存在，使用传感器的真实名称
            sensor_name = sensor.name
        else:
            # 如果没有指定传感器ID，使用提供的传感器名称
            sensor_name = rule_data.sensor_name

        # 检查规则名称是否已存在
        existing_rule = db.exec(
            select(AlertRuleDO).where(AlertRuleDO.name == rule_data.name)
        ).first()

        if existing_rule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"规则名称 '{rule_data.name}' 已存在"
            )

        # 创建规则对象
        rule = AlertRuleDO(
            **rule_data.model_dump(exclude={"sensor_name"}),
            sensor_name=sensor_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(rule)
        db.commit()
        db.refresh(rule)

        return rule

    @staticmethod
    def get_alert_rule_by_id(db: Session, rule_id: int) -> AlertRuleDO:
        """
        根据ID获取警告规则

        Args:
            db: 数据库会话
            rule_id: 规则ID

        Returns:
            规则对象

        Raises:
            HTTPException: 规则不存在时抛出404错误
        """
        rule = db.get(AlertRuleDO, rule_id)

        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"规则 ID {rule_id} 不存在"
            )

        return rule

    @staticmethod
    def get_alert_rules(
            db: Session,
            query_params: Optional[AlertRuleQueryDTO] = None
    ) -> AlertRuleListResponseDTO:
        """
        获取警告规则列表

        Args:
            db: 数据库会话
            query_params: 查询参数（可选）

        Returns:
            规则列表
        """
        # 构建基础查询
        statement = select(AlertRuleDO)

        if query_params:
            # 添加筛选条件
            if query_params.rule_type:
                statement = statement.where(AlertRuleDO.rule_type == query_params.rule_type)

            if query_params.enabled is not None:
                statement = statement.where(AlertRuleDO.enabled == query_params.enabled)

            if query_params.sensor_id:
                statement = statement.where(AlertRuleDO.sensor_id == query_params.sensor_id)

            if query_params.search:
                search_pattern = f"%{query_params.search}%"
                statement = statement.where(AlertRuleDO.name.like(search_pattern))

        # 按创建时间倒序排列
        statement = statement.order_by(AlertRuleDO.created_at.desc())

        # 执行查询
        rules = db.exec(statement).all()

        # 转换为响应DTO
        rule_responses = [
            AlertRuleResponseDTO(
                id=str(rule.id),
                name=rule.name,
                sensor_name=rule.sensor_name,
                rule_type=rule.rule_type,
                condition=rule.condition,
                threshold=rule.threshold,
                notification_method=rule.notification_method,
                enabled=rule.enabled,
                description=rule.description
            )
            for rule in rules
        ]

        return AlertRuleListResponseDTO(rules=rule_responses)

    @staticmethod
    def get_alert_rules_with_pagination(
            db: Session,
            query_params: AlertRuleQueryDTO
    ) -> ListResponseData[AlertRuleResponseDTO]:
        """
        获取警告规则列表（带分页）

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            规则列表和分页信息
        """
        # 构建基础查询
        statement = select(AlertRuleDO)

        # 添加筛选条件
        if query_params.rule_type:
            statement = statement.where(AlertRuleDO.rule_type == query_params.rule_type)

        if query_params.enabled is not None:
            statement = statement.where(AlertRuleDO.enabled == query_params.enabled)

        if query_params.sensor_id:
            statement = statement.where(AlertRuleDO.sensor_id == query_params.sensor_id)

        if query_params.search:
            search_pattern = f"%{query_params.search}%"
            statement = statement.where(AlertRuleDO.name.like(search_pattern))

        # 获取总数
        total_statement = select(func.count()).select_from(statement.subquery())
        total = db.exec(total_statement).one()

        # 添加分页和排序
        statement = statement.order_by(AlertRuleDO.created_at.desc())
        offset = (query_params.page - 1) * query_params.page_size
        statement = statement.offset(offset).limit(query_params.page_size)

        # 执行查询
        rules = db.exec(statement).all()

        # 转换为响应DTO
        rule_responses = [
            AlertRuleResponseDTO(
                id=str(rule.id),
                name=rule.name,
                sensor_name=rule.sensor_name,
                rule_type=rule.rule_type,
                condition=rule.condition,
                threshold=rule.threshold,
                notification_method=rule.notification_method,
                enabled=rule.enabled,
                description=rule.description
            )
            for rule in rules
        ]

        return ListResponseData(
            items=rule_responses,
            total=total,
            page=query_params.page,
            page_size=query_params.page_size
        )

    @staticmethod
    def update_alert_rule(
            db: Session,
            rule_id: int,
            rule_data: AlertRuleUpdateDTO
    ) -> AlertRuleDO:
        """
        更新警告规则

        Args:
            db: 数据库会话
            rule_id: 规则ID
            rule_data: 更新数据

        Returns:
            更新后的规则对象
        """
        # 获取现有规则
        rule = AlertRuleService.get_alert_rule_by_id(db, rule_id)

        # 如果更新名称，检查新名称是否已存在
        if rule_data.name and rule_data.name != rule.name:
            existing_rule = db.exec(
                select(AlertRuleDO).where(AlertRuleDO.name == rule_data.name)
            ).first()

            if existing_rule:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"规则名称 '{rule_data.name}' 已存在"
                )

        # 如果更新传感器ID，验证传感器是否存在
        if rule_data.sensor_id:
            sensor = db.get(SensorDO, rule_data.sensor_id)
            if not sensor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"传感器 ID {rule_data.sensor_id} 不存在"
                )

        # 更新字段
        update_data = rule_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(rule, key, value)

        rule.updated_at = datetime.utcnow()

        db.add(rule)
        db.commit()
        db.refresh(rule)

        return rule

    @staticmethod
    def delete_alert_rule(db: Session, rule_id: int) -> AlertRuleDeleteResponseDTO:
        """
        删除警告规则

        Args:
            db: 数据库会话
            rule_id: 规则ID

        Returns:
            删除结果
        """
        rule = AlertRuleService.get_alert_rule_by_id(db, rule_id)

        db.delete(rule)
        db.commit()

        return AlertRuleDeleteResponseDTO(
            deleted=True,
            rule_id=str(rule_id)
        )

    @staticmethod
    def toggle_alert_rule(
            db: Session,
            rule_id: int,
            enabled: bool
    ) -> AlertRuleToggleResponseDTO:
        """
        启用/禁用警告规则

        Args:
            db: 数据库会话
            rule_id: 规则ID
            enabled: 是否启用

        Returns:
            更新结果
        """
        rule = AlertRuleService.get_alert_rule_by_id(db, rule_id)

        rule.enabled = enabled
        rule.updated_at = datetime.utcnow()

        db.add(rule)
        db.commit()

        return AlertRuleToggleResponseDTO(
            id=str(rule_id),
            enabled=enabled
        )