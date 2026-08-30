# -*- coding: utf-8 -*-
"""羊舍环境 NH3免历史 XLinear(26->27) 纯预测函数。

输入：已经按 5 分钟聚合的宽表 DataFrame（不含NH3，26个特征），至少包含最近连续 288 行。
输出：未来 72 个 5 分钟点 × 27 个变量（含NH3）的长表 DataFrame（共 1944 行）。

推荐目录结构：
pred_nh3_部署/
├─ predict.py
├─ feature_cols_x.json   # 输入特征(26, 不含NH3)
├─ feature_cols_y.json   # 输出特征(27, 含NH3)
├─ scaler_x.pkl          # 输入标准化(26维)
├─ scaler_y.pkl          # 输出标准化(27维)
└─ models/
   └─ XLinear_s0.pt
"""

from __future__ import annotations

import json
import pickle
import uuid
from pathlib import Path
from typing import Optional, Union

import numpy as np
import pandas as pd
import torch
import torch.nn as nn


SEQ_LEN = 288
PRED_LEN = 72
FREQ = "5min"
MODEL_NAME = "XLinear"
MODEL_VERSION = "xlinear_nh3_26to27_v1"
DEFAULT_TIME_COLUMNS = ("时间", "created_at", "timestamp", "time")


class XLinearNH3(nn.Module):
    """必须与训练时的 XLinearNH3 网络结构完全一致。
    26输入特征 -> 27输出特征:
      减均值 -> 特征投影(26->27) -> 共享Linear(seq->pred) -> 加回投影均值
    """

    def __init__(self, seq_len: int = SEQ_LEN, pred_len: int = PRED_LEN,
                 n_in: int = 26, n_out: int = 27):
        super().__init__()
        self.proj = nn.Linear(n_in, n_out)
        self.Linear = nn.Linear(seq_len, pred_len)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [batch, seq_len, n_in]
        sm = x.mean(dim=1, keepdim=True).detach()     # [B,1,n_in]
        h = self.proj(x - sm)                          # [B,S,n_out]
        h_mean = self.proj(sm)                         # [B,1,n_out]
        out = self.Linear(h.permute(0, 2, 1)).permute(0, 2, 1)
        return out + h_mean


class EnvironmentPredictor:
    """加载一次模型，之后可以重复调用 predict()。"""

    def __init__(
        self,
        asset_dir: Optional[Union[str, Path]] = None,
        model_path: Optional[Union[str, Path]] = None,
        scaler_x_path: Optional[Union[str, Path]] = None,
        scaler_y_path: Optional[Union[str, Path]] = None,
        feature_x_path: Optional[Union[str, Path]] = None,
        feature_y_path: Optional[Union[str, Path]] = None,
        device: str = "cpu",
    ) -> None:
        base = Path(asset_dir) if asset_dir else Path(__file__).resolve().parent
        self.model_path = Path(model_path) if model_path else base / "models" / "XLinear_s0.pt"
        self.scaler_x_path = Path(scaler_x_path) if scaler_x_path else base / "scaler_x.pkl"
        self.scaler_y_path = Path(scaler_y_path) if scaler_y_path else base / "scaler_y.pkl"
        self.feature_x_path = Path(feature_x_path) if feature_x_path else base / "feature_cols_x.json"
        self.feature_y_path = Path(feature_y_path) if feature_y_path else base / "feature_cols_y.json"
        self.device = torch.device(device)

        self._check_asset_files()

        with self.feature_x_path.open("r", encoding="utf-8") as f:
            self.features_x = json.load(f)
        with self.feature_y_path.open("r", encoding="utf-8") as f:
            self.features_y = json.load(f)

        if len(self.features_x) != 26:
            raise ValueError(f"feature_cols_x.json 应包含26个输入特征，实际为{len(self.features_x)}个")
        if len(self.features_y) != 27:
            raise ValueError(f"feature_cols_y.json 应包含27个输出特征，实际为{len(self.features_y)}个")
        if len(set(self.features_x)) != len(self.features_x):
            raise ValueError("feature_cols_x.json 中存在重复特征")
        if len(set(self.features_y)) != len(self.features_y):
            raise ValueError("feature_cols_y.json 中存在重复特征")

        with self.scaler_x_path.open("rb") as f:
            self.scaler_x = pickle.load(f)
        with self.scaler_y_path.open("rb") as f:
            self.scaler_y = pickle.load(f)

        sx_features = getattr(self.scaler_x, "n_features_in_", None)
        if sx_features is not None and int(sx_features) != len(self.features_x):
            raise ValueError(
                f"scaler_x特征数为{sx_features}，feature_cols_x.json为{len(self.features_x)}，二者不一致"
            )
        sy_features = getattr(self.scaler_y, "n_features_in_", None)
        if sy_features is not None and int(sy_features) != len(self.features_y):
            raise ValueError(
                f"scaler_y特征数为{sy_features}，feature_cols_y.json为{len(self.features_y)}，二者不一致"
            )

        self.model = XLinearNH3(SEQ_LEN, PRED_LEN, len(self.features_x), len(self.features_y)).to(self.device)
        checkpoint = self._load_checkpoint()
        state_dict = checkpoint.get("state_dict", checkpoint)
        self.model.load_state_dict(state_dict, strict=True)
        self.model.eval()

        ckpt_x = checkpoint.get("feat_names_x") if isinstance(checkpoint, dict) else None
        if ckpt_x is not None and list(ckpt_x) != self.features_x:
            raise ValueError("模型检查点中的输入特征顺序与 feature_cols_x.json 不一致")
        ckpt_y = checkpoint.get("feat_names_y") if isinstance(checkpoint, dict) else None
        if ckpt_y is not None and list(ckpt_y) != self.features_y:
            raise ValueError("模型检查点中的输出特征顺序与 feature_cols_y.json 不一致")

    def _check_asset_files(self) -> None:
        for path in (self.model_path, self.scaler_x_path, self.scaler_y_path,
                     self.feature_x_path, self.feature_y_path):
            if not path.is_file():
                raise FileNotFoundError(f"缺少部署文件：{path}")

    def _load_checkpoint(self) -> dict:
        try:
            # 新版本 PyTorch 优先使用安全的 weights_only 模式。
            return torch.load(self.model_path, map_location=self.device, weights_only=True)
        except TypeError:
            # 兼容不支持 weights_only 参数的旧版本 PyTorch。
            return torch.load(self.model_path, map_location=self.device)

    @staticmethod
    def _find_time_column(df: pd.DataFrame, time_col: Optional[str]) -> str:
        if time_col is not None:
            if time_col not in df.columns:
                raise ValueError(f"指定的时间列不存在：{time_col}")
            return time_col

        found = [c for c in DEFAULT_TIME_COLUMNS if c in df.columns]
        if not found:
            raise ValueError(
                "未找到时间列，请使用 时间、created_at、timestamp、time，或通过 time_col 指定"
            )
        return found[0]

    def _prepare_input(
        self,
        history_df: pd.DataFrame,
        time_col: Optional[str],
    ) -> tuple[pd.DataFrame, str]:
        if not isinstance(history_df, pd.DataFrame):
            raise TypeError("history_df 必须是 pandas.DataFrame")
        if history_df.empty:
            raise ValueError("history_df 为空")

        time_col = self._find_time_column(history_df, time_col)
        missing = [f for f in self.features_x if f not in history_df.columns]
        if missing:
            raise ValueError(f"缺少模型输入特征列：{missing}")

        data = history_df[[time_col] + self.features_x].copy()
        data[time_col] = pd.to_datetime(data[time_col], errors="coerce")
        if data[time_col].isna().any():
            bad_count = int(data[time_col].isna().sum())
            raise ValueError(f"时间列中有{bad_count}个值无法解析")

        if data[time_col].duplicated().any():
            duplicated = data.loc[data[time_col].duplicated(), time_col].astype(str).tolist()[:5]
            raise ValueError(f"存在重复时间戳，例如：{duplicated}")

        data = data.sort_values(time_col).reset_index(drop=True)
        if len(data) < SEQ_LEN:
            raise ValueError(f"至少需要{SEQ_LEN}行5分钟数据，当前只有{len(data)}行")

        # 输入可以多于288行，预测时仅使用最新的连续288行。
        data = data.tail(SEQ_LEN).reset_index(drop=True)

        expected_times = pd.date_range(
            start=data[time_col].iloc[0], periods=SEQ_LEN, freq=FREQ
        )
        actual_times = pd.DatetimeIndex(data[time_col])
        if not actual_times.equals(expected_times):
            delta = data[time_col].diff().dropna()
            bad = data.loc[delta.ne(pd.Timedelta(FREQ)).reindex(data.index, fill_value=False), time_col]
            examples = bad.astype(str).tolist()[:5]
            raise ValueError(
                f"最近{SEQ_LEN}行时间不连续，必须严格每5分钟一行；异常位置示例：{examples}"
            )

        for feature in self.features_x:
            data[feature] = pd.to_numeric(data[feature], errors="coerce")

        if data[self.features_x].isna().any().any():
            counts = data[self.features_x].isna().sum()
            bad_cols = counts[counts > 0].to_dict()
            raise ValueError(f"输入含缺失或非数值数据：{bad_cols}")

        values = data[self.features_x].to_numpy(dtype=np.float64)
        if not np.isfinite(values).all():
            raise ValueError("输入含无穷大或非法数值")

        all_zero_rows = np.all(values == 0, axis=1)
        if all_zero_rows.any():
            bad_times = data.loc[all_zero_rows, time_col].astype(str).tolist()[:5]
            raise ValueError(f"检测到设备整行全0故障，拒绝预测；示例时间：{bad_times}")

        return data, time_col

    @staticmethod
    def _clip_physical_ranges(pred_raw: np.ndarray, features: list[str]) -> np.ndarray:
        clipped = pred_raw.copy()
        for i, feature in enumerate(features):
            if "HUM" in feature:
                clipped[:, i] = np.clip(clipped[:, i], 0.0, 100.0)
            elif "TEM" in feature:
                clipped[:, i] = np.clip(clipped[:, i], -20.0, 60.0)
            elif "BGT" in feature:
                clipped[:, i] = np.clip(clipped[:, i], -20.0, 80.0)
            else:
                clipped[:, i] = np.clip(clipped[:, i], 0.0, None)
        return clipped

    def predict(
        self,
        history_df: pd.DataFrame,
        gateway_mac: str = "",
        device_id: str = "",
        time_col: Optional[str] = None,
        forecast_time: Optional[Union[str, pd.Timestamp]] = None,
        batch_id: Optional[str] = None,
        model_version: str = MODEL_VERSION,
    ) -> pd.DataFrame:
        """预测未来6小时并返回数据库友好的长表。

        Parameters
        ----------
        history_df:
            已经按5分钟聚合的宽表。至少288行，必须包含时间列和26个输入特征列(不含NH3)。
        gateway_mac, device_id:
            原始设备标识，将原样写入输出。
        time_col:
            时间列名称；不传时自动识别。
        forecast_time:
            本次模型执行时间；不传则使用当前本地时间。
        batch_id:
            本次预测批次；不传则自动生成UUID。
        model_version:
            部署模型版本号。
        """
        data, time_col = self._prepare_input(history_df, time_col)
        input_end_time = pd.Timestamp(data[time_col].iloc[-1])

        raw = data[self.features_x].to_numpy(dtype=np.float64)
        scaled = self.scaler_x.transform(raw).astype(np.float32)
        x = torch.from_numpy(scaled).unsqueeze(0).to(self.device)

        with torch.inference_mode():
            pred_scaled = self.model(x).squeeze(0).cpu().numpy()

        if pred_scaled.shape != (PRED_LEN, len(self.features_y)):
            raise RuntimeError(
                f"模型输出形状错误：{pred_scaled.shape}，期望({PRED_LEN}, {len(self.features_y)})"
            )

        pred_raw = self.scaler_y.inverse_transform(pred_scaled)
        pred_raw = self._clip_physical_ranges(pred_raw, self.features_y)

        target_times = pd.date_range(
            start=input_end_time + pd.Timedelta(FREQ), periods=PRED_LEN, freq=FREQ
        )
        forecast_time = (
            pd.Timestamp.now().floor("s")
            if forecast_time is None
            else pd.Timestamp(forecast_time)
        )
        batch_id = batch_id or uuid.uuid4().hex

        rows = []
        for step, target_time in enumerate(target_times, start=1):
            for feature_index, feature in enumerate(self.features_y):
                point_id, point_name = self._split_feature_name(feature)
                rows.append(
                    {
                        "batch_id": batch_id,
                        "forecast_time": forecast_time,
                        "input_end_time": input_end_time,
                        "target_time": target_time,
                        "horizon_step": step,
                        "gatewayMac": str(gateway_mac),
                        "deviceId": str(device_id),
                        "pointId": point_id,
                        "pointName": point_name,
                        "predicted_value": float(pred_raw[step - 1, feature_index]),
                        "model_name": MODEL_NAME,
                        "model_version": model_version,
                    }
                )

        result = pd.DataFrame(rows)
        expected_rows = PRED_LEN * len(self.features_y)
        if len(result) != expected_rows:
            raise RuntimeError(f"预测结果应为{expected_rows}行，实际为{len(result)}行")
        return result

    @staticmethod
    def _split_feature_name(feature: str) -> tuple[str, str]:
        if "_" not in feature:
            return feature, feature
        point_id, point_name = feature.split("_", 1)
        return point_id, point_name


_DEFAULT_PREDICTOR: Optional[EnvironmentPredictor] = None


def predict_environment(
    history_df: pd.DataFrame,
    gateway_mac: str = "",
    device_id: str = "",
    *,
    time_col: Optional[str] = None,
    forecast_time: Optional[Union[str, pd.Timestamp]] = None,
    batch_id: Optional[str] = None,
    asset_dir: Optional[Union[str, Path]] = None,
) -> pd.DataFrame:
    """便捷入口：首次调用加载模型，后续调用复用同一模型对象。"""
    global _DEFAULT_PREDICTOR

    if _DEFAULT_PREDICTOR is None:
        _DEFAULT_PREDICTOR = EnvironmentPredictor(asset_dir=asset_dir)

    return _DEFAULT_PREDICTOR.predict(
        history_df=history_df,
        gateway_mac=gateway_mac,
        device_id=device_id,
        time_col=time_col,
        forecast_time=forecast_time,
        batch_id=batch_id,
    )


if __name__ == "__main__":
    # 本地演示：部署目录中准备 demo_input.csv 后执行 python predict.py
    base_dir = Path(__file__).resolve().parent
    input_path = base_dir / "demo_input.csv"
    output_path = base_dir / "demo_output.csv"

    if not input_path.is_file():
        raise FileNotFoundError(f"未找到演示输入：{input_path}")

    demo_df = pd.read_csv(input_path)
    demo_output = predict_environment(
        demo_df,
        gateway_mac="4529ecf8d0b5",
        device_id="PLC",
        asset_dir=base_dir,
    )
    demo_output.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"预测完成：{len(demo_output)}行 -> {output_path}")
