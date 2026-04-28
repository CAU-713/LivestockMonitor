"""
动物档案相关数据传输对象 (DTO)
"""
from datetime import date
from typing import Optional, Literal
from pydantic import BaseModel, Field


class AnimalCreateDTO(BaseModel):
    """创建动物档案请求DTO"""
    name: str = Field(..., min_length=1, max_length=50, description="羊只编号")
    breed: str = Field(..., min_length=1, max_length=50, description="品种")
    age: int = Field(..., ge=0, description="年龄（月）")
    gender: Literal["male", "female"] = Field(..., description="性别: male-公, female-母")
    health_status: Literal["good", "ill", "under_treatment", "removal"] = Field(
        default="good", description="健康状态"
    )
    shed_id: int = Field(..., gt=0, description="所属羊舍ID")
    current_pen_id: Optional[int] = Field(default=None, gt=0, description="当前圈ID")
    entry_date: date = Field(..., description="进入羊舍日期")
    birth_date: date = Field(..., description="出生日期")
    description: Optional[str] = Field(default=None, max_length=500, description="描述")
    dam_id: Optional[int] = Field(default=None, gt=0, description="母本ID")
    sire_id: Optional[str] = Field(default=None, max_length=50, description="父本ID/精液批次")
    production_type: Literal["breeding", "fattening", "test"] = Field(
        ..., description="生产类别: breeding-种羊, fattening-育肥, test-试验"
    )
    breeding_status: Optional[
        Literal["empty", "mated_wait", "pregnant", "perinatal", "lactation", "abortion"]
    ] = Field(default=None, description="繁殖状态")
    delivery_date: Optional[date] = Field(default=None, description="分娩日期")
    mating_date: Optional[date] = Field(default=None, description="配种日期")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "YA-2026-001",
                "breed": "湖羊",
                "age": 12,
                "gender": "female",
                "health_status": "good",
                "shed_id": 1,
                "entry_date": "2026-01-01",
                "birth_date": "2025-01-01",
                "production_type": "breeding"
            }
        }


class AnimalUpdateDTO(BaseModel):
    """更新动物档案请求DTO"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    breed: Optional[str] = Field(default=None, min_length=1, max_length=50)
    age: Optional[int] = Field(default=None, ge=0)
    gender: Optional[Literal["male", "female"]] = None
    health_status: Optional[Literal["good", "ill", "under_treatment", "removal"]] = None
    shed_id: Optional[int] = Field(default=None, gt=0)
    current_pen_id: Optional[int] = Field(default=None, gt=0)
    entry_date: Optional[date] = None
    birth_date: Optional[date] = None
    description: Optional[str] = Field(default=None, max_length=500)
    dam_id: Optional[int] = Field(default=None, gt=0)
    sire_id: Optional[str] = Field(default=None, max_length=50)
    production_type: Optional[Literal["breeding", "fattening", "test"]] = None
    breeding_status: Optional[
        Literal["empty", "mated_wait", "pregnant", "perinatal", "lactation", "abortion"]
    ] = None
    delivery_date: Optional[date] = None
    mating_date: Optional[date] = None


class AnimalHealthUpdateDTO(BaseModel):
    """更新健康状态请求DTO"""
    health_status: Literal["good", "ill", "under_treatment", "removal"] = Field(
        ..., description="新健康状态"
    )


class AnimalBreedingUpdateDTO(BaseModel):
    """更新繁殖状态请求DTO"""
    breeding_status: Optional[
        Literal["empty", "mated_wait", "pregnant", "perinatal", "lactation", "abortion"]
    ] = Field(default=None, description="繁殖状态")
    mating_date: Optional[date] = Field(default=None, description="配种日期")
    delivery_date: Optional[date] = Field(default=None, description="分娩日期")
    sire_id: Optional[str] = Field(default=None, max_length=50, description="父本ID/精液批次")


class AnimalResponseDTO(BaseModel):
    """动物档案响应DTO"""
    id: int
    name: str
    breed: str
    age: int
    gender: str
    health_status: str
    shed_id: int
    shed_name: Optional[str] = None
    current_pen_id: Optional[int] = None
    entry_date: date
    birth_date: date
    description: Optional[str] = None
    dam_id: Optional[int] = None
    sire_id: Optional[str] = None
    production_type: str
    breeding_status: Optional[str] = None
    delivery_date: Optional[date] = None
    mating_date: Optional[date] = None

    class Config:
        from_attributes = True


class AnimalQueryDTO(BaseModel):
    """动物档案查询参数DTO"""
    shed_id: Optional[int] = Field(default=None, gt=0)
    health_status: Optional[str] = None
    gender: Optional[str] = None
    breed: Optional[str] = None
    production_type: Optional[str] = None
    breeding_status: Optional[str] = None
    search: Optional[str] = None  # 按编号/品种搜索
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=1000)


class AnimalStatsDTO(BaseModel):
    """动物统计DTO"""
    total: int = Field(..., description="总数")
    good: int = Field(..., description="健康数量")
    ill: int = Field(..., description="异常数量")
    under_treatment: int = Field(..., description="治疗中数量")
    removal: int = Field(..., description="已出栏数量")
    breeding_count: int = Field(..., description="种羊数量")
    fattening_count: int = Field(..., description="育肥数量")
