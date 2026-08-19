/**
 * 环境时序预测 API
 * 封装对 /api/forecast/* 端点的调用
 */

import type { ForecastOverview, ForecastBatchSummary } from '@/types/forecast';

interface ResponseDTO<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${response.status}`);
  }
  return response.json();
}

const BASE = '/api/forecast';

/**
 * 获取环境预测展示数据（最新批次 + 未来6小时预测明细 + 设备/数据状态）
 */
export async function getForecastOverview(): Promise<ForecastOverview> {
  const res = await apiFetch<ResponseDTO<ForecastOverview>>(`${BASE}/overview`);
  return res.data;
}

/**
 * 获取最近预测批次列表
 */
export async function getForecastBatches(
  limit = 20
): Promise<ForecastBatchSummary[]> {
  const res = await apiFetch<ResponseDTO<ForecastBatchSummary[]>>(
    `${BASE}/batches?limit=${limit}`
  );
  return res.data;
}
