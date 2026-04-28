"""
告警中心服务层
处理告警相关的业务逻辑
"""
from datetime import datetime
from typing import Optional, List

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.AlertDO import AlertDO
from app.models.FacilityDO import ShedDO
from app.schemas.alertDTO import (
    AlertCreateDTO,
    AlertResolveDTO,
    AlertQueryDTO,
    AlertResponseDTO,
    AlertStatsDTO,
)
from app.schemas.responseDTO import ListResponseData


def _to_response_dto(alert: AlertDO, shed_name: Optional[str] = None) -> AlertResponseDTO:
    """将 AlertDO 转换为 AlertResponseDTO"""
    return AlertResponseDTO(
        id=alert.id,
        shed_id=alert.shed_id,
        shed_name=shed_name,
        pen_id=alert.pen_id,
        severity=alert.severity,
        description=alert.description,
        alert_time=alert.alert_time,
        resolved=alert.resolved,
        resolved_by=alert.resolved_by,
        resolve_time=alert.resolve_time,
    )


class AlertService:
    """告警服务类"""

    @staticmethod
    def create_alert(db: Session, alert_data: AlertCreateDTO) -> AlertResponseDTO:
        """
        手动创建告警

        Args:
            db: 数据库会话
            alert_data: 告警创建数据

        Returns:
            创建的告警响应DTO
        """
        # 验证羊舍是否存在
        shed = db.get(ShedDO, alert_data.shed_id)
        if not shed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"羊舍 ID {alert_data.shed_id} 不存在"
            )

        alert = AlertDO(
            shed_id=alert_data.shed_id,
            pen_id=alert_data.pen_id,
            severity=alert_data.severity,
            description=alert_data.description,
            alert_time=datetime.utcnow(),
            resolved=False,
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        return _to_response_dto(alert, shed_name=shed.name)

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: int) -> AlertResponseDTO:
        """
        获取告警详情

        Args:
            db: 数据库会话
            alert_id: 告警ID

        Returns:
            告警响应DTO
        """
        alert = db.get(AlertDO, alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"告警 ID {alert_id} 不存在"
            )

        shed = db.get(ShedDO, alert.shed_id)
        shed_name = shed.name if shed else None

        return _to_response_dto(alert, shed_name=shed_name)

    @staticmethod
    def get_alerts(
        db: Session,
        query_params: AlertQueryDTO,
    ) -> ListResponseData[AlertResponseDTO]:
        """
        获取告警列表（支持分页和筛选）

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            分页告警列表
        """
        stmt = select(AlertDO)

        # 筛选条件
        if query_params.shed_id is not None:
            stmt = stmt.where(AlertDO.shed_id == query_params.shed_id)
        if query_params.severity is not None:
            stmt = stmt.where(AlertDO.severity == query_params.severity)
        if query_params.resolved is not None:
            stmt = stmt.where(AlertDO.resolved == query_params.resolved)
        if query_params.start_time is not None:
            stmt = stmt.where(AlertDO.alert_time >= query_params.start_time)
        if query_params.end_time is not None:
            stmt = stmt.where(AlertDO.alert_time <= query_params.end_time)

        # 按时间降序
        stmt = stmt.order_by(AlertDO.alert_time.desc())

        # 查询总数
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.exec(count_stmt).one()

        # 分页
        offset = (query_params.page - 1) * query_params.page_size
        stmt = stmt.offset(offset).limit(query_params.page_size)

        alerts = db.exec(stmt).all()

        # 批量获取羊舍名称
        shed_ids = list({a.shed_id for a in alerts})
        sheds = {s.id: s.name for s in db.exec(select(ShedDO).where(ShedDO.id.in_(shed_ids))).all()}

        items = [_to_response_dto(a, shed_name=sheds.get(a.shed_id)) for a in alerts]

        return ListResponseData(
            items=items,
            total=total,
            page=query_params.page,
            page_size=query_params.page_size,
        )

    @staticmethod
    def resolve_alert(db: Session, alert_id: int, resolve_data: AlertResolveDTO) -> AlertResponseDTO:
        """
        标记告警为已解决

        Args:
            db: 数据库会话
            alert_id: 告警ID
            resolve_data: 解决信息

        Returns:
            更新后的告警响应DTO
        """
        alert = db.get(AlertDO, alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"告警 ID {alert_id} 不存在"
            )

        if alert.resolved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该告警已经被解决"
            )

        alert.resolved = True
        alert.resolved_by = resolve_data.resolved_by
        alert.resolve_time = datetime.utcnow()

        db.add(alert)
        db.commit()
        db.refresh(alert)

        shed = db.get(ShedDO, alert.shed_id)
        shed_name = shed.name if shed else None

        return _to_response_dto(alert, shed_name=shed_name)

    @staticmethod
    def delete_alert(db: Session, alert_id: int) -> None:
        """
        删除告警记录

        Args:
            db: 数据库会话
            alert_id: 告警ID
        """
        alert = db.get(AlertDO, alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"告警 ID {alert_id} 不存在"
            )

        db.delete(alert)
        db.commit()

    @staticmethod
    def get_alert_stats(db: Session) -> AlertStatsDTO:
        """
        获取告警统计数据

        Args:
            db: 数据库会话

        Returns:
            告警统计DTO
        """
        # 总数
        total = db.exec(select(func.count()).select_from(AlertDO)).one()

        # 未解决总数
        unresolved = db.exec(
            select(func.count()).select_from(AlertDO).where(AlertDO.resolved == False)
        ).one()

        # 各严重程度数量
        def count_by_severity(severity: str) -> int:
            return db.exec(
                select(func.count()).select_from(AlertDO).where(AlertDO.severity == severity)
            ).one()

        def count_unresolved_by_severity(severity: str) -> int:
            return db.exec(
                select(func.count()).select_from(AlertDO).where(
                    AlertDO.severity == severity,
                    AlertDO.resolved == False
                )
            ).one()

        return AlertStatsDTO(
            total=total,
            unresolved=unresolved,
            high=count_by_severity("high"),
            medium=count_by_severity("medium"),
            low=count_by_severity("low"),
            high_unresolved=count_unresolved_by_severity("high"),
            medium_unresolved=count_unresolved_by_severity("medium"),
            low_unresolved=count_unresolved_by_severity("low"),
        )
