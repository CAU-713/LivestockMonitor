"""
sparks 数据传输对象 (DTO)
定义 sparks MySQL 相关 API 的请求和响应数据结构。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ==================== 测点相关 ====================

class SparkPointDTO(BaseModel):
    """测点信息（从 device_data_update）"""
    id: str = Field(..., description="测点ID（pointId）")
    name: str = Field(..., description="测点中文名（pointName）")
    point_id: str = Field("", description="测点ID")
    point_name: str = Field("", description="测点中文名")
    device_id: str = Field("", description="设备ID")
    gateway_mac: str = Field("", description="网关MAC")
    type: str = Field("", description="传感器类型")
    type_name: str = Field("", description="传感器类型中文名")
    value: str = Field("", description="最新值")
    unit: str = Field("", description="单位")
    status: str = Field("active", description="状态")
    updated_at: Optional[str] = Field(None, description="数据更新时间")
    created_at: Optional[str] = Field(None, description="记录创建时间")


class SparkPointListDTO(BaseModel):
    """测点列表"""
    points: List[SparkPointDTO] = Field(default_factory=list, description="测点列表")
    point_types: List[str] = Field(default_factory=list, description="所有测点类型")
    total: int = Field(0, description="测点总数")


# ==================== 历史数据 ====================

class SparkHistoryItemDTO(BaseModel):
    """历史数据项"""
    point_id: str = Field("", description="测点ID")
    point_name: str = Field("", description="测点中文名")
    record_time: Optional[str] = Field(None, description="记录时间（聚合时为时间桶）")
    created_at: Optional[str] = Field(None, description="原始记录时间（raw模式）")
    value: Optional[str] = Field(None, description="原始值（raw模式）")
    avg_value: Optional[float] = Field(None, description="平均值（聚合模式）")
    min_value: Optional[float] = Field(None, description="最小值（聚合模式）")
    max_value: Optional[float] = Field(None, description="最大值（聚合模式）")
    sample_count: Optional[int] = Field(None, description="样本数（聚合模式）")
    device_id: str = Field("", description="设备ID")
    gateway_mac: str = Field("", description="网关MAC")


class SparkHistoryQueryDTO(BaseModel):
    """历史数据查询参数"""
    point_ids: Optional[List[str]] = Field(None, description="测点ID列表")
    start: Optional[datetime] = Field(None, description="起始时间")
    end: Optional[datetime] = Field(None, description="截止时间")
    granularity: str = Field("raw", description="数据粒度: raw | hour | day")
    limit: int = Field(5000, ge=1, le=50000, description="最大返回行数")


# ==================== 网关 ====================

class SparkGatewayDTO(BaseModel):
    """网关状态"""
    id: str = Field("", description="网关ID（gatewayMac）")
    name: str = Field("", description="网关名称")
    gateway_mac: str = Field("", description="网关MAC")
    sim_insert: int = Field(0, description="SIM卡是否插入")
    iccid: str = Field("", description="SIM卡ICCID")
    csq: int = Field(-1, description="信号强度")
    latitude: float = Field(0, description="纬度")
    longitude: float = Field(0, description="经度")
    updated_at: Optional[str] = Field(None, description="更新时间")


# ==================== 设备通信状态 ====================

class SparkDeviceStatusDTO(BaseModel):
    """设备通信状态"""
    device_id: str = Field("", description="设备ID")
    gateway_mac: str = Field("", description="网关MAC")
    is_online: bool = Field(False, description="是否在线")
    loss_rate: float = Field(0, description="丢包率")
    comm_total_cnt: int = Field(0, description="通信总次数")
    comm_fail_cnt: int = Field(0, description="通信失败次数")
    last_comm_time: Optional[str] = Field(None, description="最近通信时间")
    code: int = Field(0, description="状态码")
    message: str = Field("", description="状态消息")
    updated_at: Optional[str] = Field(None, description="更新时间")


class SparkDeviceStatusHistoryDTO(BaseModel):
    """设备通信状态历史"""
    items: List[SparkDeviceStatusDTO] = Field(default_factory=list, description="状态历史列表")
    total: int = Field(0, description="总数")


# ==================== 概览统计 ====================

class SparkOverviewDTO(BaseModel):
    """系统概览统计"""
    total_points: int = Field(0, description="测点总数")
    total_gateways: int = Field(0, description="网关总数")
    total_devices: int = Field(0, description="设备总数")
    device_online: bool = Field(False, description="设备是否在线")
    device_loss_rate: float = Field(0, description="设备丢包率")
    last_comm_time: Optional[str] = Field(None, description="最近通信时间")
    gateway_csq: int = Field(-1, description="网关信号强度")
    gateway_latitude: float = Field(0, description="网关纬度")
    gateway_longitude: float = Field(0, description="网关经度")
    gateway_sim_insert: bool = Field(False, description="网关SIM是否插入")
