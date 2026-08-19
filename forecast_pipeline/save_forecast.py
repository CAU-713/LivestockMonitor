# -*- coding: utf-8 -*-
"""预测结果写入新 SQL 表 device_forecast_save
用法:
  from save_forecast import init_forecast_table, save_forecast_result
  init_forecast_table(engine)               # 首次建表
  save_forecast_result(engine, forecast_df) # 写入预测长表
"""
from __future__ import annotations

import pandas as pd
from sqlalchemy import text
from db_config import FORECAST_TABLE

CREATE_TABLE_SQL = f"""
CREATE TABLE IF NOT EXISTS {FORECAST_TABLE} (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id        VARCHAR(64)   NOT NULL,
    forecast_time   DATETIME      NOT NULL COMMENT '模型执行时间',
    input_end_time  DATETIME      NOT NULL COMMENT '输入最后时刻',
    target_time     DATETIME      NOT NULL COMMENT '预测目标时刻',
    horizon_step    INT           NOT NULL COMMENT '预测步长 1-72',
    gateway_mac     VARCHAR(64)   DEFAULT '' COMMENT '网关标识',
    device_id       VARCHAR(64)   DEFAULT '' COMMENT '设备标识',
    point_id        VARCHAR(64)   NOT NULL COMMENT '传感器编码',
    point_name      VARCHAR(128)  DEFAULT '' COMMENT '传感器中文名',
    predicted_value DOUBLE        NOT NULL COMMENT '预测值(物理单位)',
    model_name      VARCHAR(64)   DEFAULT '' COMMENT '模型名',
    model_version   VARCHAR(64)   DEFAULT '' COMMENT '模型版本',
    -- UniWeather 23 个气象外生变量字段（暂无数据源，10月前爬取，先建列占位，可空）
    temperature_2m                DOUBLE NULL COMMENT '距地面2米空气温度(℃)',
    dewpoint_2m                   DOUBLE NULL COMMENT '距地面2米露点温度(℃)',
    apparent_temperature          DOUBLE NULL COMMENT '体感温度(℃)',
    wet_bulb_temperature_2m       DOUBLE NULL COMMENT '距地面2米湿球温度(℃)',
    relative_humidity_2m          DOUBLE NULL COMMENT '距地面2米相对湿度(%)',
    precipitation                 DOUBLE NULL COMMENT '总降水量(mm)',
    rain                          DOUBLE NULL COMMENT '液态降雨量(mm)',
    snowfall                      DOUBLE NULL COMMENT '降雪量(cm)',
    vapor_pressure_deficit        DOUBLE NULL COMMENT '饱和水汽压差(kPa)',
    cloud_cover                   DOUBLE NULL COMMENT '总云量(%)',
    cloud_cover_low               DOUBLE NULL COMMENT '低层云量(%)',
    cloud_cover_mid               DOUBLE NULL COMMENT '中层云量(%)',
    wind_speed_10m                DOUBLE NULL COMMENT '10米风速(km/h)',
    wind_speed_100m               DOUBLE NULL COMMENT '100米风速(km/h)',
    wind_direction_10m            DOUBLE NULL COMMENT '10米风向(°)',
    wind_direction_100m           DOUBLE NULL COMMENT '100米风向(°)',
    wind_gusts_10m                DOUBLE NULL COMMENT '10米阵风风速(km/h)',
    shortwave_radiation_ghi       DOUBLE NULL COMMENT '全球水平短波辐射(W/m²)',
    soil_temperature_0_to_7cm     DOUBLE NULL COMMENT '0-7cm土层温度(℃)',
    soil_temperature_7_to_28cm    DOUBLE NULL COMMENT '7-28cm土层温度(℃)',
    soil_moisture_0_to_7cm        DOUBLE NULL COMMENT '0-7cm土层体积含水量(m³/m³)',
    soil_moisture_7_to_28cm       DOUBLE NULL COMMENT '7-28cm土层体积含水量(m³/m³)',
    et0_fao_evapotranspiration    DOUBLE NULL COMMENT 'FAO参考蒸散量(mm)',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP COMMENT '写入时间',
    UNIQUE KEY uk_batch_target_point (batch_id, target_time, point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境时序预测结果表';
"""


def init_forecast_table(engine) -> None:
    """建表(幂等, 已存在则跳过)"""
    with engine.begin() as conn:
        conn.execute(text(CREATE_TABLE_SQL))


# 预测结果列(predict.py输出, 驼峰) → 数据库表字段(下划线)
COLUMN_MAP = {
    "batch_id": "batch_id",
    "forecast_time": "forecast_time",
    "input_end_time": "input_end_time",
    "target_time": "target_time",
    "horizon_step": "horizon_step",
    "gatewayMac": "gateway_mac",
    "deviceId": "device_id",
    "pointId": "point_id",
    "pointName": "point_name",
    "predicted_value": "predicted_value",
    "model_name": "model_name",
    "model_version": "model_version",
}


def save_forecast_result(engine, forecast_df) -> int:
    """将 predict_environment 返回的长表写入数据库。

    forecast_df 需包含列 (predict.py 输出的驼峰名):
      batch_id, forecast_time, input_end_time, target_time, horizon_step,
      gatewayMac, deviceId, pointId, pointName, predicted_value,
      model_name, model_version
    写入前自动映射为数据库下划线字段 (gateway_mac/device_id/point_id/point_name)。
    返回写入行数。
    """
    # 兼容: 若输入已是下划线列名, 原样通过; 若是驼峰列, 映射到数据库字段
    if "gatewayMac" in forecast_df.columns:
        required = list(COLUMN_MAP.keys())
        missing = [c for c in required if c not in forecast_df.columns]
        if missing:
            raise ValueError(f"预测结果缺少列: {missing}")
        df = forecast_df[required].copy()
        df = df.rename(columns=COLUMN_MAP)   # 驼峰 -> 下划线
    else:
        # 已按下划线命名, 直接使用
        db_cols = list(COLUMN_MAP.values())
        missing = [c for c in db_cols if c not in forecast_df.columns]
        if missing:
            raise ValueError(f"预测结果缺少列(下划线版): {missing}")
        df = forecast_df[db_cols].copy()

    df["batch_id"] = df["batch_id"].astype(str)
    df["forecast_time"] = pd.to_datetime(df["forecast_time"])
    df["input_end_time"] = pd.to_datetime(df["input_end_time"])
    df["target_time"] = pd.to_datetime(df["target_time"])
    df["horizon_step"] = df["horizon_step"].astype(int)
    df["predicted_value"] = df["predicted_value"].astype(float)

    # 幂等: 先按 batch_id 删除旧结果, 再插入 (避免 UNIQUE 冲突)
    batch = df["batch_id"].iloc[0]
    with engine.begin() as conn:
        conn.execute(text(f"DELETE FROM {FORECAST_TABLE} WHERE batch_id = :b"), {"b": batch})
        df.to_sql(FORECAST_TABLE, con=conn, if_exists="append", index=False,
                  method="multi", chunksize=500)
    return len(df)


if __name__ == "__main__":
    import pandas as pd
    from sqlalchemy import create_engine
    from db_config import DB_CONFIG
    eng = create_engine(
        f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@"
        f"{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}?charset={DB_CONFIG['charset']}"
    )
    init_forecast_table(eng)
    print(f"表 {FORECAST_TABLE} 已确认存在")
