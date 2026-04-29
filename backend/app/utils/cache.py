"""
Redis 缓存工具模块

提供统一的缓存读写接口，连接失败时优雅降级（仅打印 warning，不影响业务）。
使用 JSON 序列化缓存值，支持 pattern 批量删除（使用 SCAN 而非 KEYS，避免阻塞）。

典型用法：
    from app.utils.cache import get_cache, set_cache, delete_cache, delete_pattern

    cached = get_cache("alert:stats")
    if cached is not None:
        return cached

    data = compute_data()
    set_cache("alert:stats", data, ttl=60)
    return data
"""

import json
import logging
from typing import Any, Optional

import redis

from app.config import settings

logger = logging.getLogger(__name__)

# 模块级 Redis 客户端（懒初始化，首次调用时连接）
_redis_client: Optional[redis.Redis] = None


def _get_client() -> Optional[redis.Redis]:
    """获取 Redis 客户端，连接失败时返回 None（降级模式）。"""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=0,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        # 用 ping 验证连接是否可用
        client.ping()
        _redis_client = client
        logger.info(f"Redis 连接成功: {settings.redis_host}:{settings.redis_port}")
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis 连接失败，缓存降级为直连数据库模式: {e}")
        return None


def get_cache(key: str) -> Optional[Any]:
    """
    从 Redis 读取缓存值。

    Args:
        key: 缓存键

    Returns:
        反序列化后的缓存值，未命中或出错时返回 None
    """
    client = _get_client()
    if client is None:
        return None
    try:
        raw = client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Redis get 失败 (key={key}): {e}")
        return None


def set_cache(key: str, value: Any, ttl: int = 60) -> None:
    """
    向 Redis 写入缓存值。

    Args:
        key: 缓存键
        value: 可 JSON 序列化的值
        ttl: 过期秒数，默认 60s
    """
    client = _get_client()
    if client is None:
        return
    try:
        client.setex(key, ttl, json.dumps(value, ensure_ascii=False, default=str))
    except Exception as e:
        logger.warning(f"Redis set 失败 (key={key}): {e}")


def delete_cache(*keys: str) -> None:
    """
    删除一个或多个缓存键。

    Args:
        *keys: 要删除的缓存键列表
    """
    if not keys:
        return
    client = _get_client()
    if client is None:
        return
    try:
        client.delete(*keys)
    except Exception as e:
        logger.warning(f"Redis delete 失败 (keys={keys}): {e}")


def delete_pattern(pattern: str) -> None:
    """
    按 glob pattern 批量删除缓存键。

    使用 SCAN 迭代而非 KEYS，避免在大数据量时阻塞 Redis。

    Args:
        pattern: glob 模式，例如 "alert:list:*"
    """
    client = _get_client()
    if client is None:
        return
    try:
        cursor = 0
        while True:
            cursor, keys = client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.warning(f"Redis delete_pattern 失败 (pattern={pattern}): {e}")
