# -*- coding: utf-8 -*-
"""长表 → 宽表: 从 device_data_save 读取最近数据, 按 pointId 转成模型宽表
（NH3免历史版：只读取 26 个输入 pointId，不含 NH3 传感器）
依赖: sqlalchemy + pymysql (pip install pymysql)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text

from db_config import DB_CONFIG, GATEWAY_MAC, DEVICE_ID, HISTORY_HOURS

SEQ_LEN = 288
FREQ = "5min"

BASE_DIR = Path(__file__).resolve().parent


def get_engine():
    return create_engine(
        f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@"
        f"{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}?charset={DB_CONFIG['charset']}"
    )


def load_feature_map() -> dict:
    """feature_cols_x.json: ['BGT-N1_黑球北1', ...] -> {pointId: 特征名}
    注意：此处为输入特征（26个，不含NH3）
    """
    with open(BASE_DIR / "feature_cols_x.json", encoding="utf-8") as f:
        feats = json.load(f)
    mapping = {}
    for feat in feats:
        pid, _ = feat.split("_", 1) if "_" in feat else (feat, feat)
        mapping[pid] = feat
    return mapping


def load_wide_history(engine, gateway_mac: str = GATEWAY_MAC, device_id: str = DEVICE_ID,
                      history_hours: int = HISTORY_HOURS) -> pd.DataFrame:
    """从 device_data_save 长表读取并转为 288行×26特征 宽表 (含 '时间' 列)

    步骤:
      1. 查询最近 history_hours 小时内, 模型所需 26 个 pointId 的记录
      2. value(varchar) 转数值
      3. created_at 向下取整到 5 分钟
      4. pivot: 行=时间, 列=pointId
      5. 补齐连续 5min 时间戳, 短缺口前向填充+插值, 长缺口(>30min)中断
      6. 列重命名 pointId -> 特征名, 取最新连续 288 行

    返回: DataFrame[时间, 26特征], 时间严格连续5min
    若数据不足/长缺口无法满足288行, 抛 ValueError
    """
    feat_map = load_feature_map()
    pids = list(feat_map.keys())

    sql = f"""
        SELECT created_at, pointId, value
        FROM device_data_save
        WHERE pointId IN ({','.join([':p' + str(i) for i in range(len(pids))])})
          AND created_at >= NOW() - INTERVAL {int(history_hours)} HOUR
    """
    params = {f"p{i}": pid for i, pid in enumerate(pids)}
    if gateway_mac:
        sql += " AND gatewayMac = :gw"
        params["gw"] = gateway_mac
    if device_id:
        sql += " AND deviceId = :dv"
        params["dv"] = device_id

    with engine.connect() as conn:
        df = pd.read_sql(text(sql), conn, params=params)

    if df.empty:
        raise ValueError("device_data_save 中无数据（检查 gatewayMac/deviceId/pointId）")

    df["created_at"] = pd.to_datetime(df["created_at"])
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df = df.dropna(subset=["value"])

    # 时间向下取整到 5 分钟
    df["ts"] = df["created_at"].dt.floor(FREQ)

    # 同一 ts+pointId 可能有多条(秒级), 取均值
    wide = (df.groupby(["ts", "pointId"])["value"].mean()
              .unstack(fill_value=np.nan))

    # 只保留模型所需 pointId, 并按特征顺序排列
    missing_pid = [p for p in pids if p not in wide.columns]
    if missing_pid:
        raise ValueError(f"device_data_save 缺少 pointId: {missing_pid}")
    wide = wide[pids].rename(columns=feat_map)

    # 补齐连续 5min 时间戳
    full_idx = pd.date_range(wide.index.min(), wide.index.max(), freq=FREQ)
    wide = wide.reindex(full_idx)

    # 缺失处理: 连续缺失 <=6 个(30min) 前向填充+线性插值; 长缺口检测
    miss = wide.isna().any(axis=1)
    groups = miss.ne(miss.shift(fill_value=False)).cumsum()

    long_gap = []
    for gid, sub in miss.groupby(groups):
        if sub.any() and len(sub) > 6:
            long_gap.append((sub.index[0], sub.index[-1]))
    if long_gap:
        raise ValueError(f"历史数据存在>30min长缺口, 拒绝预测: {long_gap[:3]}")

    wide = wide.ffill().interpolate(method="linear", limit_direction="both")

    # 取最新 288 行 (数据不足则报错)
    if len(wide) < SEQ_LEN:
        raise ValueError(f"数据仅 {len(wide)} 行, 不足 {SEQ_LEN} 行")
    wide = wide.tail(SEQ_LEN)

    # 全0行检查
    zero_rows = (wide == 0).all(axis=1)
    if zero_rows.any():
        bad = wide.index[zero_rows].astype(str).tolist()[:5]
        raise ValueError(f"检测到全0故障行, 拒绝预测: {bad}")

    out = wide.reset_index().rename(columns={"index": "时间"})
    return out


if __name__ == "__main__":
    eng = get_engine()
    df = load_wide_history(eng)
    print("宽表 shape:", df.shape)
    print("时间:", df["时间"].iloc[0], "~", df["时间"].iloc[-1])
    print("列:", list(df.columns)[:5], "...")
