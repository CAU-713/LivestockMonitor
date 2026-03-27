'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  TextField,
  Modal,
  Backdrop,
  Fade,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Grid,
} from '@mui/material';
import Image from 'next/image';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import TimelineIcon from '@mui/icons-material/Timeline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArticleIcon from '@mui/icons-material/Article';
import {
  mockStatisticsSummary,
  mockCorrelationMatrix,
  mockCorrelationPValues,
  mockSheds,
} from '@/constants/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = '#2E7D32';
const ACCENT_LIGHT = 'rgba(46,125,50,0.08)';
const ACCENT_MED = 'rgba(46,125,50,0.15)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </div>
  );
}

/** 变量状态判断 */
const getVarStatus = (v: string, mean: number): 'normal' | 'warning' | 'danger' => {
  const low = v.toLowerCase();
  if (low.includes('temp') || low.includes('temperature')) {
    if (mean > 28 || mean < 15) return 'danger';
    if (mean > 25 || mean < 18) return 'warning';
  }
  if (low.includes('humidity') || low.includes('rh')) {
    if (mean > 80 || mean < 30) return 'danger';
    if (mean > 70 || mean < 40) return 'warning';
  }
  if (low.includes('nh3') || low.includes('ammonia')) {
    if (mean > 30) return 'danger';
    if (mean > 20) return 'warning';
  }
  if (low.includes('co2')) {
    if (mean > 1500) return 'danger';
    if (mean > 1000) return 'warning';
  }
  if (low.includes('pm')) {
    if (mean > 75) return 'danger';
    if (mean > 50) return 'warning';
  }
  return 'normal';
};

const statusConfig = {
  normal: { color: ACCENT, bg: '#E8F5E9', label: '正常', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  warning: { color: '#F57C00', bg: '#FFF3E0', label: '偏高', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
  danger: { color: '#E53935', bg: '#FFEBEE', label: '异常', icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
};

/** 相关系数单元格背景色 */
const getCorrBg = (r: number | undefined): string => {
  if (r === undefined) return 'transparent';
  if (r >= 0.7) return 'rgba(46,125,50,0.22)';
  if (r >= 0.4) return 'rgba(46,125,50,0.10)';
  if (r <= -0.7) return 'rgba(229,57,53,0.18)';
  if (r <= -0.4) return 'rgba(245,124,0,0.10)';
  return 'transparent';
};

/** 相关系数文字颜色 */
const getCorrColor = (r: number | undefined): string => {
  if (r === undefined) return 'text.secondary';
  if (r >= 0.7) return '#1B5E20';
  if (r >= 0.4) return '#2E7D32';
  if (r <= -0.7) return '#B71C1C';
  if (r <= -0.4) return '#E65100';
  return 'text.primary';
};

// Modal style
const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 1,
  outline: 'none',
  borderRadius: 2,
};

// ─── Main Component ────────────────────────────────────────────────────────────
const DataAnalysisPage = () => {
  const { isGuest } = useAuth();
  const router = useRouter();

  // 访客模式禁止访问数据分析页
  useEffect(() => {
    if (isGuest) {
      router.replace('/dashboard');
    }
  }, [isGuest, router]);

  const [tabValue, setTabValue] = useState(0);
  const [shed, setShed] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [pThreshold, setPThreshold] = useState<number>(0.05);
  const [reportText, setReportText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  // Modeling state
  const [modelIndependents, setModelIndependents] = useState<string[]>([]);
  const [modelDependent, setModelDependent] = useState<string>('');
  const [modelMethod, setModelMethod] = useState<string>('OLS');
  const [modelSeed, setModelSeed] = useState<number>(42);
  const [alpha, setAlpha] = useState<number>(1);
  const [l1Ratio, setL1Ratio] = useState<number>(0.5);
  const [nEstimators, setNEstimators] = useState<number>(100);
  const [learningRate, setLearningRate] = useState<number>(0.1);
  const [maxDepth, setMaxDepth] = useState<number>(5);
  const [svrC, setSvrC] = useState<number>(1);
  const [svrEps, setSvrEps] = useState<number>(0.1);
  const [modelResults, setModelResults] = useState<any>(null);

  const allVariables = mockStatisticsSummary.map((s) => s.variable);
  const correlationVariables = Object.keys(mockCorrelationMatrix);
  const displayedStatistics = selectedVariables.length
    ? mockStatisticsSummary.filter((s) => selectedVariables.includes(s.variable))
    : mockStatisticsSummary;
  const displayedCorrelationVariables = selectedVariables.length
    ? correlationVariables.filter((v) => selectedVariables.includes(v))
    : correlationVariables;

  // Significant correlation pairs
  const allCorrPairs = (() => {
    const pairs: { a: string; b: string; r: number; p: number }[] = [];
    const vars = displayedCorrelationVariables;
    for (let i = 0; i < vars.length; i++) {
      for (let j = i + 1; j < vars.length; j++) {
        const a = vars[i]; const b = vars[j];
        const r = mockCorrelationMatrix[a]?.[b] ?? mockCorrelationMatrix[b]?.[a];
        const p = mockCorrelationPValues[a]?.[b] ?? mockCorrelationPValues[b]?.[a];
        if (r !== undefined && p !== undefined) pairs.push({ a, b, r, p });
      }
    }
    return pairs.filter((p) => p.p <= pThreshold).sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  })();

  // ─── Report Generation ──────────────────────────────────────────────────────
  const generateReport = () => {
    const vars = selectedVariables.length > 0 ? selectedVariables : allVariables;
    const now = new Date().toLocaleString();
    const statsMap = new Map(mockStatisticsSummary.map((s) => [s.variable, s]));
    const riskVars: string[] = [];
    const highVarVars: string[] = [];
    vars.forEach((v) => {
      const s = statsMap.get(v);
      if (!s) return;
      const relStd = s.mean !== 0 ? s.std / Math.abs(s.mean) : 0;
      if (relStd > 0.2) highVarVars.push(v);
      const low = v.toLowerCase();
      if ((low.includes('temp') && (s.mean > 25 || s.mean < 18)) ||
        (low.includes('humidity') && (s.mean > 70 || s.mean < 40)) ||
        (low.includes('nh3') && s.mean > 20) || (low.includes('co2') && s.mean > 1000))
        riskVars.push(v);
    });
    const corrPairs: { a: string; b: string; r: number; p: number }[] = [];
    for (let i = 0; i < vars.length; i++) {
      for (let j = i + 1; j < vars.length; j++) {
        const a = vars[i]; const b = vars[j];
        const r = mockCorrelationMatrix[a]?.[b] ?? mockCorrelationMatrix[b]?.[a];
        const p = mockCorrelationPValues[a]?.[b] ?? mockCorrelationPValues[b]?.[a];
        if (r !== undefined && p !== undefined) corrPairs.push({ a, b, r, p });
      }
    }
    const significantCorr = corrPairs.filter((p) => p.p <= pThreshold).sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
    const report = `数据分析报告\n生成时间：${now}\n\n一、核心结论\n${riskVars.length > 0 ? `部分环境变量（${riskVars.join('、')}）偏离正常范围。` : `整体环境指标处于合理区间。`}\n${highVarVars.length > 0 ? `部分变量（${highVarVars.join('、')}）波动性较大。` : `各变量整体波动性可控。`}\n${significantCorr.length > 0 ? `检测到 ${significantCorr.length} 对显著相关关系（p ≤ ${pThreshold}）。` : `未发现显著变量相关关系。`}\n\n二、数据与变量说明\n分析变量包括：${vars.join('、')}。\n\n三、关键统计特征分析\n${vars.map((v) => { const s = statsMap.get(v); return s ? `${v}：均值=${s.mean.toFixed(2)}，标准差=${s.std.toFixed(2)}，最小值=${s.min}，最大值=${s.max}` : `${v}：无统计数据`; }).join('\n')}\n\n四、变量相关性\n${significantCorr.length > 0 ? significantCorr.map((p) => `${p.a} 与 ${p.b} 呈${p.r > 0 ? '正' : '负'}相关（r=${p.r.toFixed(2)}, p=${p.p.toFixed(3)}）`).join('\n') : '未检测到显著相关关系。'}\n\n五、风险提示\n${riskVars.length > 0 ? riskVars.map((v, i) => `${i + 1}. 建议重点监测 ${v}，并结合通风、降温或清洁措施进行调控。`).join('\n') : '当前未发现需立即干预的环境风险。'}`;
    setReportText(report.trim());
  };

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-analysis-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ─── Modeling Helpers ────────────────────────────────────────────────────────
  function seededRandom(seed: number) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sampleSeries = (mean: number, std: number, n: number, rnd: () => number) => {
    return Array.from({ length: n }, () => {
      const u1 = rnd() || 1e-9; const u2 = rnd() || 1e-9;
      return mean + Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * Math.max(std, 0.0001);
    });
  };
  const transpose = (A: number[][]) => A[0].map((_, c) => A.map((r) => r[c]));
  const mul = (A: number[][], B: number[][]) => A.map((r) => transpose(B).map((c) => r.reduce((s, v, i) => s + v * c[i], 0)));
  const addEye = (A: number[][], lambda: number) => A.map((r, i) => r.map((v, j) => v + (i === j ? lambda : 0)));
  const solveNormal = (X: number[][], y: number[], lambda = 0) => {
    const Xt = transpose(X);
    const M = addEye(mul(Xt, X), lambda).map((r) => r.slice());
    const n = M.length;
    const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
    for (let i = 0; i < n; i++) M[i] = M[i].concat(I[i]);
    for (let i = 0; i < n; i++) {
      let pivot = M[i][i];
      if (Math.abs(pivot) < 1e-12) for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(pivot)) pivot = M[r][i];
      if (Math.abs(pivot) < 1e-12) continue;
      for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;
      for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[i][j]; }
    }
    const inv = M.map((r) => r.slice(n));
    const Xty = Xt.map((row) => row.reduce((s, v, i) => s + v * y[i], 0));
    return inv.map((row) => row.reduce((s, v, i) => s + v * Xty[i], 0));
  };
  const calcMetrics = (y: number[], yhat: number[]) => {
    const n = y.length;
    const mean = y.reduce((s, v) => s + v, 0) / n;
    const ssRes = y.reduce((s, v, i) => s + Math.pow(v - yhat[i], 2), 0);
    const ssTot = y.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
    return { r2: 1 - ssRes / (ssTot || 1), mse: ssRes / n, mae: y.reduce((s, v, i) => s + Math.abs(v - yhat[i]), 0) / n };
  };
  const getUnit = (v: string) => {
    const s = v.toLowerCase();
    if (s.includes('tem') || s.includes('temp')) return '°C';
    if (s.includes('rh') || s.includes('humidity')) return '%';
    if (s.includes('co2') || s.includes('nh3') || s.includes('ammonia')) return 'ppm';
    if (s.includes('pm')) return 'µg/m³';
    return '';
  };

  const runModel = () => {
    if (!modelDependent || modelIndependents.length === 0) {
      setModelResults({ error: '请选择因变量与至少一个自变量' }); return;
    }
    const n = 100;
    const rnd = seededRandom(modelSeed || 42);
    const series: Record<string, number[]> = {};
    [...new Set([modelDependent, ...modelIndependents])].forEach((v) => {
      const s = mockStatisticsSummary.find((m) => m.variable === v);
      series[v] = sampleSeries(s ? s.mean : 0, s ? s.std || 1 : 1, n, rnd);
    });
    const X: number[][] = Array.from({ length: n }, (_, i) => [1, ...modelIndependents.map((v) => series[v][i])]);
    const y = series[modelDependent];
    let beta: number[], yhat: number[];
    if (modelMethod === 'OLS') { beta = solveNormal(X, y); yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0)); }
    else if (modelMethod === 'Ridge') { beta = solveNormal(X, y, alpha); yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0)); }
    else if (modelMethod === 'Lasso') { beta = solveNormal(X, y, alpha).map((b) => (Math.abs(b) < alpha * 0.5 ? 0 : b * 0.9)); yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0)); }
    else if (modelMethod === 'ElasticNet') { const lam = alpha * (1 - l1Ratio); beta = solveNormal(X, y, lam).map((b) => { const sg = Math.sign(b); return sg * Math.max(0, Math.abs(b) - alpha * l1Ratio * 0.5); }); yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0)); }
    else if (modelMethod === 'GradientBoosting') { let yh = Array(n).fill(y.reduce((s, v) => s + v, 0) / n); const sb = Array(modelIndependents.length + 1).fill(0); for (let it = 0; it < nEstimators; it++) { const bi = solveNormal(X, y.map((yi, i) => yi - yh[i]), 0.1); for (let i = 0; i < n; i++) yh[i] += learningRate * X[i].reduce((s, v, k) => s + v * bi[k], 0); for (let k = 0; k < sb.length; k++) sb[k] += learningRate * bi[k]; } beta = sb; yhat = yh; }
    else if (modelMethod === 'RandomForest') { const base = solveNormal(X, y, 0.1); beta = base.map((b) => b * (0.8 + rnd() * 0.4)); yhat = X.map((r) => { const mu = r.reduce((s, v, i) => s + v * beta[i], 0); return mu + (rnd() - 0.5) * Math.abs(mu) * 0.1; }); }
    else { beta = solveNormal(X, y, 1 / Math.max(1, svrC)); yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0)); for (let it = 0; it < 3; it++) { const nt = y.map((yi, i) => { const res = yi - yhat[i]; return Math.abs(res) <= svrEps ? yhat[i] : yi - Math.sign(res) * svrEps; }); beta = solveNormal(X, nt, 1 / Math.max(1, svrC)); yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0)); } }
    const met = calcMetrics(y, yhat);
    let plotData: any = null;
    if (modelIndependents.length === 1) {
      const x = series[modelIndependents[0]];
      const pts = x.map((xi, i) => ({ x: xi, y: y[i] }));
      const sorted = pts.slice().sort((a, b) => a.x - b.x);
      plotData = { pts, sortedLine: sorted.map((p, i) => ({ x: p.x, y: yhat[pts.indexOf(p) !== -1 ? pts.indexOf(p) : i] })) };
    } else {
      plotData = { pts: y.map((yi, i) => ({ x: yi, y: yhat[i] })), line: [{ x: Math.min(...y), y: Math.min(...y) }, { x: Math.max(...y), y: Math.max(...y) }] };
    }
    setModelResults({ method: modelMethod, beta, met, plotData, independents: modelIndependents, dependent: modelDependent });
  };

  const clearModel = () => { setModelIndependents([]); setModelDependent(''); setModelMethod('OLS'); setModelResults(null); };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Stack spacing={3}>
        {/* ── 页面标题 ── */}
        <Box>
          <Box sx={{ borderLeft: `4px solid ${ACCENT}`, pl: 1.5, py: 0.5 }}>
            <Typography variant="h5" fontWeight={700}>数据分析</Typography>
            <Typography variant="body2" color="text.secondary">基于历史传感器数据的统计分析与建模</Typography>
          </Box>
        </Box>

        {/* ── 分析设置面板 ── */}
        <Paper elevation={2} sx={{ borderTop: `4px solid ${ACCENT}`, borderRadius: 2 }}>
          <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">分析设置</Typography>
          </Box>
          <Box sx={{ px: 2.5, pb: 2.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel id="shed-select-label">选择畜舍</InputLabel>
                <Select labelId="shed-select-label" value={shed} label="选择畜舍" onChange={(e) => setShed(e.target.value)}>
                  <MenuItem value=""><em>全部畜舍</em></MenuItem>
                  {mockSheds.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel id="variable-multi-select-label">选择分析变量</InputLabel>
                <Select
                  labelId="variable-multi-select-label"
                  multiple
                  value={selectedVariables}
                  onChange={(e) => setSelectedVariables(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                  input={<OutlinedInput label="选择分析变量" />}
                  renderValue={(selected) => (selected as string[]).length > 0 ? `已选 ${(selected as string[]).length} 个变量` : '全部变量'}
                >
                  {allVariables.map((v) => (
                    <MenuItem key={v} value={v}>
                      <Checkbox checked={selectedVariables.indexOf(v) > -1} size="small" />
                      <ListItemText primary={v} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField label="开始日期" type="date" size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="结束日期" type="date" size="small" InputLabelProps={{ shrink: true }} />

              <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} sx={{ ml: { md: 'auto' } }}>
                开始分析
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* ── Tabs ── */}
        <Box sx={{ width: '100%' }}>
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: ACCENT_LIGHT }}>
              <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                aria-label="data analysis tabs"
                sx={{
                  '& .MuiTab-root': { minHeight: 52, fontWeight: 600, fontSize: '0.85rem', textTransform: 'none' },
                  '& .Mui-selected': { color: `${ACCENT} !important`, fontWeight: 700 },
                }}
              >
                <Tab icon={<BarChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="描述性统计" id="analysis-tab-0" />
                <Tab icon={<ScatterPlotIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="相关性分析" id="analysis-tab-1" />
                <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="平稳性 ACF" id="analysis-tab-2" />
                <Tab icon={<PsychologyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="数据建模" id="analysis-tab-3" />
                <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="生成报表" id="analysis-tab-4" />
              </Tabs>
            </Box>

            <Box sx={{ p: 2.5 }}>

              {/* ════════════════════════════════════════════════════════
                  Tab 0: 描述性统计
              ════════════════════════════════════════════════════════ */}
              <TabPanel value={tabValue} index={0}>
                <Stack spacing={3}>
                  {/* 变量状态摘要卡片行 */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                      变量健康状态一览
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {displayedStatistics.map((row) => {
                        const st = getVarStatus(row.variable, row.mean);
                        const cfg = statusConfig[st];
                        return (
                          <Paper
                            key={row.variable}
                            elevation={0}
                            sx={{
                              px: 2, py: 1.5,
                              borderLeft: `4px solid ${cfg.color}`,
                              backgroundColor: cfg.bg,
                              borderRadius: 2,
                              minWidth: 140,
                              flex: '1 1 140px',
                              maxWidth: 200,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                              {row.variable}
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: cfg.color, lineHeight: 1.2, my: 0.5 }}>
                              {row.mean.toFixed(1)}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{getUnit(row.variable)}</Typography>
                            </Typography>
                            <Chip
                              icon={cfg.icon}
                              label={cfg.label}
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', backgroundColor: `${cfg.color}22`, color: cfg.color, fontWeight: 700, '& .MuiChip-icon': { color: cfg.color } }}
                            />
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>

                  <Divider />

                  {/* 统计摘要表格 */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>详细统计摘要</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { backgroundColor: ACCENT_LIGHT, fontWeight: 700, fontSize: '0.82rem' } }}>
                            <TableCell>变量</TableCell>
                            <TableCell align="right">均值</TableCell>
                            <TableCell align="right">方差</TableCell>
                            <TableCell align="right">标准差</TableCell>
                            <TableCell align="right">最小值</TableCell>
                            <TableCell align="right">最大值</TableCell>
                            <TableCell align="right">计数</TableCell>
                            <TableCell align="center">状态</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedStatistics.map((row) => {
                            const st = getVarStatus(row.variable, row.mean);
                            const cfg = statusConfig[st];
                            const highVar = row.mean !== 0 && row.std / Math.abs(row.mean) > 0.2;
                            return (
                              <TableRow key={row.variable} sx={{ '&:hover': { backgroundColor: ACCENT_LIGHT } }}>
                                <TableCell sx={{ fontWeight: 600 }}>{row.variable}</TableCell>
                                <TableCell align="right" sx={{ color: st !== 'normal' ? cfg.color : 'text.primary', fontWeight: st !== 'normal' ? 700 : 400 }}>{row.mean.toFixed(2)}</TableCell>
                                <TableCell align="right">{row.variance.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ color: highVar ? '#F57C00' : 'text.primary', fontWeight: highVar ? 700 : 400 }}>
                                  <Tooltip title={highVar ? '波动性偏高（std/mean > 20%）' : ''}>
                                    <span>{row.std.toFixed(2)}{highVar ? ' ⚠' : ''}</span>
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="right">{row.min}</TableCell>
                                <TableCell align="right">{row.max}</TableCell>
                                <TableCell align="right">{row.count}</TableCell>
                                <TableCell align="center">
                                  <Chip label={cfg.label} size="small" sx={{ height: 20, fontSize: '0.68rem', backgroundColor: `${cfg.color}22`, color: cfg.color, fontWeight: 700 }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Stack>
              </TabPanel>

              {/* ════════════════════════════════════════════════════════
                  Tab 1: 相关性分析
              ════════════════════════════════════════════════════════ */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  {/* 相关矩阵热图 */}
                  <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700}>Pearson 相关系数矩阵</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" color="text.secondary">p 值阈值：</Typography>
                          <TextField
                            type="number"
                            size="small"
                            inputProps={{ step: 0.01, min: 0, max: 1 }}
                            value={pThreshold}
                            onChange={(e) => setPThreshold(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                            sx={{ width: 90 }}
                          />
                        </Stack>
                      </Stack>

                      {/* 色阶说明 */}
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
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>* p ≤ 阈值（显著）</Typography>
                      </Stack>

                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 460, overflow: 'auto' }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: ACCENT_LIGHT, fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' } }}>
                              <TableCell sx={{ minWidth: 100 }}>变量</TableCell>
                              {displayedCorrelationVariables.map((v) => (
                                <TableCell key={v} align="center" sx={{ minWidth: 72 }}>{v}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {displayedCorrelationVariables.map((rowVar) => (
                              <TableRow key={rowVar}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{rowVar}</TableCell>
                                {displayedCorrelationVariables.map((colVar) => {
                                  const coef = mockCorrelationMatrix[rowVar]?.[colVar];
                                  const pval = mockCorrelationPValues[rowVar]?.[colVar];
                                  const sig = pval !== undefined && pval <= pThreshold;
                                  const isIdentity = rowVar === colVar;
                                  return (
                                    <TableCell
                                      key={colVar}
                                      align="center"
                                      sx={{
                                        backgroundColor: isIdentity ? ACCENT_MED : getCorrBg(coef),
                                        color: isIdentity ? ACCENT : getCorrColor(coef),
                                        fontWeight: sig || isIdentity ? 700 : 400,
                                        fontSize: '0.78rem',
                                      }}
                                    >
                                      {isIdentity ? '1.00' : coef !== undefined ? `${coef.toFixed(2)}${sig ? '*' : ''}` : '—'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Stack>
                  </Grid>

                  {/* 显著相关对摘要 */}
                  <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        显著相关对（p ≤ {pThreshold}）
                      </Typography>
                      {allCorrPairs.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                          <Typography variant="body2" color="text.secondary">未检测到显著相关对</Typography>
                        </Box>
                      ) : (
                        <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                          {allCorrPairs.map((pair, idx) => {
                            const isPos = pair.r > 0;
                            const strength = Math.abs(pair.r);
                            const color = isPos ? (strength >= 0.7 ? '#1B5E20' : '#2E7D32') : (strength >= 0.7 ? '#B71C1C' : '#E65100');
                            return (
                              <Box key={idx} sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: isPos ? `rgba(46,125,50,0.06)` : `rgba(229,57,53,0.06)`, border: `1px solid ${isPos ? 'rgba(46,125,50,0.15)' : 'rgba(229,57,53,0.15)'}` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ fontSize: '0.72rem' }}>
                                    {pair.a} ↔ {pair.b}
                                  </Typography>
                                  <Chip label={isPos ? '正相关' : '负相关'} size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: `${color}20`, color, fontWeight: 700 }} />
                                </Stack>
                                <Stack direction="row" spacing={1} mt={0.5}>
                                  <Typography variant="caption" sx={{ color, fontWeight: 700 }}>r = {pair.r.toFixed(3)}</Typography>
                                  <Typography variant="caption" color="text.secondary">p = {pair.p.toFixed(3)}</Typography>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* ════════════════════════════════════════════════════════
                  Tab 2: 平稳性 ACF
              ════════════════════════════════════════════════════════ */}
              <TabPanel value={tabValue} index={2}>
                <Stack spacing={2.5}>
                  <Alert severity="info" icon={<TipsAndUpdatesIcon />} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>ACF 自相关函数图说明</Typography>
                    <Typography variant="body2">
                      自相关函数（ACF）用于判断时间序列的平稳性。蓝色区域为 95% 置信区间，超出区域的滞后阶表示存在显著自相关，提示该序列可能存在趋势或周期性，建议在建模前进行差分处理。
                    </Typography>
                  </Alert>

                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>ACF 平稳性分析图</Typography>
                        <Typography variant="caption" color="text.secondary">
                          当前分析变量：{selectedVariables.length > 0 ? selectedVariables.join(', ') : '全部变量'}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<ZoomInIcon sx={{ fontSize: '14px !important' }} />}
                        label="点击放大"
                        size="small"
                        variant="outlined"
                        onClick={() => { setSelectedImage('/acf_all_variables.png'); setModalOpen(true); }}
                        sx={{ cursor: 'pointer', borderColor: ACCENT, color: ACCENT, fontSize: '0.72rem' }}
                      />
                    </Stack>
                    <Box
                      onClick={() => { setSelectedImage('/acf_all_variables.png'); setModalOpen(true); }}
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: { xs: 280, md: 400 },
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        '&:hover': { opacity: 0.92 },
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <Image src="/acf_all_variables.png" alt="ACF Plot" fill style={{ objectFit: 'contain' }} />
                    </Box>
                  </Paper>
                </Stack>
              </TabPanel>

              {/* ════════════════════════════════════════════════════════
                  Tab 3: 数据建模
              ════════════════════════════════════════════════════════ */}
              <TabPanel value={tabValue} index={3}>
                <Stack spacing={2.5}>
                  {/* 变量与方法选择 */}
                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>模型配置</Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                      <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel id="independent-select-label">自变量（X）</InputLabel>
                        <Select labelId="independent-select-label" multiple value={modelIndependents}
                          onChange={(e) => setModelIndependents(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                          input={<OutlinedInput label="自变量（X）" />}
                          renderValue={(selected) => `${(selected as string[]).length} 个变量`}>
                          {allVariables.map((v) => (
                            <MenuItem key={v} value={v}><Checkbox checked={modelIndependents.indexOf(v) > -1} size="small" /><ListItemText primary={v} /></MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl sx={{ minWidth: 180 }} size="small">
                        <InputLabel id="dependent-select-label">因变量（Y）</InputLabel>
                        <Select labelId="dependent-select-label" value={modelDependent} label="因变量（Y）" onChange={(e) => setModelDependent(e.target.value)}>
                          {allVariables.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                      </FormControl>

                      <FormControl sx={{ minWidth: 180 }} size="small">
                        <InputLabel id="method-select-label">建模方法</InputLabel>
                        <Select labelId="method-select-label" value={modelMethod} label="建模方法" onChange={(e) => setModelMethod(e.target.value)}>
                          <MenuItem value="OLS">最小二乘回归</MenuItem>
                          <MenuItem value="Ridge">Ridge 回归</MenuItem>
                          <MenuItem value="Lasso">Lasso 回归</MenuItem>
                          <MenuItem value="ElasticNet">ElasticNet</MenuItem>
                          <MenuItem value="GradientBoosting">Gradient Boosting</MenuItem>
                          <MenuItem value="RandomForest">随机森林</MenuItem>
                          <MenuItem value="SVR">支持向量回归</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField label="随机种子" type="number" value={modelSeed} size="small" onChange={(e) => setModelSeed(parseInt(e.target.value || '0'))} sx={{ width: 120 }} />
                    </Stack>

                    {/* 动态超参数 */}
                    {(modelMethod !== 'OLS') && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                          模型超参数
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          {(modelMethod === 'Ridge' || modelMethod === 'Lasso' || modelMethod === 'ElasticNet') && (
                            <TextField label="alpha" type="number" size="small" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value || '0'))} sx={{ width: 120 }} />
                          )}
                          {modelMethod === 'ElasticNet' && (
                            <TextField label="l1_ratio" type="number" size="small" inputProps={{ step: 0.05, min: 0, max: 1 }} value={l1Ratio} onChange={(e) => setL1Ratio(Math.max(0, Math.min(1, parseFloat(e.target.value || '0'))))} sx={{ width: 120 }} />
                          )}
                          {(modelMethod === 'RandomForest' || modelMethod === 'GradientBoosting') && (
                            <>
                              <TextField label="n_estimators" type="number" size="small" value={nEstimators} onChange={(e) => setNEstimators(parseInt(e.target.value || '0'))} sx={{ width: 130 }} />
                              <TextField label="max_depth" type="number" size="small" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value || '0'))} sx={{ width: 120 }} />
                            </>
                          )}
                          {modelMethod === 'GradientBoosting' && (
                            <TextField label="learning_rate" type="number" size="small" inputProps={{ step: 0.01, min: 0 }} value={learningRate} onChange={(e) => setLearningRate(parseFloat(e.target.value || '0'))} sx={{ width: 130 }} />
                          )}
                          {modelMethod === 'SVR' && (
                            <>
                              <TextField label="C" type="number" size="small" inputProps={{ step: 0.1, min: 0.001 }} value={svrC} onChange={(e) => setSvrC(parseFloat(e.target.value || '0'))} sx={{ width: 110 }} />
                              <TextField label="epsilon" type="number" size="small" inputProps={{ step: 0.01, min: 0 }} value={svrEps} onChange={(e) => setSvrEps(parseFloat(e.target.value || '0'))} sx={{ width: 120 }} />
                            </>
                          )}
                        </Stack>
                      </Box>
                    )}

                    <Stack direction="row" spacing={2} sx={{ mt: 2.5 }} justifyContent="flex-end">
                      <Button variant="outlined" onClick={clearModel}>清空模型</Button>
                      <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={runModel}>运行建模</Button>
                    </Stack>
                  </Paper>

                  {/* 模型结果 */}
                  {modelResults && (
                    <Paper elevation={0} sx={{ border: `1px solid ${modelResults.error ? '#FFCDD2' : ACCENT + '40'}`, borderTop: `4px solid ${modelResults.error ? '#E53935' : ACCENT}`, borderRadius: 2, p: 2.5 }}>
                      {modelResults.error ? (
                        <Alert severity="error" sx={{ borderRadius: 1 }}>{modelResults.error}</Alert>
                      ) : (
                        <Stack spacing={2.5}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography variant="subtitle2" fontWeight={700}>模型结果</Typography>
                            <Chip label={modelResults.method} size="small" sx={{ backgroundColor: ACCENT_LIGHT, color: ACCENT, fontWeight: 700 }} />
                            {/* R² 质量标签 */}
                            {(() => {
                              const r2 = modelResults.met.r2;
                              const r2cfg = r2 >= 0.8
                                ? { label: '拟合优良', color: ACCENT, bg: '#E8F5E9' }
                                : r2 >= 0.5
                                  ? { label: '拟合一般', color: '#F57C00', bg: '#FFF3E0' }
                                  : { label: '拟合较差', color: '#E53935', bg: '#FFEBEE' };
                              return <Chip label={r2cfg.label} size="small" sx={{ backgroundColor: r2cfg.bg, color: r2cfg.color, fontWeight: 700 }} />;
                            })()}
                          </Stack>

                          {/* SVG 图表 */}
                          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, backgroundColor: '#fafafa', overflow: 'hidden' }}>
                            {(() => {
                              const pd = modelResults.plotData;
                              const W = 720, H = 360, PAD = 56, LPAD = PAD + 45;
                              const pts = pd.pts;
                              const xs = pts.map((p: any) => p.x), ys = pts.map((p: any) => p.y);
                              const fxs = pd.sortedLine ? pd.sortedLine.map((p: any) => p.x) : (pd.line ? pd.line.map((p: any) => p.x) : []);
                              const fys = pd.sortedLine ? pd.sortedLine.map((p: any) => p.y) : (pd.line ? pd.line.map((p: any) => p.y) : []);
                              const xMin = Math.min(...xs, ...(fxs.length ? fxs : [Infinity]));
                              const xMax = Math.max(...xs, ...(fxs.length ? fxs : [-Infinity]));
                              const yMin = Math.min(...ys, ...(fys.length ? fys : [Infinity]));
                              const yMax = Math.max(...ys, ...(fys.length ? fys : [-Infinity]));
                              const xR = (xMax - xMin) || 1, yR = (yMax - yMin) || 1, ep = 0.06;
                              const ax0 = xMin - xR * ep, ax1 = xMax + xR * ep, ay0 = yMin - yR * ep, ay1 = yMax + yR * ep;
                              const sx = (v: number) => LPAD + ((v - ax0) / (ax1 - ax0 || 1)) * (W - LPAD - PAD);
                              const sy = (v: number) => H - PAD - ((v - ay0) / (ay1 - ay0 || 1)) * (H - PAD * 2);
                              const xTicks = Array.from({ length: 5 }, (_, i) => ax0 + (i / 4) * (ax1 - ax0 || 1));
                              const yTicks = Array.from({ length: 5 }, (_, i) => ay0 + (i / 4) * (ay1 - ay0 || 1));
                              const xLabel = modelResults.independents.length === 1
                                ? `${modelResults.independents[0]}${getUnit(modelResults.independents[0]) ? ' (' + getUnit(modelResults.independents[0]) + ')' : ''}`
                                : `${modelResults.dependent} (实际)`;
                              const yLabel = modelResults.independents.length === 1
                                ? `${modelResults.dependent}${getUnit(modelResults.dependent) ? ' (' + getUnit(modelResults.dependent) + ')' : ''}`
                                : `${modelResults.dependent} (预测)`;
                              const LX = W - PAD - 180, LY = Math.max(18, PAD / 2);
                              return (
                                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: 'inherit' }}>
                                  <line x1={LPAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#bbb" />
                                  <line x1={LPAD} y1={PAD} x2={LPAD} y2={H - PAD} stroke="#bbb" />
                                  {/* Grid lines */}
                                  {yTicks.map((t, i) => (
                                    <line key={i} x1={LPAD} y1={sy(t)} x2={W - PAD} y2={sy(t)} stroke="#eee" strokeDasharray="3 3" />
                                  ))}
                                  {/* Legend */}
                                  <g>
                                    <circle cx={LX + 8} cy={LY} r={5} fill={ACCENT} opacity={0.85} />
                                    <text x={LX + 18} y={LY + 4} fontSize={12} fill="#555">{pd.sortedLine ? '观测值' : '实际值'}</text>
                                    <line x1={LX + 90} y1={LY} x2={LX + 130} y2={LY} stroke="#E65100" strokeWidth={2} strokeDasharray={pd.sortedLine ? undefined : "4 2"} />
                                    <text x={LX + 140} y={LY + 4} fontSize={12} fill="#555">{pd.sortedLine ? '拟合值' : '预测值'}</text>
                                  </g>
                                  {xTicks.map((t, i) => (
                                    <g key={i}>
                                      <line x1={sx(t)} y1={H - PAD} x2={sx(t)} y2={H - PAD + 5} stroke="#999" />
                                      <text x={sx(t)} y={H - PAD + 17} fontSize={11} textAnchor="middle" fill="#666">{t.toFixed(1)}</text>
                                    </g>
                                  ))}
                                  {yTicks.map((t, i) => (
                                    <g key={i}>
                                      <line x1={LPAD - 5} y1={sy(t)} x2={LPAD} y2={sy(t)} stroke="#999" />
                                      <text x={LPAD - 10} y={sy(t) + 4} fontSize={11} textAnchor="end" fill="#666">{t.toFixed(1)}</text>
                                    </g>
                                  ))}
                                  <text x={W / 2} y={H - 5} fontSize={12} textAnchor="middle" fill="#555">{xLabel}</text>
                                  <text x={LPAD / 2 - 6} y={H / 2} fontSize={12} textAnchor="middle" transform={`rotate(-90 ${LPAD / 2 - 6} ${H / 2})`} fill="#555">{yLabel}</text>
                                  {pts.map((p: any, i: number) => (
                                    <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={ACCENT} opacity={0.75} />
                                  ))}
                                  {pd.sortedLine ? (
                                    <polyline fill="none" stroke="#E65100" strokeWidth={2.5} points={pd.sortedLine.map((pt: any) => `${sx(pt.x)},${sy(pt.y)}`).join(' ')} />
                                  ) : (() => {
                                    const dm = Math.min(ax0, ay0), dM = Math.max(ax1, ay1);
                                    return <line x1={sx(dm)} y1={sy(dm)} x2={sx(dM)} y2={sy(dM)} stroke="#E65100" strokeWidth={2} strokeDasharray="5 3" />;
                                  })()}
                                </svg>
                              );
                            })()}
                          </Box>

                          {/* 指标表格 */}
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 5 }}>
                              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ '& th': { backgroundColor: ACCENT_LIGHT, fontWeight: 700 } }}>
                                      <TableCell colSpan={2}>评价指标</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {[
                                      { label: 'R²（决定系数）', value: modelResults.met.r2.toFixed(4), highlight: true },
                                      { label: 'MSE（均方误差）', value: modelResults.met.mse.toFixed(4), highlight: false },
                                      { label: 'MAE（平均绝对误差）', value: modelResults.met.mae.toFixed(4), highlight: false },
                                    ].map((row) => (
                                      <TableRow key={row.label} sx={{ '&:hover': { backgroundColor: ACCENT_LIGHT } }}>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell align="right" sx={row.highlight ? { fontWeight: 700, color: ACCENT, fontSize: '1rem' } : {}}>
                                          {row.value}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Grid>
                            <Grid size={{ xs: 12, md: 7 }}>
                              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ '& th': { backgroundColor: ACCENT_LIGHT, fontWeight: 700 } }}>
                                      <TableCell>系数（含截距）</TableCell>
                                      <TableCell align="right">值</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {modelResults.beta.map((b: number, i: number) => (
                                      <TableRow key={i} sx={{ '&:hover': { backgroundColor: ACCENT_LIGHT } }}>
                                        <TableCell sx={{ fontWeight: i === 0 ? 400 : 500 }}>{i === 0 ? 'Intercept' : modelResults.independents[i - 1]}</TableCell>
                                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{b.toFixed(5)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Grid>
                          </Grid>
                        </Stack>
                      )}
                    </Paper>
                  )}
                </Stack>
              </TabPanel>

              {/* ════════════════════════════════════════════════════════
                  Tab 4: 生成报表
              ════════════════════════════════════════════════════════ */}
              <TabPanel value={tabValue} index={4}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>数据分析报告</Typography>
                      <Typography variant="body2" color="text.secondary">基于当前选择的畜舍、时间区间与变量生成智能分析结论</Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                      <Button variant="contained" color="primary" startIcon={<ArticleIcon />} onClick={generateReport}>生成报表</Button>
                      <Button variant="outlined" onClick={downloadReport} disabled={!reportText}>下载报表</Button>
                      <Button variant="outlined" color="error" onClick={() => setReportText('')} disabled={!reportText}>清空</Button>
                    </Stack>
                  </Stack>

                  {!reportText ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
                      <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">点击&ldquo;生成报表&rdquo;按钮生成分析报告</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {/* 解析报表各章节为 Accordion */}
                      {reportText.split('\n\n').filter(Boolean).map((section, idx) => {
                        const lines = section.split('\n').filter(Boolean);
                        const title = lines[0] || '章节';
                        const content = lines.slice(1).join('\n');
                        if (!content) return (
                          <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                          </Paper>
                        );
                        const isTitleSection = ['数据分析报告', '生成时间'].some((k) => title.includes(k));
                        if (isTitleSection) return (
                          <Paper key={idx} elevation={0} sx={{ px: 2.5, py: 2, borderTop: `4px solid ${ACCENT}`, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight={700}>{title}</Typography>
                            <Typography variant="body2" color="text.secondary">{content}</Typography>
                          </Paper>
                        );

                        const isRisk = title.includes('风险');
                        const accentColor = isRisk ? '#E53935' : ACCENT;
                        return (
                          <Accordion key={idx} defaultExpanded={idx <= 2} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' }, borderLeft: `4px solid ${accentColor}` }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, '& .MuiAccordionSummary-content': { my: '10px' } }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ color: accentColor }}>{title}</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                                {content}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              </TabPanel>

            </Box>
          </Paper>
        </Box>
      </Stack>

      {/* ── 图片放大 Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 400 } }}>
        <Fade in={modalOpen}>
          <Box sx={{ ...modalStyle, width: 'auto' }}>
            <img src={selectedImage} alt="Enlarged view" style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 'calc(90vh - 16px)', objectFit: 'contain' }} />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default DataAnalysisPage;
