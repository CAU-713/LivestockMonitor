"""
疫病防治相关数据传输对象 (DTO)
"""
from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ─── 疫苗接种记录 ────────────────────────────────────────────────

class VaccinationCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0, description="羊只ID")
    vaccine_name: str = Field(..., max_length=100, description="疫苗名称")
    batch_number: Optional[str] = Field(default=None, max_length=50, description="疫苗批次号")
    vaccination_date: date = Field(..., description="接种日期")
    next_due_date: Optional[date] = Field(default=None, description="下次接种日期")
    dose_ml: Optional[float] = Field(default=None, gt=0, description="接种剂量(mL)")
    vaccinator: Optional[str] = Field(default=None, max_length=50, description="接种人员")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")

    class Config:
        json_schema_extra = {
            "example": {
                "animal_id": 1,
                "vaccine_name": "口蹄疫疫苗",
                "batch_number": "2026A001",
                "vaccination_date": "2026-04-28",
                "next_due_date": "2026-10-28",
                "dose_ml": 2.0,
                "vaccinator": "张医生"
            }
        }


class VaccinationResponseDTO(BaseModel):
    id: int
    animal_id: int
    vaccine_name: str
    batch_number: Optional[str] = None
    vaccination_date: date
    next_due_date: Optional[date] = None
    dose_ml: Optional[float] = None
    vaccinator: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── 用药记录 ────────────────────────────────────────────────

class MedicationCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0, description="羊只ID")
    disease_name: str = Field(..., max_length=100, description="疾病名称")
    drug_name: str = Field(..., max_length=100, description="药品名称")
    dosage: Optional[str] = Field(default=None, max_length=100, description="剂量与用法")
    treatment_start: date = Field(..., description="治疗开始日期")
    treatment_end: Optional[date] = Field(default=None, description="治疗结束日期")
    vet_name: Optional[str] = Field(default=None, max_length=50, description="兽医姓名")
    outcome: Optional[str] = Field(default=None, description="治疗结果: recovered/ongoing/died")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")

    @field_validator("outcome")
    @classmethod
    def validate_outcome(cls, v):
        if v is not None and v not in ("recovered", "ongoing", "died"):
            raise ValueError("治疗结果必须是 recovered/ongoing/died 之一")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "animal_id": 1,
                "disease_name": "肺炎",
                "drug_name": "青霉素",
                "dosage": "5万单位/kg，肌注",
                "treatment_start": "2026-04-28",
                "vet_name": "李兽医",
                "outcome": "ongoing"
            }
        }


class MedicationResponseDTO(BaseModel):
    id: int
    animal_id: int
    disease_name: str
    drug_name: str
    dosage: Optional[str] = None
    treatment_start: date
    treatment_end: Optional[date] = None
    vet_name: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── 驱虫记录 ────────────────────────────────────────────────

class DewormingCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0, description="羊只ID")
    drug_name: str = Field(..., max_length=100, description="驱虫药名称")
    dose_ml: Optional[float] = Field(default=None, gt=0, description="驱虫药剂量(mL)")
    deworming_date: date = Field(..., description="驱虫日期")
    next_due_date: Optional[date] = Field(default=None, description="下次驱虫日期")
    operator: Optional[str] = Field(default=None, max_length=50, description="操作人员")
    notes: Optional[str] = Field(default=None, max_length=500, description="备注")

    class Config:
        json_schema_extra = {
            "example": {
                "animal_id": 1,
                "drug_name": "阿维菌素",
                "dose_ml": 1.5,
                "deworming_date": "2026-04-28",
                "next_due_date": "2026-07-28",
                "operator": "王操作员"
            }
        }


class DewormingResponseDTO(BaseModel):
    id: int
    animal_id: int
    drug_name: str
    dose_ml: Optional[float] = None
    deworming_date: date
    next_due_date: Optional[date] = None
    operator: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── 即将到期提醒 ────────────────────────────────────────────────

class UpcomingReminderDTO(BaseModel):
    type: str  # vaccination / deworming
    animal_id: int
    animal_name: str
    item_name: str  # 疫苗名或驱虫药名
    due_date: date
    days_until_due: int
