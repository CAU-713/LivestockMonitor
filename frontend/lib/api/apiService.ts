/**
 * 统一 API 服务层
 * 封装所有后端 API 调用，调用失败时 fallback 到 mock 数据
 */

import {
  mockSheds,
  mockSensors,
  mockCameras,
  mockUsers,
  mockAlertRules,
  mockHourlyChartData,
  mockDailyChartData,
  mockSensorRecords,
} from '@/constants/mockData';
import type { Shed, Sensor, Camera, User, AlertRule, MergedChartData, Alert, AlertStats, AnimalRecord, AnimalStats } from '@/types';

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
// 后端响应格式（统一 ResponseDTO）
// ============================================================

interface ResponseDTO<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

interface ListResponseData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================
// 类型映射：后端 DTO → 前端 Type
// ============================================================

interface ShedDTO {
  id: number;
  name: string;
  location: string;
  livestock_count: number;
  area?: number;
  status: string;
  type?: number;
  description?: string;
}

interface SensorDTO {
  id: number;
  name: string;
  shed_id: number;
  pen_id?: number;
  type: string;
  status: string;
  last_reading?: number;
  location?: string;
}

interface CameraDTO {
  id: number;
  name: string;
  shed_id: number;
  pen_id?: number;
  status: string;
  stream_url: string;
  thumbnail_url: string;
  location?: string;
}

interface UserDTO {
  id: number;
  name: string;
  role: number;
}

interface AlertRuleDTO {
  id: string;
  name: string;
  sensor_name: string;
  rule_type: string;
  condition: string;
  threshold: number;
  notification_method: string;
  enabled: boolean;
  description?: string;
}

function mapShed(dto: ShedDTO): Shed {
  return {
    id: String(dto.id),
    name: dto.name,
    location: dto.location,
    livestockCount: dto.livestock_count,
    area: dto.area,
  };
}

function mapSensor(dto: SensorDTO): Sensor {
  return {
    id: String(dto.id),
    name: dto.name,
    shedId: String(dto.shed_id),
    penId: dto.pen_id ? String(dto.pen_id) : '',
    type: dto.type as Sensor['type'],
    status: dto.status as Sensor['status'],
    lastReading: dto.last_reading,
  };
}

function mapCamera(dto: CameraDTO): Camera {
  return {
    id: String(dto.id),
    name: dto.name,
    shedId: String(dto.shed_id),
    penId: dto.pen_id ? String(dto.pen_id) : undefined,
    status: dto.status as Camera['status'],
    streamUrl: dto.stream_url,
    thumbnailUrl: dto.thumbnail_url,
  };
}

function mapUser(dto: UserDTO): User {
  const roleMap: Record<number, 'admin' | 'user' | 'visitor'> = {
    0: 'admin',
    1: 'visitor',
    2: 'user',
  };
  return {
    id: String(dto.id),
    username: dto.name,
    email: '',
    role: roleMap[dto.role] ?? 'visitor',
    status: 'active',
    createdAt: '',
  };
}

function mapAlertRule(dto: AlertRuleDTO): AlertRule {
  return {
    id: dto.id,
    name: dto.name,
    sensorName: dto.sensor_name,
    ruleType: dto.rule_type as AlertRule['ruleType'],
    condition: dto.condition as AlertRule['condition'],
    threshold: dto.threshold,
    notificationMethod: dto.notification_method as AlertRule['notificationMethod'],
    enabled: dto.enabled,
  };
}

// ============================================================
// 羊舍 API
// ============================================================

export const shedApi = {
  async getSheds(): Promise<Shed[]> {
    try {
      const res = await apiFetch<ResponseDTO<ListResponseData<ShedDTO>>>('/api/sheds?page=1&page_size=100');
      if (res.success && res.data?.items) {
        return res.data.items.map(mapShed);
      }
      return mockSheds;
    } catch (e) {
      console.warn('[shedApi.getSheds] fallback to mock', e);
      return mockSheds;
    }
  },

  async createShed(data: Omit<ShedDTO, 'id'>): Promise<ShedDTO> {
    const res = await apiFetch<ResponseDTO<ShedDTO>>('/api/sheds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateShed(id: number, data: Partial<ShedDTO>): Promise<ShedDTO> {
    const res = await apiFetch<ResponseDTO<ShedDTO>>(`/api/sheds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteShed(id: number): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/sheds/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// 传感器 API
// ============================================================

export const sensorApi = {
  async getSensors(params?: { shed_id?: number; page_size?: number }): Promise<Sensor[]> {
    try {
      const query = new URLSearchParams();
      if (params?.shed_id) query.set('shed_id', String(params.shed_id));
      query.set('page_size', String(params?.page_size ?? 200));

      const res = await apiFetch<ResponseDTO<ListResponseData<SensorDTO>>>(`/api/sensors?${query}`);
      if (res.success && res.data?.items) {
        return res.data.items.map(mapSensor);
      }
      return mockSensors;
    } catch (e) {
      console.warn('[sensorApi.getSensors] fallback to mock', e);
      return mockSensors;
    }
  },

  async createSensor(data: Omit<SensorDTO, 'id'>): Promise<SensorDTO> {
    const res = await apiFetch<ResponseDTO<SensorDTO>>('/api/sensors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateSensor(id: number, data: Partial<SensorDTO>): Promise<SensorDTO> {
    const res = await apiFetch<ResponseDTO<SensorDTO>>(`/api/sensors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteSensor(id: number): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/sensors/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// 摄像头 API
// ============================================================

export const cameraApi = {
  async getCameras(params?: { shed_id?: number }): Promise<Camera[]> {
    try {
      const query = new URLSearchParams({ page_size: '200' });
      if (params?.shed_id) query.set('shed_id', String(params.shed_id));

      const res = await apiFetch<ResponseDTO<ListResponseData<CameraDTO>>>(`/api/cameras?${query}`);
      if (res.success && res.data?.items) {
        return res.data.items.map(mapCamera);
      }
      return mockCameras;
    } catch (e) {
      console.warn('[cameraApi.getCameras] fallback to mock', e);
      return mockCameras;
    }
  },

  async createCamera(data: Omit<CameraDTO, 'id'>): Promise<CameraDTO> {
    const res = await apiFetch<ResponseDTO<CameraDTO>>('/api/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateCamera(id: number, data: Partial<CameraDTO>): Promise<CameraDTO> {
    const res = await apiFetch<ResponseDTO<CameraDTO>>(`/api/cameras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteCamera(id: number): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/cameras/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// 用户 API
// ============================================================

export const userApi = {
  async getUsers(): Promise<User[]> {
    try {
      const res = await apiFetch<UserDTO[]>('/api/users');
      if (Array.isArray(res)) {
        return res.map(mapUser);
      }
      return mockUsers;
    } catch (e) {
      console.warn('[userApi.getUsers] fallback to mock', e);
      return mockUsers;
    }
  },

  async createUser(data: { name: string; password: string; role: number }): Promise<UserDTO> {
    return apiFetch<UserDTO>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: number, data: { name?: string; password?: string; role?: number }): Promise<UserDTO> {
    return apiFetch<UserDTO>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: number): Promise<void> {
    await apiFetch<{ ok: boolean }>(`/api/users/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// 历史数据 API
// ============================================================

interface SensorHistoryItem {
  sensor_id: string;
  shed_id: string;
  sensor_name: string;
  sensor_type: string;
  unit: string;
  data: { time: string; value: number }[];
}

export interface SensorHistoryResult {
  sensorId: string;
  shedId: string;
  sensorName: string;
  sensorType: string;
  unit: string;
  data: { time: string; value: number }[];
}

export const historyApi = {
  async getSensorHistory(params: {
    shed_ids?: number[];
    sensor_types?: string[];
    start?: string;
    end?: string;
    granularity?: 'raw' | 'hour' | 'day';
  }): Promise<SensorHistoryResult[]> {
    try {
      const query = new URLSearchParams();
      if (params.shed_ids?.length) {
        params.shed_ids.forEach((id) => query.append('shed_ids', String(id)));
      }
      if (params.sensor_types?.length) {
        params.sensor_types.forEach((t) => query.append('sensor_types', t));
      }
      if (params.start) query.set('start', params.start);
      if (params.end) query.set('end', params.end);
      if (params.granularity) query.set('granularity', params.granularity);

      const res = await apiFetch<ResponseDTO<SensorHistoryItem[]>>(`/api/history/sensor-data?${query}`);
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((item) => ({
          sensorId: item.sensor_id,
          shedId: item.shed_id,
          sensorName: item.sensor_name,
          sensorType: item.sensor_type,
          unit: item.unit,
          data: item.data,
        }));
      }
      return [];
    } catch (e) {
      console.warn('[historyApi.getSensorHistory] API failed', e);
      return [];
    }
  },
};

// ============================================================
// 告警规则 API
// ============================================================

export const alertRuleApi = {
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const res = await apiFetch<ResponseDTO<{ rules: AlertRuleDTO[] }>>('/api/alert-rules');
      if (res.success && res.data?.rules) {
        return res.data.rules.map(mapAlertRule);
      }
      return mockAlertRules;
    } catch (e) {
      console.warn('[alertRuleApi.getAlertRules] fallback to mock', e);
      return mockAlertRules;
    }
  },

  async createAlertRule(data: Omit<AlertRuleDTO, 'id'>): Promise<AlertRuleDTO> {
    const res = await apiFetch<ResponseDTO<AlertRuleDTO>>('/api/alert-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateAlertRule(id: string, data: Partial<AlertRuleDTO>): Promise<AlertRuleDTO> {
    const res = await apiFetch<ResponseDTO<AlertRuleDTO>>(`/api/alert-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteAlertRule(id: string): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/alert-rules/${id}`, { method: 'DELETE' });
  },

  async toggleAlertRule(id: string, enabled: boolean): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/alert-rules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  },
};

// ============================================================
// 告警中心 API
// ============================================================

export const alertApi = {
  async getAlerts(params?: {
    shed_id?: number;
    severity?: string;
    resolved?: boolean;
    start_time?: string;
    end_time?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Alert[]; total: number; page: number; page_size: number }> {
    const query = new URLSearchParams();
    if (params?.shed_id != null) query.set('shed_id', String(params.shed_id));
    if (params?.severity) query.set('severity', params.severity);
    if (params?.resolved != null) query.set('resolved', String(params.resolved));
    if (params?.start_time) query.set('start_time', params.start_time);
    if (params?.end_time) query.set('end_time', params.end_time);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));

    const res = await apiFetch<ResponseDTO<ListResponseData<Alert>>>(`/api/alerts?${query}`);
    return res.data;
  },

  async getStats(): Promise<AlertStats> {
    const res = await apiFetch<ResponseDTO<AlertStats>>('/api/alerts/stats');
    return res.data;
  },

  async createAlert(data: {
    shed_id: number;
    pen_id?: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }): Promise<Alert> {
    const res = await apiFetch<ResponseDTO<Alert>>('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async resolveAlert(id: number, resolved_by: string): Promise<Alert> {
    const res = await apiFetch<ResponseDTO<Alert>>(`/api/alerts/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved_by }),
    });
    return res.data;
  },

  async deleteAlert(id: number): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/alerts/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// 动物档案 API
// ============================================================

export const animalApi = {
  async getAnimals(params?: {
    shed_id?: number;
    health_status?: string;
    gender?: string;
    breed?: string;
    production_type?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: AnimalRecord[]; total: number; page: number; page_size: number }> {
    const query = new URLSearchParams();
    if (params?.shed_id) query.set('shed_id', String(params.shed_id));
    if (params?.health_status) query.set('health_status', params.health_status);
    if (params?.gender) query.set('gender', params.gender);
    if (params?.breed) query.set('breed', params.breed);
    if (params?.production_type) query.set('production_type', params.production_type);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));

    const res = await apiFetch<ResponseDTO<ListResponseData<AnimalRecord>>>(`/api/animals?${query}`);
    return res.data;
  },

  async getStats(): Promise<AnimalStats> {
    const res = await apiFetch<ResponseDTO<AnimalStats>>('/api/animals/stats');
    return res.data;
  },

  async getAnimal(id: number): Promise<AnimalRecord> {
    const res = await apiFetch<ResponseDTO<AnimalRecord>>(`/api/animals/${id}`);
    return res.data;
  },

  async createAnimal(data: Omit<AnimalRecord, 'id' | 'shed_name'>): Promise<AnimalRecord> {
    const res = await apiFetch<ResponseDTO<AnimalRecord>>('/api/animals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateAnimal(id: number, data: Partial<Omit<AnimalRecord, 'id' | 'shed_name'>>): Promise<AnimalRecord> {
    const res = await apiFetch<ResponseDTO<AnimalRecord>>(`/api/animals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateHealthStatus(id: number, health_status: string): Promise<AnimalRecord> {
    const res = await apiFetch<ResponseDTO<AnimalRecord>>(`/api/animals/${id}/health`, {
      method: 'PATCH',
      body: JSON.stringify({ health_status }),
    });
    return res.data;
  },

  async deleteAnimal(id: number): Promise<void> {
    await apiFetch<ResponseDTO<null>>(`/api/animals/${id}`, { method: 'DELETE' });
  },

  async getBreedingAnimals(): Promise<AnimalRecord[]> {
    const res = await apiFetch<ResponseDTO<ListResponseData<AnimalRecord>>>('/api/animals/breeding?page_size=500');
    return res.data.items;
  },

  async updateBreedingStatus(id: number, data: {
    breeding_status?: string;
    mating_date?: string;
    delivery_date?: string;
    sire_id?: string;
  }): Promise<AnimalRecord> {
    const res = await apiFetch<ResponseDTO<AnimalRecord>>(`/api/animals/${id}/breeding`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

// ============================================================
// 健康数据 API
// ============================================================

export const healthApi = {
  // 体重
  async getWeightRecords(params: { animal_id: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams({ animal_id: String(params.animal_id) });
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<any>>>(`/api/health/weight?${q}`);
    return res.data;
  },

  async createWeightRecord(data: { animal_id: number; record_date: string; weighing_time: string; weight_kg: number }) {
    const res = await apiFetch<ResponseDTO<any>>('/api/health/weight', { method: 'POST', body: JSON.stringify(data) });
    return res.data;
  },

  async getWeightTrend(animal_id: number) {
    const res = await apiFetch<ResponseDTO<any>>(`/api/health/trend/${animal_id}`);
    return res.data;
  },

  // 体温
  async getTemperatureRecords(params: { animal_id: number; page?: number; page_size?: number }) {
    const q = new URLSearchParams({ animal_id: String(params.animal_id) });
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<any>>>(`/api/health/temperature?${q}`);
    return res.data;
  },

  async createTemperatureRecord(data: any) {
    const res = await apiFetch<ResponseDTO<any>>('/api/health/temperature', { method: 'POST', body: JSON.stringify(data) });
    return res.data;
  },

  // 呼吸
  async getRespirationRecords(params: { animal_id: number; page?: number; page_size?: number }) {
    const q = new URLSearchParams({ animal_id: String(params.animal_id) });
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<any>>>(`/api/health/respiration?${q}`);
    return res.data;
  },

  async createRespirationRecord(data: { animal_id: number; record_date: string; monitoring_time: string; respiratory_rate_per_minute: number }) {
    const res = await apiFetch<ResponseDTO<any>>('/api/health/respiration', { method: 'POST', body: JSON.stringify(data) });
    return res.data;
  },

  // 血清
  async getSerumRecords(params: { animal_id: number; page?: number; page_size?: number }) {
    const q = new URLSearchParams({ animal_id: String(params.animal_id) });
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<any>>>(`/api/health/serum?${q}`);
    return res.data;
  },

  async createSerumRecord(data: any) {
    const res = await apiFetch<ResponseDTO<any>>('/api/health/serum', { method: 'POST', body: JSON.stringify(data) });
    return res.data;
  },
};

// ============================================================
// 行为监控 API
// ============================================================

export const behaviorApi = {
  async getLatest(camera_id: number) {
    const res = await apiFetch<ResponseDTO<any>>(`/api/behavior/latest?camera_id=${camera_id}`);
    return res.data;
  },

  async getRecords(params: { camera_id: number; start_time?: string; end_time?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams({ camera_id: String(params.camera_id) });
    if (params.start_time) q.set('start_time', params.start_time);
    if (params.end_time) q.set('end_time', params.end_time);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<any>>>(`/api/behavior/records?${q}`);
    return res.data;
  },

  async getTrend(camera_id: number, hours: number = 24) {
    const res = await apiFetch<ResponseDTO<any>>(`/api/behavior/trend?camera_id=${camera_id}&hours=${hours}`);
    return res.data;
  },
};

// ============================================================
// 疫病防治 API
// ============================================================

export interface VaccinationRecord {
  id: number;
  animal_id: number;
  vaccine_name: string;
  batch_number?: string;
  vaccination_date: string;
  next_due_date?: string;
  dose_ml?: number;
  vaccinator?: string;
  notes?: string;
}

export interface MedicationRecord {
  id: number;
  animal_id: number;
  disease_name: string;
  drug_name: string;
  dosage?: string;
  treatment_start: string;
  treatment_end?: string;
  vet_name?: string;
  outcome?: string;
  notes?: string;
}

export interface DewormingRecord {
  id: number;
  animal_id: number;
  drug_name: string;
  dose_ml?: number;
  deworming_date: string;
  next_due_date?: string;
  operator?: string;
  notes?: string;
}

export interface UpcomingReminder {
  type: string;
  animal_id: number;
  animal_name: string;
  item_name: string;
  due_date: string;
  days_until_due: number;
}

export const medicalApi = {
  // 疫苗接种
  async getVaccinations(params: { animal_id?: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.animal_id) q.set('animal_id', String(params.animal_id));
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<VaccinationRecord>>>(`/api/medical/vaccination?${q}`);
    return res.data;
  },

  async createVaccination(data: Omit<VaccinationRecord, 'id'>) {
    const res = await apiFetch<ResponseDTO<VaccinationRecord>>('/api/medical/vaccination', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteVaccination(id: number) {
    await apiFetch<ResponseDTO<null>>(`/api/medical/vaccination/${id}`, { method: 'DELETE' });
  },

  // 用药记录
  async getMedications(params: { animal_id?: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.animal_id) q.set('animal_id', String(params.animal_id));
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<MedicationRecord>>>(`/api/medical/medication?${q}`);
    return res.data;
  },

  async createMedication(data: Omit<MedicationRecord, 'id'>) {
    const res = await apiFetch<ResponseDTO<MedicationRecord>>('/api/medical/medication', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteMedication(id: number) {
    await apiFetch<ResponseDTO<null>>(`/api/medical/medication/${id}`, { method: 'DELETE' });
  },

  // 驱虫记录
  async getDewormings(params: { animal_id?: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.animal_id) q.set('animal_id', String(params.animal_id));
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<DewormingRecord>>>(`/api/medical/deworming?${q}`);
    return res.data;
  },

  async createDeworming(data: Omit<DewormingRecord, 'id'>) {
    const res = await apiFetch<ResponseDTO<DewormingRecord>>('/api/medical/deworming', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteDeworming(id: number) {
    await apiFetch<ResponseDTO<null>>(`/api/medical/deworming/${id}`, { method: 'DELETE' });
  },

  // 到期提醒
  async getUpcomingReminders(days: number = 7): Promise<UpcomingReminder[]> {
    const res = await apiFetch<ResponseDTO<UpcomingReminder[]>>(`/api/medical/upcoming?days=${days}`);
    return res.data;
  },
};

// ============================================================
// 生产管理 API（出栏/死亡）
// ============================================================

export interface SlaughterRecord {
  id: number;
  animal_id: number;
  animal_name?: string;
  slaughter_date: string;
  slaughter_weight_kg?: number;
  price_per_kg?: number;
  total_price?: number;
  buyer?: string;
  destination?: string;
  operator?: string;
  notes?: string;
}

export interface MortalityRecord {
  id: number;
  animal_id: number;
  animal_name?: string;
  death_date: string;
  cause?: string;
  disposal_method?: string;
  vet_confirmation: boolean;
  loss_amount?: number;
  notes?: string;
}

export interface ProductionStats {
  month_slaughter_count: number;
  month_mortality_count: number;
  month_total_revenue: number;
  mortality_rate: number;
  total_slaughter_count: number;
  total_mortality_count: number;
}

export const productionApi = {
  async getSlaughters(params: { shed_id?: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.shed_id) q.set('shed_id', String(params.shed_id));
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<SlaughterRecord>>>(`/api/production/slaughter?${q}`);
    return res.data;
  },

  async createSlaughter(data: Omit<SlaughterRecord, 'id' | 'animal_name'>) {
    const res = await apiFetch<ResponseDTO<SlaughterRecord>>('/api/production/slaughter', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getMortalities(params: { shed_id?: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.shed_id) q.set('shed_id', String(params.shed_id));
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<MortalityRecord>>>(`/api/production/mortality?${q}`);
    return res.data;
  },

  async createMortality(data: Omit<MortalityRecord, 'id' | 'animal_name'>) {
    const res = await apiFetch<ResponseDTO<MortalityRecord>>('/api/production/mortality', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getStats(): Promise<ProductionStats> {
    const res = await apiFetch<ResponseDTO<ProductionStats>>('/api/production/stats');
    return res.data;
  },
};

// ============================================================
// 采食量 API
// ============================================================

export interface FeedIntakeRecord {
  id: number;
  pen_id: number;
  record_date: string;
  sheep_count: number;
  morning_feeding_amount_kg?: number;
  morning_box_weight_kg?: number;
  morning_remaining_feed_kg?: number;
  morning_feed_intake_kg?: number;
  afternoon_feeding_amount_kg?: number;
  afternoon_box_weight_kg?: number;
  afternoon_remaining_feed_kg?: number;
  afternoon_feed_intake_kg?: number;
  daily_total_feed_intake_kg?: number;
  avg_individual_intake_kg?: number;
}

export const feedApi = {
  async getFeedIntakes(params: { pen_id?: number; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.pen_id) q.set('pen_id', String(params.pen_id));
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<FeedIntakeRecord>>>(`/api/health/feed-intake?${q}`);
    return res.data;
  },

  async createFeedIntake(data: Omit<FeedIntakeRecord, 'id' | 'morning_feed_intake_kg' | 'afternoon_feed_intake_kg' | 'daily_total_feed_intake_kg' | 'avg_individual_intake_kg'>) {
    const res = await apiFetch<ResponseDTO<FeedIntakeRecord>>('/api/health/feed-intake', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getFeedTrend(pen_id: number, days: number = 30) {
    const res = await apiFetch<ResponseDTO<any>>(`/api/health/feed-intake/trend/${pen_id}?days=${days}`);
    return res.data;
  },
};

// ============================================================
// 操作日志 API
// ============================================================

export interface OperationLog {
  id: number;
  operator_name: string;
  operator_role: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  resource_name?: string;
  detail?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditStats {
  total_7days: number;
  by_action: { action: string; count: number }[];
  by_resource_type: { action: string; count: number }[];
}

export const auditApi = {
  async getLogs(params: { operator?: string; action?: string; resource_type?: string; start_date?: string; end_date?: string; page?: number; page_size?: number }) {
    const q = new URLSearchParams();
    if (params.operator) q.set('operator', params.operator);
    if (params.action) q.set('action', params.action);
    if (params.resource_type) q.set('resource_type', params.resource_type);
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const res = await apiFetch<ResponseDTO<ListResponseData<OperationLog>>>(`/api/audit/logs?${q}`);
    return res.data;
  },

  async getStats(): Promise<AuditStats> {
    const res = await apiFetch<ResponseDTO<AuditStats>>('/api/audit/stats');
    return res.data;
  },
};

// ============================================================
// 批量导入 API
// ============================================================

export interface ImportResult {
  success_count: number;
  fail_count: number;
  errors: { row: number; reason: string }[];
}

export const importApi = {
  async importAnimals(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/import/animals', { method: 'POST', body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `HTTP ${response.status}`);
    }
    const res = await response.json() as ResponseDTO<ImportResult>;
    return res.data;
  },

  async importWeightRecords(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/import/health/weight', { method: 'POST', body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `HTTP ${response.status}`);
    }
    const res = await response.json() as ResponseDTO<ImportResult>;
    return res.data;
  },

  downloadAnimalTemplate() {
    window.open('/api/import/template/animals', '_blank');
  },

  downloadWeightTemplate() {
    window.open('/api/import/template/weight', '_blank');
  },
};
