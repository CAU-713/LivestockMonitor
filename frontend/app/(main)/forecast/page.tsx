'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

import LineChart from '@/components/charts/LineChart';
import { getForecastOverview } from '@/lib/api/forecastApi';
import { FORECAST_MODELS } from '@/types/forecast';
import type { ForecastOverview, ForecastPoint, ForecastHistoryPoint } from '@/types/forecast';
import type { ChartDataPoint, ChartLine, MergedChartData } from '@/types';

// 分组定义：传感器前缀 -> 展示名称与单位
const CATEGORIES: { label: string; unit: string; prefixes: string[] }[] = [
  { label: '温度', unit: '°C', prefixes: ['TEM', 'BGT'] },
  { label: '湿度', unit: '%', prefixes: ['HUM'] },
  { label: '气体', unit: 'ppm', prefixes: ['CO2', 'NH3'] },
  { label: '颗粒物', unit: 'µg/m³', prefixes: ['PM', 'TSP'] },
  { label: '光照', unit: 'Lux', prefixes: ['LIG'] },
  { label: '风速', unit: 'm/s', prefixes: ['WIN'] },
];

const KPI_POINTS = [
  { pointId: 'TEM-N', label: '温度北', unit: '°C' },
  { pointId: 'HUM-N1', label: '湿度北1', unit: '%' },
  { pointId: 'CO2-N1', label: 'CO2 北1', unit: 'ppm' },
  { pointId: 'NH3-S', label: 'NH3 南', unit: 'ppm' },
  { pointId: 'PM25-N', label: 'PM25 北', unit: 'µg/m³' },
];

const LINE_COLORS = [
  '#2E7D32', '#1565C0', '#F57C00', '#6A1B9A', '#00695C',
  '#E65100', '#880E4F', '#F9A825', '#4E342E',
];
const getColor = (i: number) => LINE_COLORS[i % LINE_COLORS.length];

const formatTime = (t: string | null) => (t ? dayjs(t).format('MM-DD HH:mm') : '-');

function matchesCategory(pointId: string, prefixes: string[]) {
  return prefixes.some((p) => pointId.startsWith(p));
}

// 历史真实值 + 未来预测值 → 单张分组图（该分组下每个 point 一条连续线）
function buildChart(
  category: { label: string; unit: string; prefixes: string[] },
  history: ForecastHistoryPoint[],
  forecast: ForecastPoint[],
  boundaryTime: string | null,
): MergedChartData | null {
  const historyInCat = history.filter((h) =>
    matchesCategory(h.point_id, category.prefixes),
  );
  const forecastInCat = forecast.filter((f) =>
    matchesCategory(f.point_id, category.prefixes),
  );

  const pointIds = Array.from(
    new Set([
      ...historyInCat.map((h) => h.point_id),
      ...forecastInCat.map((f) => f.point_id),
    ]),
  ).sort();

  if (pointIds.length === 0) return null;

  // point_id -> 中文名（预测优先，历史回落）
  const nameMap = new Map<string, string>();
  forecastInCat.forEach((f) => nameMap.set(f.point_id, f.point_name));
  historyInCat.forEach((h) => {
    if (!nameMap.has(h.point_id)) nameMap.set(h.point_id, h.point_name);
  });

  // 合并：真实值（过去24h）在前，预测值（未来）在后，天然连续
  const dataMap = new Map<string, ChartDataPoint>();
  const put = (t: string | null, pid: string, val: number) => {
    if (!t) return;
    const key = formatTime(t);
    let row = dataMap.get(key);
    if (!row) {
      row = { time: key };
      dataMap.set(key, row);
    }
    row[pid] = Number(Number(val).toFixed(2));
  };
  historyInCat.forEach((h) => put(h.time, h.point_id, h.value));
  forecastInCat.forEach((f) => put(f.target_time, f.point_id, f.predicted_value));

  const data = Array.from(dataMap.values()).sort((a, b) =>
    String(a.time).localeCompare(String(b.time)),
  );

  const lines: ChartLine[] = pointIds.map((pid, idx) => ({
    dataKey: pid,
    name: nameMap.get(pid) || pid,
    color: getColor(idx),
  }));

  return {
    title: category.label,
    sensorType: 'Mixed',
    unit: category.unit,
    lines,
    data,
    referenceX: boundaryTime ? formatTime(boundaryTime) : undefined,
  };
}

export default function ForecastPage() {
  const [overview, setOverview] = useState<ForecastOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string>(FORECAST_MODELS[0].value);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getForecastOverview(model)
      .then((data) => {
        if (alive) setOverview(data);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [model]);

  const charts = useMemo(() => {
    if (!overview) return [];
    const boundary = overview.batch?.input_end_time ?? null;
    return CATEGORIES.map((c) =>
      buildChart(c, overview.history, overview.forecast, boundary),
    ).filter((c): c is MergedChartData => c !== null);
  }, [overview]);

  const kpis = useMemo(() => {
    if (!overview) return [];
    return KPI_POINTS.map((k) => {
      const next1h = overview.forecast.filter(
        (f) => f.point_id === k.pointId && f.horizon_step <= 12,
      );
      const avg =
        next1h.length > 0
          ? next1h.reduce((s, f) => s + f.predicted_value, 0) / next1h.length
          : null;
      return { ...k, avg };
    });
  }, [overview]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !overview) {
    return <Alert severity="error">加载预测数据失败：{error}</Alert>;
  }

  if (!overview) return null;

  const { batch, device } = overview;
  const noForecast = !batch || overview.forecast.length === 0;
  const sensorZero = !device.last_nonzero_at
    ? true
    : dayjs().diff(dayjs(device.last_nonzero_at), 'hour') > 6;
  const online = device.is_online === true;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        环境预测
      </Typography>

      {/* 模型选择 */}
      <Tabs
        value={model}
        onChange={(_, v: string) => setModel(v)}
        aria-label="预测模型选择"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {FORECAST_MODELS.map((m) => (
          <Tab key={m.value} label={m.label} value={m.value} />
        ))}
      </Tabs>

      {/* 设备/数据状态 */}
      {!online && (
        <Alert severity="error">
          设备离线
          {device.last_comm_time ? `（最近通信：${formatTime(device.last_comm_time)}）` : ''}
        </Alert>
      )}
      {online && sensorZero && (
        <Alert severity="warning">
          设备在线，但环境传感器自{' '}
          {device.last_nonzero_at ? formatTime(device.last_nonzero_at) : '入库以来'}{' '}
          起无有效数据（全 0），预测将在数据恢复后自动生成。
        </Alert>
      )}
      {online && !sensorZero && (
        <Alert severity="success">
          设备在线，传感器数据正常
          {device.last_nonzero_at
            ? `，最近有效数据：${formatTime(device.last_nonzero_at)}`
            : ''}
        </Alert>
      )}

      {/* 批次信息 */}
      {batch && (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              最新预测批次：{batch.batch_id}
            </Typography>
            <Typography variant="body2">
              执行时间 {formatTime(batch.forecast_time)} · 输入截止{' '}
              {formatTime(batch.input_end_time)} · 模型 {batch.model_name}{' '}
              {batch.model_version}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              预测范围 {formatTime(batch.target_start)} ~{' '}
              {formatTime(batch.target_end)} · {batch.rows} 行
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* 无预测数据空状态 */}
      {noForecast && (
        <Alert severity="info">
          暂无预测数据。预测表 device_forecast_save 将在定时任务首次运行时自动建表，
          待传感器数据恢复后自动产出预测。
        </Alert>
      )}

      {/* 关键指标卡片（未来 1 小时预测均值） */}
      {!noForecast && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {kpis.map((k) => (
              <Paper key={k.pointId} sx={{ minWidth: 150, flex: '1 1 150px', p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {k.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {k.avg !== null ? k.avg.toFixed(1) : '-'}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {' '}
                    {k.unit}
                  </Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  未来 1 小时预测均值
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* 分组曲线 */}
          {charts.map((chart) => (
            <Paper key={chart.title} sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {chart.title}（过去 24 小时真实值 + 未来 6 小时预测）
              </Typography>
              <LineChart chartData={chart} />
            </Paper>
          ))}
        </>
      )}
    </Stack>
  );
}
