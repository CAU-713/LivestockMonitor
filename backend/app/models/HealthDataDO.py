from datetime import date, time
from typing import Optional

from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel, Relationship


class WeightRecordDO(SQLModel, table=True):
    """羊只体重记录数据对象"""
    __tablename__ = "weight_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="体重数据的唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    record_date: date = Field(description="体重测量的日期")
    weighing_time: time = Field(description="具体的体重测量时间")
    weight_kg: float = Field(description="羊只实际体重测量值(kg)")

class FeedIntakeRecordDO(SQLModel, table=True):
    """羊只采食量记录数据对象"""
    __tablename__ = "feed_intake_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="采食量数据的唯一标识")
    pen_id: int = Field(foreign_key="pen.id", description="羊群所属圈舍ID")
    record_date: date = Field(description="采食量测量日期")

    # 上午数据
    morning_feeding_time: Optional[time] = Field(default=None, description="上午投放饲料时间")
    morning_feeding_amount_kg: Optional[float] = Field(default=None, description="上午投放饲料净重量(kg)")
    morning_box_weight_kg: Optional[float] = Field(default=None, description="上午装料用空箱总重量(kg)")
    morning_remaining_feed_kg: Optional[float] = Field(default=None, description="上午剩料+空箱总重量(kg)")
    morning_feed_intake_kg: Optional[float] = Field(default=None, description="上午群体实际采食量(kg,自动计算)")

    # 下午数据
    afternoon_feeding_time: Optional[time] = Field(default=None, description="下午投放饲料时间")
    afternoon_feeding_amount_kg: Optional[float] = Field(default=None, description="下午投放饲料净重量(kg)")
    afternoon_box_weight_kg: Optional[float] = Field(default=None, description="下午装料用空箱总重量(kg)")
    afternoon_remaining_feed_kg: Optional[float] = Field(default=None, description="下午剩料+空箱总重量(kg)")
    afternoon_feed_intake_kg: Optional[float] = Field(default=None, description="下午群体实际采食量(kg,自动计算)")

    # 汇总数据
    daily_total_feed_intake_kg: Optional[float] = Field(default=None, description="群体当日总采食量(kg,自动计算)")
    sheep_count: int = Field(description="该群体当日羊只数量")
    avg_individual_intake_kg: Optional[float] = Field(default=None, description="单羊平均采食量(kg,自动计算)")

class BodyTemperatureRecordDO(SQLModel, table=True):
    """羊只体温记录数据对象"""
    __tablename__ = "body_temperature_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="体温数据的唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    record_date: date = Field(description="体温测量的日期")
    measurement_time: time = Field(description="体表各部位温度测量的统一时间")

    # 各部位温度
    ear_temperature: float = Field(description="耳部温度(℃)")
    dewlap_temperature: float = Field(description="颈部垂皮部位温度(℃)")
    scapula_temperature: float = Field(description="肩胛部皮肤温度(℃)")
    dorsal_midline_temperature: float = Field(description="背部中央皮肤温度(℃)")
    hip_temperature: float = Field(description="臀部皮肤温度(℃)")
    forelimb_upper_temperature: float = Field(description="前肢上部皮肤温度(℃)")
    forelimb_lower_temperature: float = Field(description="前肢下部皮肤温度(℃)")
    hindlimb_upper_temperature: float = Field(description="后肢上部皮肤温度(℃)")
    hindlimb_lower_temperature: float = Field(description="后肢下部皮肤温度(℃)")
    testicular_temperature: Optional[float] = Field(default=None, description="睾丸部位温度(℃,公羊必填)")

    average_body_surface_temperature: float = Field(description="体表部位温度的算术平均值(℃)")

class RespirationRecordDO(SQLModel, table=True):
    """羊只呼吸记录数据对象"""
    __tablename__ = "respiration_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="呼吸数据的唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    record_date: date = Field(description="呼吸记录的日期")
    monitoring_time: time = Field(description="具体的呼吸频次监测时间")
    respiratory_rate_per_minute: int = Field(description="每分钟羊只的呼吸次数")

class SerumRecordDO(SQLModel, table=True):
    """羊只血清记录数据对象"""
    __tablename__ = "serum_record"

    id: Optional[int] = Field(default=None, primary_key=True, description="血清数据的唯一标识")
    animal_id: int = Field(foreign_key="animal.id", description="羊只ID")
    record_date: date = Field(description="血清采样的日期")
    sampling_time: time = Field(description="血清具体采样时间")

    # 免疫指标
    igg_gl: float = Field(description="血清免疫球蛋白G含量(g/L)")
    igm_gl: float = Field(description="血清免疫球蛋白M含量(g/L)")
    iga_gl: float = Field(description="血清免疫球蛋白A含量(g/L)")

    # 代谢指标
    mda_nmol_ml: float = Field(description="血清丙二醛含量(nmol/mL)")
    glu_mmol_l: float = Field(description="血清葡萄糖含量(mmol/L)")
    bun_mmol_l: float = Field(description="血清尿素氮含量(mmol/L)")
    tp_gl: float = Field(description="血清总蛋白含量(g/L)")

    # 抗氧化指标
    sod_u_ml: float = Field(description="血清超氧化物歧化酶活性(U/mL)")
    nefa_umol_ml: float = Field(description="血清非酯化脂肪酸含量(μmol/mL)")
    taoc_u_ml: float = Field(description="血清总抗氧化能力(U/mL)")
    cat_u_ml: float = Field(description="血清过氧化氢酶活性(U/mL)")
    gshpx_u_ml: float = Field(description="血清谷胱甘肽过氧化物酶活性(U/mL)")

    # 细胞因子
    il2_pg_ml: float = Field(description="血清白细胞介素-2含量(pg/mL)")
    il6_ng_l: float = Field(description="血清白细胞介素-6含量(ng/L)")

    # 激素指标
    lh_miu_ml: float = Field(description="血清促黄体生成素含量(mIU/mL)")
    gh_ng_ml: float = Field(description="血清生长激素含量(ng/mL)")
    ins_uiul_ml: float = Field(description="血清胰岛素含量(μIU/mL)")
    t_pg_ml: float = Field(description="血清睾酮含量(pg/mL)")
    t3_ng_ml: float = Field(description="血清三碘甲状腺原氨酸含量(ng/mL)")
    tsh_miu_l: float = Field(description="血清促甲状腺激素含量(mIU/L)")
    cort_ng_ml: float = Field(description="血清皮质醇含量(ng/mL)")

    # 应激指标
    hsp70_pg_ml: float = Field(description="血清热休克蛋白70含量(pg/mL)")
    asd_nmol_l: float = Field(description="血清相关功能指标(nmol/L)")