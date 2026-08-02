'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Grid from '@mui/material/GridLegacy';
import {
  Paper,
  Typography,
  Stack,
  Box,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  DevicesOther as DevicesIcon,
  WifiOff as OfflineIcon,
  NotificationsActive as AlertIcon,
  Sensors as SensorsIcon,
  ThermostatAuto as TempIcon,
  WaterDrop as HumIcon,
  Co2 as Co2Icon,
  Air as WindIcon,
  LightMode as LightIcon,
} from '@mui/icons-material';
import KPICard from './components/KPICard';
import LineChart from '../../../components/charts/LineChart';
import {
  getPoints,
  getMultiPointHistory,
  getDeviceStatus,
  getOverview,
  type SparkPoint,
  type SparkHistoryItem,
  type SparkDeviceStatus,
  type SparkOverview,
} from '@/lib/api/sparksApi';
import type { MergedChartData } from '@/types';

type KPIStatus = 'normal' | 'warning' | 'danger';

// ==================== 传感器类型分组 ====================

interface PointGroup {
  type: string;
  type_name: string;
  icon: React.ReactNode;
  unit: string;
  chipBg: string;
  chipColor: string;
  points: SparkPoint[];
}

const groupConfig: Omit<PointGroup, 'points'>[] = [
  { type: 'Temperature', type_name: '温度', icon: <TempIcon sx={{ fontSize: 14 }} />, unit: '°C', chipBg: '#FFF3E0', chipColor: '#E65100' },
  { type: 'Humidity', type_name: '湿度', icon: <HumIcon sx={{ fontSize: 14 }} />, unit: '%RH', chipBg: '#E3F2FD', chipColor: '#1565C0' },
  { type: 'CO2', type_name: 'CO₂', icon: <Co2Icon sx={{ fontSize: 14 }} />, unit: 'ppm', chipBg: '#E8EAF6', chipColor: '#283593' },
  { type: 'Light', type_name: '光照', icon: <LightIcon sx={{ fontSize: 14 }} />, unit: 'lux', chipBg: '#FFFDE7', chipColor: '#F9A825' },
  { type: 'WindSpeed', type_name: '风速', icon: <WindIcon sx={{ fontSize: 14 }} />, unit: 'm/s', chipBg: '#E8F5E9', chipColor: '#2E7D32' },
];

// ==================== 图表配置 ====================

const chartTypeConfig: Record<string, { label: string; color: string; unit: string }> = {
  Temperature: { label: '温度趋势', color: '#E65100', unit: '°C' },
  Humidity: { label: '湿度趋势', color: '#1565C0', unit: '%RH' },
  CO2: { label: 'CO₂ 趋势', color: '#283593', unit: 'ppm' },
  Light: { label: '光照趋势', color: '#F9A825', unit: 'lux' },
  WindSpeed: { label: '风速趋势', color: '#2E7D32', unit: 'm/s' },
};

const DashboardPage = () => {
  // 状态
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<SparkPoint[]>([]);
  const [overview, setOverview] = useState<SparkOverview | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<SparkDeviceStatus | null>(null);
  const [chartData, setChartData] = useState<MergedChartData | null>(null);
  const [selectedChartType, setSelectedChartType] = useState('Temperature');
  const [chartLoading, setChartLoading] = useState(false);

  // 加载基础数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [pointsRes, overviewRes, deviceRes] = await Promise.all([
          getPoints(),
          getOverview(),
          getDeviceStatus(),
        ]);
        setPoints(pointsRes.points || []);
        setOverview(overviewRes);
        setDeviceStatus(deviceRes);
      } catch (e) {
        console.error('Dashboard load failed:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 加载趋势图数据
  const loadChartData = useCallback(async (sensorType: string) => {
    setChartLoading(true);
    try {
      const typePoints = points.filter((p) => p.type === sensorType);
      if (typePoints.length === 0) {
        setChartData(null);
        return;
      }

      // 取该类型的前 3 个测点做趋势
      const pointIds = typePoints.slice(0, 3).map((p) => p.point_id);
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const history = await getMultiPointHistory({
        point_ids: pointIds,
        start,
        end: now.toISOString(),
        granularity: 'hour',
        limit: 500,
      });

      // 按时间分组，取平均值
      const timeMap: Record<string, { sum: number; count: number }> = {};
      history.forEach((item) => {
        const t = item.record_time || '';
        if (!t) return;
        const val = item.avg_value ?? parseFloat(item.value || '0');
        // value 为 0 也是合法数据，只跳过非数字
        if (typeof val !== 'number' || isNaN(val)) return;
        if (!timeMap[t]) timeMap[t] = { sum: 0, count: 0 };
        timeMap[t].sum += val;
        timeMap[t].count += 1;
      });

      const data = Object.entries(timeMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-24)
        .map(([time, { sum, count }]) => ({
          time: time.substring(11, 16), // HH:mm
          value: parseFloat((sum / count).toFixed(1)),
          range: [0, 0] as [number, number],
        }));

      const cfg = chartTypeConfig[sensorType];
      setChartData({
        title: cfg.label,
        sensorType,
        unit: cfg.unit,
        lines: [{ dataKey: 'value', name: cfg.label, color: cfg.color }],
        data,
      });
    } catch (e) {
      console.error('Chart data load failed:', e);
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  }, [points]);

  // 初始加载 + 类型切换
  useEffect(() => {
    if (points.length > 0) {
      loadChartData(selectedChartType);
    }
  }, [points, selectedChartType, loadChartData]);

  // ==================== 按类型分组测点 ====================

  const pointGroups: PointGroup[] = groupConfig.map((cfg) => ({
    ...cfg,
    points: points.filter((p) => p.type === cfg.type),
  })).filter((g) => g.points.length > 0);

  // ==================== KPI ====================

  const isOnline = deviceStatus?.is_online ?? false;
  const lossRate = deviceStatus?.loss_rate ?? 0;
  const csq = overview?.gateway_csq ?? -1;

  const kpiData = [
    {
      title: '设备在线状态',
      icon: <DevicesIcon />,
      value: isOnline ? '在线' : '离线',
      unit: undefined,
      status: (isOnline ? 'normal' : 'danger') as KPIStatus,
      subtitle: lossRate > 0 ? `丢包率 ${(lossRate * 100).toFixed(1)}%` : '通信正常',
    },
    {
      title: '未处理告警',
      icon: <AlertIcon />,
      value: 0,
      unit: '条',
      status: 'normal' as KPIStatus,
      subtitle: '暂无待处理告警',
      href: '/alerts',
    },
    {
      title: '测点总数',
      icon: <SensorsIcon />,
      value: overview?.total_points ?? points.length,
      unit: '个',
      status: 'normal' as KPIStatus,
      subtitle: '环境监测点位',
    },
    {
      title: '离线设备',
      icon: <OfflineIcon />,
      value: isOnline ? 0 : 1,
      unit: '台',
      status: (isOnline ? 'normal' : 'danger') as KPIStatus,
      subtitle: isOnline ? '全部在线' : '设备离线',
    },
  ];

  // ==================== 渲染 ====================

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Row 1: KPIs */}
      {kpiData.map((kpi, idx) => (
        <Grid item xs={12} sm={6} md={3} key={idx}>
          <KPICard
            title={kpi.title}
            icon={kpi.icon}
            value={kpi.value}
            unit={kpi.unit}
            status={kpi.status}
            accentColor={['#2E7D32', '#1565C0', '#6A1B9A', '#E65100'][idx]}
            bgColor={['#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFF3E0'][idx]}
            subtitle={kpi.subtitle}
            href={(kpi as any).href}
          />
        </Grid>
      ))}

      {/* Row 2: 趋势图 */}
      <Grid item xs={12} lg={8} sx={{ height: 430 }}>
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, height: '100%', borderTop: '4px solid #2E7D32' }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Typography variant="h6" fontWeight={700}>24 小时趋势图</Typography>
            <Stack direction="row" spacing={0.5}>
              {Object.keys(chartTypeConfig).map((type) => (
                <Chip
                  key={type}
                  label={chartTypeConfig[type].label.replace('趋势', '')}
                  size="small"
                  variant={selectedChartType === type ? 'filled' : 'outlined'}
                  color={selectedChartType === type ? 'primary' : 'default'}
                  onClick={() => setSelectedChartType(type)}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Stack>
          {chartLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="calc(100% - 60px)">
              <CircularProgress size={32} />
            </Box>
          ) : chartData ? (
            <LineChart chartData={chartData} />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="calc(100% - 60px)">
              <Typography color="text.secondary">暂无数据</Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Row 2: 设备状态 */}
      <Grid item xs={12} lg={4}>
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, height: '100%', borderTop: '4px solid #E65100' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>设备通信状态</Typography>
          {deviceStatus ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">设备 ID</Typography>
                <Typography fontWeight={600}>{deviceStatus.device_id || 'PLC'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">网关 MAC</Typography>
                <Typography fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {deviceStatus.gateway_mac || '—'}
                </Typography>
              </Box>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">累计通信</Typography>
                  <Typography fontWeight={600}>{deviceStatus.comm_total_cnt?.toLocaleString() ?? 0} 次</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">失败次数</Typography>
                  <Typography fontWeight={600} color={deviceStatus.comm_fail_cnt > 0 ? 'error.main' : 'success.main'}>
                    {deviceStatus.comm_fail_cnt ?? 0}
                  </Typography>
                </Box>
              </Stack>
              <Box>
                <Typography variant="caption" color="text.secondary">最近通信</Typography>
                <Typography fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                  {deviceStatus.last_comm_time || '—'}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">暂无数据</Typography>
          )}
        </Paper>
      </Grid>

      {/* Row 3: 按类型分组展示测点 */}
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          测点概览
          <Chip label={`共 ${points.length} 个测点`} size="small" sx={{ ml: 1.5, backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32', fontWeight: 600 }} />
        </Typography>
      </Grid>

      {pointGroups.map((group) => (
        <Grid item xs={12} md={6} lg={4} key={group.type}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${group.chipColor}, ${group.chipColor}88)` }} />
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <Box sx={{ color: group.chipColor }}>{group.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700}>{group.type_name}</Typography>
                <Chip label={`${group.points.length} 个`} size="small" sx={{ backgroundColor: group.chipBg, color: group.chipColor, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={0.5}>
                {group.points.slice(0, 8).map((p) => (
                  <Stack key={p.point_id} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.point_name || p.point_id}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ ml: 1, color: group.chipColor }}>
                      {p.value} {group.unit}
                    </Typography>
                  </Stack>
                ))}
                {group.points.length > 8 && (
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    ... 还有 {group.points.length - 8} 个测点
                  </Typography>
                )}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardPage;
