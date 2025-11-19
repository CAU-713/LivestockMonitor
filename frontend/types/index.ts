// TypeScript types and interfaces go here

/**
 * @description Represents a single livestock shed
 */
export interface Shed {
  id: string;
  name: string;
  location: string;
  livestockCount: number;
}

/**
 * @description Represents a pen within a shed
 */
export interface Pen {
  id:string;
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
  type: 'Temperature' | 'Humidity' | 'Ammonia'; // Example sensor types
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
