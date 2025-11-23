import {
  Shed,
  Pen,
  Sensor,
  SensorRecord,
  Camera,
  BehaviorSummary,
  Animal,
  ProductionPerformance,
  MergedChartData, // Corrected import
} from '@/types';

// =================================================================
// 1. Shed List (羊舍列表)
// =================================================================
export const mockSheds: Shed[] = [
  {
    id: 'shed-a',
    name: 'A区-育肥羊舍',
    location: '牧场南区',
    livestockCount: 80,
  },
  {
    id: 'shed-b',
    name: 'B区-母羊产房',
    location: '牧场北区',
    livestockCount: 25,
  },
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
  // --- Sensors for Shed A ---
  { id: 'sensor-a-t1', name: 'A区-东侧温度计', shedId: 'shed-a', penId: 'pen-a1', type: 'Temperature', status: 'active', lastReading: 22.5 },
  { id: 'sensor-a-t2', name: 'A区-西侧温度计', shedId: 'shed-a', penId: 'pen-a2', type: 'Temperature', status: 'active', lastReading: 22.8 },
  { id: 'sensor-a-h1', name: 'A区-中央湿度计', shedId: 'shed-a', penId: 'pen-a1', type: 'Humidity', status: 'active', lastReading: 58 },
  { id: 'sensor-a-nh3', name: 'A区-氨气检测仪', shedId: 'shed-a', penId: 'pen-a2', type: 'Ammonia', status: 'active', lastReading: 12 },
  // --- Sensors for Shed B ---
  { id: 'sensor-b-t1', name: 'B区-产房温度计', shedId: 'shed-b', penId: 'pen-b1', type: 'Temperature', status: 'active', lastReading: 26.1 },
  { id: 'sensor-b-h1', name: 'B区-产房湿度计', shedId: 'shed-b', penId: 'pen-b1', type: 'Humidity', status: 'inactive', lastReading: 65 },
  { id: 'sensor-b-h2', name: 'B区-隔离区湿度计', shedId: 'shed-b', penId: 'pen-b1', type: 'Humidity', status: 'error', lastReading: 70 },
  { id: 'sensor-b-nh3', name: 'B区-氨气检测仪', shedId: 'shed-b', penId: 'pen-b1', type: 'Ammonia', status: 'active', lastReading: 8 },
];

// =================================================================
// 4. Sensor Records (传感器原始记录 - 密集数据)
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

// ... (other mock data remains the same)

// =================================================================
// 9. Aggregated Chart Data (for different granularities)
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
  // Shed A
  { title: 'A区-东侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-东侧温度计', color: '#8884d8' }], data: generateHourlyData(24, (i) => 22 + Math.sin(i / 4) * 2 + Math.random()) },
  { title: 'A区-西侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-西侧温度计', color: '#82ca9d' }], data: generateHourlyData(24, (i) => 22.5 + Math.cos(i / 4) * 1.5 + Math.random()) },
  { title: 'A区-中央湿度计', sensorType: 'Humidity', unit: '%', lines: [{ dataKey: 'value', name: 'A区-中央湿度计', color: '#ffc658' }], data: generateHourlyData(24, (i) => 60 + Math.cos(i / 3) * 5 + Math.random() * 2) },
  { title: 'A区-氨气检测仪', sensorType: 'Ammonia', unit: 'ppm', lines: [{ dataKey: 'value', name: 'A区-氨气检测仪', color: '#ff7300' }], data: generateHourlyData(24, (i) => 10 + Math.sin(i / 6) * 3 + Math.random() * 1.5) },
  // Shed B
  { title: 'B区-产房温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'B区-产房温度计', color: '#8884d8' }], data: generateHourlyData(24, (i) => 25 + Math.sin(i / 5) * 1.5 + Math.random() * 0.5) },
  { title: 'B区-产房湿度计', sensorType: 'Humidity', unit: '%', lines: [{ dataKey: 'value', name: 'B区-产房湿度计', color: '#82ca9d' }], data: generateHourlyData(24, (i) => 68 + Math.sin(i / 3) * 3 + Math.random()) },
  { title: 'B区-氨气检测仪', sensorType: 'Ammonia', unit: 'ppm', lines: [{ dataKey: 'value', name: 'B区-氨气检测仪', color: '#ffc658' }], data: generateHourlyData(24, (i) => 7 + Math.cos(i / 5) * 2 + Math.random()) },
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
    // Shed A
    { title: 'A区-东侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-东侧温度计', color: '#8884d8' }], data: generateDailyData(30, (i) => 20 + Math.sin(i / 7) * 3 + Math.random() * 2) },
    { title: 'A区-西侧温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'A区-西侧温度计', color: '#82ca9d' }], data: generateDailyData(30, (i) => 21 + Math.cos(i / 7) * 2.5 + Math.random() * 2) },
    { title: 'A区-中央湿度计', sensorType: 'Humidity', unit: '%', lines: [{ dataKey: 'value', name: 'A区-中央湿度计', color: '#ffc658' }], data: generateDailyData(30, (i) => 55 + Math.cos(i / 5) * 8 + Math.random() * 4) },
    { title: 'A区-氨气检测仪', sensorType: 'Ammonia', unit: 'ppm', lines: [{ dataKey: 'value', name: 'A区-氨气检测仪', color: '#ff7300' }], data: generateDailyData(30, (i) => 12 + Math.sin(i / 10) * 4 + Math.random() * 2) },
    // Shed B
    { title: 'B区-产房温度计', sensorType: 'Temperature', unit: '°C', lines: [{ dataKey: 'value', name: 'B区-产房温度计', color: '#8884d8' }], data: generateDailyData(30, (i) => 24 + Math.sin(i / 6) * 2 + Math.random()) },
    { title: 'B区-产房湿度计', sensorType: 'Humidity', unit: '%', lines: [{ dataKey: 'value', name: 'B区-产房湿度计', color: '#82ca9d' }], data: generateDailyData(30, (i) => 65 + Math.sin(i / 8) * 5 + Math.random() * 3) },
    { title: 'B区-氨气检测仪', sensorType: 'Ammonia', unit: 'ppm', lines: [{ dataKey: 'value', name: 'B区-氨气检测仪', color: '#ffc658' }], data: generateDailyData(30, (i) => 8 + Math.cos(i / 9) * 3 + Math.random()) },
];
