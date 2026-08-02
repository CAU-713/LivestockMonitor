'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Typography, CircularProgress, Stack, Chip,
  Popover, Checkbox, FormControlLabel, Divider, IconButton,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import LineChart from '@/components/charts/LineChart';
import { getPoints, getMultiPointHistory, type SparkPoint, type SparkHistoryItem } from '@/lib/api/sparksApi';
import type { MergedChartData, ChartLine } from '@/types';
import { typeNameMap, typeColorMap, getUnit } from '@/constants/sensorTypes';

type Granularity = 'moment' | 'hour' | 'day';
type MergeMode = 'none' | 'type';

const lineColors = ['#2E7D32', '#1565C0', '#F57C00', '#6A1B9A', '#00695C', '#E65100', '#880E4F', '#F9A825', '#4E342E'];
const getColor = (i: number) => lineColors[i % lineColors.length];

const formatTime = (t: string, g: Granularity): string => {
  const d = dayjs(t);
  if (!d.isValid()) return t;
  if (g === 'moment') return d.format('MM-DD HH:mm');
  if (g === 'hour') return d.format('MM-DD HH:00');
  return d.format('MM-DD');
};

const HistoricalEnvironmentalDataPage = () => {
  const [points, setPoints] = useState<SparkPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Temperature']);
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [mergeMode, setMergeMode] = useState<MergeMode>('none');
  const [apiLoading, setApiLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<SparkHistoryItem[]>([]);

  // Popover 状态
  const [pointAnchor, setPointAnchor] = useState<HTMLButtonElement | null>(null);
  const pointPopOpen = Boolean(pointAnchor);

  // 加载测点列表
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPoints();
        setPoints(data.points || []);
      } catch (e) {
        console.error('Failed to load points:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pointTypes = useMemo(() => Array.from(new Set(points.map((p) => p.type))).sort(), [points]);

  // 按类型分组测点
  const typeGroups = useMemo(() => {
    const map: Record<string, SparkPoint[]> = {};
    points.forEach((p) => {
      if (!map[p.type]) map[p.type] = [];
      map[p.type].push(p);
    });
    return map;
  }, [points]);

  // 当前选中类型下的所有测点
  const eligiblePoints = useMemo(() => {
    if (selectedTypes.length === 0) return [];
    return points.filter((p) => selectedTypes.includes(p.type));
  }, [points, selectedTypes]);

  // 初始化时选中选中类型下的所有测点
  useEffect(() => {
    setSelectedPointIds(eligiblePoints.map((p) => p.point_id));
  }, [selectedTypes.join(','), points.length]);

  // 类型 Chip 点击
  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // 颗粒度切换
  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g);
    if (g === 'day') { setStartDate(dayjs().subtract(7, 'day')); setEndDate(dayjs()); }
    else if (g === 'hour') { setStartDate(dayjs().subtract(3, 'day')); setEndDate(dayjs()); }
    else { setStartDate(dayjs().subtract(24, 'hour')); setEndDate(dayjs()); }
  };

  // Popover 中全选/取消某类型下所有测点
  const handleToggleAllPointsInType = (type: string) => {
    const typeIds = (typeGroups[type] || []).map((p) => p.point_id);
    const allSelected = typeIds.every((id) => selectedPointIds.includes(id));
    if (allSelected) {
      setSelectedPointIds((prev) => prev.filter((id) => !typeIds.includes(id)));
    } else {
      setSelectedPointIds((prev) => [...new Set([...prev, ...typeIds])]);
    }
  };

  // 查询历史数据
  useEffect(() => {
    if (!startDate || !endDate || selectedPointIds.length === 0) return;
    const fetchHistory = async () => {
      setApiLoading(true);
      try {
        const backendG = granularity === 'moment' ? 'raw' : granularity;
        const items = await getMultiPointHistory({
          point_ids: selectedPointIds,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          granularity: backendG,
          limit: 10000,
        });
        setHistoryItems(items);
      } catch (e) {
        console.error('History fetch failed:', e);
        setHistoryItems([]);
      } finally {
        setApiLoading(false);
      }
    };
    fetchHistory();
  }, [granularity, startDate, endDate, selectedPointIds.join(',')]);

  // 转换为图表数据
  const chartData = useMemo((): MergedChartData[] => {
    if (historyItems.length === 0) return [];

    const pointMap: Record<string, SparkHistoryItem[]> = {};
    historyItems.forEach((item) => {
      if (!pointMap[item.point_id]) pointMap[item.point_id] = [];
      pointMap[item.point_id].push(item);
    });

    if (mergeMode === 'none') {
      return Object.entries(pointMap).map(([pointId, items], idx) => {
        const first = items[0];
        const pointInfo = points.find((p) => p.point_id === pointId);
        const title = first.point_name || pointId;
        const sType = pointInfo?.type || '';
        return {
          title,
          sensorType: sType as any,
          unit: pointInfo?.unit || getUnit(sType),
          lines: [{ dataKey: 'value', name: title, color: getColor(idx) }],
          data: items
            .sort((a, b) => (a.record_time || a.created_at || '').localeCompare(b.record_time || b.created_at || ''))
            .map((item) => ({
              time: formatTime(item.record_time || item.created_at || '', granularity),
              value: item.avg_value ?? parseFloat(item.value || '0'),
            })),
        };
      });
    }

    // mergeMode === 'type'
    const typeMap: Record<string, { pointIds: Set<string>; items: SparkHistoryItem[] }> = {};
    historyItems.forEach((item) => {
      const pInfo = points.find((p) => p.point_id === item.point_id);
      const type = pInfo?.type || 'Unknown';
      if (!typeMap[type]) typeMap[type] = { pointIds: new Set(), items: [] };
      typeMap[type].pointIds.add(item.point_id);
      typeMap[type].items.push(item);
    });

    return Object.entries(typeMap).map(([type, { pointIds, items }]) => {
      const timeMap: Record<string, Record<string, number>> = {};
      const lines: ChartLine[] = [];
      const pointIdList = Array.from(pointIds);

      pointIdList.forEach((pid, idx) => {
        const pInfo = points.find((p) => p.point_id === pid);
        lines.push({ dataKey: pid, name: pInfo?.point_name || pid, color: getColor(idx) });
      });

      items.forEach((item) => {
        const t = formatTime(item.record_time || item.created_at || '', granularity);
        if (!timeMap[t]) timeMap[t] = {};
        timeMap[t][item.point_id] = item.avg_value ?? parseFloat(item.value || '0');
      });

      return {
        title: `${typeNameMap[type] || type}（按类型合并）`,
        sensorType: type as any,
        unit: getUnit(type),
        lines,
        data: Object.entries(timeMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, vals]) => ({ time, ...vals })),
      };
    });
  }, [historyItems, mergeMode, granularity, points]);

  // CSV 导出
  const handleExportCSV = useCallback(() => {
    if (chartData.length === 0) return;
    const escapeCell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows: string[] = [];
    chartData.forEach((chart) => {
      rows.push(escapeCell(chart.title));
      const cols = chart.lines.map((l) => l.dataKey);
      rows.push(['时间', ...chart.lines.map((l) => l.name)].map(escapeCell).join(','));
      chart.data.forEach((d) => {
        rows.push([escapeCell(d.time), ...cols.map((c) => escapeCell((d as any)[c]))].join(','));
      });
      rows.push('');
    });
    const csv = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `environment_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [chartData]);

  const typeSelCount = useMemo(() => {
    return eligiblePoints.filter((p) => selectedPointIds.includes(p.point_id)).length;
  }, [eligiblePoints, selectedPointIds]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* 筛选卡片 */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, borderTop: '4px solid #2E7D32' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>筛选条件</Typography>

          {/* 类型 Chip 多选 */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={2}>
            <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>类型：</Typography>
            {pointTypes.map((type) => {
              const isActive = selectedTypes.includes(type);
              const tc = typeColorMap[type] || { color: '#555' };
              const count = (typeGroups[type] || []).length;
              return (
                <Chip
                  key={type}
                  label={`${typeNameMap[type] || type} (${count})`}
                  variant={isActive ? 'filled' : 'outlined'}
                  onClick={() => handleToggleType(type)}
                  sx={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    bgcolor: isActive ? tc.color : 'transparent',
                    color: isActive ? '#fff' : tc.color,
                    borderColor: tc.color,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isActive ? tc.color : `${tc.color}15`,
                      borderColor: tc.color,
                      transform: 'translateY(-1px)',
                      boxShadow: 1,
                    },
                  }}
                />
              );
            })}
          </Stack>

          {/* 测点选择 + 颗粒度 + 日期 */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            {/* 测点选择按钮 */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={(e) => setPointAnchor(e.currentTarget)}
              disabled={eligiblePoints.length === 0}
              sx={{
                textTransform: 'none',
                color: '#2E7D32',
                borderColor: '#A5D6A7',
                '&:hover': { borderColor: '#2E7D32', bgcolor: 'rgba(46,125,50,0.04)' },
              }}
            >
              选择测点 ({typeSelCount}/{eligiblePoints.length})
            </Button>

            {/* 测点选择 Popover */}
            <Popover
              open={pointPopOpen}
              anchorEl={pointAnchor}
              onClose={() => setPointAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              slotProps={{ paper: { sx: { maxHeight: 400, width: 360, p: 1 } } }}
            >
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  选择测点（按类型分组）
                </Typography>
                {selectedTypes.map((type) => {
                  const typePoints = typeGroups[type] || [];
                  const selInType = typePoints.filter((p) => selectedPointIds.includes(p.point_id)).length;
                  const allSel = selInType === typePoints.length && typePoints.length > 0;
                  const indeterminate = selInType > 0 && selInType < typePoints.length;
                  return (
                    <Box key={type} sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          py: 0.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'rgba(46,125,50,0.04)' },
                        }}
                        onClick={() => handleToggleAllPointsInType(type)}
                      >
                        <Checkbox
                          checked={allSel}
                          indeterminate={indeterminate}
                          size="small"
                          sx={{ color: '#2E7D32', '&.Mui-checked': { color: '#2E7D32' } }}
                        />
                        <Typography variant="body2" fontWeight={700}>
                          {typeNameMap[type] || type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ({selInType}/{typePoints.length})
                        </Typography>
                      </Box>
                      {typePoints.map((p) => (
                        <FormControlLabel
                          key={p.point_id}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedPointIds.includes(p.point_id)}
                              onChange={(_, checked) => {
                                if (checked) {
                                  setSelectedPointIds((prev) => [...prev, p.point_id]);
                                } else {
                                  setSelectedPointIds((prev) => prev.filter((id) => id !== p.point_id));
                                }
                              }}
                              sx={{ color: '#2E7D32', '&.Mui-checked': { color: '#2E7D32' } }}
                            />
                          }
                          label={
                            <Typography variant="caption">{p.point_name || p.point_id}</Typography>
                          }
                          sx={{ ml: 1, display: 'flex', width: '100%' }}
                        />
                      ))}
                    </Box>
                  );
                })}
              </Box>
            </Popover>

            {/* 颗粒度 */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600}>颗粒度：</Typography>
              {(['moment', 'hour', 'day'] as Granularity[]).map((g) => (
                <Chip
                  key={g}
                  label={{ moment: '时刻', hour: '小时', day: '天' }[g]}
                  variant={granularity === g ? 'filled' : 'outlined'}
                  color={granularity === g ? 'primary' : 'default'}
                  onClick={() => handleGranularityChange(g)}
                  size="small"
                  sx={{ fontWeight: granularity === g ? 700 : 500, fontSize: '0.78rem' }}
                />
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 日期选择 */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" fontWeight={600}>时间范围：</Typography>
            <DatePicker
              label="开始日期"
              value={startDate}
              onChange={setStartDate}
              sx={{ width: 180 }}
            />
            <Typography variant="body2" color="text.secondary">至</Typography>
            <DatePicker
              label="结束日期"
              value={endDate}
              onChange={setEndDate}
              sx={{ width: 180 }}
            />
          </Stack>
        </Paper>

        {/* 合并模式 + 导出 */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Typography variant="body2" fontWeight={600}>图表模式：</Typography>
          {(['none', 'type'] as MergeMode[]).map((m) => (
            <Chip
              key={m}
              label={m === 'none' ? '独立图表' : '按类型合并'}
              variant={mergeMode === m ? 'filled' : 'outlined'}
              color={mergeMode === m ? 'primary' : 'default'}
              onClick={() => setMergeMode(m)}
              size="small"
              sx={{ fontWeight: mergeMode === m ? 700 : 500, fontSize: '0.78rem' }}
            />
          ))}
          <Box flex={1} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={chartData.length === 0}
            sx={{ textTransform: 'none', px: 2, color: '#000', borderColor: '#ccc' }}
          >
            导出 CSV
          </Button>
        </Stack>

        {/* 图表区 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          {apiLoading ? (
            <Box sx={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
          ) : chartData.length > 0 ? (
            chartData.map((data, idx) => (
              <Box key={idx} sx={{ gridColumn: { xs: 'span 12', lg: mergeMode !== 'none' ? 'span 12' : 'span 6' }, height: 320 }}>
                <LineChart chartData={data} />
              </Box>
            ))
          ) : (
            <Box sx={{ gridColumn: 'span 12' }}>
              <Typography align="center" sx={{ mt: 4 }}>没有找到符合条件的数据。</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default HistoricalEnvironmentalDataPage;
