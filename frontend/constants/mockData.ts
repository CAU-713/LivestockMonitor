import {
  Shed,
  Pen,
  Sensor,
  Camera,
  BehaviorSummary,
  MergedChartData,
  SensorRecord,
  User,
  AlertRule,
} from '@/types';
import { ComfortAssessment } from '@/components/dashboard/ComfortAssessmentPanel';

// =================================================================
// 1. Shed List (羊舍列表)
// =================================================================
export const mockSheds: Shed[] = [
  {
    id: 'shed-a',
    name: 'A区-育肥羊舍',
    location: '畜舍南区',
    livestockCount: 80,
    area: 600,
  },
  {
    id: 'shed-b',
    name: 'B区-母羊产房',
    location: '畜舍北区',
    livestockCount: 25,
    area: 400,
  },
];

// =================================================================
// 1.5 Comfort Assessment (环境舒适度评价)
// =================================================================
export const mockComfortAssessments: Record<string, ComfortAssessment> = {
  'shed-a': {
    status: 'comfort',
    label: '舒适区',
    color: '#4CAF50',
    backgroundColor: '#4CAF50',
    description: '环境条件优良，动物舒适度高，生长性能最佳',
    thi: 68.5,
  },
  'shed-b': {
    status: 'mild-heat-stress',
    label: '轻度热应激',
    color: '#FF9800',
    backgroundColor: '#FF9800',
    description: '环境温度偏高，动物可能出现轻微应激反应，需关注饮水和通风',
    thi: 74.2,
  },
};

// =================================================================
// 2. Pen List (圈列表)
// =================================================================
export const mockPens: Pen[] = [
  { id: 'pen-a1', name: 'A区-1号圈', shedId: 'shed-a' },
  { id: 'pen-a2', name: 'A区-2号圈', shedId: 'shed-a' },
  { id: 'pen-b1', name: 'B区-母羊圈', shedId: 'shed-b' },
];

// =================================================================
// 3. Sensor List (传感器列表)
// =================================================================
export const mockSensors: Sensor[] = [
  {
    id: 'sensor-a-t1',
    name: 'A区-东侧温度计',
    shedId: 'shed-a',
    penId: 'pen-a1',
    type: 'Temperature',
    status: 'active',
    lastReading: 22.5,
  },
  {
    id: 'sensor-a-t2',
    name: 'A区-西侧温度计',
    shedId: 'shed-a',
    penId: 'pen-a2',
    type: 'Temperature',
    status: 'active',
    lastReading: 22.8,
  },
  {
    id: 'sensor-a-h1',
    name: 'A区-中央湿度计',
    shedId: 'shed-a',
    penId: 'pen-a1',
    type: 'Humidity',
    status: 'active',
    lastReading: 58,
  },
  {
    id: 'sensor-a-nh3',
    name: 'A区-氨气检测仪',
    shedId: 'shed-a',
    penId: 'pen-a2',
    type: 'Ammonia',
    status: 'active',
    lastReading: 12,
  },
  {
    id: 'sensor-a-co2',
    name: 'A区-二氧化碳检测仪',
    shedId: 'shed-a',
    penId: 'pen-a1',
    type: 'CO2',
    status: 'active',
    lastReading: 850,
  },
  {
    id: 'sensor-a-ch4',
    name: 'A区-甲烷检测仪',
    shedId: 'shed-a',
    penId: 'pen-a2',
    type: 'CH4',
    status: 'active',
    lastReading: 1.2,
  },
  {
    id: 'sensor-a-o2',
    name: 'A区-含氧量传感器',
    shedId: 'shed-a',
    penId: 'pen-a1',
    type: 'Oxygen',
    status: 'active',
    lastReading: 20.8,
  },
  {
    id: 'sensor-a-wind',
    name: 'A区-风速传感器',
    shedId: 'shed-a',
    penId: 'pen-a2',
    type: 'WindSpeed',
    status: 'active',
    lastReading: 0.8,
  },
  {
    id: 'sensor-a-h2s',
    name: 'A区-硫化氢传感器',
    shedId: 'shed-a',
    penId: 'pen-a1',
    type: 'H2S',
    status: 'active',
    lastReading: 0.5,
  },
  {
    id: 'sensor-a-pm',
    name: 'A区-颗粒物传感器',
    shedId: 'shed-a',
    penId: 'pen-a2',
    type: 'PM',
    status: 'active',
    lastReading: 35,
  },
  {
    id: 'sensor-a-light',
    name: 'A区-光照强度传感器',
    shedId: 'shed-a',
    penId: 'pen-a1',
    type: 'Light',
    status: 'active',
    lastReading: 1200,
  },
  {
    id: 'sensor-b-t1',
    name: 'B区-产房温度计',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'Temperature',
    status: 'active',
    lastReading: 26.1,
  },
  {
    id: 'sensor-b-h1',
    name: 'B区-产房湿度计',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'Humidity',
    status: 'inactive',
    lastReading: 65,
  },
  {
    id: 'sensor-b-h2',
    name: 'B区-隔离区湿度计',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'Humidity',
    status: 'error',
    lastReading: 70,
  },
  {
    id: 'sensor-b-nh3',
    name: 'B区-氨气检测仪',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'Ammonia',
    status: 'active',
    lastReading: 8,
  },
  {
    id: 'sensor-b-co2',
    name: 'B区-二氧化碳检测仪',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'CO2',
    status: 'active',
    lastReading: 920,
  },
  {
    id: 'sensor-b-ch4',
    name: 'B区-甲烷检测仪',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'CH4',
    status: 'active',
    lastReading: 1.5,
  },
  {
    id: 'sensor-b-o2',
    name: 'B区-含氧量传感器',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'Oxygen',
    status: 'active',
    lastReading: 20.5,
  },
  {
    id: 'sensor-b-wind',
    name: 'B区-风速传感器',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'WindSpeed',
    status: 'active',
    lastReading: 0.6,
  },
  {
    id: 'sensor-b-h2s',
    name: 'B区-硫化氢传感器',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'H2S',
    status: 'active',
    lastReading: 0.3,
  },
  {
    id: 'sensor-b-pm',
    name: 'B区-颗粒物传感器',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'PM',
    status: 'active',
    lastReading: 42,
  },
  {
    id: 'sensor-b-light',
    name: 'B区-光照强度传感器',
    shedId: 'shed-b',
    penId: 'pen-b1',
    type: 'Light',
    status: 'active',
    lastReading: 1500,
  },
];

// =================================================================
// 4. Camera List (摄像头列表)
// =================================================================
export const mockCameras: Camera[] = [
  {
    id: 'cam-a-01',
    name: 'A区-全景摄像头',
    shedId: 'shed-a',
    status: 'online',
    streamUrl:
      'http://localhost:8000/detect/infer?model=app/checkpoints/v8.pt&video=app/videos/test.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cam-a-01/400/300',
  },
  {
    id: 'cam-a-02',
    name: 'A区-1号圈摄像头',
    shedId: 'shed-a',
    penId: 'pen-a1',
    status: 'online',
    streamUrl:
      'http://localhost:8000/detect/infer?model=app/checkpoints/v8.pt&video=app/videos/test.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cam-a-02/400/300',
  },
  {
    id: 'cam-b-01',
    name: 'B区-1号圈摄像头',
    shedId: 'shed-b',
    penId: 'pen-b1',
    status: 'offline',
    streamUrl:
      'http://localhost:8000/detect/infer?model=app/checkpoints/v8.pt&video=app/videos/test.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cam-b-01/400/300',
  },
];

// =================================================================
// 5. Behavior Summaries (行为统计)
// =================================================================
export const mockBehaviorSummaries: BehaviorSummary[] = [
  {
    id: 'sum-a1-1',
    cameraId: 'cam-a-01',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    eatingCount: 15,
    drinkingCount: 5,
    lickingCount: 1,
    standingCount: 30,
    lyingCount: 30,
  },
  {
    id: 'sum-a1-2',
    cameraId: 'cam-a-01',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    eatingCount: 25,
    drinkingCount: 8,
    lickingCount: 2,
    standingCount: 22,
    lyingCount: 25,
  },
  {
    id: 'sum-a1-3',
    cameraId: 'cam-a-01',
    timestamp: new Date().toISOString(),
    eatingCount: 20,
    drinkingCount: 10,
    lickingCount: 0,
    standingCount: 20,
    lyingCount: 30,
  },
];

// =================================================================
// 6. Sensor Records (传感器原始记录 - 密集数据)
// =================================================================
const generateRawSensorData = (
  sensorId: string,
  durationMinutes: number,
  intervalMinutes: number,
  valueGenerator: (i: number) => number
): SensorRecord[] => {
  const records: SensorRecord[] = [];
  const now = Date.now();
  for (let i = 0; i * intervalMinutes <= durationMinutes; i++) {
    const timestamp = new Date(
      now - (durationMinutes - i * intervalMinutes) * 60 * 1000
    ).toISOString();
    records.push({
      id: `${sensorId}-rec-${i}`,
      sensorId,
      value: parseFloat(valueGenerator(i).toFixed(2)),
      timestamp,
    });
  }
  return records;
};

export const mockSensorRecords: SensorRecord[] = [
  ...generateRawSensorData(
    'sensor-a-t1',
    24 * 60,
    5,
    (i) => 22 + Math.sin(i / 12) * 2 + Math.random()
  ),
  ...generateRawSensorData(
    'sensor-a-t2',
    24 * 60,
    5,
    (i) => 22.5 + Math.cos(i / 12) * 1.5 + Math.random()
  ),
  ...generateRawSensorData(
    'sensor-a-h1',
    24 * 60,
    5,
    (i) => 60 + Math.cos(i / 10) * 5 + Math.random() * 2
  ),
  ...generateRawSensorData(
    'sensor-a-nh3',
    24 * 60,
    5,
    (i) => 10 + Math.sin(i / 20) * 3 + Math.random() * 1.5
  ),
  ...generateRawSensorData(
    'sensor-a-co2',
    24 * 60,
    5,
    (i) => 800 + Math.sin(i / 30) * 100 + Math.random() * 50
  ),
  ...generateRawSensorData(
    'sensor-b-t1',
    24 * 60,
    5,
    (i) => 25 + Math.sin(i / 15) * 1.5 + Math.random() * 0.5
  ),
  ...generateRawSensorData(
    'sensor-b-h1',
    24 * 60,
    5,
    (i) => 68 + Math.sin(i / 10) * 3 + Math.random()
  ),
  ...generateRawSensorData(
    'sensor-b-nh3',
    24 * 60,
    5,
    (i) => 7 + Math.cos(i / 18) * 2 + Math.random()
  ),
  ...generateRawSensorData(
    'sensor-b-co2',
    24 * 60,
    5,
    (i) => 900 + Math.cos(i / 25) * 80 + Math.random() * 40
  ),
];

// =================================================================
// 7. Aggregated Chart Data (for different granularities)
// =================================================================

// --- HOURLY DATA ---
const generateHourlyData = (
  hours: number,
  valueGenerator: (i: number) => number
) => {
  return Array.from({ length: hours }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (hours - 1 - i));
    return {
      time: `${date.getHours()}:00`,
      value: parseFloat(valueGenerator(i).toFixed(1)),
    };
  });
};

export const mockHourlyChartData: MergedChartData[] = [
  {
    title: 'A区-东侧温度计',
    sensorType: 'Temperature',
    unit: '°C',
    lines: [{ dataKey: 'value', name: 'A区-东侧温度计', color: '#8884d8' }],
    data: generateHourlyData(
      24,
      (i) => 22 + Math.sin(i / 4) * 2 + Math.random()
    ),
  },
  {
    title: 'A区-西侧温度计',
    sensorType: 'Temperature',
    unit: '°C',
    lines: [{ dataKey: 'value', name: 'A区-西侧温度计', color: '#82ca9d' }],
    data: generateHourlyData(
      24,
      (i) => 22.5 + Math.cos(i / 4) * 1.5 + Math.random()
    ),
  },
  {
    title: 'A区-中央湿度计',
    sensorType: 'Humidity',
    unit: '%',
    lines: [{ dataKey: 'value', name: 'A区-中央湿度计', color: '#ffc658' }],
    data: generateHourlyData(
      24,
      (i) => 60 + Math.cos(i / 3) * 5 + Math.random() * 2
    ),
  },
  {
    title: 'A区-氨气检测仪',
    sensorType: 'Ammonia',
    unit: 'ppm',
    lines: [{ dataKey: 'value', name: 'A区-氨气检测仪', color: '#ff7300' }],
    data: generateHourlyData(
      24,
      (i) => 10 + Math.sin(i / 5) * 3 + Math.random()
    ),
  },
  {
    title: 'A区-二氧化碳检测仪',
    sensorType: 'CO2',
    unit: 'ppm',
    lines: [{ dataKey: 'value', name: 'A区-二氧化碳检测仪', color: '#387908' }],
    data: generateHourlyData(
      24,
      (i) => 800 + Math.sin(i / 6) * 100 + Math.random() * 20
    ),
  },
];

// --- DAILY DATA ---
const generateDailyData = (
  days: number,
  valueGenerator: (i: number) => number
) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      time: `${date.getMonth() + 1}/${date.getDate()}`,
      value: parseFloat(valueGenerator(i).toFixed(1)),
    };
  });
};

export const mockDailyChartData: MergedChartData[] = [
  {
    title: 'A区-东侧温度计',
    sensorType: 'Temperature',
    unit: '°C',
    lines: [{ dataKey: 'value', name: 'A区-东侧温度计', color: '#8884d8' }],
    data: generateDailyData(
      30,
      (i) => 20 + Math.sin(i / 7) * 3 + Math.random() * 2
    ),
  },
  {
    title: 'A区-西侧温度计',
    sensorType: 'Temperature',
    unit: '°C',
    lines: [{ dataKey: 'value', name: 'A区-西侧温度计', color: '#82ca9d' }],
    data: generateDailyData(
      30,
      (i) => 21 + Math.cos(i / 7) * 2.5 + Math.random() * 2
    ),
  },
  {
    title: 'A区-中央湿度计',
    sensorType: 'Humidity',
    unit: '%',
    lines: [{ dataKey: 'value', name: 'A区-中央湿度计', color: '#ffc658' }],
    data: generateDailyData(
      30,
      (i) => 55 + Math.cos(i / 5) * 8 + Math.random() * 4
    ),
  },
  {
    title: 'A区-氨气检测仪',
    sensorType: 'Ammonia',
    unit: 'ppm',
    lines: [{ dataKey: 'value', name: 'A区-氨气检测仪', color: '#ff7300' }],
    data: generateDailyData(
      30,
      (i) => 12 + Math.sin(i / 10) * 4 + Math.random() * 2
    ),
  },
  {
    title: 'A区-二氧化碳检测仪',
    sensorType: 'CO2',
    unit: 'ppm',
    lines: [{ dataKey: 'value', name: 'A区-二氧化碳检测仪', color: '#387908' }],
    data: generateDailyData(
      30,
      (i) => 850 + Math.cos(i / 8) * 150 + Math.random() * 50
    ),
  },
];

// =================================================================
// 10. Dashboard Specific Data
// =================================================================

// --- KPI Calculations ---
const totalLivestock = mockSheds.reduce(
  (sum, shed) => sum + shed.livestockCount,
  0
);
const totalArea = mockSheds.reduce((sum, shed) => sum + (shed.area || 0), 0);
const onlineSensors = mockSensors.filter((s) => s.status === 'active').length;
const onlineCameras = mockCameras.filter((c) => c.status === 'online').length;
const avgTemperature =
  parseFloat(
    (
      mockSensors
        .filter((s) => s.type === 'Temperature' && s.lastReading)
        .reduce((sum, s) => sum + s.lastReading!, 0) /
      mockSensors.filter((s) => s.type === 'Temperature' && s.lastReading)
        .length
    ).toFixed(1)
  ) || 0;
const avgAmmonia =
  parseFloat(
    (
      mockSensors
        .filter((s) => s.type === 'Ammonia' && s.lastReading)
        .reduce((sum, s) => sum + s.lastReading!, 0) /
      mockSensors.filter((s) => s.type === 'Ammonia' && s.lastReading).length
    ).toFixed(1)
  ) || 0;

export const mockDashboardKPIs = {
  totalLivestock: { value: totalLivestock, unit: '只' },
  totalArea: { value: totalArea, unit: '㎡' },
  deviceStatus: {
    value: `${onlineSensors + onlineCameras} / ${mockSensors.length + mockCameras.length}`,
    label: '在线设备',
  },
  avgTemperature: {
    value: avgTemperature,
    unit: '°C',
    status: avgTemperature > 25 ? 'warning' : 'normal',
  },
  avgAmmonia: {
    value: avgAmmonia,
    unit: 'ppm',
    status: avgAmmonia > 20 ? 'danger' : 'normal',
  },
};

// --- Offline Devices List ---
type Device = (Sensor | Camera) & { deviceType: 'Sensor' | 'Camera' };
export const mockOfflineDevices: Device[] = [
  ...mockSensors
    .filter((s) => s.status !== 'active')
    .map((s) => ({ ...s, deviceType: 'Sensor' as const })),
  ...mockCameras
    .filter((c) => c.status !== 'online')
    .map((c) => ({ ...c, deviceType: 'Camera' as const })),
];

// --- Overall Trend Chart Data ---
const generateOverallTrend = (
  hours: number,
  valueGenerator: (i: number) => { avg: number; max: number; min: number }
): { time: string; value: number; range: [number, number] }[] => {
  return Array.from({ length: hours }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (hours - 1 - i));
    const values = valueGenerator(i);
    return {
      time: `${date.getHours()}:00`,
      value: parseFloat(values.avg.toFixed(1)),
      range: [
        parseFloat(values.min.toFixed(1)),
        parseFloat(values.max.toFixed(1)),
      ],
    };
  });
};

export const mockOverallTemperatureTrend: MergedChartData = {
  title: '畜舍总览：平均温度趋势 (24h)',
  sensorType: 'Temperature',
  unit: '°C',
  lines: [
    { dataKey: 'value', name: '平均值', color: '#ff7300' },
    { dataKey: 'range', name: '范围', color: '#ff7300' },
  ],
  data: generateOverallTrend(24, (i) => {
    const avg = 23 + Math.sin(i / 5) * 2 + Math.random();
    return { avg, max: avg + 2 + Math.random(), min: avg - 2 - Math.random() };
  }),
};

export const mockOverallHumidityTrend: MergedChartData = {
  title: '畜舍总览：平均湿度趋势 (24h)',
  sensorType: 'Humidity',
  unit: '%',
  lines: [
    { dataKey: 'value', name: '平均值', color: '#387908' },
    { dataKey: 'range', name: '范围', color: '#387908' },
  ],
  data: generateOverallTrend(24, (i) => {
    const avg = 60 + Math.cos(i / 4) * 5 + Math.random() * 2;
    return {
      avg,
      max: avg + 5 + Math.random() * 2,
      min: avg - 5 - Math.random() * 2,
    };
  }),
};

// ============ User Management Mock Data ============
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin_john',
    email: 'john@livestock.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    username: 'user_sarah',
    email: 'sarah@livestock.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    username: 'user_mike',
    email: 'mike@livestock.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    username: 'visitor_lisa',
    email: 'lisa@livestock.com',
    role: 'visitor',
    status: 'active',
    createdAt: '2024-03-15',
  },
  {
    id: '5',
    username: 'user_david',
    email: 'david@livestock.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2024-04-01',
  },
  {
    id: '6',
    username: 'visitor_emma',
    email: 'emma@livestock.com',
    role: 'visitor',
    status: 'active',
    createdAt: '2024-05-12',
  },
  {
    id: '7',
    username: 'admin_robert',
    email: 'robert@livestock.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-06-01',
  },
];

// ============ Alert Rules Mock Data ============
export const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: '温度过高',
    sensorName: '东侧温度计',
    ruleType: 'manual',
    condition: 'gt',
    threshold: 28,
    notificationMethod: 'email',
    enabled: true,
  },
  {
    id: '2',
    name: '温度过低',
    sensorName: '西侧温度计',
    ruleType: 'manual',
    condition: 'lt',
    threshold: 15,
    notificationMethod: 'both',
    enabled: true,
  },
  {
    id: '3',
    name: '湿度过高',
    sensorName: '中央湿度计',
    ruleType: 'manual',
    condition: 'gt',
    threshold: 75,
    notificationMethod: 'sms',
    enabled: true,
  },
  {
    id: '4',
    name: '湿度过低',
    sensorName: '南侧湿度计',
    ruleType: 'manual',
    condition: 'lt',
    threshold: 40,
    notificationMethod: 'email',
    enabled: false,
  },
  {
    id: '5',
    name: '氨气浓度过高',
    sensorName: '氨气传感器',
    ruleType: 'manual',
    condition: 'gt',
    threshold: 25,
    notificationMethod: 'both',
    enabled: true,
  },
  {
    id: '6',
    name: '二氧化碳浓度过高',
    sensorName: 'CO2传感器',
    ruleType: 'manual',
    condition: 'gt',
    threshold: 1500,
    notificationMethod: 'email',
    enabled: true,
  },
  {
    id: '7',
    name: '通用设备异常',
    sensorName: '所有设备',
    ruleType: 'manual',
    condition: 'eq',
    threshold: 0,
    notificationMethod: 'both',
    enabled: true,
  },
  {
    id: '8',
    name: '光照强度异常',
    sensorName: '光照传感器',
    ruleType: 'manual',
    condition: 'lt',
    threshold: 100,
    notificationMethod: 'email',
    enabled: false,
  },
  // 智能规则假数据
  {
    id: '9',
    name: '智能温度异常检测',
    sensorName: '东侧温度计',
    ruleType: 'smart',
    condition: 'gt',
    threshold: 0,
    notificationMethod: 'both',
    enabled: true,
  },
  {
    id: '10',
    name: '湿度自适应预警',
    sensorName: '中央湿度计',
    ruleType: 'smart',
    condition: 'lt',
    threshold: 0,
    notificationMethod: 'email',
    enabled: true,
  },
  {
    id: '11',
    name: '气体浓度智能监测',
    sensorName: '氨气传感器',
    ruleType: 'smart',
    condition: 'gt',
    threshold: 0,
    notificationMethod: 'sms',
    enabled: false,
  },
];

// ============ Alert Rules Constants ============
export const SENSOR_NAMES = [
  '东侧温度计',
  '西侧温度计',
  '中央湿度计',
  '南侧湿度计',
  '氨气传感器',
  'CO2传感器',
  '光照传感器',
  '所有设备',
];

// 智能规则描述信息
export const SMART_RULE_DESCRIPTIONS: { [key: string]: string } = {
  temperature: '基于历史温度数据的智能分析，动态调整告警阈值',
  humidity: '湿度模式的机器学习检测，自适应季节和天气变化',
  gas: '多点传感器数据融合分析，智能识别异常气体浓度',
  general: '多维度数据关联分析，综合评估环境健康状况',
};

export const CONDITIONS = [
  { value: 'gt', label: '大于 (>)' },
  { value: 'lt', label: '小于 (<)' },
  { value: 'eq', label: '等于 (=)' },
];

export const NOTIFICATION_METHODS = [
  { value: 'email', label: '邮件' },
  { value: 'sms', label: '短信' },
  { value: 'both', label: '邮件和短信' },
];
