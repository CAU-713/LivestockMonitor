from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class SlaughterRecordDO(SQLModel, table=True):
    """出栏记录数据对象"""
    __tablename__ = "slaughter_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="出栏记录唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    slaughter_date: date = Field(description="出栏日期")
    slaughter_weight_kg: Optional[float] = Field(default=None, description="出栏体重(kg)")
    price_per_kg: Optional[float] = Field(default=None, description="出栏单价(元/kg)")
    total_price: Optional[float] = Field(default=None, description="出栏总价(元)")
    buyer: Optional[str] = Field(default=None, max_length=100, description="买方/购买商")
    destination: Optional[str] = Field(default=None, max_length=200, description="去向")
    operator: Optional[str] = Field(default=None, max_length=50, description="操作人员")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")


class MortalityRecordDO(SQLModel, table=True):
    """死亡记录数据对象"""
    __tablename__ = "mortality_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="死亡记录唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    death_date: date = Field(description="死亡日期")
    cause: Optional[str] = Field(default=None, max_length=50, description="死亡原因: disease/injury/unknown/other")
    disposal_method: Optional[str] = Field(default=None, max_length=50, description="处置方式: buried/incinerated/other")
    vet_confirmation: bool = Field(default=False, description="是否经兽医确认")
    loss_amount: Optional[float] = Field(default=None, description="损失金额(元)")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")
