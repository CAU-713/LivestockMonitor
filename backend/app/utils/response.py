"""
统一响应工具函数
提供便捷的响应生成方法
"""

from typing import Optional, Any, List
from app.schemas.responseDTO import ResponseDTO, ListResponseData


def success(
        data: Any = None,
        message: str = "操作成功",
        code: int = 200
) -> dict:
    """
    成功响应

    Args:
        data: 响应数据
        message: 提示信息
        code: 业务状态码 (默认 200)

    Returns:
        统一格式的成功响应字典

    Examples:
        >>> success(data={"id": 1, "name": "测试"})
        >>> success(message="创建成功", code=201)
    """
    response = ResponseDTO(
        code=code,
        success=True,
        message=message,
        data=data
    )
    return response.model_dump()


def error(
        message: str = "操作失败",
        code: int = 400,
        data: Any = None
) -> dict:
    """
    失败响应

    Args:
        message: 错误信息
        code: 错误状态码 (默认 400)
        data: 额外数据 (可选)

    Returns:
        统一格式的错误响应字典

    Examples:
        >>> error(message="参数错误")
        >>> error(message="资源不存在", code=404)
    """
    response = ResponseDTO(
        code=code,
        success=False,
        message=message,
        data=data
    )
    return response.model_dump()


def created(
        data: Any = None,
        message: str = "创建成功"
) -> dict:
    """
    创建成功响应 (201)

    Args:
        data: 创建的资源数据
        message: 提示信息

    Returns:
        201 状态码的成功响应
    """
    return success(data=data, message=message, code=201)


def not_found(
        message: str = "资源不存在",
        data: Any = None
) -> dict:
    """
    资源不存在响应 (404)

    Args:
        message: 错误信息
        data: 额外数据

    Returns:
        404 状态码的错误响应
    """
    return error(message=message, code=404, data=data)


def bad_request(
        message: str = "请求参数错误",
        data: Any = None
) -> dict:
    """
    请求参数错误响应 (400)

    Args:
        message: 错误信息
        data: 额外数据

    Returns:
        400 状态码的错误响应
    """
    return error(message=message, code=400, data=data)


def unauthorized(
        message: str = "未授权，请先登录",
        data: Any = None
) -> dict:
    """
    未授权响应 (401)

    Args:
        message: 错误信息
        data: 额外数据

    Returns:
        401 状态码的错误响应
    """
    return error(message=message, code=401, data=data)


def forbidden(
        message: str = "无权限访问",
        data: Any = None
) -> dict:
    """
    禁止访问响应 (403)

    Args:
        message: 错误信息
        data: 额外数据

    Returns:
        403 状态码的错误响应
    """
    return error(message=message, code=403, data=data)


def conflict(
        message: str = "资源冲突",
        data: Any = None
) -> dict:
    """
    资源冲突响应 (409)

    Args:
        message: 错误信息
        data: 额外数据

    Returns:
        409 状态码的错误响应
    """
    return error(message=message, code=409, data=data)


def server_error(
        message: str = "服务器内部错误",
        data: Any = None
) -> dict:
    """
    服务器错误响应 (500)

    Args:
        message: 错误信息
        data: 额外数据

    Returns:
        500 状态码的错误响应
    """
    return error(message=message, code=500, data=data)


def paginated(
        items: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 10,
        message: str = "获取列表成功"
) -> dict:
    """
    分页列表响应

    Args:
        items: 数据列表
        total: 总记录数
        page: 当前页码
        page_size: 每页数量
        message: 提示信息

    Returns:
        包含分页信息的成功响应

    Examples:
        >>> paginated(items=[{"id": 1}, {"id": 2}], total=100, page=1, page_size=10)
    """
    list_data = ListResponseData(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

    return success(
        data=list_data.model_dump(),
        message=message
    )


# 别名，方便使用
ok = success
fail = error