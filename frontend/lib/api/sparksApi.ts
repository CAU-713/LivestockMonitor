/**
 * sparks API 服务层
 * 封装对 /api/sparks/* 端点的调用，返回真实物联网数据。
 */

// ============================================================
// 类型定义
// ============================================================

export interface SparkPoint {
  id: string;
  name: string;
  point_id: string;
  point_name: string;
  device_id: string;
  gateway_mac: string;
  type: string;
  type_name: string;
  value: string;
  unit: string;
  status: string;
  updated_at: string | null;
  created_at: string | null;
}

export interface SparkPointList {
  points: SparkPoint[];
  point_types: string[];
  total: number;
}

export interface SparkHistoryItem {
  point_id: string;
  point_name: string;
  record_time?: string | null;
  created_at?: string | null;
  value?: string | null;
  avg_value?: number | null;
  min_value?: number | null;
  max_value?: number | null;
  sample_count?: number | null;
  device_id: string;
  gateway_mac: string;
}

export interface SparkGateway {
  id: string;
  name: string;
  gateway_mac: string;
  sim_insert: number;
  iccid: string;
  csq: number;
  latitude: number;
  longitude: number;
  updated_at: string | null;
}

export interface SparkDeviceStatus {
  device_id: string;
  gateway_mac: string;
  is_online: boolean;
  loss_rate: number;
  comm_total_cnt: number;
  comm_fail_cnt: number;
  last_comm_time: string | null;
  code: number;
  message: string;
  updated_at: string | null;
}

export interface SparkOverview {
  total_points: number;
  total_gateways: number;
  total_devices: number;
  device_online: boolean;
  device_loss_rate: number;
  last_comm_time: string | null;
  gateway_csq: number;
  gateway_latitude: number;
  gateway_longitude: number;
  gateway_sim_insert: boolean;
}

// ============================================================
// 通用响应格式
// ============================================================

interface ResponseDTO<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

// ============================================================
// 通用请求工具
// ============================================================

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================================
// API 方法
// ============================================================

const BASE = '/api/sparks';

/**
 * 获取所有测点及最新值
 */
export async function getPoints(): Promise<SparkPointList> {
  const res = await apiFetch<ResponseDTO<SparkPointList>>(`${BASE}/points`);
  return res.data;
}

/**
 * 获取单个测点历史数据
 */
export async function getPointHistory(
  pointId: string,
  params?: {
    start?: string;
    end?: string;
    granularity?: 'raw' | 'hour' | 'day';
    limit?: number;
  }
): Promise<SparkHistoryItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.start) searchParams.set('start', params.start);
  if (params?.end) searchParams.set('end', params.end);
  if (params?.granularity) searchParams.set('granularity', params.granularity);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const url = `${BASE}/points/${encodeURIComponent(pointId)}/history${query ? '?' + query : ''}`;
  const res = await apiFetch<ResponseDTO<SparkHistoryItem[]>>(url);
  return res.data;
}

/**
 * 获取多测点历史数据
 */
export async function getMultiPointHistory(params?: {
  point_ids?: string[];
  start?: string;
  end?: string;
  granularity?: 'raw' | 'hour' | 'day';
  limit?: number;
}): Promise<SparkHistoryItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.point_ids?.length) {
    params.point_ids.forEach((id) => searchParams.append('point_ids', id));
  }
  if (params?.start) searchParams.set('start', params.start);
  if (params?.end) searchParams.set('end', params.end);
  if (params?.granularity) searchParams.set('granularity', params.granularity);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const url = `${BASE}/history${query ? '?' + query : ''}`;
  const res = await apiFetch<ResponseDTO<SparkHistoryItem[]>>(url);
  return res.data;
}

/**
 * 获取网关最新状态
 */
export async function getGatewayStatus(): Promise<SparkGateway> {
  const res = await apiFetch<ResponseDTO<SparkGateway>>(`${BASE}/gateway`);
  return res.data;
}

/**
 * 获取设备最新通信状态
 */
export async function getDeviceStatus(): Promise<SparkDeviceStatus> {
  const res = await apiFetch<ResponseDTO<SparkDeviceStatus>>(`${BASE}/device-status`);
  return res.data;
}

/**
 * 获取系统概览统计
 */
export async function getOverview(): Promise<SparkOverview> {
  const res = await apiFetch<ResponseDTO<SparkOverview>>(`${BASE}/overview`);
  return res.data;
}
