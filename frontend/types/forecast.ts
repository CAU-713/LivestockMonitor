/**
 * 环境时序预测 · 类型定义
 * 与后端 /api/forecast/overview 返回结构对应
 */

export interface ForecastBatch {
  batch_id: string;
  forecast_time: string | null;
  input_end_time: string | null;
  model_name: string;
  model_version: string;
  rows: number;
  target_start: string | null;
  target_end: string | null;
}

export interface ForecastPoint {
  target_time: string | null;
  horizon_step: number;
  point_id: string;
  point_name: string;
  predicted_value: number;
}

export interface ForecastHistoryPoint {
  time: string | null;
  point_id: string;
  point_name: string;
  value: number;
}

export interface DeviceStatus {
  is_online: boolean;
  last_comm_time: string | null;
  /** 27 个环境点最后一次出现非 0 值的时间；为 null 表示从未有有效数据 */
  last_nonzero_at: string | null;
}

export interface ForecastOverview {
  batch: ForecastBatch | null;
  history: ForecastHistoryPoint[];
  forecast: ForecastPoint[];
  device: DeviceStatus;
}

export interface ForecastBatchSummary {
  batch_id: string;
  forecast_time: string | null;
  input_end_time: string | null;
  model_name: string | null;
  model_version: string | null;
  rows: number;
  target_start: string | null;
  target_end: string | null;
}

/** 可选预测模型列表（value 对应 device_forecast_save.model_version） */
export const FORECAST_MODELS = [
  { value: 'xlinear_s0_final_v1', label: '环境全变量预测' },
  { value: 'xlinear_nh3_26to27_v1', label: '氨气预测' },
] as const;
