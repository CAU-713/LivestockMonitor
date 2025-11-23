import {
  Shed,
  Pen,
  Sensor,
  Camera,
  BehaviorSummary,
  Animal,
  ProductionPerformance,
  MergedChartData,
  SensorRecord,
} from '@/types';

// =================================================================
// 1. Shed List (羊舍列表)
// =================================================================
export const mockSheds: Shed[] = [
  { id: 'shed-a', name: 'A区-育肥羊舍', location: '牧场南区', livestockCount: 80 },
  { id: 'shed-b', name: 'B区-母羊产房', location: '牧场北区', livestockCount: 25 },
];

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
  { id: 'sensor-a-t1', name: 'A区-东侧温度计', shedId: 'shed-a', penId: 'pen-a1', type: 'Temperature', status: 'active', lastReading: 22.5 },
  { id: 'sensor-a-t2', name: 'A区-西侧温度计', shedId: 'shed-a', penId: 'pen-a2', type: 'Temperature', status: 'active', lastReading: 22.8 },
  { id: 'sensor-a-h1', name: 'A区-中央湿度计', shedId: 'shed-a', penId: 'pen-a1', type: 'Humidity', status: 'active', lastReading: 58 },
  { id: 'sensor-a-nh3', name: 'A区-氨气检测仪', shedId: 'shed-a', penId: 'pen-a2', type: 'Ammonia', status: 'active', lastReading: 12 },
  { id: 'sensor-b-t1', name: 'B区-产房温度计', shedId: 'shed-b', penId: 'pen-b1', type: 'Temperature', status: 'active', lastReading: 26.1 },
  { id: 'sensor-b-h1', name: 'B区-产房湿度计', shedId: 'shed-b', penId: 'pen-b1', type: 'Humidity', status: 'inactive', lastReading: 65 },
  { id: 'sensor-b-h2', name: 'B区-隔离区湿度计', shedId: 'shed-b', penId: 'pen-b1', type: 'Humidity', status: 'error', lastReading: 70 },
  { id: 'sensor-b-nh3', name: 'B区-氨气检测仪', shedId: 'shed-b', penId: 'pen-b1', type: 'Ammonia', status: 'active', lastReading: 8 },
];

// =================================================================
// 4. Camera List (摄像头列表)
// =================================================================
export const mockCameras: Camera[] = [
    { id: 'cam-a-01', name: 'A区-全景摄像头', shedId: 'shed-a', status: 'online', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', thumbnailUrl: 'https://picsum.photos/seed/cam-a-01/400/300' },
    { id: 'cam-a-02', name: 'A区-1号圈摄像头', shedId: 'shed-a', penId: 'pen-a1', status: 'online', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', thumbnailUrl: 'https://picsum.photos/seed/cam-a-02/400/300' },
    { id: 'cam-b-01', name: 'B区-1号圈摄像头', shedId: 'shed-b', penId: 'pen-b1', status: 'offline', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', thumbnailUrl: 'https://picsum.photos/seed/cam-b-01/400/300' },
];

// =================================================================
// 5. Behavior Summaries (行为统计)
// =================================================================
export const mockBehaviorSummaries: BehaviorSummary[] = [
    { id: 'sum-a1-1', cameraId: 'cam-a-01', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), eatingCount: 15, drinkingCount: 5, lickingCount: 1, standingCount: 30, lyingCount: 30 },
    { id: 'sum-a1-2', cameraId: 'cam-a-01', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), eatingCount: 25, drinkingCount: 8, lickingCount: 2, standingCount: 22, lyingCount: 25 },
    { id: 'sum-a1-3', cameraId: 'cam-a-01', timestamp: new Date().toISOString(), eatingCount: 20, drinkingCount: 10, lickingCount: 0, standingCount: 20, lyingCount: 30 },
];

// =================================================================
// 6. Sensor Records (传感器原始记录 - 密集数据)
// =================================================================
const generateRawSensorData = (sensorId: string, durationMinutes: number, intervalMinutes: number, valueGenerator: (i: number) => number): SensorRecord[] => {
  const records: SensorRecord[] = [];
  const now = Date.now();
  for (let i = 0; i * intervalMinutes <= durationMinutes; i++) {
    const timestamp = new Date(now - (durationMinutes - i * intervalMinutes) * 60 * 1000).toISOString();
    records.push({ id: `${sensorId}-rec-${i}`, sensorId, value: parseFloat(valueGenerator(i).toFixed(2)), timestamp });
  }
  return records;
};

export const mockSensorRecords: SensorRecord[] = [
  ...generateRawSensorData('sensor-a-t1', 24 * 60, 5, (i) => 22 + Math.sin(i / 12) * 2 + Math.random()),
  ...generateRawSensorData('sensor-a-t2', 24 * 60, 5, (i) => 22.5 + Math.cos(i / 12) * 1.5 + Math.random()),
  ...generateRawSensorData('sensor-a-h1', 24 * 60, 5, (i) => 60 + Math.cos(i / 10) * 5 + Math.random() * 2),
  ...generateRawSensorData('sensor-a-nh3', 24 * 60, 5, (i) => 10 + Math.sin(i / 20) * 3 + Math.random() * 1.5),
  ...generateRawSensorData('sensor-b-t1', 24 * 60, 5, (i) => 25 + Math.sin(i / 15) * 1.5 + Math.random() * 0.5),
  ...generateRawSensorData('sensor-b-h1', 24 * 60, 5, (i) => 68 + Math.sin(i / 10) * 3 + Math.random()),
  ...generateRawSensorData('sensor-b-nh3', 24 * 60, 5, (i) => 7 + Math.cos(i / 18) * 2 + Math.random()),
];

// =================================================================
// 7. Aggregated Chart Data (for different granularities)
// =================================================================

// --- HOURLY DATA ---
const generateHourlyData = (hours: number, valueGenerator: (i: number) => number) => {
  return Array.from({ length: hours }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (hours - 1 - i));
    return { time: `${date.getHours()}:00`, value: parseFloat(valueGenerator(i).toFixed(1)) };
  });
};

export const mockHourlyChartData: MergedChartData[] = [
  { title: 'A区-东侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-东侧温度计', color: '#8884d8' }], data: generateHourlyData(24, (i) => 22 + Math.sin(i / 4) * 2 + Math.random()) },
  { title: 'A区-西侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-西侧温度计', color: '#82ca9d' }], data: generateHourlyData(24, (i) => 22.5 + Math.cos(i / 4) * 1.5 + Math.random()) },
  { title: 'A区-中央湿度计', sensorType: 'Humidity', unit: '%', lines: [{ dataKey: 'value', name: 'A区-中央湿度计', color: '#ffc658' }], data: generateHourlyData(24, (i) => 60 + Math.cos(i / 3) * 5 + Math.random() * 2) },
];

// --- DAILY DATA ---
const generateDailyData = (days: number, valueGenerator: (i: number) => number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return { time: `${date.getMonth() + 1}/${date.getDate()}`, value: parseFloat(valueGenerator(i).toFixed(1)) };
  });
};

export const mockDailyChartData: MergedChartData[] = [
    { title: 'A区-东侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-东侧温度计', color: '#8884d8' }], data: generateDailyData(30, (i) => 20 + Math.sin(i / 7) * 3 + Math.random() * 2) },
    { title: 'A区-西侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-西侧温度计', color: '#82ca9d' }], data: generateDailyData(30, (i) => 21 + Math.cos(i / 7) * 2.5 + Math.random() * 2) },
    { title: 'A区-中央湿度计', sensorType: 'Humidity', unit: '%', lines: [{ dataKey: 'value', name: 'A区-中央湿度计', color: '#ffc658' }], data: generateDailyData(30, (i) => 55 + Math.cos(i / 5) * 8 + Math.random() * 4) },
];


// =================================================================
// 10. Dashboard Specific Data
// =================================================================

// --- KPI Calculations ---
const totalLivestock = mockSheds.reduce((sum, shed) => sum + shed.livestockCount, 0);
const onlineSensors = mockSensors.filter((s) => s.status === 'active').length;
const onlineCameras = mockCameras.filter((c) => c.status === 'online').length;
const avgTemperature = parseFloat((mockSensors.filter(s => s.type === 'Temperature' && s.lastReading).reduce((sum, s) => sum + s.lastReading!, 0) / mockSensors.filter(s => s.type === 'Temperature' && s.lastReading).length).toFixed(1)) || 0;
const avgAmmonia = parseFloat((mockSensors.filter(s => s.type === 'Ammonia' && s.lastReading).reduce((sum, s) => sum + s.lastReading!, 0) / mockSensors.filter(s => s.type === 'Ammonia' && s.lastReading).length).toFixed(1)) || 0;

export const mockDashboardKPIs = {
  totalLivestock: { value: totalLivestock, unit: '只' },
  deviceStatus: { value: `${onlineSensors + onlineCameras} / ${mockSensors.length + mockCameras.length}`, label: '在线设备' },
  avgTemperature: { value: avgTemperature, unit: '°C', status: avgTemperature > 25 ? 'warning' : 'normal' },
  avgAmmonia: { value: avgAmmonia, unit: 'ppm', status: avgAmmonia > 20 ? 'danger' : 'normal' },
};

// --- Offline Devices List ---
type Device = (Sensor | Camera) & { deviceType: 'Sensor' | 'Camera' };
export const mockOfflineDevices: Device[] = [
  ...mockSensors.filter((s) => s.status !== 'active').map((s) => ({ ...s, deviceType: 'Sensor' as const })),
  ...mockCameras.filter((c) => c.status !== 'online').map((c) => ({ ...c, deviceType: 'Camera' as const })),
];

// --- Overall Trend Chart Data ---
const generateOverallTrend = (hours: number, valueGenerator: (i: number) => { avg: number; max: number; min: number }): { time: string; value: number; range: [number, number] }[] => {
  return Array.from({ length: hours }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (hours - 1 - i));
    const values = valueGenerator(i);
    return {
      time: `${date.getHours()}:00`,
      value: parseFloat(values.avg.toFixed(1)),
      range: [parseFloat(values.min.toFixed(1)), parseFloat(values.max.toFixed(1))],
    };
  });
};

export const mockOverallTemperatureTrend: MergedChartData = {
  title: '牧场总览：平均温度趋势 (24h)',
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
  title: '牧场总览：平均湿度趋势 (24h)',
  sensorType: 'Humidity',
  unit: '%',
  lines: [
    { dataKey: 'value', name: '平均值', color: '#387908' },
    { dataKey: 'range', name: '范围', color: '#387908' },
  ],
  data: generateOverallTrend(24, (i) => {
    const avg = 60 + Math.cos(i / 4) * 5 + Math.random() * 2;
    return { avg, max: avg + 5 + Math.random() * 2, min: avg - 5 - Math.random() * 2 };
  }),
};
