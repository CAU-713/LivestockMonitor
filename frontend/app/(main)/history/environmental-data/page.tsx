'use client';
import React, { useState, useMemo, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

import LineChart from '@/components/charts/LineChart';
import { mockSheds as fallbackSheds, mockSensors as fallbackSensors } from '@/constants/mockData';
import {
  Sensor,
  Shed,
  MergedChartData,
  ChartDataPoint,
  YAxisConfig,
  ChartLine,
} from '@/types';
import { shedApi, sensorApi, historyApi, SensorHistoryResult } from '@/lib/api/apiService';

type Granularity = 'moment' | 'hour' | 'day';
type MergeMode = 'none' | 'type' | 'shed';

const lineColors = [
  '#2E7D32', '#1565C0', '#F57C00', '#6A1B9A', '#00695C', '#E65100', '#880E4F', '#F9A825', '#4E342E',
];
const getColor = (index: number) => lineColors[index % lineColors.length];

const getUnit = (type: string): string => {
  switch (type) {
    case 'Temperature': return '°C';
    case 'Humidity': return '%';
    case 'Ammonia': case 'CO2': case 'H2S': return 'ppm';
    case 'CH4': case 'Oxygen': return '%';
    case 'WindSpeed': return 'm/s';
    case 'PM': return 'µg/m³';
    case 'Light': return 'Lux';
    default: return '';
  }
};

// 根据粒度格式化时间标签
const formatTimeLabel = (time: string, granularity: Granularity): string => {
  const d = dayjs(time);
  if (!d.isValid()) return time;
  switch (granularity) {
    case 'moment': return d.format('MM-DD HH:mm');
    case 'hour':   return d.format('MM-DD HH:00');
    case 'day':    return d.format('MM-DD');
    default:       return time;
  }
};

const HistoricalEnvironmentalDataPage = () => {
  const [sheds, setSheds] = useState<Shed[]>(fallbackSheds);
  const [sensors, setSensors] = useState<Sensor[]>(fallbackSensors);
  const [loading, setLoading] = useState(true);
  const [selectedShedId, setSelectedShedId] = useState<string>('all');
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<Sensor['type'][]>(['Temperature']);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [mergeMode, setMergeMode] = useState<MergeMode>('none');
  // 原始 API 数据，所有粒度都用这个
  const [apiResults, setApiResults] = useState<SensorHistoryResult[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // 加载 sheds + sensors
  useEffect(() => {
    const load = async () => {
      try {
        const [shedData, sensorData] = await Promise.all([
          shedApi.getSheds(),
          sensorApi.getSensors({ page_size: 500 }),
        ]);
        if (shedData.length > 0) setSheds(shedData);
        if (sensorData.length > 0) setSensors(sensorData);
      } catch (e) {
        console.warn('History page load failed, using mock data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleShedChange = (event: SelectChangeEvent<string>) => setSelectedShedId(event.target.value);
  const handleSensorTypeChange = (event: SelectChangeEvent<typeof selectedSensorTypes>) => {
    const { target: { value } } = event;
    setSelectedSensorTypes(typeof value === 'string' ? (value.split(',') as Sensor['type'][]) : (value as Sensor['type'][]));
  };
  const handleGranularityChange = (event: React.MouseEvent<HTMLElement>, newGranularity: Granularity | null) => {
    if (newGranularity !== null) {
      setGranularity(newGranularity);
      if (newGranularity === 'day') {
        setStartDate(dayjs().subtract(7, 'day'));
        setEndDate(dayjs());
      } else if (newGranularity === 'hour') {
        setStartDate(dayjs().subtract(3, 'day'));
        setEndDate(dayjs());
      } else {
        setStartDate(dayjs().subtract(24, 'hour'));
        setEndDate(dayjs());
      }
    }
  };
  const handleMergeModeChange = (event: React.MouseEvent<HTMLElement>, newMode: MergeMode | null) => {
    if (newMode !== null) setMergeMode(newMode);
  };

  const availableSensors = useMemo(() => {
    if (selectedShedId === 'all') return sensors;
    return sensors.filter((sensor) => sensor.shedId === selectedShedId);
  }, [selectedShedId, sensors]);

  const availableSensorTypes = useMemo(
    () => Array.from(new Set(availableSensors.map((sensor) => sensor.type))),
    [availableSensors]
  );

  // ============================================================
  // 核心修复：所有粒度（时刻/小时/天）统一调用 API
  // ============================================================
  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchHistory = async () => {
      setApiLoading(true);
      setApiResults([]);
      try {
        const shedIds = selectedShedId === 'all'
          ? sheds.map((s) => parseInt(s.id)).filter(Boolean)
          : [parseInt(selectedShedId)].filter(Boolean);

        // granularity 映射到后端参数
        const backendGranularity = granularity === 'moment' ? 'raw' : granularity; // 'hour' | 'day' | 'raw'

        const results = await historyApi.getSensorHistory({
          shed_ids: shedIds.length ? shedIds : undefined,
          sensor_types: selectedSensorTypes as string[],
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          granularity: backendGranularity as 'raw' | 'hour' | 'day',
        });

        setApiResults(results);
      } catch (e) {
        console.warn('History API failed:', e);
        setApiResults([]);
      } finally {
        setApiLoading(false);
      }
    };

    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, startDate, endDate, selectedShedId, selectedSensorTypes, sheds]);

  // ============================================================
  // 将 API 数据转换为图表格式，支持三种合并模式
  // ============================================================
  const chartData = useMemo((): MergedChartData[] => {
    if (apiResults.length === 0) return [];

    // 格式化时间标签
    const formatResult = (item: SensorHistoryResult): MergedChartData => ({
      title: item.sensorName,
      sensorType: item.sensorType as MergedChartData['sensorType'],
      unit: item.unit || getUnit(item.sensorType),
      lines: [{ dataKey: 'value', name: item.sensorName, color: getColor(0) }],
      data: item.data.map((d) => ({
        time: formatTimeLabel(d.time, granularity),
        value: d.value,
      })),
    });

    if (mergeMode === 'none') {
      // 不合并：每个传感器单独一张图
      return apiResults.map((item, idx) => ({
        ...formatResult(item),
        lines: [{ dataKey: 'value', name: item.sensorName, color: getColor(idx) }],
      }));
    }

    if (mergeMode === 'type') {
      // 按类型合并：同类型传感器合到一张图，多条折线
      const typeMap = new Map<string, SensorHistoryResult[]>();
      apiResults.forEach((item) => {
        if (!typeMap.has(item.sensorType)) typeMap.set(item.sensorType, []);
        typeMap.get(item.sensorType)!.push(item);
      });

      return Array.from(typeMap.entries()).map(([type, items]) => {
        const dataMap = new Map<string, ChartDataPoint>();
        const newLines: ChartLine[] = [];

        items.forEach((item, idx) => {
          const key = item.sensorId;
          newLines.push({ dataKey: key, name: item.sensorName, color: getColor(idx) });
          item.data.forEach((d) => {
            const t = formatTimeLabel(d.time, granularity);
            if (!dataMap.has(t)) dataMap.set(t, { time: t });
            dataMap.get(t)![key] = d.value;
          });
        });

        return {
          title: `${type} 传感器（按类型合并）`,
          sensorType: type as MergedChartData['sensorType'],
          unit: getUnit(type),
          lines: newLines,
          data: Array.from(dataMap.values()).sort((a, b) => a.time.localeCompare(b.time)),
        };
      });
    }

    if (mergeMode === 'shed') {
      // 按舍合并：同棚舍的传感器合到一张图，多坐标轴
      const shedMap = new Map<string, SensorHistoryResult[]>();
      apiResults.forEach((item) => {
        const sensor = sensors.find((s) => s.id === item.sensorId);
        const shedId = sensor?.shedId ?? 'unknown';
        if (!shedMap.has(shedId)) shedMap.set(shedId, []);
        shedMap.get(shedId)!.push(item);
      });

      return Array.from(shedMap.entries()).map(([shedId, items]) => {
        const shedName = sheds.find((s) => s.id === shedId)?.name ?? shedId;
        const types = Array.from(new Set(items.map((i) => i.sensorType)));
        const yAxes: YAxisConfig[] = types.map((type, idx) => ({
          id: type,
          unit: getUnit(type),
          orientation: idx % 2 === 0 ? 'left' : 'right',
          color: getColor(idx),
        }));

        const dataMap = new Map<string, ChartDataPoint>();
        const newLines: ChartLine[] = [];

        items.forEach((item, idx) => {
          const key = item.sensorId;
          newLines.push({ dataKey: key, name: item.sensorName, color: getColor(idx), yAxisId: item.sensorType });
          item.data.forEach((d) => {
            const t = formatTimeLabel(d.time, granularity);
            if (!dataMap.has(t)) dataMap.set(t, { time: t });
            dataMap.get(t)![key] = d.value;
          });
        });

        return {
          title: `${shedName}（按舍合并）`,
          sensorType: 'Mixed' as MergedChartData['sensorType'],
          yAxes,
          lines: newLines,
          data: Array.from(dataMap.values()).sort((a, b) => a.time.localeCompare(b.time)),
        };
      });
    }

    return [];
  }, [apiResults, granularity, mergeMode, sensors, sheds]);

  // Export CSV with UTF-8 BOM for Excel compatibility
  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) return;

    const escapeCell = (v: any): string => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };

    const columns: { key: string; header: string }[] = [];
    const timeSet = new Set<string>();

    chartData.forEach((chart) => {
      if (chart.lines.length === 1 && chart.lines[0].dataKey === 'value') {
        columns.push({ key: chart.title, header: chart.title });
        chart.data.forEach((d) => timeSet.add(d.time));
      } else {
        chart.lines.forEach((line) => {
          columns.push({ key: `${chart.title}@@${line.dataKey}`, header: `${chart.title}-${line.name}` });
        });
        chart.data.forEach((d) => timeSet.add(d.time));
      }
    });

    const times = Array.from(timeSet).sort((a, b) => a.localeCompare(b));
    const valueMap: Record<string, Record<string, any>> = {};
    chartData.forEach((chart) => {
      if (chart.lines.length === 1 && chart.lines[0].dataKey === 'value') {
        const key = chart.title;
        valueMap[key] = {};
        chart.data.forEach((d) => { valueMap[key][d.time] = (d as any).value; });
      } else {
        chart.lines.forEach((line) => { valueMap[`${chart.title}@@${line.dataKey}`] = {}; });
        chart.data.forEach((d) => {
          chart.lines.forEach((line) => {
            valueMap[`${chart.title}@@${line.dataKey}`][d.time] = (d as any)[line.dataKey];
          });
        });
      }
    });

    const headerRow = ['时间', ...columns.map((c) => c.header)].map(escapeCell).join(',');
    const rows: string[] = [headerRow];
    times.forEach((t) => {
      const rowCells = [escapeCell(t)];
      columns.forEach((col) => rowCells.push(escapeCell(valueMap[col.key]?.[t])));
      rows.push(rowCells.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `environmental_data_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const TimePickerComponent = granularity === 'moment' ? DateTimePicker : DatePicker;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Paper sx={{ p: 2, mb: 3, borderTop: '4px solid #2E7D32' }}>
          <Typography variant='h6' gutterBottom fontWeight={700}>
            筛选条件
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, alignItems: 'center' }}>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>羊舍</InputLabel>
                <Select value={selectedShedId} label='羊舍' onChange={handleShedChange}>
                  <MenuItem value='all'>所有羊舍</MenuItem>
                  {sheds.map((shed) => (
                    <MenuItem key={shed.id} value={shed.id}>{shed.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>传感器类型</InputLabel>
                <Select multiple value={selectedSensorTypes} onChange={handleSensorTypeChange} label='传感器类型'>
                  {availableSensorTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={handleGranularityChange}
                sx={{ '& .MuiToggleButton-root.Mui-selected': { backgroundColor: '#2E7D32', color: '#ffffff', '&:hover': { backgroundColor: '#1B5E20' } } }}
              >
                <ToggleButton value='moment'>时刻</ToggleButton>
                <ToggleButton value='hour'>小时</ToggleButton>
                <ToggleButton value='day'>天</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 3 }}>
                <ToggleButtonGroup
                  value={mergeMode}
                  exclusive
                  onChange={handleMergeModeChange}
                  size='small'
                  sx={{ '& .MuiToggleButton-root.Mui-selected': { backgroundColor: '#2E7D32', color: '#ffffff', '&:hover': { backgroundColor: '#1B5E20' } } }}
                >
                  <ToggleButton value='none'>不合并</ToggleButton>
                  <ToggleButton value='type'>按类型</ToggleButton>
                  <ToggleButton value='shed'>按舍</ToggleButton>
                </ToggleButtonGroup>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={handleExportCSV}
                  sx={{ textTransform: 'none', px: 2, py: 0.75, fontSize: '0.875rem', color: '#000000', borderColor: '#cccccc', '&:hover': { borderColor: '#999999', backgroundColor: 'rgba(0,0,0,0.02)' } }}
                >
                  导出数据
                </Button>
              </Box>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TimePickerComponent label='开始日期' value={startDate} onChange={setStartDate} sx={{ width: '100%' }} />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TimePickerComponent label='结束日期' value={endDate} onChange={setEndDate} sx={{ width: '100%' }} />
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          {apiLoading ? (
            <Box sx={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
          ) : chartData.length > 0 ? (
            chartData.map((data, index) => (
              <Box key={index} sx={{ gridColumn: { xs: 'span 12', lg: mergeMode !== 'none' ? 'span 12' : 'span 6' }, height: 320 }}>
                <LineChart chartData={data} />
              </Box>
            ))
          ) : (
            <Box sx={{ gridColumn: 'span 12' }}>
              <Typography align='center' sx={{ mt: 4 }}>没有找到符合条件的数据。</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default HistoricalEnvironmentalDataPage;
