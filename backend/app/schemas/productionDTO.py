"""
生产管理相关数据传输对象 (DTO)
"""
from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ─── 出栏记录 ────────────────────────────────────────────────

class SlaughterCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0, description="羊只ID")
    slaughter_date: date = Field(..., description="出栏日期")
    slaughter_weight_kg: Optional[float] = Field(default=None, gt=0, description="出栏体重(kg)")
    price_per_kg: Optional[float] = Field(default=None, ge=0, description="出栏单价(元/kg)")
    total_price: Optional[float] = Field(default=None, ge=0, description="出栏总价(元)")
    buyer: Optional[str] = Field(default=None, max_length=100, description="买方/购买商")
    destination: Optional[str] = Field(default=None, max_length=200, description="去向")
    operator: Optional[str] = Field(default=None, max_length=50, description="操作人员")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")

    class Config:
        json_schema_extra = {
            "example": {
                "animal_id": 1,
                "slaughter_date": "2026-04-28",
                "slaughter_weight_kg": 45.5,
                "price_per_kg": 30.0,
                "total_price": 1365.0,
                "buyer": "绿洲肉类公司",
                "destination": "屠宰场"
            }
        }


class SlaughterResponseDTO(BaseModel):
    id: int
    animal_id: int
    animal_name: Optional[str] = None  # 从关联查询获取
    slaughter_date: date
    slaughter_weight_kg: Optional[float] = None
    price_per_kg: Optional[float] = None
    total_price: Optional[float] = None
    buyer: Optional[str] = None
    destination: Optional[str] = None
    operator: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── 死亡记录 ────────────────────────────────────────────────

class MortalityCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0, description="羊只ID")
    death_date: date = Field(..., description="死亡日期")
    cause: Optional[str] = Field(default=None, description="死亡原因: disease/injury/unknown/other")
    disposal_method: Optional[str] = Field(default=None, description="处置方式: buried/incinerated/other")
    vet_confirmation: bool = Field(default=False, description="是否经兽医确认")
    loss_amount: Optional[float] = Field(default=None, ge=0, description="损失金额(元)")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")

    @field_validator("cause")
    @classmethod
    def validate_cause(cls, v):
        if v is not None and v not in ("disease", "injury", "unknown", "other"):
            raise ValueError("死亡原因必须是 disease/injury/unknown/other 之一")
        return v

    @field_validator("disposal_method")
    @classmethod
    def validate_disposal(cls, v):
        if v is not None and v not in ("buried", "incinerated", "other"):
            raise ValueError("处置方式必须是 buried/incinerated/other 之一")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "animal_id": 1,
                "death_date": "2026-04-28",
                "cause": "disease",
                "disposal_method": "buried",
                "vet_confirmation": True,
                "loss_amount": 1200.0
            }
        }


class MortalityResponseDTO(BaseModel):
    id: int
    animal_id: int
    animal_name: Optional[str] = None  # 从关联查询获取
    death_date: date
    cause: Optional[str] = None
    disposal_method: Optional[str] = None
    vet_confirmation: bool
    loss_amount: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── 统计数据 ────────────────────────────────────────────────

class ProductionStatsDTO(BaseModel):
    month_slaughter_count: int = Field(description="本月出栏数")
    month_mortality_count: int = Field(description="本月死亡数")
    month_total_revenue: float = Field(description="本月出栏总收入(元)")
    mortality_rate: float = Field(description="本月死亡率(%)")
    total_slaughter_count: int = Field(description="累计出栏数")
    total_mortality_count: int = Field(description="累计死亡数")
