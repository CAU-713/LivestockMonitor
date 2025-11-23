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
import LineChart from '../../../components/charts/LineChart';
import {
  mockDashboardKPIs,
  mockOverallTemperatureTrend,
  mockOverallHumidityTrend,
  mockOfflineDevices,
  mockSheds,
  mockSensors,
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
      title: '牲畜总数',
      icon: <FenceIcon />,
      value: mockDashboardKPIs.totalLivestock.value,
      unit: mockDashboardKPIs.totalLivestock.unit,
      status: 'normal' as KPIStatus,
    },
    {
      id: 'devices',
      title: '设备状态',
      icon: <DevicesIcon />,
      value: mockDashboardKPIs.deviceStatus.value,
      unit: undefined,
      status: 'normal' as KPIStatus,
    },
    {
      id: 'temp',
      title: '牧场平均温度',
      icon: <ThermostatIcon />,
      value: mockDashboardKPIs.avgTemperature.value,
      unit: mockDashboardKPIs.avgTemperature.unit,
      status: mockDashboardKPIs.avgTemperature.status as KPIStatus,
    },
    {
      id: 'ammonia',
      title: '牧场平均氨气',
      icon: <AirIcon />,
      value: mockDashboardKPIs.avgAmmonia.value,
      unit: mockDashboardKPIs.avgAmmonia.unit,
      status: mockDashboardKPIs.avgAmmonia.status as KPIStatus,
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">牧场总体趋势</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
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

        return (
          <Grid item xs={12} md={6} key={shed.id}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6">{shed.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {shed.livestockCount} 只牲畜
                  </Typography>
                  <Stack direction="row" spacing={2} mt={1}>
                    <Typography variant="caption">温度: {avgTemp}°C</Typography>
                    <Typography variant="caption">湿度: {avgHumidity}%</Typography>
                    <Typography variant="caption">氨气: {avgAmmonia}ppm</Typography>
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  component={Link}
                  href={`/monitor/environmental-data?shed=${shed.id}`}
                >
                  进入监控
                </Button>
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DashboardPage;
