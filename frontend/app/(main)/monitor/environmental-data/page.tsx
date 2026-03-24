'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import EnvironmentalDataFilter from '../components/EnvironmentalDataFilter';
import SensorStatusList from '../components/SensorStatusList';
import { mockSheds, mockSensors } from '@/constants/mockData';
import { Sensor } from '@/types';

// Define an enhanced type for the list component
export type SensorForList = Sensor & { shedName: string };

const EnvironmentalDataPage = () => {
  const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);

  const handleSelectionChange = useCallback((sensorIds: string[]) => {
    setSelectedSensorIds(sensorIds);
  }, []);

  // This memo block creates the final list for rendering, including the shedName
  const sensorsForList = useMemo((): SensorForList[] => {
    // On initial load, selectedSensorIds might be empty, but the filter component
    // will immediately call onSelectionChange with all IDs.
    if (selectedSensorIds.length === 0) {
      return [];
    }

    const shedMap = new Map(mockSheds.map((shed) => [shed.id, shed.name]));

    const filtered = mockSensors.filter((sensor) =>
      selectedSensorIds.includes(sensor.id)
    );

    return filtered.map((sensor) => ({
      ...sensor,
      shedName: shedMap.get(sensor.shedId) || '未知羊舍',
    }));
  }, [selectedSensorIds]);

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          borderLeft: '4px solid #2E7D32',
          pl: 1.5,
          py: 0.5,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          环境数据监控
        </Typography>
        <Typography variant="body2" color="text.secondary">
          查看所有畜舍传感器实时读数
        </Typography>
      </Box>

      <EnvironmentalDataFilter
        sheds={mockSheds}
        sensors={mockSensors}
        onSelectionChange={handleSelectionChange}
      />

      <SensorStatusList sensors={sensorsForList} />
    </Box>
  );
};

export default EnvironmentalDataPage;
