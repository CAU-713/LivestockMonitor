'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Button, Paper, Typography, CircularProgress, Stack, Chip,
  Popover, Checkbox, FormControlLabel, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import BiotechIcon from '@mui/icons-material/Biotech';
import LineChart from '@/components/charts/LineChart';
import { getPoints, getMultiPointHistory, type SparkPoint, type SparkHistoryItem } from '@/lib/api/sparksApi';
import type { MergedChartData, ChartLine, YAxisConfig } from '@/types';
import { typeNameMap, typeColorMap, getUnit } from '@/constants/sensorTypes';

type Granularity = 'moment' | 'hour' | 'day';
type MergeMode = 'none' | 'type' | 'overlay' | 'compare';

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

  // 对比模式状态
  const [compareStart, setCompareStart] = useState<Dayjs | null>(null);
  const [compareEnd, setCompareEnd] = useState<Dayjs | null>(null);
  const [compareItems, setCompareItems] = useState<SparkHistoryItem[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState<string>('');

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
  const fetchHistory = useCallback(async (pointIds: string[], start: string, end: string) => {
    const backendG = granularity === 'moment' ? 'raw' : granularity;
    return await getMultiPointHistory({
      point_ids: pointIds,
      start,
      end,
      granularity: backendG,
      limit: 10000,
    });
  }, [granularity]);

  // 主查询
  useEffect(() => {
    if (!startDate || !endDate || selectedPointIds.length === 0) return;
    const load = async () => {
      setApiLoading(true);
      try {
        const items = await fetchHistory(selectedPointIds, startDate.toISOString(), endDate.toISOString());
        setHistoryItems(items);
      } catch (e) {
        console.error('History fetch failed:', e);
        setHistoryItems([]);
      } finally {
        setApiLoading(false);
      }
    };
    load();
  }, [granularity, startDate, endDate, selectedPointIds.join(','), fetchHistory]);

  // 切换模式时清理对比数据
  useEffect(() => {
    if (mergeMode !== 'compare') {
      setCompareItems([]);
      setCompareStart(null);
      setCompareEnd(null);
    }
  }, [mergeMode]);

  // 对比模式：加载对照区间数据
  const handleCompareFetch = useCallback(async () => {
    if (!compareStart || !compareEnd || selectedPointIds.length === 0) return;

    // 时长校验
    const mainDuration = endDate && startDate ? endDate.diff(startDate, granularity === 'day' ? 'day' : 'hour') : 0;
    const cmpDuration = compareEnd.diff(compareStart, granularity === 'day' ? 'day' : 'hour');
    const diff = Math.abs(mainDuration - cmpDuration);

    // 允许 1 个单位（天/小时）的误差
    if (diff > 1) {
      setCompareDialogOpen(true);
      return;
    }

    setCompareLoading(true);
    try {
      const items = await fetchHistory(selectedPointIds, compareStart.toISOString(), compareEnd.toISOString());
      setCompareItems(items);
    } catch (e) {
      console.error('Compare fetch failed:', e);
      setCompareItems([]);
    } finally {
      setCompareLoading(false);
    }
  }, [compareStart, compareEnd, selectedPointIds, endDate, startDate, granularity, fetchHistory]);

  // 转换为图表数据
  const chartData = useMemo((): MergedChartData[] => {
    // ===== 叠加对比图模式：多类型用双Y轴叠加到一张图 =====
    if (mergeMode === 'overlay') {
      if (historyItems.length === 0 || selectedTypes.length < 2) return [];

      // 按类型分组，每种类型取所有测点值的均值
      const timeMap: Record<string, Record<string, { sum: number; count: number }>> = {};
      const typesInUse = new Set<string>();

      historyItems.forEach((item) => {
        const pInfo = points.find((p) => p.point_id === item.point_id);
        const type = pInfo?.type || 'Unknown';
        if (!selectedTypes.includes(type)) return;
        typesInUse.add(type);
        const t = formatTime(item.record_time || item.created_at || '', granularity);
        if (!timeMap[t]) timeMap[t] = {};
        if (!timeMap[t][type]) timeMap[t][type] = { sum: 0, count: 0 };
        const val = item.avg_value ?? parseFloat(item.value || '0');
        if (!isNaN(val)) { timeMap[t][type].sum += val; timeMap[t][type].count += 1; }
      });

      const typeList = Array.from(typesInUse).sort();
      const yAxes: YAxisConfig[] = [];
      const lines: ChartLine[] = [];

      typeList.forEach((type, idx) => {
        const unit = getUnit(type);
        const orientation = idx === 0 ? 'left' : 'right';
        yAxes.push({ id: type, unit, orientation, color: getColor(idx) });
        lines.push({
          dataKey: type,
          name: typeNameMap[type] || type,
          color: getColor(idx),
          yAxisId: type,
        });
      });

      const data = Object.entries(timeMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, typeVals]) => {
          const point: Record<string, any> & { time: string } = { time };
          Object.entries(typeVals).forEach(([type, { sum, count }]) => {
            point[type] = parseFloat((sum / count).toFixed(1));
          });
          return point;
        });

      const title = typeList.map((t) => typeNameMap[t] || t).join(' + ') + ' 叠加对比';

      return [{
        title,
        sensorType: 'overlay' as any,
        yAxes,
        lines,
        data,
      }];
    }

    // ===== 对比模式：两个时间段同测点对比（同一时间轴，无数据用0补） =====
    if (mergeMode === 'compare') {
      if (historyItems.length === 0 || compareItems.length === 0) return [];
      if (!startDate || !endDate || !compareStart || !compareEnd) return [];

      const buildTypeAvg = (items: SparkHistoryItem[], type: string) => {
        const map: Record<string, { sum: number; count: number }> = {};
        items.forEach((item) => {
          const pInfo = points.find((p) => p.point_id === item.point_id);
          if (pInfo?.type !== type) return;
          const t = formatTime(item.record_time || item.created_at || '', granularity);
          if (!map[t]) map[t] = { sum: 0, count: 0 };
          const val = item.avg_value ?? parseFloat(item.value || '0');
          if (!isNaN(val)) { map[t].sum += val; map[t].count += 1; }
        });
        return map;
      };

      const mainLabel = `${startDate.format('MM-DD')}~${endDate.format('MM-DD')}`;
      const cmpLabel = `${compareStart.format('MM-DD')}~${compareEnd.format('MM-DD')}`;

      // X 轴用主区间的实际日期时间点（不偏移，对照区间的数据按其真实日期画到对应 X 点上）
      const mainLen = granularity === 'day'
        ? endDate.diff(startDate, 'day') + 1
        : granularity === 'hour'
          ? Math.max(1, endDate.diff(startDate, 'hour') + 1)
          : Math.max(1, endDate.diff(startDate, 'day') * 24 + endDate.diff(startDate, 'hour') + 1);

      const xPoints: { time: string; mainDate: Dayjs }[] = [];
      for (let i = 0; i < mainLen; i++) {
        if (granularity === 'day') {
          const d = startDate.add(i, 'day');
          xPoints.push({ time: d.format('MM-DD'), mainDate: d });
        } else if (granularity === 'hour') {
          const d = startDate.add(i, 'hour');
          xPoints.push({ time: d.format('MM-DD HH:00'), mainDate: d });
        } else {
          const d = startDate.add(i, 'hour');
          xPoints.push({ time: d.format('MM-DD HH:mm'), mainDate: d });
        }
      }

      const result: MergedChartData[] = [];

      selectedTypes.forEach((type, tIdx) => {
        const mainAvg = buildTypeAvg(historyItems, type);
        const cmpAvg = buildTypeAvg(compareItems, type);
        const mainKey = `${type}_A`;
        const cmpKey = `${type}_B`;
        const unit = getUnit(type);

        const data = xPoints.map(({ time, mainDate }) => {
          // 主区间数据：按当前 X 点对应的实际日期查找
          const mainKeyStr = granularity === 'day'
            ? mainDate.format('MM-DD')
            : granularity === 'hour'
              ? mainDate.format('MM-DD HH:00')
              : mainDate.format('MM-DD HH:mm');
          // 对照区间数据：按对照区间的真实日期查找（不偏移）
          // 如果 X 点日期在对照区间内，则按 X 点日期；否则不画（用 0 补）
          let cmpKeyStr: string | null = null;
          if (granularity === 'day') {
            const cmpDate = mainDate; // 假设 X 轴就是主区间日期，对照区间数据按相同 X 坐标位置
            if (cmpDate.isSame(compareStart) || cmpDate.isAfter(compareStart)) {
              if (cmpDate.isSame(compareEnd) || cmpDate.isBefore(compareEnd)) {
                cmpKeyStr = cmpDate.format('MM-DD');
              }
            }
          } else if (granularity === 'hour') {
            const cmpDate = mainDate;
            if (cmpDate.isSame(compareStart) || cmpDate.isAfter(compareStart)) {
              if (cmpDate.isSame(compareEnd) || cmpDate.isBefore(compareEnd)) {
                cmpKeyStr = cmpDate.format('MM-DD HH:00');
              }
            }
          } else {
            const cmpDate = mainDate;
            if (cmpDate.isSame(compareStart) || cmpDate.isAfter(compareStart)) {
              if (cmpDate.isSame(compareEnd) || cmpDate.isBefore(compareEnd)) {
                cmpKeyStr = cmpDate.format('MM-DD HH:mm');
              }
            }
          }

          const point: Record<string, any> & { time: string } = { time };
          // 主区间：有数据用数据值，没数据用 0
          point[mainKey] = mainAvg[mainKeyStr] !== undefined
            ? parseFloat((mainAvg[mainKeyStr].sum / mainAvg[mainKeyStr].count).toFixed(1))
            : 0;
          // 对照区间：在对照区间范围内才画
          if (cmpKeyStr && cmpAvg[cmpKeyStr] !== undefined) {
            point[cmpKey] = parseFloat((cmpAvg[cmpKeyStr].sum / cmpAvg[cmpKeyStr].count).toFixed(1));
          } else {
            point[cmpKey] = 0;
          }
          return point;
        });

        result.push({
          title: `${typeNameMap[type] || type} 对比 (${mainLabel} vs ${cmpLabel})`,
          sensorType: type as any,
          unit,
          lines: [
            { dataKey: mainKey, name: `${typeNameMap[type] || type} ${mainLabel}`, color: getColor(tIdx * 2) },
            { dataKey: cmpKey, name: `${typeNameMap[type] || type} ${cmpLabel}`, color: getColor(tIdx * 2 + 1) },
          ],
          data,
        });
      });

      return result;
    }

    // ===== 独立模式 =====
    if (mergeMode === 'none' && historyItems.length > 0) {
      const pointMap: Record<string, SparkHistoryItem[]> = {};
      historyItems.forEach((item) => {
        if (!pointMap[item.point_id]) pointMap[item.point_id] = [];
        pointMap[item.point_id].push(item);
      });

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

    // ===== 按类型合并模式 =====
    if (mergeMode === 'type' && historyItems.length > 0) {
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
    }

    return [];
  }, [historyItems, compareItems, mergeMode, granularity, points, selectedTypes, startDate, endDate, compareStart, compareEnd]);

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

  // ==================== 数据诊断 ====================

  const generateDiagnosis = useCallback(() => {
    const lines: string[] = [];
    const addLine = (s: string) => lines.push(s);
    const nbsp = '\u00A0\u00A0\u00A0\u00A0';

    const timeRangeStr = `${startDate?.format('YYYY-MM-DD')} ~ ${endDate?.format('YYYY-MM-DD')}`;
    const typeNames = selectedTypes.map((t) => typeNameMap[t] || t).join('、');
    const pointNames = selectedPointIds
      .map((id) => points.find((p) => p.point_id === id)?.point_name || id)
      .join('、');

    // 头部信息
    addLine('📊 环境数据诊断报告');
    addLine('');
    addLine(`时间范围：${timeRangeStr}`);
    addLine(`测点类型：${typeNames || '未选择'}`);
    addLine(`选中测点：${pointNames || '无'}`);
    addLine(`颗粒度：${{ moment: '时刻', hour: '小时', day: '天' }[granularity]}`);
    addLine(`数据条数：${historyItems.length.toLocaleString()}`);
    addLine('');

    if (historyItems.length === 0) {
      addLine('⚠️ 当前时间范围内无数据，请调整筛选条件。');
      setDiagnosisText(lines.join('\n'));
      return;
    }

    // 按模式生成不同诊断
    if (mergeMode === 'none') {
      // 独立图表模式
      addLine('🔍 模式：独立图表');
      addLine('');

      selectedTypes.forEach((type) => {
        const typeItems = historyItems.filter((item) => {
          const pInfo = points.find((p) => p.point_id === item.point_id);
          return pInfo?.type === type;
        });
        const vals = typeItems.map((item) => item.avg_value ?? parseFloat(item.value || '0')).filter((v) => !isNaN(v));
        if (vals.length === 0) return;

        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        const max = Math.max(...vals);
        const min = Math.min(...vals);
        const std = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
        const unit = getUnit(type);

        addLine(`【${typeNameMap[type] || type}】`);
        addLine(`${nbsp}均值：${avg.toFixed(1)} ${unit}`);
        addLine(`${nbsp}最大值：${max.toFixed(1)} ${unit}`);
        addLine(`${nbsp}最小值：${min.toFixed(1)} ${unit}`);
        addLine(`${nbsp}标准差：${std.toFixed(2)}`);
        addLine(`${nbsp}波动幅度：${(max - min).toFixed(1)} ${unit}（${((max - min) / (avg || 1) * 100).toFixed(0)}%）`);

        // 趋势判断
        const sorted = typeItems
          .map((item) => ({
            time: item.record_time || item.created_at || '',
            val: item.avg_value ?? parseFloat(item.value || '0'),
          }))
          .filter((v) => !isNaN(v.val))
          .sort((a, b) => a.time.localeCompare(b.time));

        if (sorted.length >= 4) {
          const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
          const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
          const firstAvg = firstHalf.reduce((s, v) => s + v.val, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((s, v) => s + v.val, 0) / secondHalf.length;
          const change = secondAvg - firstAvg;
          const changePct = ((change / (firstAvg || 1)) * 100).toFixed(0);
          if (changePct !== '0') {
            const trend = change > 0 ? '上升' : '下降';
            const icon = change > 0 ? '📈' : '📉';
            addLine(`${nbsp}趋势：${icon} 后半段较前半段${trend} ${Math.abs(Number(changePct))}%`);
          } else {
            addLine(`${nbsp}趋势：➡️ 保持稳定`);
          }
        }

        // 波动程度
        const cv = std / (avg || 1);
        if (cv > 0.3) addLine(`${nbsp}波动程度：⚠️ 波动较大（变异系数 ${(cv * 100).toFixed(0)}%）`);
        else if (cv > 0.15) addLine(`${nbsp}波动程度：⚡ 波动适中（变异系数 ${(cv * 100).toFixed(0)}%）`);
        else addLine(`${nbsp}波动程度：✅ 波动较小，数据稳定（变异系数 ${(cv * 100).toFixed(0)}%）`);

        addLine('');
      });

      // 跨类型对比
      if (selectedTypes.length >= 2) {
        addLine('【跨类型概览】');
        const typeStats = selectedTypes.map((type) => {
          const vals = historyItems
            .filter((item) => {
              const pInfo = points.find((p) => p.point_id === item.point_id);
              return pInfo?.type === type;
            })
            .map((item) => item.avg_value ?? parseFloat(item.value || '0'))
            .filter((v) => !isNaN(v));
          const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
          const max = vals.length > 0 ? Math.max(...vals) : 0;
          const min = vals.length > 0 ? Math.min(...vals) : 0;
          return { type, avg, max, min, count: vals.length };
        }).filter((s) => s.count > 0);

        typeStats.forEach(({ type, avg, max, min }) => {
          addLine(`${nbsp}${typeNameMap[type] || type}：均值 ${avg.toFixed(1)} ${getUnit(type)}，范围 ${min.toFixed(1)} ~ ${max.toFixed(1)} ${getUnit(type)}`);
        });

        addLine('');
        addLine(`💡 建议：共 ${selectedPointIds.length} 个测点独立展示，适合逐一查看各测点变化趋势。如需综合对比，可切换为「叠加对比图」或「按类型合并」模式。`);
      }
    } else if (mergeMode === 'type') {
      // 按类型合并模式
      addLine('🔍 模式：按类型合并');
      addLine('');

      selectedTypes.forEach((type) => {
        const typeItems = historyItems.filter((item) => {
          const pInfo = points.find((p) => p.point_id === item.point_id);
          return pInfo?.type === type;
        });
        const vals = typeItems.map((item) => item.avg_value ?? parseFloat(item.value || '0')).filter((v) => !isNaN(v));
        if (vals.length === 0) return;

        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        const max = Math.max(...vals);
        const min = Math.min(...vals);
        const unit = getUnit(type);
        const typePoints = (typeGroups[type] || []).filter((p) => selectedPointIds.includes(p.point_id));

        addLine(`【${typeNameMap[type] || type}】（${typePoints.length} 个测点合并）`);
        addLine(`${nbsp}均值：${avg.toFixed(1)} ${unit}`);
        addLine(`${nbsp}最大值：${max.toFixed(1)} ${unit}`);
        addLine(`${nbsp}最小值：${min.toFixed(1)} ${unit}`);
        addLine(`${nbsp}极差：${(max - min).toFixed(1)} ${unit}`);
        addLine('');
      });

      addLine(`💡 建议：按类型合并后，可直观对比不同类型间的数据量级和波动模式。${selectedTypes.length >= 2 ? '各类型的曲线可以放在一起观察耦合关系。' : ''}`);
    } else if (mergeMode === 'overlay') {
      // 叠加对比图模式
      addLine('🔍 模式：叠加对比图（双Y轴）');
      addLine('');

      const typeStatsArr = selectedTypes.map((type) => {
        const vals = historyItems
          .filter((item) => {
            const pInfo = points.find((p) => p.point_id === item.point_id);
            return pInfo?.type === type;
          })
          .map((item) => item.avg_value ?? parseFloat(item.value || '0'))
          .filter((v) => !isNaN(v));
        if (vals.length === 0) return null;
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        const max = Math.max(...vals);
        const min = Math.min(...vals);
        const std = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
        return { type, avg, max, min, std, count: vals.length, unit: getUnit(type) };
      }).filter(Boolean) as { type: string; avg: number; max: number; min: number; std: number; count: number; unit: string }[];

      typeStatsArr.forEach(({ type, avg, max, min, std }) => {
        addLine(`【${typeNameMap[type] || type}】`);
        addLine(`${nbsp}均值：${avg.toFixed(1)} ${getUnit(type)}，极差：${(max - min).toFixed(1)} ${getUnit(type)}`);
        addLine(`${nbsp}变异系数：${((std / (avg || 1)) * 100).toFixed(0)}%`);
        addLine('');
      });

      // 跨类型关联分析
      if (typeStatsArr.length >= 2) {
        addLine('【跨类型关联分析】');
        for (let i = 0; i < typeStatsArr.length; i++) {
          for (let j = i + 1; j < typeStatsArr.length; j++) {
            const a = typeStatsArr[i];
            const b = typeStatsArr[j];
            const aVals: number[] = [];
            const bVals: number[] = [];
            // 简单时序关联
            const timeMapA: Record<string, number> = {};
            const timeMapB: Record<string, number> = {};
            historyItems.forEach((item) => {
              const pInfo = points.find((p) => p.point_id === item.point_id);
              if (pInfo?.type === a.type) {
                const t = item.record_time || item.created_at || '';
                if (t) timeMapA[t] = item.avg_value ?? parseFloat(item.value || '0');
              }
              if (pInfo?.type === b.type) {
                const t = item.record_time || item.created_at || '';
                if (t) timeMapB[t] = item.avg_value ?? parseFloat(item.value || '0');
              }
            });
            Object.keys(timeMapA).forEach((t) => {
              if (timeMapB[t] !== undefined) {
                aVals.push(timeMapA[t]);
                bVals.push(timeMapB[t]);
              }
            });

            if (aVals.length >= 3) {
              const mA = aVals.reduce((s, v) => s + v, 0) / aVals.length;
              const mB = bVals.reduce((s, v) => s + v, 0) / bVals.length;
              let cov = 0, va = 0, vb = 0;
              for (let k = 0; k < aVals.length; k++) {
                const da = aVals[k] - mA, db = bVals[k] - mB;
                cov += da * db; va += da * da; vb += db * db;
              }
              const r = va === 0 || vb === 0 ? 0 : cov / Math.sqrt(va * vb);
              const nameA = typeNameMap[a.type] || a.type;
              const nameB = typeNameMap[b.type] || b.type;
              const relation = r > 0.6 ? '强正相关' : r > 0.3 ? '弱正相关' : r < -0.6 ? '强负相关' : r < -0.3 ? '弱负相关' : '无明显线性相关';
              addLine(`${nbsp}${nameA} ↔ ${nameB}：r = ${r.toFixed(2)}（${relation}）`);
            }
          }
        }
        addLine('');
      }

      addLine(`💡 建议：叠加对比图将 ${typeStatsArr.map((s) => typeNameMap[s.type] || s.type).join('、')} 合并在一张图中，左Y轴为第一个类型，其余用右Y轴。适合观察多类型数据的协同变化规律。`);
    } else if (mergeMode === 'compare') {
      // 对比模式
      addLine('🔍 模式：对比模式');
      addLine('');

      const mainLabel = `${startDate?.format('MM-DD')}~${endDate?.format('MM-DD')}`;
      const cmpLabel = compareStart && compareEnd ? `${compareStart.format('MM-DD')}~${compareEnd.format('MM-DD')}` : '未设置';

      addLine(`主区间：${mainLabel}`);
      addLine(`对照区间：${cmpLabel}`);
      addLine('');

      if (compareItems.length === 0) {
        addLine('⚠️ 对照区间尚未加载数据，请设置对照区间并点击「查询对照」。');
      } else {
        selectedTypes.forEach((type) => {
          const getStats = (items: SparkHistoryItem[]) => {
            const vals = items
              .filter((item) => {
                const pInfo = points.find((p) => p.point_id === item.point_id);
                return pInfo?.type === type;
              })
              .map((item) => item.avg_value ?? parseFloat(item.value || '0'))
              .filter((v) => !isNaN(v));
            if (vals.length === 0) return null;
            return {
              avg: vals.reduce((s, v) => s + v, 0) / vals.length,
              max: Math.max(...vals),
              min: Math.min(...vals),
              count: vals.length,
            };
          };

          const mainStats = getStats(historyItems);
          const cmpStats = getStats(compareItems);

          if (!mainStats || !cmpStats) return;

          const diff = mainStats.avg - cmpStats.avg;
          const diffPct = ((diff / (cmpStats.avg || 1)) * 100).toFixed(0);
          const unit = getUnit(type);
          const name = typeNameMap[type] || type;

          addLine(`【${name}】`);
          addLine(`${nbsp}主区间均值：${mainStats.avg.toFixed(1)} ${unit}（${mainStats.min.toFixed(1)} ~ ${mainStats.max.toFixed(1)}）`);
          addLine(`${nbsp}对照区间均值：${cmpStats.avg.toFixed(1)} ${unit}（${cmpStats.min.toFixed(1)} ~ ${cmpStats.max.toFixed(1)}）`);

          const diffIcon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
          const diffDesc = diff > 0 ? '高于' : diff < 0 ? '低于' : '等于';
          addLine(`${nbsp}变化：${diffIcon} 主区间${diffDesc}对照区间 ${Math.abs(Number(diffPct))}%（差 ${Math.abs(diff).toFixed(1)} ${unit}）`);
          addLine('');
        });

        addLine('💡 建议：对比模式下可直观看出两个时间段的差异。若差异较大，请关注是否存在设备变更、季节变化或异常事件。');
      }
    }

    setDiagnosisText(lines.join('\n'));
  }, [mergeMode, selectedTypes, selectedPointIds, historyItems, compareItems, granularity, startDate, endDate, compareStart, compareEnd, points, typeGroups]);

  const handleOpenDiagnosis = useCallback(() => {
    generateDiagnosis();
    setDiagnosisOpen(true);
  }, [generateDiagnosis]);

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
            <Typography variant="body2" fontWeight={600}>主时间范围：</Typography>
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

          {/* 对比模式：对照区间 */}
          {mergeMode === 'compare' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" fontWeight={600} color="#1565C0">对照区间：</Typography>

                {/* 快捷选项 */}
                <Paper
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    borderRadius: 2,
                    borderColor: '#90CAF9',
                    overflow: 'hidden',
                  }}
                >
                  {[
                    { label: '上一周期', key: 'prev' },
                    { label: '上月同期', key: 'prevMonth' },
                    { label: '去年同期', key: 'prevYear' },
                  ].map(({ label, key }) => {
                    const isActive = startDate && endDate && (
                      (key === 'prev' && compareStart?.isSame(startDate.subtract(endDate.diff(startDate, 'day') + 1, 'day'), 'day')) ||
                      (key === 'prevMonth' && compareStart?.isSame(startDate.subtract(1, 'month'), 'day')) ||
                      (key === 'prevYear' && compareStart?.isSame(startDate.subtract(1, 'year'), 'day'))
                    );
                    return (
                      <Button
                        key={key}
                        size="small"
                        onClick={() => {
                          if (!startDate || !endDate) return;
                          const days = endDate.diff(startDate, 'day') + 1;
                          let newStart: Dayjs;
                          let newEnd: Dayjs;
                          if (key === 'prev') {
                            newEnd = startDate.subtract(1, 'day');
                            newStart = newEnd.subtract(days - 1, 'day');
                          } else if (key === 'prevMonth') {
                            newStart = startDate.subtract(1, 'month');
                            newEnd = newStart.add(days - 1, 'day');
                          } else {
                            newStart = startDate.subtract(1, 'year');
                            newEnd = newStart.add(days - 1, 'day');
                          }
                          setCompareStart(newStart);
                          setCompareEnd(newEnd);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#fff' : '#1565C0',
                          bgcolor: isActive ? '#1565C0' : 'transparent',
                          borderRadius: 0,
                          px: 1.5,
                          py: 0.3,
                          minWidth: 'auto',
                          borderRight: '1px solid',
                          borderColor: '#90CAF9',
                          '&:last-child': { borderRight: 'none' },
                          '&:hover': { bgcolor: isActive ? '#1565C0' : 'rgba(21,101,192,0.08)' },
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Paper>

                <DatePicker
                  label="开始日期"
                  value={compareStart}
                  onChange={setCompareStart}
                  sx={{ width: 180 }}
                />
                <Typography variant="body2" color="text.secondary">至</Typography>
                <DatePicker
                  label="结束日期"
                  value={compareEnd}
                  onChange={setCompareEnd}
                  sx={{ width: 180 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCompareFetch}
                  disabled={!compareStart || !compareEnd}
                  sx={{ textTransform: 'none', bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}
                >
                  {compareLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : '查询对照'}
                </Button>
              </Stack>
            </>
          )}
        </Paper>

        {/* 图表模式 + 导出 */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Typography variant="body2" fontWeight={600}>图表模式：</Typography>
          {([
            { mode: 'none' as MergeMode, label: '独立图表', icon: null },
            { mode: 'type' as MergeMode, label: '按类型合并', icon: <MergeTypeIcon sx={{ fontSize: 16 }} /> },
            { mode: 'overlay' as MergeMode, label: '叠加对比图', icon: <MergeTypeIcon sx={{ fontSize: 16 }} /> },
            { mode: 'compare' as MergeMode, label: '对比模式', icon: <CompareArrowsIcon sx={{ fontSize: 16 }} /> },
          ]).map(({ mode, label, icon }) => (
            <Chip
              key={mode}
              icon={icon || undefined}
              label={label}
              variant={mergeMode === mode ? 'filled' : 'outlined'}
              color={mergeMode === mode ? 'primary' : 'default'}
              onClick={() => setMergeMode(mode)}
              size="small"
              sx={{ fontWeight: mergeMode === mode ? 700 : 500, fontSize: '0.78rem' }}
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
          <Button
            variant="contained"
            size="small"
            startIcon={<BiotechIcon />}
            onClick={handleOpenDiagnosis}
            disabled={historyItems.length === 0}
            sx={{
              textTransform: 'none',
              px: 2,
              bgcolor: '#E65100',
              '&:hover': { bgcolor: '#BF360C' },
            }}
          >
            数据诊断
          </Button>
        </Stack>

        {/* 图表区 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          {apiLoading || compareLoading ? (
            <Box sx={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
          ) : chartData.length > 0 ? (
            chartData.map((data, idx) => (
              <Box key={idx} sx={{
                gridColumn: {
                  xs: 'span 12',
                  lg: (mergeMode === 'overlay' || mergeMode === 'type') ? 'span 12' : 'span 6',
                },
                height: mergeMode === 'overlay' ? 400 : 320,
              }}>
                <LineChart chartData={data} />
              </Box>
            ))
          ) : (
            <Box sx={{ gridColumn: 'span 12' }}>
              <Typography align="center" sx={{ mt: 4 }}>
                {mergeMode === 'compare' && (!compareItems.length)
                  ? '请设置对照区间并点击"查询对照"'
                  : mergeMode === 'overlay' && selectedTypes.length < 2
                    ? '叠加对比图需要至少选择 2 种类型'
                    : '没有找到符合条件的数据。'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 时长不匹配弹窗 */}
        <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrowsIcon color="warning" />
            时间范围不匹配
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 1 }}>
              对照区间与主区间的时间跨度不一致，可能导致对比结果不准确。
            </Alert>
            <Typography variant="body2" color="text.secondary">
              主区间：{startDate?.format('YYYY-MM-DD')} ~ {endDate?.format('YYYY-MM-DD')}
              （{endDate && startDate ? endDate.diff(startDate, 'day') + 1 : 0} 天）
            </Typography>
            <Typography variant="body2" color="text.secondary">
              对照区间：{compareStart?.format('YYYY-MM-DD')} ~ {compareEnd?.format('YYYY-MM-DD')}
              （{compareEnd && compareStart ? compareEnd.diff(compareStart, 'day') + 1 : 0} 天）
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              建议调整为相同的时间跨度后重新查询。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompareDialogOpen(false)}>知道了</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setCompareDialogOpen(false);
                // 忽略警告，强制执行查询
                if (compareStart && compareEnd && selectedPointIds.length > 0) {
                  setCompareLoading(true);
                  fetchHistory(selectedPointIds, compareStart.toISOString(), compareEnd.toISOString())
                    .then(setCompareItems)
                    .finally(() => setCompareLoading(false));
                }
              }}
            >
              仍然查询
            </Button>
          </DialogActions>
        </Dialog>

        {/* 数据诊断弹窗 */}
        <Dialog
          open={diagnosisOpen}
          onClose={() => setDiagnosisOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
            <BiotechIcon sx={{ color: '#E65100' }} />
            数据诊断报告
          </DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                bgcolor: '#FFF8E1',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: 1.8,
                color: '#333',
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              {diagnosisText}
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiagnosisOpen(false)}>关闭</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default HistoricalEnvironmentalDataPage;
