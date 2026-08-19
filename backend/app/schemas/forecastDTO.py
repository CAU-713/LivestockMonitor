"""
环境时序预测相关 DTO
"""
from typing import List, Optional

from pydantic import BaseModel, Field


class ForecastBatchDTO(BaseModel):
    """预测批次信息"""

    batch_id: str = Field(..., description="批次号")
    forecast_time: Optional[str] = Field(None, description="模型执行时间")
    input_end_time: Optional[str] = Field(None, description="输入数据截止时间")
    model_name: str = Field("", description="模型名")
    model_version: str = Field("", description="模型版本")
    rows: int = Field(0, description="该批次预测行数")
    target_start: Optional[str] = Field(None, description="预测起始时刻")
    target_end: Optional[str] = Field(None, description="预测结束时刻")


class ForecastPointDTO(BaseModel):
    """单个预测点（长表一行）"""

    target_time: Optional[str] = Field(None, description="预测目标时刻")
    horizon_step: int = Field(0, description="预测步长")
    point_id: str = Field("", description="传感器编码")
    point_name: str = Field("", description="传感器中文名")
    predicted_value: float = Field(0, description="预测值")


class DeviceStatusDTO(BaseModel):
    """设备/数据状态"""

    is_online: bool = Field(False, description="设备是否在线")
    last_comm_time: Optional[str] = Field(None, description="最近通信时间")
    last_nonzero_at: Optional[str] = Field(
        None, description="环境传感器最后一次非0值时间"
    )


class ForecastOverviewDTO(BaseModel):
    """预测展示页一次性数据"""

    batch: Optional[ForecastBatchDTO] = Field(None, description="最新预测批次")
    forecast: List[ForecastPointDTO] = Field(
        default_factory=list, description="预测明细"
    )
    device: DeviceStatusDTO = Field(
        default_factory=DeviceStatusDTO, description="设备状态"
    )


class ForecastBatchSummaryDTO(BaseModel):
    """预测批次列表项"""

    batch_id: str = Field(..., description="批次号")
    forecast_time: Optional[str] = Field(None, description="模型执行时间")
    input_end_time: Optional[str] = Field(None, description="输入数据截止时间")
    model_name: Optional[str] = Field(None, description="模型名")
    model_version: Optional[str] = Field(None, description="模型版本")
    rows: int = Field(0, description="预测行数")
    target_start: Optional[str] = Field(None, description="预测起始时刻")
    target_end: Optional[str] = Field(None, description="预测结束时刻")
