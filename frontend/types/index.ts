// TypeScript types and interfaces go here
export * from './ragflow';

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
    | 'Light'
    | 'Radiation'; // Example sensor types (热辐射，单位 W/m²)
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
  sensorType: string;
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

// =================================================================
// Types for Alert Center
// =================================================================

/**
 * @description Represents an alert record
 */
export interface Alert {
  id: number;
  shed_id: number;
  shed_name?: string;
  pen_id?: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  alert_time: string; // ISO 8601
  resolved: boolean;
  resolved_by?: string;
  resolve_time?: string;
}

export interface AlertStats {
  total: number;
  unresolved: number;
  high: number;
  medium: number;
  low: number;
  high_unresolved: number;
  medium_unresolved: number;
  low_unresolved: number;
}

// =================================================================
// Types for Animal Management
// =================================================================

/**
 * @description Represents a livestock animal record
 */
export interface AnimalRecord {
  id: number;
  name: string; // 编号
  breed: string;
  age: number; // months
  gender: 'male' | 'female';
  health_status: 'good' | 'ill' | 'under_treatment' | 'removal';
  shed_id: number;
  shed_name?: string;
  current_pen_id?: number;
  entry_date: string;
  birth_date: string;
  description?: string;
  dam_id?: number;
  sire_id?: string;
  production_type: 'breeding' | 'fattening' | 'test';
  breeding_status?: 'empty' | 'mated_wait' | 'pregnant' | 'perinatal' | 'lactation' | 'abortion';
  delivery_date?: string;
  mating_date?: string;
}

export interface AnimalStats {
  total: number;
  good: number;
  ill: number;
  under_treatment: number;
  removal: number;
  breeding_count: number;
  fattening_count: number;
}

// =================================================================
// Types for Data Analysis
// =================================================================

/**
 * @description Represents the statistical summary for a single variable.
 */
export interface StatisticsSummaryData {
  variable: string;
  mean: number;
  variance: number;
  std: number;
  min: number;
  max: number;
  count: number;
}

/**
 * @description Represents a correlation matrix.
 * The outer keys are variable names, and the inner keys are the variables they are compared against.
 * @example { 'temp_in': { 'temp_out': 0.8, 'humidity': -0.5 } }
 */
export interface CorrelationMatrix {
  [variable: string]: {
    [otherVariable: string]: number;
  };
}
