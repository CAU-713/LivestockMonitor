/**
 * 传感器类型共享常量
 * 统一管理类型名称映射、颜色映射和单位映射，避免三个页面重复定义。
 */

export const typeNameMap: Record<string, string> = {
  Temperature: '温度',
  Humidity: '湿度',
  CO2: 'CO₂',
  Light: '光照',
  WindSpeed: '风速',
  Ammonia: '氨气',
  CH4: 'CH₄',
  Oxygen: 'O₂',
  H2S: 'H₂S',
  PM: '颗粒物',
  Noise: '噪音',
  Device: '设备',
};

export const typeColorMap: Record<string, { bg: string; color: string }> = {
  Temperature: { bg: '#FFF3E0', color: '#E65100' },
  Humidity: { bg: '#E3F2FD', color: '#1565C0' },
  CO2: { bg: '#E8EAF6', color: '#283593' },
  Light: { bg: '#FFFDE7', color: '#F9A825' },
  WindSpeed: { bg: '#E8F5E9', color: '#2E7D32' },
  Ammonia: { bg: '#F3E5F5', color: '#6A1B9A' },
  CH4: { bg: '#FCE4EC', color: '#880E4F' },
  Oxygen: { bg: '#E0F2F1', color: '#00695C' },
  H2S: { bg: '#FFF8E1', color: '#F57F17' },
  PM: { bg: '#EFEBE9', color: '#4E342E' },
  Noise: { bg: '#ECEFF1', color: '#455A64' },
  Device: { bg: '#E8EAF6', color: '#3949AB' },
};

export const getUnit = (type: string): string => {
  const m: Record<string, string> = {
    Temperature: '°C',
    Humidity: '%RH',
    CO2: 'ppm',
    Light: 'lux',
    WindSpeed: 'm/s',
    Ammonia: 'ppm',
    CH4: 'ppm',
    Oxygen: '%',
    H2S: 'ppm',
    PM: 'μg/m³',
    Noise: 'dB',
    Device: '',
  };
  return m[type] || '';
};

/** 判断是否为设备类测点（I/M 前缀，value 为 true/false） */
export const isDevicePoint = (pointId: string): boolean => {
  if (!pointId) return false;
  const prefix = pointId.split('-')[0]?.toUpperCase() || '';
  return prefix.startsWith('I') || prefix.startsWith('M');
};

/** 判断是否为 Q 类测点（气体/控制关联，value 为 true/false） */
export const isQPoint = (pointId: string): boolean => {
  if (!pointId) return false;
  const prefix = pointId.split('-')[0]?.toUpperCase() || '';
  return prefix.startsWith('Q');
};

/** 判断是否为布尔型设备点（I/M/Q 且 value 是 true/false） */
export const isBoolPoint = (pointId: string): boolean => {
  return isDevicePoint(pointId) || isQPoint(pointId);
};

/** 获取设备点的显示类型（I/M/Q 统一返回 'Device'，否则 null） */
export const getDeviceType = (pointId: string): 'Device' | null => {
  if (!pointId) return null;
  const prefix = pointId.split('-')[0]?.toUpperCase() || '';
  if (prefix.startsWith('I') || prefix.startsWith('M') || prefix.startsWith('Q')) return 'Device';
  return null;
};
