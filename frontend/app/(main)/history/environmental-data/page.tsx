'use client';
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
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
import {
  Sensor,
  MergedChartData,
  ChartDataPoint,
  YAxisConfig,
  ChartLine,
} from '@/types';

type Granularity = 'moment' | 'hour' | 'day';
type MergeMode = 'none' | 'type' | 'shed';

const lineColors = [
  '#2E7D32',
  '#1565C0',
  '#F57C00',
  '#6A1B9A',
  '#00695C',
  '#E65100',
  '#880E4F',
  '#F9A825',
  '#4E342E',
];
const getColor = (index: number) => lineColors[index % lineColors.length];

const getUnit = (type: string): string => {
  switch (type) {
    case 'Temperature':
      return '°C';
    case 'Humidity':
      return '%';
    case 'Ammonia':
    case 'CO2':
    case 'H2S':
      return 'ppm';
    case 'CH4':
    case 'Oxygen':
      return '%';
    case 'WindSpeed':
      return 'm/s';
    case 'PM':
      return 'µg/m³';
    case 'Light':
      return 'Lux';
    default:
      return '';
  }
};

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
  const [mergeMode, setMergeMode] = useState<MergeMode>('none');

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
  const handleMergeModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: MergeMode | null
  ) => {
    if (newMode !== null) {
      setMergeMode(newMode);
    }
  };

  const availableSensors = useMemo(() => {
    if (selectedShedId === 'all') return mockSensors;
    return mockSensors.filter((sensor) => sensor.shedId === selectedShedId);
  }, [selectedShedId]);

  const availableSensorTypes = useMemo(
    () => Array.from(new Set(availableSensors.map((sensor) => sensor.type))),
    [availableSensors]
  );

  // Export CSV with UTF-8 BOM for Excel compatibility
  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) return;

    const escapeCell = (v: any): string => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };

    // Collect all columns and unique times
    const columns: { key: string; header: string }[] = [];
    const timeSet = new Set<string>();

    chartData.forEach((chart) => {
      if (chart.lines.length === 1 && chart.lines[0].dataKey === 'value') {
        const colKey = `${chart.title}`;
        columns.push({ key: colKey, header: colKey });
        chart.data.forEach((d) => timeSet.add(d.time));
      } else {
        chart.lines.forEach((line) => {
          columns.push({
            key: `${chart.title}@@${line.dataKey}`,
            header: `${chart.title}-${line.name}`,
          });
        });
        chart.data.forEach((d) => timeSet.add(d.time));
      }
    });

    const times = Array.from(timeSet).sort((a, b) => a.localeCompare(b));

    // Build value map
    const valueMap: Record<string, Record<string, any>> = {};
    chartData.forEach((chart) => {
      if (chart.lines.length === 1 && chart.lines[0].dataKey === 'value') {
        const key = `${chart.title}`;
        valueMap[key] = {};
        chart.data.forEach((d) => {
          valueMap[key][d.time] = (d as any).value;
        });
      } else {
        chart.lines.forEach((line) => {
          const key = `${chart.title}@@${line.dataKey}`;
          valueMap[key] = {};
        });
        chart.data.forEach((d) => {
          chart.lines.forEach((line) => {
            const key = `${chart.title}@@${line.dataKey}`;
            valueMap[key][d.time] = (d as any)[line.dataKey];
          });
        });
      }
    });

    // Build CSV rows
    const headerRow = ['时间', ...columns.map((c) => c.header)]
      .map(escapeCell)
      .join(',');
    const rows: string[] = [headerRow];

    times.forEach((t) => {
      const rowCells = [escapeCell(t)];
      columns.forEach((col) => {
        const raw = valueMap[col.key]?.[t];
        rowCells.push(escapeCell(raw));
      });
      rows.push(rowCells.join(','));
    });

    // Add UTF-8 BOM to ensure Excel recognizes encoding
    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `environmental_data_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      if (mergeMode === 'type') {
        return selectedSensorTypes.map((type): MergedChartData => {
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
            unit: getUnit(type),
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
      } else if (mergeMode === 'shed') {
        const sheds = Array.from(new Set(selectedSensors.map((s) => s.shedId)));
        return sheds.map((shedId): MergedChartData => {
          const sensorsInShed = selectedSensors.filter(
            (s) => s.shedId === shedId
          );
          const shedName =
            mockSheds.find((s) => s.id === shedId)?.name || shedId;

          const typesInShed = Array.from(
            new Set(sensorsInShed.map((s) => s.type))
          );
          const yAxes: YAxisConfig[] = typesInShed.map((type, index) => ({
            id: type,
            unit: getUnit(type),
            orientation: index % 2 === 0 ? 'left' : 'right',
            color: getColor(index),
          }));

          const dataMap = new Map<string, ChartDataPoint>();
          sensorsInShed.forEach((sensor) => {
            sensorRecords
              .filter((r) => r.sensorId === sensor.id)
              .forEach((record) => {
                const time = dayjs(record.timestamp).format('HH:mm');
                if (!dataMap.has(time)) dataMap.set(time, { time });
                dataMap.get(time)![sensor.id] = record.value;
              });
          });

          return {
            title: `${shedName} Overview`,
            sensorType: 'Mixed',
            yAxes,
            lines: sensorsInShed.map((s, i) => ({
              dataKey: s.id,
              name: s.name,
              color: getColor(i),
              yAxisId: s.type,
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
          unit: getUnit(sensor.type),
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
        selectedSensorTypes.includes(d.sensorType as Sensor['type'])
      );
    });

    if (mergeMode === 'type') {
      return selectedSensorTypes
        .map((type): MergedChartData | null => {
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
            unit: getUnit(type),
            lines: newLines,
            data: Array.from(dataMap.values()).sort((a, b) =>
              a.time.localeCompare(b.time)
            ),
          };
        })
        .filter((d): d is MergedChartData => d !== null);
    } else if (mergeMode === 'shed') {
      const sheds = Array.from(new Set(selectedSensors.map((s) => s.shedId)));
      return sheds
        .map((shedId): MergedChartData | null => {
          const sensorsInShed = selectedSensors.filter(
            (s) => s.shedId === shedId
          );
          const shedName =
            mockSheds.find((s) => s.id === shedId)?.name || shedId;

          const dataForShed = relevantAggregatedData.filter((d) =>
            sensorsInShed.some((s) => s.name === d.title)
          );

          if (dataForShed.length === 0) return null;

          const typesInShed = Array.from(
            new Set(dataForShed.map((d) => d.sensorType))
          );
          const yAxes: YAxisConfig[] = typesInShed.map((type, index) => ({
            id: type as string,
            unit: getUnit(type),
            orientation: index % 2 === 0 ? 'left' : 'right',
            color: getColor(index),
          }));

          const dataMap = new Map<string, ChartDataPoint>();
          const newLines: ChartLine[] = [];

          dataForShed.forEach((chart) => {
            const sensor = sensorsInShed.find((s) => s.name === chart.title);
            if (!sensor) return;

            const lineKey = sensor.id;
            if (!newLines.some((l) => l.dataKey === lineKey)) {
              newLines.push({
                dataKey: lineKey,
                name: sensor.name,
                color: getColor(newLines.length),
                yAxisId: sensor.type,
              });
            }

            chart.data.forEach((point) => {
              if (!dataMap.has(point.time))
                dataMap.set(point.time, { time: point.time });
              dataMap.get(point.time)![lineKey] = point.value;
            });
          });

          return {
            title: `${shedName} Overview${titleSuffix}`,
            sensorType: 'Mixed',
            yAxes,
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
    startDate,
    endDate,
    mergeMode,
  ]);

  const TimePickerComponent =
    granularity === 'moment' ? DateTimePicker : DatePicker;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderTop: '4px solid #2E7D32',
          }}
        >
          <Typography variant='h6' gutterBottom fontWeight={700}>
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
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={handleGranularityChange}
                sx={{
                  '& .MuiToggleButton-root.Mui-selected': {
                    backgroundColor: '#2E7D32',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#1B5E20' },
                  },
                }}
              >
                <ToggleButton value='moment'>时刻</ToggleButton>
                <ToggleButton value='hour'>小时</ToggleButton>
                <ToggleButton value='day'>天</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 3 }}
              >
                <ToggleButtonGroup
                  value={mergeMode}
                  exclusive
                  onChange={handleMergeModeChange}
                  size='small'
                  aria-label='merge mode'
                  sx={{
                    '& .MuiToggleButton-root.Mui-selected': {
                      backgroundColor: '#2E7D32',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#1B5E20' },
                    },
                  }}
                >
                  <ToggleButton value='none'>不合并</ToggleButton>
                  <ToggleButton value='type'>按类型</ToggleButton>
                  <ToggleButton value='shed'>按舍</ToggleButton>
                </ToggleButtonGroup>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={handleExportCSV}
                  sx={{
                    textTransform: 'none',
                    px: 2,
                    py: 0.75,
                    fontSize: '0.875rem',
                    color: '#000000',
                    borderColor: '#cccccc',
                    '&:hover': {
                      borderColor: '#999999',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  导出数据
                </Button>
              </Box>
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
                    lg: mergeMode !== 'none' ? 'span 12' : 'span 6',
                  },
                  height: 320,
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
