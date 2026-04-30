"""
健康数据相关数据传输对象 (DTO)
"""
from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── 体重记录 ────────────────────────────────────────────────

class WeightRecordCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0, description="羊只ID")
    record_date: date = Field(..., description="测量日期")
    weighing_time: time = Field(..., description="测量时间")
    weight_kg: float = Field(..., gt=0, description="体重(kg)")

    class Config:
        json_schema_extra = {
            "example": {"animal_id": 1, "record_date": "2026-04-28", "weighing_time": "08:00:00", "weight_kg": 35.5}
        }


class WeightRecordResponseDTO(BaseModel):
    id: int
    animal_id: int
    record_date: date
    weighing_time: time
    weight_kg: float

    class Config:
        from_attributes = True


# ─── 体温记录 ────────────────────────────────────────────────

class BodyTemperatureCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0)
    record_date: date
    measurement_time: time
    ear_temperature: float = Field(..., description="耳部温度(℃)")
    dewlap_temperature: float = Field(..., description="颈部垂皮温度(℃)")
    scapula_temperature: float = Field(..., description="肩胛部温度(℃)")
    dorsal_midline_temperature: float = Field(..., description="背部中央温度(℃)")
    hip_temperature: float = Field(..., description="臀部温度(℃)")
    forelimb_upper_temperature: float = Field(..., description="前肢上部温度(℃)")
    forelimb_lower_temperature: float = Field(..., description="前肢下部温度(℃)")
    hindlimb_upper_temperature: float = Field(..., description="后肢上部温度(℃)")
    hindlimb_lower_temperature: float = Field(..., description="后肢下部温度(℃)")
    testicular_temperature: Optional[float] = Field(default=None, description="睾丸温度(℃，公羊)")
    average_body_surface_temperature: float = Field(..., description="体表平均温度(℃)")


class BodyTemperatureResponseDTO(BaseModel):
    id: int
    animal_id: int
    record_date: date
    measurement_time: time
    ear_temperature: float
    dewlap_temperature: float
    scapula_temperature: float
    dorsal_midline_temperature: float
    hip_temperature: float
    forelimb_upper_temperature: float
    forelimb_lower_temperature: float
    hindlimb_upper_temperature: float
    hindlimb_lower_temperature: float
    testicular_temperature: Optional[float] = None
    average_body_surface_temperature: float

    class Config:
        from_attributes = True


# ─── 呼吸记录 ────────────────────────────────────────────────

class RespirationRecordCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0)
    record_date: date
    monitoring_time: time
    respiratory_rate_per_minute: int = Field(..., gt=0, description="每分钟呼吸次数")


class RespirationRecordResponseDTO(BaseModel):
    id: int
    animal_id: int
    record_date: date
    monitoring_time: time
    respiratory_rate_per_minute: int

    class Config:
        from_attributes = True


# ─── 血清记录 ────────────────────────────────────────────────

class SerumRecordCreateDTO(BaseModel):
    animal_id: int = Field(..., gt=0)
    record_date: date
    sampling_time: time

    # 免疫指标
    igg_gl: float = Field(..., description="IgG(g/L)")
    igm_gl: float = Field(..., description="IgM(g/L)")
    iga_gl: float = Field(..., description="IgA(g/L)")

    # 代谢指标
    mda_nmol_ml: float = Field(..., description="MDA(nmol/mL)")
    glu_mmol_l: float = Field(..., description="GLU(mmol/L)")
    bun_mmol_l: float = Field(..., description="BUN(mmol/L)")
    tp_gl: float = Field(..., description="TP(g/L)")

    # 抗氧化指标
    sod_u_ml: float = Field(..., description="SOD(U/mL)")
    nefa_umol_ml: float = Field(..., description="NEFA(μmol/mL)")
    taoc_u_ml: float = Field(..., description="T-AOC(U/mL)")
    cat_u_ml: float = Field(..., description="CAT(U/mL)")
    gshpx_u_ml: float = Field(..., description="GSH-Px(U/mL)")

    # 细胞因子
    il2_pg_ml: float = Field(..., description="IL-2(pg/mL)")
    il6_ng_l: float = Field(..., description="IL-6(ng/L)")

    # 激素指标
    lh_miu_ml: float = Field(..., description="LH(mIU/mL)")
    gh_ng_ml: float = Field(..., description="GH(ng/mL)")
    ins_uiul_ml: float = Field(..., description="INS(μIU/mL)")
    t_pg_ml: float = Field(..., description="T(pg/mL)")
    t3_ng_ml: float = Field(..., description="T3(ng/mL)")
    tsh_miu_l: float = Field(..., description="TSH(mIU/L)")
    cort_ng_ml: float = Field(..., description="CORT(ng/mL)")

    # 应激指标
    hsp70_pg_ml: float = Field(..., description="HSP70(pg/mL)")
    asd_nmol_l: float = Field(..., description="ASD(nmol/L)")


class SerumRecordResponseDTO(BaseModel):
    id: int
    animal_id: int
    record_date: date
    sampling_time: time
    igg_gl: float
    igm_gl: float
    iga_gl: float
    mda_nmol_ml: float
    glu_mmol_l: float
    bun_mmol_l: float
    tp_gl: float
    sod_u_ml: float
    nefa_umol_ml: float
    taoc_u_ml: float
    cat_u_ml: float
    gshpx_u_ml: float
    il2_pg_ml: float
    il6_ng_l: float
    lh_miu_ml: float
    gh_ng_ml: float
    ins_uiul_ml: float
    t_pg_ml: float
    t3_ng_ml: float
    tsh_miu_l: float
    cort_ng_ml: float
    hsp70_pg_ml: float
    asd_nmol_l: float

    class Config:
        from_attributes = True


# ─── 体重趋势 ────────────────────────────────────────────────

class WeightTrendPoint(BaseModel):
    date: str
    weight_kg: float


class WeightTrendResponseDTO(BaseModel):
    animal_id: int
    data: List[WeightTrendPoint]


# ─── 采食量记录 ────────────────────────────────────────────────

class FeedIntakeCreateDTO(BaseModel):
    pen_id: int = Field(..., gt=0, description="圈舍ID")
    record_date: date = Field(..., description="记录日期")
    sheep_count: int = Field(..., gt=0, description="当日羊只数量")

    # 上午数据
    morning_feeding_amount_kg: Optional[float] = Field(default=None, ge=0, description="上午投放饲料量(kg)")
    morning_box_weight_kg: Optional[float] = Field(default=None, ge=0, description="上午空箱总重量(kg)")
    morning_remaining_feed_kg: Optional[float] = Field(default=None, ge=0, description="上午剩料+空箱总重(kg)")

    # 下午数据
    afternoon_feeding_amount_kg: Optional[float] = Field(default=None, ge=0, description="下午投放饲料量(kg)")
    afternoon_box_weight_kg: Optional[float] = Field(default=None, ge=0, description="下午空箱总重量(kg)")
    afternoon_remaining_feed_kg: Optional[float] = Field(default=None, ge=0, description="下午剩料+空箱总重(kg)")

    class Config:
        json_schema_extra = {
            "example": {
                "pen_id": 1,
                "record_date": "2026-04-28",
                "sheep_count": 10,
                "morning_feeding_amount_kg": 20.0,
                "morning_box_weight_kg": 2.0,
                "morning_remaining_feed_kg": 4.5,
                "afternoon_feeding_amount_kg": 20.0,
                "afternoon_box_weight_kg": 2.0,
                "afternoon_remaining_feed_kg": 3.0
            }
        }


class FeedIntakeResponseDTO(BaseModel):
    id: int
    pen_id: int
    record_date: date
    sheep_count: int
    morning_feeding_amount_kg: Optional[float] = None
    morning_box_weight_kg: Optional[float] = None
    morning_remaining_feed_kg: Optional[float] = None
    morning_feed_intake_kg: Optional[float] = None
    afternoon_feeding_amount_kg: Optional[float] = None
    afternoon_box_weight_kg: Optional[float] = None
    afternoon_remaining_feed_kg: Optional[float] = None
    afternoon_feed_intake_kg: Optional[float] = None
    daily_total_feed_intake_kg: Optional[float] = None
    avg_individual_intake_kg: Optional[float] = None

    class Config:
        from_attributes = True


class FeedIntakeTrendPoint(BaseModel):
    date: str
    pen_id: int
    daily_total_feed_intake_kg: float
    avg_individual_intake_kg: Optional[float] = None


class FeedIntakeTrendResponseDTO(BaseModel):
    pen_id: int
    data: List[FeedIntakeTrendPoint]
