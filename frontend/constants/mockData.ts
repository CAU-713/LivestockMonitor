import {
  Shed,
  Pen,
  Sensor,
  SensorRecord,
  Camera,
  BehaviorSummary,
  Animal,
  ProductionPerformance,
} from '../types';

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

  // --- Sensors for Shed B ---
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
];

// =================================================================
// 4. Sensor Records (传感器历史记录)
// =================================================================
const getTime = (offsetMinutes: number) =>
  new Date(Date.now() - offsetMinutes * 60 * 1000).toISOString();

export const mockSensorRecords: SensorRecord[] = [
  // Records for Sensor 'sensor-a-t1'
  {
    id: 'rec-a-t1-1',
    sensorId: 'sensor-a-t1',
    value: 22.4,
    timestamp: getTime(60),
  },
  {
    id: 'rec-a-t1-2',
    sensorId: 'sensor-a-t1',
    value: 22.5,
    timestamp: getTime(30),
  },
  {
    id: 'rec-a-t1-3',
    sensorId: 'sensor-a-t1',
    value: 22.5,
    timestamp: getTime(0),
  },

  // Records for Sensor 'sensor-a-t2'
  {
    id: 'rec-a-t2-1',
    sensorId: 'sensor-a-t2',
    value: 22.7,
    timestamp: getTime(60),
  },
  {
    id: 'rec-a-t2-2',
    sensorId: 'sensor-a-t2',
    value: 22.8,
    timestamp: getTime(30),
  },
  {
    id: 'rec-a-t2-3',
    sensorId: 'sensor-a-t2',
    value: 22.8,
    timestamp: getTime(0),
  },
];

// =================================================================
// 5. Camera List (摄像头列表)
// =================================================================
export const mockCameras: Camera[] = [
  {
    id: 'cam-a-01',
    name: 'A区摄像头',
    shedId: 'shed-a',
    status: 'online',
    streamUrl: 'https://example.com/stream/cam-a-01.m3u8',
    thumbnailUrl: 'https://picsum.photos/seed/cam-a-01/400/300',
  },
  {
    id: 'cam-b-01',
    name: 'B区摄像头',
    shedId: 'shed-b',
    status: 'offline',
    streamUrl: 'https://example.com/stream/cam-b-01.m3u8',
    thumbnailUrl: 'https://picsum.photos/seed/cam-b-01/400/300',
  },
];

// =================================================================
// 6. Behavior Summaries (行为统计)
// =================================================================
export const mockBehaviorSummaries: BehaviorSummary[] = [
  // Summaries for Camera 'cam-a-01'
  {
    id: 'sum-a1-1',
    cameraId: 'cam-a-01',
    timestamp: getTime(30),
    eatingCount: 15,
    drinkingCount: 5,
    standingCount: 30,
    lyingCount: 30,
  },
  {
    id: 'sum-a1-2',
    cameraId: 'cam-a-01',
    timestamp: getTime(15),
    eatingCount: 25,
    drinkingCount: 8,
    standingCount: 22,
    lyingCount: 25,
  },
  {
    id: 'sum-a1-3',
    cameraId: 'cam-a-01',
    timestamp: getTime(0),
    eatingCount: 20,
    drinkingCount: 10,
    standingCount: 20,
    lyingCount: 30,
  },
];

// =================================================================
// 7. Animal List (动物列表)
// =================================================================
export const mockAnimals: Animal[] = [
  { id: 'animal-001', type: 'Sheep', penId: 'pen-a1' },
  { id: 'animal-002', type: 'Sheep', penId: 'pen-a2' },
  { id: 'animal-003', type: 'Sheep', penId: 'pen-b1' },
];

// =================================================================
// 8. Production Performance (生产性能统计)
// =================================================================
export const mockProductionPerformance: ProductionPerformance[] = [
  // --- Daily records for animal-001 ---
  {
    id: 'pp-001-1',
    animalId: 'animal-001',
    type: 'feedIntake',
    granularity: 'daily',
    value: 1.5,
    date: '2023-10-26',
  },
  {
    id: 'pp-001-2',
    animalId: 'animal-001',
    type: 'feedIntake',
    granularity: 'daily',
    value: 1.6,
    date: '2023-10-27',
  },
  {
    id: 'pp-001-3',
    animalId: 'animal-001',
    type: 'weightGain',
    granularity: 'daily',
    value: 0.2,
    date: '2023-10-27',
  },

  // --- Weekly records for animal-001 ---
  {
    id: 'pp-001-4',
    animalId: 'animal-001',
    type: 'feedIntake',
    granularity: 'weekly',
    value: 10.8,
    date: '2023-10-22',
  },
  {
    id: 'pp-001-5',
    animalId: 'animal-001',
    type: 'weightGain',
    granularity: 'weekly',
    value: 1.3,
    date: '2023-10-22',
  },

  // --- Daily records for animal-002 ---
  {
    id: 'pp-002-1',
    animalId: 'animal-002',
    type: 'feedIntake',
    granularity: 'daily',
    value: 1.4,
    date: '2023-10-27',
  },
];
