'use client';
import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/GridLegacy';
import {
  Paper,
  Typography,
  Stack,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';

// Import Icons for KPIs
import PetsIcon from '@mui/icons-material/Pets';
import DevicesIcon from '@mui/icons-material/Devices';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ThermostatAutoIcon from '@mui/icons-material/ThermostatAuto';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import Co2Icon from '@mui/icons-material/Co2';
import OpacityIcon from '@mui/icons-material/Opacity';
import LightModeIcon from '@mui/icons-material/LightMode';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import GrainIcon from '@mui/icons-material/Grain';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Import Components and Data
import KPICard from './components/KPICard';
import DeviceStatusList from './components/AlertList';
import ComfortAssessmentPanel from './components/ComfortAssessmentPanel';
import LineChart from '../../../components/charts/LineChart';
import {
  mockOverallTemperatureTrend,
  mockOverallHumidityTrend,
  mockOfflineDevices,
  mockSheds as fallbackSheds,
  mockSensors as fallbackSensors,
} from '../../../constants/mockData';
import type { ComfortAssessment } from './components/ComfortAssessmentPanel';
import { MergedChartData } from '@/types';
import type { Shed, Sensor } from '@/types';
import { shedApi, sensorApi } from '@/lib/api/apiService';

type ChartType = 'temperature' | 'humidity';
type KPIStatus = 'normal' | 'warning' | 'danger';

const kpiConfig = [
  { id: 'livestock', accentColor: '#2E7D32', bgColor: '#E8F5E9' },
  { id: 'area', accentColor: '#1565C0', bgColor: '#E3F2FD' },
  { id: 'devices', accentColor: '#6A1B9A', bgColor: '#F3E5F5' },
  { id: 'temp', accentColor: '#E65100', bgColor: '#FFF3E0' },
];

const sensorIconMap: Record<string, React.ReactNode> = {
  Temperature: <ThermostatAutoIcon sx={{ fontSize: 14 }} />,
  Humidity: <WaterDropIcon sx={{ fontSize: 14 }} />,
  WindSpeed: <AirIcon sx={{ fontSize: 14 }} />,
  Ammonia: <BubbleChartIcon sx={{ fontSize: 14 }} />,
  CO2: <Co2Icon sx={{ fontSize: 14 }} />,
  CH4: <GrainIcon sx={{ fontSize: 14 }} />,
  Oxygen: <OpacityIcon sx={{ fontSize: 14 }} />,
  H2S: <BubbleChartIcon sx={{ fontSize: 14 }} />,
  PM: <GrainIcon sx={{ fontSize: 14 }} />,
  Light: <LightModeIcon sx={{ fontSize: 14 }} />,
};

const basicSensorTypes = ['Temperature', 'Humidity', 'WindSpeed'];
const gasSensorTypes = ['Ammonia', 'CO2', 'CH4', 'Oxygen', 'H2S', 'PM', 'Light'];

const sensorFormatMap: Record<string, { unit: string; label: string }> = {
  Temperature: { unit: '°C', label: '温度' },
  Humidity: { unit: '%', label: '湿度' },
  WindSpeed: { unit: 'm/s', label: '风速' },
  Ammonia: { unit: 'ppm', label: 'NH₃' },
  CO2: { unit: 'ppm', label: 'CO₂' },
  CH4: { unit: 'ppm', label: 'CH₄' },
  Oxygen: { unit: '%', label: 'O₂' },
  H2S: { unit: 'ppm', label: 'H₂S' },
  PM: { unit: 'μg/m³', label: 'PM2.5' },
  Light: { unit: 'lux', label: '光照' },
};

const sensorChipColors: Record<string, { bg: string; color: string }> = {
  Temperature: { bg: '#FFF3E0', color: '#E65100' },
  Humidity: { bg: '#E3F2FD', color: '#1565C0' },
  WindSpeed: { bg: '#E8F5E9', color: '#2E7D32' },
  Ammonia: { bg: '#F3E5F5', color: '#6A1B9A' },
  CO2: { bg: '#E8EAF6', color: '#283593' },
  CH4: { bg: '#FCE4EC', color: '#880E4F' },
  Oxygen: { bg: '#E0F2F1', color: '#00695C' },
  H2S: { bg: '#FFF8E1', color: '#F57F17' },
  PM: { bg: '#EFEBE9', color: '#4E342E' },
  Light: { bg: '#FFFDE7', color: '#F9A825' },
};

const assessEnvironment = (
  temp?: number | string,
  humidity?: number | string,
  wind?: number | string,
  radiation?: number | string
): ComfortAssessment => {
  const t = typeof temp === 'number' ? temp : parseFloat(String(temp));
  const h = typeof humidity === 'number' ? humidity : parseFloat(String(humidity));
  const w = typeof wind === 'number' ? wind : parseFloat(String(wind));
  const r = typeof radiation === 'number' ? radiation : parseFloat(String(radiation));

  if (t > 4.6 && t < 6.7 && h > 66 && h < 88 && w < 0.4 && r > 9290.16 && r < 0.5) {
    return { status: 'comfort', label: '正常阶段', color: '#4CAF50', backgroundColor: '#4CAF50', description: '满足正常阶段所有条件' };
  }
  if (t > 1.9 && t < 4.5 && h > 76 && h < 88 && w < 9340.48 && r > 0.27 && r < 0.43) {
    return { status: 'cold-stress', label: '轻度冷应激', color: '#FF9800', backgroundColor: '#FF9800', description: '满足轻度冷应激条件，需关注保温和供暖' };
  }
  if (t < 2 && h > 65 && h < 76 && w > 0.5 && w < 9390.92 && r > -0.6 && r < 0.27) {
    return { status: 'cold-stress', label: '重度冷应激', color: '#F44336', backgroundColor: '#F44336', description: '满足重度冷应激条件，需立即采取保暖措施' };
  }
  return { status: 'cold-stress', label: '未定义', color: '#9E9E9E', backgroundColor: '#9E9E9E', description: '当前环境参数未命中给定规则' };
};

const DashboardPage = () => {
  const [selectedChart, setSelectedChart] = useState<ChartType>('temperature');
  const [sheds, setSheds] = useState<Shed[]>(fallbackSheds);
  const [sensors, setSensors] = useState<Sensor[]>(fallbackSensors);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [shedData, sensorData] = await Promise.all([
          shedApi.getSheds(),
          sensorApi.getSensors({ page_size: 500 }),
        ]);
        if (shedData.length > 0) setSheds(shedData);
        if (sensorData.length > 0) setSensors(sensorData);
      } catch (e) {
        console.warn('Dashboard load failed, using mock data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChartChange = (event: SelectChangeEvent<string>) => {
    setSelectedChart(event.target.value as ChartType);
  };

  const chartDataMap: Record<ChartType, MergedChartData> = {
    temperature: mockOverallTemperatureTrend,
    humidity: mockOverallHumidityTrend,
  };

  // 计算 KPI
  const totalLivestock = sheds.reduce((sum, s) => sum + (s.livestockCount || 0), 0);
  const totalArea = sheds.reduce((sum, s) => sum + (s.area || 0), 0);
  const onlineSensors = sensors.filter((s) => s.status === 'active').length;
  const avgTemp = sensors.filter((s) => s.type === 'Temperature' && s.lastReading != null)
    .reduce((sum, s, _, arr) => sum + s.lastReading! / arr.length, 0);

  const kpiData = [
    { id: 'livestock', title: '养殖动物总数', icon: <PetsIcon />, value: totalLivestock, unit: '只', status: 'normal' as KPIStatus, subtitle: '全场存栏量' },
    { id: 'area', title: '畜舍总面积', icon: <HomeWorkIcon />, value: totalArea || '—', unit: totalArea ? '㎡' : undefined, status: 'normal' as KPIStatus, subtitle: '可用养殖空间' },
    { id: 'devices', title: '工作设备数', icon: <DevicesIcon />, value: `${onlineSensors} / ${sensors.length}`, unit: undefined, status: 'normal' as KPIStatus, subtitle: '在线传感器' },
    { id: 'temp', title: '畜舍平均温度', icon: <ThermostatIcon />, value: avgTemp ? parseFloat(avgTemp.toFixed(1)) : '—', unit: avgTemp ? '°C' : undefined, status: (avgTemp > 25 ? 'warning' : 'normal') as KPIStatus, subtitle: '所有羊舍均值' },
  ];

  return (
    <Grid container spacing={3}>
      {/* Row 1: KPIs */}
      {kpiData.map((kpi) => {
        const cfg = kpiConfig.find((c) => c.id === kpi.id);
        return (
          <Grid item xs={12} sm={6} md={3} key={kpi.id}>
            <KPICard
              title={kpi.title}
              icon={kpi.icon}
              value={kpi.value as any}
              unit={kpi.unit}
              status={kpi.status}
              accentColor={cfg?.accentColor}
              bgColor={cfg?.bgColor}
              subtitle={kpi.subtitle}
            />
          </Grid>
        );
      })}

      {/* Row 2: 趋势图 + 告警列表（保持 mock 数据）*/}
      <Grid item xs={12} lg={8} sx={{ height: 430 }}>
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, height: '100%', borderTop: '4px solid #2E7D32' }}>
          <Stack direction="row" alignItems="center" mb={2} spacing={2}>
            <Typography variant="h6" fontWeight={700}>畜舍总体趋势</Typography>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>指标</InputLabel>
              <Select value={selectedChart} label="指标" onChange={handleChartChange}>
                <MenuItem value="temperature">温度</MenuItem>
                <MenuItem value="humidity">湿度</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <LineChart chartData={chartDataMap[selectedChart]} />
        </Paper>
      </Grid>
      <Grid item xs={12} lg={4}>
        <DeviceStatusList devices={mockOfflineDevices} />
      </Grid>

      {/* Row 3: 各区域概览 */}
      <Grid item xs={12}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h6" fontWeight={700}>各区域概览</Typography>
          {loading ? (
            <CircularProgress size={16} />
          ) : (
            <Chip label={`共 ${sheds.length} 个区域`} size="small" sx={{ backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32', fontWeight: 600 }} />
          )}
        </Stack>
      </Grid>

      {sheds.map((shed) => {
        const shedSensors = sensors.filter((s) => s.shedId === shed.id);

        const getSensorReading = (type: string): string | number => {
          return shedSensors.find((s) => s.type === type)?.lastReading ?? 'N/A';
        };

        const getSensorValue = (type: string) =>
          shedSensors.find((s) => s.type === type)?.lastReading as number | undefined;

        const envTemp = getSensorValue('Temperature') ?? getSensorReading('Temperature');
        const envHumidity = getSensorValue('Humidity') ?? getSensorReading('Humidity');
        const envWind = getSensorValue('WindSpeed') ?? getSensorReading('WindSpeed');
        const computedAssessment = assessEnvironment(envTemp, envHumidity, envWind);

        return (
          <Grid item xs={12} md={6} key={shed.id}>
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', transition: 'box-shadow 0.2s ease', '&:hover': { boxShadow: '0 6px 20px rgba(46,125,50,0.15)' } }}>
              <Box sx={{ height: 4, background: 'linear-gradient(90deg, #1B5E20, #66BB6A)' }} />
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{shed.name}</Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.25}>
                      <Chip
                        icon={<PetsIcon sx={{ fontSize: '12px !important' }} />}
                        label={`${shed.livestockCount} 只动物`}
                        size="small"
                        sx={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.72rem', height: 22 }}
                      />
                    </Stack>
                  </Box>
                  <Button
                    variant="contained"
                    component={Link}
                    href={`/monitor/environmental-data?shed=${shed.id}`}
                    size="small"
                    endIcon={<ArrowForwardIosIcon sx={{ fontSize: '12px !important' }} />}
                    sx={{ whiteSpace: 'nowrap', borderRadius: 2 }}
                  >
                    进入监控
                  </Button>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Box mb={1.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                    基础环境
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {basicSensorTypes.map((type) => {
                      const fmt = sensorFormatMap[type];
                      const reading = getSensorReading(type);
                      const chipStyle = sensorChipColors[type] || { bg: '#f5f5f5', color: '#555' };
                      return (
                        <Chip
                          key={type}
                          icon={<Box sx={{ display: 'flex', color: chipStyle.color }}>{sensorIconMap[type]}</Box>}
                          label={`${fmt.label} ${reading}${reading !== 'N/A' ? fmt.unit : ''}`}
                          size="small"
                          sx={{ backgroundColor: chipStyle.bg, color: chipStyle.color, fontWeight: 600, fontSize: '0.72rem', height: 24, '& .MuiChip-icon': { color: chipStyle.color, ml: '6px' } }}
                        />
                      );
                    })}
                  </Stack>
                </Box>

                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                    气体指标
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {gasSensorTypes.map((type) => {
                      const fmt = sensorFormatMap[type];
                      const reading = getSensorReading(type);
                      const chipStyle = sensorChipColors[type] || { bg: '#f5f5f5', color: '#555' };
                      return (
                        <Chip
                          key={type}
                          icon={<Box sx={{ display: 'flex', color: chipStyle.color }}>{sensorIconMap[type]}</Box>}
                          label={`${fmt.label} ${reading}${reading !== 'N/A' ? fmt.unit : ''}`}
                          size="small"
                          sx={{ backgroundColor: chipStyle.bg, color: chipStyle.color, fontWeight: 600, fontSize: '0.72rem', height: 24, '& .MuiChip-icon': { color: chipStyle.color, ml: '6px' } }}
                        />
                      );
                    })}
                  </Stack>
                </Box>

                <ComfortAssessmentPanel assessment={computedAssessment} />
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DashboardPage;
