'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Checkbox,
} from '@mui/material';
import { Shed, Sensor } from '@/types';

interface EnvironmentalDataFilterProps {
  sheds: Shed[];
  sensors: Sensor[];
  onSelectionChange: (selectedSensorIds: string[]) => void;
}

// Helper type for sensors with shedName
type EnhancedSensor = Sensor & { shedName: string };

const EnvironmentalDataFilter: React.FC<EnvironmentalDataFilterProps> = ({
  sheds,
  sensors,
  onSelectionChange,
}) => {
  const [selectedSensors, setSelectedSensors] = useState<EnhancedSensor[]>([]);

  // Enhance sensors with shedName for grouping and easier lookup
  const enhancedSensors = useMemo<EnhancedSensor[]>(() => {
    const shedMap = new Map(sheds.map((shed) => [shed.id, shed.name]));
    return sensors.map((sensor) => ({
      ...sensor,
      shedName: shedMap.get(sensor.shedId) || '未知羊舍',
    }));
  }, [sensors, sheds]);

  // Effect to notify the parent component of the selection change
  useEffect(() => {
    // On initial load, select all sensors by default
    if (selectedSensors.length === 0) {
      onSelectionChange(enhancedSensors.map((s) => s.id));
    } else {
      onSelectionChange(selectedSensors.map((s) => s.id));
    }
  }, [selectedSensors, onSelectionChange, enhancedSensors]);

  const handleToggleGroup = (groupName: string) => {
    const sensorsInGroup = enhancedSensors.filter(
      (s) => s.shedName === groupName
    );
    const selectedSensorsInGroup = selectedSensors.filter(
      (s) => s.shedName === groupName
    );

    const allInGroupSelected =
      sensorsInGroup.length === selectedSensorsInGroup.length;

    let newSelectedSensors = selectedSensors.filter(
      (s) => s.shedName !== groupName
    );

    if (!allInGroupSelected) {
      newSelectedSensors = [...newSelectedSensors, ...sensorsInGroup];
    }

    setSelectedSensors(newSelectedSensors);
  };

  return (
    <Box
      sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <Typography variant='subtitle1' sx={{ mr: 1 }}>
        筛选:
      </Typography>
      <Autocomplete
        multiple
        id='grouped-sensor-selector'
        options={enhancedSensors.sort((a, b) =>
          a.shedName.localeCompare(b.shedName)
        )}
        value={selectedSensors}
        disableCloseOnSelect
        getOptionLabel={(option) => `${option.name} (${option.type})`}
        groupBy={(option) => option.shedName}
        onChange={(event, newValue) => setSelectedSensors(newValue)}
        sx={{ width: 520 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label='选择传感器'
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <Typography sx={{ pl: 1, whiteSpace: 'nowrap' }}>
                  {selectedSensors.length > 0
                    ? `${selectedSensors.length} 个已选择`
                    : ''}
                </Typography>
              ),
            }}
          />
        )}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox style={{ marginRight: 8 }} checked={selected} />
            {`${option.name} (${option.type})`}
          </li>
        )}
        // Return null to prevent default tags from rendering, as we handle it in renderInput
        renderTags={() => null}
        renderGroup={(params) => {
          const sensorsInGroup = enhancedSensors.filter(
            (s) => s.shedName === params.group
          );
          const selectedCount = selectedSensors.filter(
            (s) => s.shedName === params.group
          ).length;
          const isGroupSelected = selectedCount === sensorsInGroup.length;
          const isGroupIndeterminate =
            selectedCount > 0 && selectedCount < sensorsInGroup.length;

          return (
            <li key={params.key}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  pl: 1.5,
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleGroup(params.group)}
              >
                <Checkbox
                  checked={isGroupSelected}
                  indeterminate={isGroupIndeterminate}
                />
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {params.group}
                </Typography>
              </Box>
              {params.children}
            </li>
          );
        }}
      />
    </Box>
  );
};

export default EnvironmentalDataFilter;
