'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Checkbox,
  Paper,
  Stack,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
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
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        borderRadius: 2,
        borderTop: '4px solid #2E7D32',
        mb: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <FilterListIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
          传感器筛选
        </Typography>
        {selectedSensors.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            （已选 {selectedSensors.length} 个）
          </Typography>
        )}
      </Stack>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Typography sx={{ pl: 1, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {selectedSensors.length > 0
                      ? `${selectedSensors.length} 个已选择`
                      : ''}
                  </Typography>
                ),
              }}
            />
          )}
          renderOption={(props, option, { selected }) => {
            const { key, ...restProps } = props;
            return (
              <li key={key} {...restProps}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {`${option.name} (${option.type})`}
              </li>
            );
          }}
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
              <Box
                key={params.key}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  pl: 1.5,
                  pt: 0.5,
                  pb: 0.5,
                  borderLeft: '2px solid #A5D6A7',
                  ml: 1,
                  mr: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToggleGroup(params.group)}
                >
                  <Checkbox
                    checked={isGroupSelected}
                    indeterminate={isGroupIndeterminate}
                    color="primary"
                  />
                  <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                    {params.group}
                  </Typography>
                </Box>
                {params.children}
              </Box>
            );
          }}
        />
      </Box>
    </Paper>
  );
};

export default EnvironmentalDataFilter;
