'use client';
import React, { useState, useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

import LineChart from '@/components/charts/LineChart';
import {
  mockSheds,
  mockSensors,
  mockHourlyChartData,
  mockDailyChartData,
  mockSensorRecords,
} from '@/constants/mockData';
import { Sensor, MergedChartData, ChartDataPoint } from '@/types';

type Granularity = 'moment' | 'hour' | 'day';

const lineColors = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#387908',
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
];
const getColor = (index: number) => lineColors[index % lineColors.length];

const HistoricalEnvironmentalDataPage = () => {
  const [selectedShedId, setSelectedShedId] = useState<string>('all');
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<
    Sensor['type'][]
  >(['Temperature']);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().subtract(30, 'day')
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [mergeCharts, setMergeCharts] = useState<boolean>(false);

  const handleShedChange = (event: SelectChangeEvent<string>) =>
    setSelectedShedId(event.target.value);
  const handleSensorTypeChange = (
    event: SelectChangeEvent<typeof selectedSensorTypes>
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedSensorTypes(
      typeof value === 'string'
        ? (value.split(',') as Sensor['type'][])
        : (value as Sensor['type'][])
    );
  };
  const handleGranularityChange = (
    event: React.MouseEvent<HTMLElement>,
    newGranularity: Granularity | null
  ) => {
    if (newGranularity !== null) {
      setGranularity(newGranularity);
      if (newGranularity === 'day') {
        setStartDate(dayjs().subtract(30, 'day'));
        setEndDate(dayjs());
      } else if (newGranularity === 'hour' || newGranularity === 'moment') {
        setStartDate(dayjs().subtract(24, 'hour'));
        setEndDate(dayjs());
      }
    }
  };
  const handleMergeChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setMergeCharts(event.target.checked);

  const availableSensors = useMemo(() => {
    if (selectedShedId === 'all') return mockSensors;
    return mockSensors.filter((sensor) => sensor.shedId === selectedShedId);
  }, [selectedShedId]);

  const availableSensorTypes = useMemo(
    () => Array.from(new Set(availableSensors.map((sensor) => sensor.type))),
    [availableSensors]
  );

  const chartData = useMemo((): MergedChartData[] => {
    const selectedSensors = availableSensors.filter((s) =>
      selectedSensorTypes.includes(s.type)
    );
    if (selectedSensors.length === 0) return [];

    // --- Step 1: Select the correct data source based on granularity ---
    if (granularity === 'moment') {
      const sensorRecords = mockSensorRecords.filter(
        (record) =>
          dayjs(record.timestamp).isAfter(startDate) &&
          dayjs(record.timestamp).isBefore(endDate)
      );
      if (mergeCharts) {
        return selectedSensorTypes.map((type) => {
          const sensorsOfType = selectedSensors.filter((s) => s.type === type);
          const dataMap = new Map<string, ChartDataPoint>();
          sensorsOfType.forEach((sensor) => {
            sensorRecords
              .filter((r) => r.sensorId === sensor.id)
              .forEach((record) => {
                const time = dayjs(record.timestamp).format('HH:mm');
                if (!dataMap.has(time)) dataMap.set(time, { time });
                dataMap.get(time)![sensor.id] = record.value;
              });
          });
          return {
            title: `${type} Sensors`,
            sensorType: type,
            unit:
              type === 'Temperature' ? '°C' : type === 'Humidity' ? '%' : 'ppm',
            lines: sensorsOfType.map((s, i) => ({
              dataKey: s.id,
              name: s.name,
              color: getColor(i),
            })),
            data: Array.from(dataMap.values()).sort((a, b) =>
              a.time.localeCompare(b.time)
            ),
          };
        });
      } else {
        return selectedSensors.map((sensor) => ({
          title: sensor.name,
          sensorType: sensor.type,
          unit:
            sensor.type === 'Temperature'
              ? '°C'
              : sensor.type === 'Humidity'
                ? '%'
                : 'ppm',
          lines: [{ dataKey: 'value', name: sensor.name, color: getColor(0) }],
          data: sensorRecords
            .filter((r) => r.sensorId === sensor.id)
            .map((r) => ({
              time: dayjs(r.timestamp).format('HH:mm'),
              value: r.value,
            })),
        }));
      }
    }

    // --- Step 2: Logic for aggregated granularities ('hour', 'day') ---
    let sourceData: MergedChartData[] = [];
    let titleSuffix = '';
    switch (granularity) {
      case 'day':
        sourceData = mockDailyChartData;
        titleSuffix = ' (Daily Avg)';
        break;
      case 'hour':
        sourceData = mockHourlyChartData;
        titleSuffix = ' (Hourly Avg)';
        break;
      default:
        return [];
    }

    const relevantAggregatedData = sourceData.filter((d) => {
      const sensorId =
        d.lines[0]?.dataKey === 'value'
          ? mockSensors.find((s) => s.name === d.title)?.id
          : null;
      return (
        selectedSensors.some((s) => s.name === d.title || s.id === sensorId) &&
        selectedSensorTypes.includes(d.sensorType)
      );
    });

    if (mergeCharts) {
      return selectedSensorTypes
        .map((type) => {
          const dataOfType = relevantAggregatedData.filter(
            (d) => d.sensorType === type
          );
          if (dataOfType.length === 0) return null;

          const dataMap = new Map<string, ChartDataPoint>();
          const newLines: { dataKey: string; name: string; color: string }[] =
            [];

          dataOfType.forEach((chart) => {
            const sensorId =
              mockSensors.find((s) => s.name === chart.title)?.id ||
              chart.title;
            if (!newLines.some((l) => l.dataKey === sensorId)) {
              newLines.push({
                dataKey: sensorId,
                name: chart.title,
                color: getColor(newLines.length),
              });
            }
            chart.data.forEach((point) => {
              if (!dataMap.has(point.time))
                dataMap.set(point.time, { time: point.time });
              dataMap.get(point.time)![sensorId] = point.value;
            });
          });

          return {
            title: `${type} Sensors${titleSuffix}`,
            sensorType: type,
            unit:
              type === 'Temperature' ? '°C' : type === 'Humidity' ? '%' : 'ppm',
            lines: newLines,
            data: Array.from(dataMap.values()).sort((a, b) =>
              a.time.localeCompare(b.time)
            ),
          };
        })
        .filter((d): d is MergedChartData => d !== null);
    } else {
      return relevantAggregatedData;
    }
  }, [
    availableSensors,
    selectedSensorTypes,
    granularity,
    startDate?.toISOString(),
    endDate,
    mergeCharts,
  ]);

  const TimePickerComponent =
    granularity === 'moment' ? DateTimePicker : DatePicker;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant='h6' gutterBottom>
            筛选条件
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}
            >
              <FormControl fullWidth>
                <InputLabel>羊舍</InputLabel>
                <Select
                  value={selectedShedId}
                  label='羊舍'
                  onChange={handleShedChange}
                >
                  <MenuItem value='all'>所有羊舍</MenuItem>
                  {mockSheds.map((shed) => (
                    <MenuItem key={shed.id} value={shed.id}>
                      {shed.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box
              sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}
            >
              <FormControl fullWidth>
                <InputLabel>传感器类型</InputLabel>
                <Select
                  multiple
                  value={selectedSensorTypes}
                  onChange={handleSensorTypeChange}
                  label='传感器类型'
                >
                  {availableSensorTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={handleGranularityChange}
              >
                <ToggleButton value='moment'>时刻</ToggleButton>
                <ToggleButton value='hour'>小时</ToggleButton>
                <ToggleButton value='day'>天</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 2' } }}>
              <FormControlLabel
                control={
                  <Switch checked={mergeCharts} onChange={handleMergeChange} />
                }
                label='合并图表'
              />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TimePickerComponent
                label='开始日期'
                value={startDate}
                onChange={setStartDate}
                sx={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TimePickerComponent
                label='结束日期'
                value={endDate}
                onChange={setEndDate}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 3,
          }}
        >
          {chartData.length > 0 ? (
            chartData.map((data, index) => (
              <Box
                key={index}
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    lg: mergeCharts ? 'span 12' : 'span 6',
                  },
                }}
              >
                <LineChart chartData={data} />
              </Box>
            ))
          ) : (
            <Box sx={{ gridColumn: 'span 12' }}>
              <Typography align='center' sx={{ mt: 4 }}>
                没有找到符合条件的数据。
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default HistoricalEnvironmentalDataPage;
