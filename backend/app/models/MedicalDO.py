from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class VaccinationRecordDO(SQLModel, table=True):
    """羊只疫苗接种记录数据对象"""
    __tablename__ = "vaccination_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="疫苗记录唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    vaccine_name: str = Field(max_length=100, description="疫苗名称")
    batch_number: Optional[str] = Field(default=None, max_length=50, description="疫苗批次号")
    vaccination_date: date = Field(description="接种日期")
    next_due_date: Optional[date] = Field(default=None, description="下次接种日期")
    dose_ml: Optional[float] = Field(default=None, description="接种剂量(mL)")
    vaccinator: Optional[str] = Field(default=None, max_length=50, description="接种人员")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")


class MedicationRecordDO(SQLModel, table=True):
    """羊只用药记录数据对象"""
    __tablename__ = "medication_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="用药记录唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    disease_name: str = Field(max_length=100, description="疾病名称")
    drug_name: str = Field(max_length=100, description="药品名称")
    dosage: Optional[str] = Field(default=None, max_length=100, description="剂量与用法")
    treatment_start: date = Field(description="治疗开始日期")
    treatment_end: Optional[date] = Field(default=None, description="治疗结束日期")
    vet_name: Optional[str] = Field(default=None, max_length=50, description="兽医姓名")
    outcome: Optional[str] = Field(default=None, max_length=20, description="治疗结果: recovered/ongoing/died")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")


class DewormingRecordDO(SQLModel, table=True):
    """羊只驱虫记录数据对象"""
    __tablename__ = "deworming_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="驱虫记录唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    drug_name: str = Field(max_length=100, description="驱虫药名称")
    dose_ml: Optional[float] = Field(default=None, description="驱虫药剂量(mL)")
    deworming_date: date = Field(description="驱虫日期")
    next_due_date: Optional[date] = Field(default=None, description="下次驱虫日期")
    operator: Optional[str] = Field(default=None, max_length=50, description="操作人员")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")
