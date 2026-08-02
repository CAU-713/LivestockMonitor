'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box, Typography, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Stack, CircularProgress, Chip, Grid, Button, TextField,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { getPoints, getMultiPointHistory, type SparkPoint, type SparkHistoryItem } from '@/lib/api/sparksApi';
import { typeNameMap, typeColorMap, getUnit, isBoolPoint } from '@/constants/sensorTypes';

const ACCENT = '#2E7D32';
const ACCENT_LIGHT = 'rgba(46,125,50,0.08)';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return <div role="tabpanel" hidden={value !== index}>{value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}</div>;
}

interface VarStat { variable: string; type: string; mean: number; std: number; min: number; max: number; count: number; unit: string; }

interface ExceedStat {
  variable: string;
  type: string;
  unit: string;
  threshold: number;
  exceedCount: number;
  totalCount: number;
  exceedRate: number;
  exceedDuration: number;  // 连续超标的记录数（代表持续时长）
  exceedMax: number;
  latestValue: number;
  latestTime: string;
}

const DataAnalysisPage = () => {
  const { isGuest } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isGuest) router.replace('/dashboard'); }, [isGuest, router]);

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<SparkPoint[]>([]);
  const [history, setHistory] = useState<SparkHistoryItem[]>([]);
  const [stats, setStats] = useState<VarStat[]>([]);

  // 筛选状态
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // 阈值设置（按类型，排除设备类型）
  const [thresholds, setThresholds] = useState<Record<string, number>>({});

  const pointTypes = useMemo(() => Array.from(new Set(points.map((p) => p.type))), [points]);

  // 排除设备类型（Device），只对数值传感器设置阈值
  const numericTypes = useMemo(() => pointTypes.filter((t) => t !== 'Device'), [pointTypes]);

  // 按类型分组
  const typeGroups = useMemo(() => {
    const map: Record<string, SparkPoint[]> = {};
    points.forEach((p) => {
      if (!map[p.type]) map[p.type] = [];
      map[p.type].push(p);
    });
    return map;
  }, [points]);

  // 首次加载：获取测点列表
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPoints();
        const pts = data.points || [];
        setPoints(pts);
        const types = Array.from(new Set(pts.map((p) => p.type)));
        setSelectedTypes(types);
      } catch (e) {
        console.error('Failed to load points:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 根据筛选条件加载历史数据
  const fetchAnalysis = useCallback(async () => {
    if (!startDate || !endDate || selectedTypes.length === 0) return;
    setLoading(true);
    try {
      const targetIds = points
        .filter((p) => selectedTypes.includes(p.type))
        .map((p) => p.point_id);

      const items = await getMultiPointHistory({
        point_ids: targetIds,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        granularity: 'raw',
        limit: 20000,
      });
      setHistory(items);

      // 计算每个测点的统计
      const pointMap: Record<string, number[]> = {};
      items.forEach((item) => {
        const val = parseFloat(item.value || '');
        if (!isNaN(val)) {
          if (!pointMap[item.point_id]) pointMap[item.point_id] = [];
          pointMap[item.point_id].push(val);
        }
      });

      const filteredPoints = points.filter((p) => selectedTypes.includes(p.type));
      const varStats: VarStat[] = filteredPoints.map((p) => {
        const vals = pointMap[p.point_id] || [];
        const n = vals.length;
        if (n === 0) return { variable: p.point_name || p.point_id, type: p.type, mean: 0, std: 0, min: 0, max: 0, count: 0, unit: p.unit };
        const mean = vals.reduce((s, v) => s + v, 0) / n;
        const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
        return {
          variable: p.point_name || p.point_id,
          type: p.type,
          mean: parseFloat(mean.toFixed(2)),
          std: parseFloat(Math.sqrt(variance).toFixed(2)),
          min: parseFloat(Math.min(...vals).toFixed(2)),
          max: parseFloat(Math.max(...vals).toFixed(2)),
          count: n,
          unit: p.unit,
        };
      });
      setStats(varStats);
    } catch (e) {
      console.error('Data analysis load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedTypes.join(','), points.length]);

  // 初次加载 + 筛选变化时拉数据
  useEffect(() => {
    if (points.length > 0 && selectedTypes.length > 0) {
      fetchAnalysis();
    }
  }, [fetchAnalysis]);

  // 类型 Chip 切换
  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // 阈值变更
  const handleThresholdChange = (type: string, value: string) => {
    const num = parseFloat(value);
    setThresholds((prev) => ({
      ...prev,
      [type]: isNaN(num) ? (prev[type] ?? 0) : num,
    }));
  };

  // 按类型分组统计
  const typeStats = useMemo(() => {
    const map: Record<string, VarStat[]> = {};
    stats.forEach((s) => {
      if (!map[s.type]) map[s.type] = [];
      map[s.type].push(s);
    });
    return map;
  }, [stats]);

  // 相关性矩阵
  const correlationMatrix = useMemo(() => {
    const types = Object.keys(typeStats);
    const matrix: Record<string, Record<string, number>> = {};
    types.forEach((t1) => {
      matrix[t1] = {};
      types.forEach((t2) => {
        const vals1 = (typeStats[t1] || []).map((s) => s.mean);
        const vals2 = (typeStats[t2] || []).map((s) => s.mean);
        const len = Math.min(vals1.length, vals2.length);
        if (len < 3) { matrix[t1][t2] = 0; return; }
        const m1 = vals1.slice(0, len).reduce((a, b) => a + b, 0) / len;
        const m2 = vals2.slice(0, len).reduce((a, b) => a + b, 0) / len;
        let cov = 0, v1 = 0, v2 = 0;
        for (let i = 0; i < len; i++) {
          const d1 = vals1[i] - m1, d2 = vals2[i] - m2;
          cov += d1 * d2; v1 += d1 * d1; v2 += d2 * d2;
        }
        matrix[t1][t2] = (v1 === 0 || v2 === 0) ? 0 : parseFloat((cov / Math.sqrt(v1 * v2)).toFixed(2));
      });
    });
    return matrix;
  }, [typeStats]);

  const getCorrBg = (r: number) => {
    if (r >= 0.7) return 'rgba(46,125,50,0.22)';
    if (r >= 0.4) return 'rgba(46,125,50,0.10)';
    if (r <= -0.7) return 'rgba(229,57,53,0.18)';
    if (r <= -0.4) return 'rgba(245,124,0,0.10)';
    return 'transparent';
  };

  const eligiblePointCount = useMemo(() => {
    return points.filter((p) => selectedTypes.includes(p.type)).length;
  }, [points, selectedTypes]);

  // ==================== 超标统计 ====================

  const exceedStats = useMemo((): ExceedStat[] => {
    // 按 point_id 分组，保留时间顺序
    const pointItems: Record<string, SparkHistoryItem[]> = {};
    history.forEach((item) => {
      if (!pointItems[item.point_id]) pointItems[item.point_id] = [];
      pointItems[item.point_id].push(item);
    });

    const result: ExceedStat[] = [];

    points
      .filter((p) => selectedTypes.includes(p.type) && p.type !== 'Device' && !isBoolPoint(p.point_id))
      .forEach((p) => {
        const threshold = thresholds[p.type];
        const items = (pointItems[p.point_id] || [])
          .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
        const totalCount = items.length;

        if (totalCount === 0 || threshold === undefined || threshold === null) {
          result.push({
            variable: p.point_name || p.point_id,
            type: p.type,
            unit: p.unit,
            threshold: threshold ?? 0,
            exceedCount: 0,
            totalCount,
            exceedRate: 0,
            exceedDuration: 0,
            exceedMax: 0,
            latestValue: 0,
            latestTime: '',
          });
          return;
        }

        let exceedCount = 0;
        let exceedMax = -Infinity;
        let maxConsecutive = 0;
        let currentConsecutive = 0;

        items.forEach((item) => {
          const val = parseFloat(item.value || '');
          if (isNaN(val)) return;
          if (val > threshold) {
            exceedCount++;
            exceedMax = Math.max(exceedMax, val);
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          } else {
            currentConsecutive = 0;
          }
        });

        const lastItem = items[items.length - 1];
        const latestVal = parseFloat(lastItem?.value || '0');

        result.push({
          variable: p.point_name || p.point_id,
          type: p.type,
          unit: p.unit,
          threshold,
          exceedCount,
          totalCount,
          exceedRate: totalCount > 0 ? parseFloat(((exceedCount / totalCount) * 100).toFixed(1)) : 0,
          exceedDuration: maxConsecutive,
          exceedMax: exceedCount > 0 ? parseFloat(exceedMax.toFixed(2)) : 0,
          latestValue: isNaN(latestVal) ? 0 : parseFloat(latestVal.toFixed(2)),
          latestTime: lastItem?.created_at || '',
        });
      });

    return result;
  }, [history, points, selectedTypes, thresholds]);

  const exceedTypeGroups = useMemo(() => {
    const map: Record<string, ExceedStat[]> = {};
    exceedStats.forEach((s) => {
      if (!map[s.type]) map[s.type] = [];
      map[s.type].push(s);
    });
    return map;
  }, [exceedStats]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={3}>
        <Box>
          <Box sx={{ borderLeft: `4px solid ${ACCENT}`, pl: 1.5, py: 0.5 }}>
            <Typography variant="h5" fontWeight={700}>数据分析</Typography>
            <Typography variant="body2" color="text.secondary">基于真实测点数据的统计分析与相关性探索</Typography>
          </Box>
        </Box>

        {/* 筛选栏 */}
        <Paper sx={{ p: 2.5, borderRadius: 2, borderTop: '4px solid #2E7D32' }}>
          <Stack spacing={2}>
            {/* 类型 Chip 多选 */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>测点类型：</Typography>
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

            {/* 阈值设置（仅对数值类型） */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>超标阈值：</Typography>
              {numericTypes.filter((t) => selectedTypes.includes(t)).map((type) => {
                const unit = getUnit(type);
                const val = thresholds[type];
                return (
                  <TextField
                    key={type}
                    size="small"
                    type="number"
                    label={`${typeNameMap[type] || type}${unit ? ` (${unit})` : ''}`}
                    value={val !== undefined ? val : ''}
                    onChange={(e) => handleThresholdChange(type, e.target.value)}
                    placeholder="阈值"
                    inputProps={{ min: 0, step: 0.1, style: { fontSize: '0.8rem' } }}
                    sx={{
                      width: 140,
                      '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                    }}
                  />
                );
              })}
              {numericTypes.filter((t) => selectedTypes.includes(t)).length === 0 && (
                <Typography variant="caption" color="text.secondary">请先选择数值类型的测点</Typography>
              )}
            </Stack>

            {/* 时间范围 + 刷新 */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" fontWeight={600}>时间范围：</Typography>
              <DatePicker
                label="开始日期"
                value={startDate}
                onChange={setStartDate}
                sx={{ width: 170 }}
              />
              <Typography variant="body2" color="text.secondary">至</Typography>
              <DatePicker
                label="结束日期"
                value={endDate}
                onChange={setEndDate}
                sx={{ width: 170 }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchAnalysis}
                disabled={selectedTypes.length === 0}
                sx={{
                  textTransform: 'none',
                  color: '#2E7D32',
                  borderColor: '#A5D6A7',
                  '&:hover': { borderColor: '#2E7D32', bgcolor: 'rgba(46,125,50,0.04)' },
                }}
              >
                刷新分析
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: ACCENT_LIGHT }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
                sx={{ '& .MuiTab-root': { minHeight: 52, fontWeight: 600, fontSize: '0.85rem', textTransform: 'none' }, '& .Mui-selected': { color: `${ACCENT} !important`, fontWeight: 700 } }}>
                <Tab icon={<BarChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="描述性统计" />
                <Tab icon={<ScatterPlotIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="相关性分析" />
                <Tab icon={<WarningAmberIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="超标统计" />
              </Tabs>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Tab 0: 描述性统计 */}
              <TabPanel value={tabValue} index={0}>
                <Stack spacing={3}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>数据概览</Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: '选中测点数', value: eligiblePointCount },
                        { label: '测点类型', value: selectedTypes.length },
                        { label: '历史数据量', value: history.length.toLocaleString() },
                        { label: '时间范围', value: `${startDate?.format('MM-DD') || ''} ~ ${endDate?.format('MM-DD') || ''}` },
                      ].map((item, i) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={i}>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography variant="h6" fontWeight={700} color={ACCENT}>{item.value}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>

                  {Object.entries(typeStats).map(([type, vars]) => (
                    <Paper key={type} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ px: 2, py: 1.5, backgroundColor: ACCENT_LIGHT }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {typeNameMap[type] || type} ({vars.length} 个测点)
                        </Typography>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.78rem' } }}>
                              <TableCell>测点名称</TableCell>
                              <TableCell align="right">均值</TableCell>
                              <TableCell align="right">标准差</TableCell>
                              <TableCell align="right">最小值</TableCell>
                              <TableCell align="right">最大值</TableCell>
                              <TableCell align="right">样本数</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {vars.map((v) => (
                              <TableRow key={v.variable} sx={{ '&:hover': { backgroundColor: ACCENT_LIGHT } }}>
                                <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{v.variable}</TableCell>
                                <TableCell align="right">{v.mean} {v.unit}</TableCell>
                                <TableCell align="right">{v.std}</TableCell>
                                <TableCell align="right">{v.min}</TableCell>
                                <TableCell align="right">{v.max}</TableCell>
                                <TableCell align="right">{v.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ))}
                </Stack>
              </TabPanel>

              {/* Tab 1: 相关性分析 */}
              <TabPanel value={tabValue} index={1}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={700}>测点类型间 Pearson 相关系数矩阵</Typography>
                  <Typography variant="caption" color="text.secondary">
                    基于各类型下所有测点均值计算的相关性（{startDate?.format('YYYY-MM-DD')} ~ {endDate?.format('YYYY-MM-DD')}）
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {[
                      { label: 'r ≥ 0.7 强正相关', bg: 'rgba(46,125,50,0.22)', color: '#1B5E20' },
                      { label: 'r ≥ 0.4 弱正相关', bg: 'rgba(46,125,50,0.10)', color: '#2E7D32' },
                      { label: 'r ≤ -0.4 弱负相关', bg: 'rgba(245,124,0,0.10)', color: '#E65100' },
                      { label: 'r ≤ -0.7 强负相关', bg: 'rgba(229,57,53,0.18)', color: '#B71C1C' },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: 0.5, backgroundColor: item.bg, border: `1px solid ${item.color}40` }} />
                        <Typography variant="caption" color={item.color} fontWeight={600}>{item.label}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  {Object.keys(correlationMatrix).length > 0 ? (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 400, overflow: 'auto' }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { backgroundColor: ACCENT_LIGHT, fontWeight: 700, fontSize: '0.75rem' } }}>
                            <TableCell>类型</TableCell>
                            {Object.keys(correlationMatrix).map((t) => (
                              <TableCell key={t} align="center">{typeNameMap[t] || t}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.keys(correlationMatrix).map((rowType) => (
                            <TableRow key={rowType}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{typeNameMap[rowType] || rowType}</TableCell>
                              {Object.keys(correlationMatrix).map((colType) => {
                                const val = correlationMatrix[rowType]?.[colType] ?? 0;
                                const isIdentity = rowType === colType;
                                return (
                                  <TableCell key={colType} align="center"
                                    sx={{
                                      backgroundColor: isIdentity ? ACCENT_LIGHT : getCorrBg(val),
                                      fontWeight: Math.abs(val) >= 0.4 || isIdentity ? 700 : 400,
                                      fontSize: '0.78rem',
                                      color: isIdentity ? ACCENT : val >= 0.7 ? '#1B5E20' : val <= -0.7 ? '#B71C1C' : 'text.primary',
                                    }}>
                                    {isIdentity ? '1.00' : val.toFixed(2)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      需要至少 3 个测点类型才能计算相关性矩阵
                    </Typography>
                  )}
                </Stack>
              </TabPanel>

              {/* Tab 2: 超标统计 */}
              <TabPanel value={tabValue} index={2}>
                <Stack spacing={3}>
                  <Typography variant="subtitle2" fontWeight={700}>超标统计</Typography>
                  <Typography variant="caption" color="text.secondary">
                    基于上方设置的阈值，统计各测点超过阈值的次数、比例、持续时长和最大值
                    （{startDate?.format('YYYY-MM-DD')} ~ {endDate?.format('YYYY-MM-DD')}）
                  </Typography>

                  {Object.keys(thresholds).length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <WarningAmberIcon sx={{ fontSize: 48, color: '#F57C00', mb: 1 }} />
                      <Typography color="text.secondary">请先在筛选栏中设置超标阈值</Typography>
                      <Typography variant="caption" color="text.secondary">为需要监控的传感器类型输入阈值后，刷新分析即可查看超标统计</Typography>
                    </Box>
                  ) : Object.entries(exceedTypeGroups).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      当前时间范围内无数据，请调整筛选条件
                    </Typography>
                  ) : (
                    Object.entries(exceedTypeGroups).map(([type, items]) => (
                      <Paper key={type} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 1.5, backgroundColor: ACCENT_LIGHT, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {typeNameMap[type] || type}
                          </Typography>
                          <Chip
                            label={`阈值 > ${thresholds[type]} ${getUnit(type)}`}
                            size="small"
                            sx={{ backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 600, fontSize: '0.7rem' }}
                          />
                          {(() => {
                            const totalExceed = items.reduce((s, i) => s + i.exceedCount, 0);
                            return totalExceed > 0 ? (
                              <Chip
                                label={`共 ${totalExceed} 次超标`}
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                              />
                            ) : (
                              <Chip
                                label="全部正常"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                              />
                            );
                          })()}
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.78rem' } }}>
                                <TableCell>测点名称</TableCell>
                                <TableCell align="right">超标次数</TableCell>
                                <TableCell align="right">超标率</TableCell>
                                <TableCell align="right">最长连续</TableCell>
                                <TableCell align="right">超标最大值</TableCell>
                                <TableCell align="right">最新值</TableCell>
                                <TableCell align="right">最新时间</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items.map((item) => {
                                const hasExceed = item.exceedCount > 0;
                                return (
                                  <TableRow
                                    key={item.variable}
                                    sx={{
                                      '&:hover': { backgroundColor: ACCENT_LIGHT },
                                      backgroundColor: hasExceed ? 'rgba(229,57,53,0.04)' : 'transparent',
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{item.variable}</TableCell>
                                    <TableCell align="right">
                                      <Typography
                                        variant="body2"
                                        fontWeight={hasExceed ? 700 : 400}
                                        color={hasExceed ? 'error.main' : 'text.primary'}
                                      >
                                        {item.exceedCount}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography
                                        variant="body2"
                                        fontWeight={item.exceedRate >= 10 ? 700 : 400}
                                        color={item.exceedRate >= 30 ? 'error.main' : item.exceedRate >= 10 ? '#F57C00' : 'text.primary'}
                                      >
                                        {item.exceedRate}%
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">{item.exceedDuration > 0 ? `${item.exceedDuration} 次` : '—'}</TableCell>
                                    <TableCell align="right">
                                      {item.exceedCount > 0 ? `${item.exceedMax} ${item.unit}` : '—'}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color={item.latestValue > item.threshold ? 'error.main' : 'text.primary'}
                                      >
                                        {item.latestValue} {item.unit}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                      {item.latestTime ? dayjs(item.latestTime).format('MM-DD HH:mm') : '—'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    ))
                  )}
                </Stack>
              </TabPanel>
            </Box>
          </Paper>
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default DataAnalysisPage;
