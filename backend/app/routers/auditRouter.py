"""
操作日志路由
提供操作日志查询和统计接口（仅管理员可访问）
"""
from datetime import date, datetime, timedelta
from typing import Annotated, Optional, List

from fastapi import APIRouter, Query
from sqlmodel import select, func

from app.config import SessionDep
from app.models.AuditDO import OperationLogDO
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.auditDTO import OperationLogResponseDTO, AuditStatsDTO, AuditStatsItemDTO

router = APIRouter(prefix="/api/audit", tags=["操作日志"])


@router.get(
    "/logs",
    response_model=ResponseDTO[ListResponseData[OperationLogResponseDTO]],
    summary="查询操作日志列表"
)
def get_logs(
    db: SessionDep,
    operator: Annotated[Optional[str], Query(description="操作人员名称（模糊搜索）")] = None,
    action: Annotated[Optional[str], Query(description="操作类型: CREATE/UPDATE/DELETE/LOGIN/RESOLVE")] = None,
    resource_type: Annotated[Optional[str], Query(description="资源类型: animal/shed/sensor/alert/user/rule")] = None,
    start_date: Annotated[Optional[date], Query(description="开始日期")] = None,
    end_date: Annotated[Optional[date], Query(description="结束日期")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
) -> ResponseDTO[ListResponseData[OperationLogResponseDTO]]:
    stmt = select(OperationLogDO)
    if operator:
        stmt = stmt.where(OperationLogDO.operator_name.ilike(f"%{operator}%"))
    if action:
        stmt = stmt.where(OperationLogDO.action == action)
    if resource_type:
        stmt = stmt.where(OperationLogDO.resource_type == resource_type)
    if start_date:
        stmt = stmt.where(OperationLogDO.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        stmt = stmt.where(OperationLogDO.created_at <= datetime.combine(end_date, datetime.max.time()))
    stmt = stmt.order_by(OperationLogDO.created_at.desc())

    total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
    records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    return ResponseDTO(
        code=200, success=True, message="查询成功",
        data=ListResponseData(
            items=[OperationLogResponseDTO.model_validate(r) for r in records],
            total=total, page=page, page_size=page_size,
        )
    )


@router.get(
    "/stats",
    response_model=ResponseDTO[AuditStatsDTO],
    summary="获取操作日志统计（近7天）"
)
def get_stats(db: SessionDep) -> ResponseDTO[AuditStatsDTO]:
    since = datetime.utcnow() - timedelta(days=7)

    # 总数
    total = db.exec(
        select(func.count()).select_from(OperationLogDO)
        .where(OperationLogDO.created_at >= since)
    ).one()

    # 按操作类型统计
    action_rows = db.exec(
        select(OperationLogDO.action, func.count())
        .where(OperationLogDO.created_at >= since)
        .group_by(OperationLogDO.action)
    ).all()

    # 按资源类型统计
    res_rows = db.exec(
        select(OperationLogDO.resource_type, func.count())
        .where(OperationLogDO.created_at >= since)
        .group_by(OperationLogDO.resource_type)
    ).all()

    return ResponseDTO(
        code=200, success=True, message="查询成功",
        data=AuditStatsDTO(
            total_7days=total or 0,
            by_action=[AuditStatsItemDTO(action=a, count=c) for a, c in action_rows],
            by_resource_type=[AuditStatsItemDTO(action=r, count=c) for r, c in res_rows],
        )
    )
