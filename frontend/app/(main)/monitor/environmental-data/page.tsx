'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import EnvironmentalDataFilter from '../components/EnvironmentalDataFilter';
import SensorStatusList from '../components/SensorStatusList';
import { mockSheds as fallbackSheds, mockSensors as fallbackSensors } from '@/constants/mockData';
import { shedApi, sensorApi } from '@/lib/api/apiService';
import { Shed, Sensor } from '@/types';

export type SensorForList = Sensor & { shedName: string };

const EnvironmentalDataPage = () => {
  const [sheds, setSheds] = useState<Shed[]>(fallbackSheds);
  const [sensors, setSensors] = useState<Sensor[]>(fallbackSensors);
  const [loading, setLoading] = useState(true);
  const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [shedData, sensorData] = await Promise.all([
          shedApi.getSheds(),
          sensorApi.getSensors({ page_size: 500 }),
        ]);
        if (shedData.length > 0) setSheds(shedData);
        if (sensorData.length > 0) setSensors(sensorData);
      } catch (e) {
        console.warn('EnvironmentalDataPage load failed, using mock data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectionChange = useCallback((sensorIds: string[]) => {
    setSelectedSensorIds(sensorIds);
  }, []);

  const sensorsForList = useMemo((): SensorForList[] => {
    if (selectedSensorIds.length === 0) return [];
    const shedMap = new Map(sheds.map((shed) => [shed.id, shed.name]));
    const filtered = sensors.filter((sensor) => selectedSensorIds.includes(sensor.id));
    return filtered.map((sensor) => ({
      ...sensor,
      shedName: shedMap.get(sensor.shedId) || '未知羊舍',
    }));
  }, [selectedSensorIds, sheds, sensors]);

  return (
    <Box>
      <Box sx={{ mb: 2, borderLeft: '4px solid #2E7D32', pl: 1.5, py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" fontWeight={700}>环境数据监控</Typography>
          {loading && <CircularProgress size={18} sx={{ color: '#2E7D32' }} />}
        </Box>
        <Typography variant="body2" color="text.secondary">查看所有畜舍传感器实时读数</Typography>
      </Box>

      <EnvironmentalDataFilter
        sheds={sheds}
        sensors={sensors}
        onSelectionChange={handleSelectionChange}
      />

      <SensorStatusList sensors={sensorsForList} />
    </Box>
  );
};

export default EnvironmentalDataPage;
