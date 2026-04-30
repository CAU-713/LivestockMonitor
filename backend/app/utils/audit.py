"""
操作日志工具函数
提供轻量级的审计日志记录功能，在关键写操作路由中调用
"""
import json
from datetime import datetime
from typing import Optional

from sqlmodel import Session

from app.models.AuditDO import OperationLogDO


def log_operation(
    db: Session,
    operator_name: str,
    operator_role: int,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    resource_name: Optional[str] = None,
    detail: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> None:
    """
    记录一条操作日志

    Args:
        db: 数据库会话
        operator_name: 操作人员名称（从 token 解析）
        operator_role: 操作人员角色（0=admin, 1=user, 2=research）
        action: 操作类型，如 CREATE/UPDATE/DELETE/LOGIN/RESOLVE
        resource_type: 资源类型，如 animal/shed/sensor/alert/user/rule
        resource_id: 被操作资源的 ID（可选）
        resource_name: 被操作资源的名称描述（可选）
        detail: 操作详情字典，将被序列化为 JSON（可选）
        ip_address: 客户端 IP（可选）
    """
    try:
        log = OperationLogDO(
            operator_name=operator_name,
            operator_role=operator_role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            detail=json.dumps(detail, ensure_ascii=False, default=str) if detail else None,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
    except Exception:
        # 审计日志记录失败不应影响主业务逻辑
        db.rollback()


def get_operator_from_header(authorization: Optional[str]) -> tuple[str, int]:
    """
    从 Authorization 请求头解析操作人员信息
    当前实现：token 直接为 "用户名:角色" 格式或仅用户名（兼容现有登录实现）

    Returns:
        (operator_name, operator_role)
    """
    if not authorization:
        return "anonymous", 1

    # 移除 Bearer 前缀
    token = authorization.replace("Bearer ", "").strip()

    # 尝试解析 "name:role" 格式（新格式）
    if ":" in token:
        parts = token.split(":", 1)
        try:
            return parts[0], int(parts[1])
        except (ValueError, IndexError):
            pass

    # 降级：仅有用户名，角色默认为普通用户
    return token if token else "anonymous", 1
