from typing import Optional, Dict, Any
from datetime import datetime, date, time
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class AnimalDO(SQLModel, table=True):
    """羊只信息数据对象"""
    __tablename__ = "animal"

    id: Optional[int] = Field(default=None, primary_key=True, description="羊只唯一标识符")
    name: str = Field(max_length=50, description="羊只编号")
    breed: str = Field(max_length=50, description="品种")
    age: int = Field(description="年龄(月)")
    gender: str = Field(max_length=10, description="性别: male-公, female-母")
    health_status: str = Field(default="good", max_length=20,
                               description="健康状态: good-健康, ill-异常, under_treatment-治疗中, removal-已出栏")
    shed_id: int = Field(foreign_key="shed.id", description="所属羊舍ID")
    current_pen_id: Optional[int] = Field(default=None, foreign_key="pen.id", description="当前圈ID")
    entry_date: date = Field(description="进入羊舍日期")
    birth_date: date = Field(description="出生日期")
    description: Optional[str] = Field(default=None, max_length=500, description="羊只描述")

    # 繁殖相关
    dam_id: Optional[int] = Field(default=None, foreign_key="animal.id", description="母本ID(母羊编号)")
    sire_id: Optional[str] = Field(default=None, max_length=50, description="父本ID/精液批次")
    production_type: str = Field(description="生产类别: breeding-种羊, fattening-育肥, test-试验")
    breeding_status: Optional[str] = Field(default=None, max_length=20,
                                           description="繁殖状态: empty-空怀, mated_wait-已配待妊检, pregnant-妊娠, perinatal-围产, lactation-泌乳, abortion-流产")
    delivery_date: Optional[date] = Field(default=None, description="分娩日期")
    mating_date: Optional[date] = Field(default=None, description="配种日期")

