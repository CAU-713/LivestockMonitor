// TypeScript types and interfaces go here

/**
 * @description Represents a single livestock shed
 */
export interface Shed {
  id: string;
  name: string;
  location: string;
  livestockCount: number;
  area?: number; // Optional area property to fix type errors in mockData.ts
}

/**
 * @description Represents a pen within a shed
 */
export interface Pen {
  id: string;
  name: string;
  shedId: string; // Foreign key to link to a Shed
}

/**
 * @description Represents a sensor device
 */
export interface Sensor {
  id: string;
  name: string; // Custom name for the sensor, e.g., "East-side Temperature"
  shedId: string; // Foreign key to link to a Shed, for broad filtering
  penId: string; // Foreign key to link to a Pen, for specific matching
  type:
    | 'Temperature'
    | 'Humidity'
    | 'Ammonia'
    | 'CO2'
    | 'CH4'
    | 'Oxygen'
    | 'WindSpeed'
    | 'H2S'
    | 'PM'
    | 'Light'; // Example sensor types
  status: 'active' | 'inactive' | 'error';
  lastReading?: number; // Optional last reading value
}

/**
 * @description Represents a single data record from a sensor
 */
export interface SensorRecord {
  id: string;
  sensorId: string; // Foreign key to link to a Sensor
  value: number;
  timestamp: string; // ISO 8601 date string
}

/**
 * @description Represents a camera device
 */
export interface Camera {
  id: string;
  name: string;
  shedId: string; // Foreign key to link to a Shed
  penId?: string; // Optional foreign key to link to a specific Pen
  status: 'online' | 'offline';
  streamUrl: string; // URL for the raw video stream
  thumbnailUrl?: string; // Optional URL for a preview image
}

/**
 * @description Represents a summary of all behaviors captured by a camera at a specific time
 */
export interface BehaviorSummary {
  id: string;
  cameraId: string; // Foreign key to link to a Camera
  timestamp: string; // ISO 8601 date string
  eatingCount: number;
  drinkingCount: number;
  lickingCount: number;
  standingCount: number;
  lyingCount: number;
}

/**
 * @description Represents an individual animal
 */
export interface Animal {
  id: string;
  type: 'Sheep' | 'Pig' | 'Rabbit'; // Example animal types
  penId: string; // Foreign key to link to a Pen
}

/**
 * @description Represents production performance data for an animal
 */
export interface ProductionPerformance {
  id: string;
  animalId: string; // Foreign key to link to an Animal
  type: 'feedIntake' | 'weightGain'; // Type of performance metric
  granularity: 'daily' | 'weekly' | 'cycle'; // Time granularity of the statistic
  value: number; // The actual value of the metric (e.g., in kg)
  date: string; // The date for which the record is valid (e.g., '2023-10-27')
}

// =================================================================
// Types for Charting (v2 - supports merged charts)
// =================================================================

/**
 * @description Represents a single data point for a chart.
 * Can contain multiple values if charts are merged.
 */
export interface ChartDataPoint {
  time: string;
  [key: string]: any; // Allows for multiple sensor values, e.g., { time: '10:00', 'sensor-a-t1': 22.5, 'sensor-a-t2': 23.1 }
}

/**
 * @description Defines a single line to be drawn on the chart.
 */
export interface ChartLine {
  dataKey: string; // Unique key for the line, e.g., 'sensor-a-t1' or 'value'
  name: string; // Name to display in the legend, e.g., 'A区-东侧温度计'
  color: string; // Color of the line
  yAxisId?: string; // ID of the Y-axis this line belongs to
}

export interface YAxisConfig {
  id: string;
  unit: string;
  orientation?: 'left' | 'right';
  color?: string;
}

/**
 * @description Represents a complete dataset for a single chart component, which can contain multiple lines.
 */
export interface MergedChartData {
  title: string; // The overall title of the chart, e.g., 'Temperature'
  sensorType: Sensor['type'] | 'Mixed';
  unit?: string;
  yAxes?: YAxisConfig[];
  lines: ChartLine[]; // An array of lines to draw
  data: ChartDataPoint[]; // The actual data points for the chart
}

/**
 * @description Represents a system user
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'visitor';
  status: 'active' | 'inactive';
  createdAt: string;
}

/**
 * @description Represents an alert rule
 */
export interface AlertRule {
  id: string;
  name: string;
  sensorName: string;
  ruleType: 'manual' | 'smart'; // manual: 手动规则, smart: 智能规则
  condition: 'gt' | 'lt' | 'eq'; // greater than, less than, equal
  threshold: number;
  notificationMethod: 'email' | 'sms' | 'both';
  enabled: boolean;
}
