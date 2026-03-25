"""
警告规则路由
定义警告规则相关的 API 接口
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query, Body
from sqlmodel import Session

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO, ListResponseData
from app.schemas.ruleDTO import (
    AlertRuleCreateDTO,
    AlertRuleUpdateDTO,
    AlertRuleResponseDTO,
    AlertRuleListResponseDTO,
    AlertRuleDeleteResponseDTO,
    AlertRuleToggleResponseDTO,
    AlertRuleQueryDTO
)
from app.services.rule import AlertRuleService

router = APIRouter(prefix="/api/alert-rules", tags=["警告规则管理"])


@router.post(
    "",
    response_model=ResponseDTO[AlertRuleResponseDTO],
    summary="新建警告规则",
    description="创建一个新的警告规则"
)
def create_alert_rule(
        db: SessionDep,
        rule_data: AlertRuleCreateDTO,
) -> ResponseDTO[AlertRuleResponseDTO]:
    """新建警告规则"""
    rule = AlertRuleService.create_alert_rule(db, rule_data)

    response_data = AlertRuleResponseDTO(
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

    return ResponseDTO(
        code=200,
        success=True,
        message="规则创建成功",
        data=response_data
    )


@router.get(
    "",
    response_model=ResponseDTO[AlertRuleListResponseDTO],
    summary="获取规则列表",
    description="获取警告规则列表，支持筛选"
)
def get_alert_rules(
        db: SessionDep,
        rule_type: Annotated[Optional[str], Query(description="规则类型筛选")] = None,
        enabled: Annotated[Optional[bool], Query(description="启用状态筛选")] = None,
        sensor_id: Annotated[Optional[int], Query(description="传感器ID筛选", gt=0)] = None,
        search: Annotated[Optional[str], Query(description="搜索关键词")] = None,
) -> ResponseDTO[AlertRuleListResponseDTO]:
    """获取规则列表"""
    query_params = AlertRuleQueryDTO(
        rule_type=rule_type,
        enabled=enabled,
        sensor_id=sensor_id,
        search=search,
        page=1,
        page_size=1000  # 获取所有规则
    )

    result = AlertRuleService.get_alert_rules(db, query_params)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=result
    )


@router.get(
    "/list",
    response_model=ResponseDTO[ListResponseData[AlertRuleResponseDTO]],
    summary="获取规则列表（带分页）",
    description="获取警告规则列表，支持分页和筛选"
)
def get_alert_rules_with_pagination(
        db: SessionDep,
        rule_type: Annotated[Optional[str], Query(description="规则类型筛选")] = None,
        enabled: Annotated[Optional[bool], Query(description="启用状态筛选")] = None,
        sensor_id: Annotated[Optional[int], Query(description="传感器ID筛选", gt=0)] = None,
        search: Annotated[Optional[str], Query(description="搜索关键词")] = None,
        page: Annotated[int, Query(description="页码", ge=1)] = 1,
        page_size: Annotated[int, Query(description="每页数量", ge=1, le=10000)] = 10,
) -> ResponseDTO[ListResponseData[AlertRuleResponseDTO]]:
    """获取规则列表（带分页）"""
    query_params = AlertRuleQueryDTO(
        rule_type=rule_type,
        enabled=enabled,
        sensor_id=sensor_id,
        search=search,
        page=page,
        page_size=page_size
    )

    result = AlertRuleService.get_alert_rules_with_pagination(db, query_params)

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=result
    )


@router.get(
    "/{rule_id}",
    response_model=ResponseDTO[AlertRuleResponseDTO],
    summary="获取规则详情",
    description="根据ID获取警告规则详细信息"
)
def get_alert_rule(
        db: SessionDep,
        rule_id: int,
) -> ResponseDTO[AlertRuleResponseDTO]:
    """获取规则详情"""
    rule = AlertRuleService.get_alert_rule_by_id(db, rule_id)

    response_data = AlertRuleResponseDTO(
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

    return ResponseDTO(
        code=200,
        success=True,
        message="查询成功",
        data=response_data
    )


@router.put(
    "/{rule_id}",
    response_model=ResponseDTO[AlertRuleResponseDTO],
    summary="更新规则",
    description="更新警告规则信息"
)
def update_alert_rule(
        db: SessionDep,
        rule_id: int,
        rule_data: AlertRuleUpdateDTO,
) -> ResponseDTO[AlertRuleResponseDTO]:
    """更新规则"""
    rule = AlertRuleService.update_alert_rule(db, rule_id, rule_data)

    response_data = AlertRuleResponseDTO(
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

    return ResponseDTO(
        code=200,
        success=True,
        message="规则更新成功",
        data=response_data
    )


@router.delete(
    "/{rule_id}",
    response_model=ResponseDTO[AlertRuleDeleteResponseDTO],
    summary="删除规则",
    description="删除指定的警告规则"
)
def delete_alert_rule(
        db: SessionDep,
        rule_id: int,
) -> ResponseDTO[AlertRuleDeleteResponseDTO]:
    """删除规则"""
    result = AlertRuleService.delete_alert_rule(db, rule_id)

    return ResponseDTO(
        code=200,
        success=True,
        message="规则删除成功",
        data=result
    )


@router.patch(
    "/{rule_id}/toggle",
    response_model=ResponseDTO[AlertRuleToggleResponseDTO],
    summary="启用/禁用规则",
    description="启用或禁用警告规则"
)
def toggle_alert_rule(
        db: SessionDep,
        rule_id: int,
        enabled: Annotated[bool, Body(..., embed=True, description="是否启用")],
) -> ResponseDTO[AlertRuleToggleResponseDTO]:
    """启用/禁用规则"""
    result = AlertRuleService.toggle_alert_rule(db, rule_id, enabled)

    return ResponseDTO(
        code=200,
        success=True,
        message="规则状态更新成功",
        data=result
    )