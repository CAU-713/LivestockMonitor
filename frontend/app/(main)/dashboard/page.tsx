'use client';
import React, { useState } from 'react';
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
} from '@mui/material';
import Link from 'next/link';

// Import Icons for KPIs
import FenceIcon from '@mui/icons-material/Fence';
import DevicesIcon from '@mui/icons-material/Devices';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';

// Import Components and Data
import KPICard from '../../../components/dashboard/KPICard';
import DeviceStatusList from '../../../components/dashboard/AlertList';
import ComfortAssessmentPanel from '../../../components/dashboard/ComfortAssessmentPanel';
import LineChart from '../../../components/charts/LineChart';
import {
  mockDashboardKPIs,
  mockOverallTemperatureTrend,
  mockOverallHumidityTrend,
  mockOfflineDevices,
  mockSheds,
  mockSensors,
  mockComfortAssessments,
} from '../../../constants/mockData';
import { MergedChartData } from '@/types';

type ChartType = 'temperature' | 'humidity';
type KPIStatus = 'normal' | 'warning' | 'danger';

const DashboardPage = () => {
  const [selectedChart, setSelectedChart] = useState<ChartType>('temperature');

  const handleChartChange = (event: SelectChangeEvent<string>) => {
    setSelectedChart(event.target.value as ChartType);
  };

  const chartDataMap: Record<ChartType, MergedChartData> = {
    temperature: mockOverallTemperatureTrend,
    humidity: mockOverallHumidityTrend,
  };

  // Flatten the data structure to directly match KPICard props
  const kpiData = [
    {
      id: 'livestock',
      title: '养殖动物总数',
      icon: <FenceIcon />,
      value: mockDashboardKPIs.totalLivestock.value,
      unit: mockDashboardKPIs.totalLivestock.unit,
      status: 'normal' as KPIStatus,
    },
    {
      id: 'area',
      title: '畜舍总面积',
      icon: <FenceIcon />,
      value: mockDashboardKPIs.totalArea.value,
      unit: mockDashboardKPIs.totalArea.unit,
      status: 'normal',
    },

    {
      id: 'devices',
      title: '工作设备数',
      icon: <DevicesIcon />,
      value: mockDashboardKPIs.deviceStatus.value,
      unit: undefined,
      status: 'normal' as KPIStatus,
    },
    {
      id: 'temp',
      title: '畜舍平均温度',
      icon: <ThermostatIcon />,
      value: mockDashboardKPIs.avgTemperature.value,
      unit: mockDashboardKPIs.avgTemperature.unit,
      status: mockDashboardKPIs.avgTemperature.status as KPIStatus,
    },
    
  ];

  return (
    <Grid container spacing={3}>
      {/* Row 1: KPIs */}
      {kpiData.map((kpi) => (
        <Grid item xs={12} sm={6} md={3} key={kpi.id}>
          <KPICard
            title={kpi.title}
            icon={kpi.icon}
            value={kpi.value}
            unit={kpi.unit}
            status={kpi.status}
          />
        </Grid>
      ))}

      {/* Row 2: Main Chart and Offline Devices */}
      <Grid item xs={12} lg={8}>
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: '100%' }}>
          <Stack direction="row" alignItems="center" mb={2} spacing={2}>
            <Typography variant="h6">畜舍总体趋势</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>指标</InputLabel>
              <Select value={selectedChart} label="指标" onChange={handleChartChange}>
                <MenuItem value="temperature">温度</MenuItem>
                <MenuItem value="humidity">湿度</MenuItem>
              </Select>
            </FormControl>
            {chartDataMap[selectedChart]?.data.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  // 当前日期 = 结束日期
                  const endDate = new Date();
                  const endMonth = endDate.getMonth() + 1;
                  const endDay = endDate.getDate();

                  // 开始日期 = 当前日期 - 1 天
                  const startDate = new Date();
                  startDate.setDate(startDate.getDate() - 1);
                  const startMonth = startDate.getMonth() + 1;
                  const startDay = startDate.getDate();

                  // 从图表数据中获取第一个和最后一个时间点
                  const firstTime = chartDataMap[selectedChart].data[0]?.time;
                  const lastTime =
                    chartDataMap[selectedChart].data[
                      chartDataMap[selectedChart].data.length - 1
                    ]?.time;

                  // 解析时间（HH:MM）
                  const parseTime = (timeStr: string) => {
                    const [hour, minute] = timeStr.split(':').map(Number);
                    return { hour, minute };
                  };

                  const firstParsed = parseTime(firstTime);
                  const lastParsed = parseTime(lastTime);

                  // 显示：开始日期/开始时间 - 结束日期/结束时间
                  return `${startMonth}/${startDay}/${firstParsed.hour
                    .toString()
                    .padStart(2, '0')}:${firstParsed.minute
                    .toString()
                    .padStart(2, '0')} - ${endMonth}/${endDay}/${lastParsed.hour
                    .toString()
                    .padStart(2, '0')}:${lastParsed.minute.toString().padStart(2, '0')}`;
                })()}
              </Typography>
            )}

          </Stack>
          <LineChart chartData={chartDataMap[selectedChart]} />
        </Paper>
      </Grid>
      <Grid item xs={12} lg={4}>
        <DeviceStatusList devices={mockOfflineDevices} />
      </Grid>

      {/* Row 3: Shed Overviews */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          各区域概览
        </Typography>
      </Grid>
      {mockSheds.map((shed) => {
        const shedSensors = mockSensors.filter((s) => s.shedId === shed.id);
        const avgTemp = shedSensors.find((s) => s.type === 'Temperature')?.lastReading ?? 'N/A';
        const avgHumidity = shedSensors.find((s) => s.type === 'Humidity')?.lastReading ?? 'N/A';
        const avgAmmonia = shedSensors.find((s) => s.type === 'Ammonia')?.lastReading ?? 'N/A';
        const avgCO2 = shedSensors.find((s) => s.type === 'CO2')?.lastReading ?? 'N/A';
        const avgCH4 = shedSensors.find((s) => s.type === 'CH4')?.lastReading ?? 'N/A';
        const avgOxygen = shedSensors.find((s) => s.type === 'Oxygen')?.lastReading ?? 'N/A';
        const avgWindSpeed = shedSensors.find((s) => s.type === 'WindSpeed')?.lastReading ?? 'N/A';
        const avgH2S = shedSensors.find((s) => s.type === 'H2S')?.lastReading ?? 'N/A';
        const avgPM = shedSensors.find((s) => s.type === 'PM')?.lastReading ?? 'N/A';
        const avgLight = shedSensors.find((s) => s.type === 'Light')?.lastReading ?? 'N/A';

        return (
          <Grid item xs={12} md={6} key={shed.id}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Stack spacing={2}>
                {/* 上部分：信息和按钮 */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6">{shed.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shed.livestockCount} 只动物
                    </Typography>
                    <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                      <Typography variant="caption">温度: {avgTemp}°C</Typography>
                      <Typography variant="caption">湿度: {avgHumidity}%</Typography>
                      <Typography variant="caption">氨气: {avgAmmonia}ppm</Typography>
                      <Typography variant="caption">CO₂: {avgCO2}ppm</Typography>
                      <Typography variant="caption">甲烷: {avgCH4}ppm</Typography>
                      <Typography variant="caption">含氧量: {avgOxygen}%</Typography>
                      <Typography variant="caption">风速: {avgWindSpeed}m/s</Typography>
                      <Typography variant="caption">硫化氢: {avgH2S}ppm</Typography>
                      <Typography variant="caption">PM2.5/PM10: {avgPM}μg/m³</Typography>
                      <Typography variant="caption">光照强度: {avgLight}lux</Typography>
                    </Stack>
                  </Box>
                  <Button
                    variant="contained"
                    component={Link}
                    href={`/monitor/environmental-data?shed=${shed.id}`}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    进入监控
                  </Button>
                </Stack>

                {/* 下部分：环境舒适度评价 */}
                <ComfortAssessmentPanel assessment={mockComfortAssessments[shed.id]} />
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DashboardPage;
