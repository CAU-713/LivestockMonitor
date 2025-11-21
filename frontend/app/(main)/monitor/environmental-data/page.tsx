'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import EnvironmentalDataFilter from '../../../../components/monitor/EnvironmentalDataFilter';
import SensorStatusList from '../../../../components/monitor/SensorStatusList';
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
      <Typography variant='h4' sx={{ mb: 2 }}>
        环境数据监控
      </Typography>

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
