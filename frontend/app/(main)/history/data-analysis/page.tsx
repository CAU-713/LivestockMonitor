'use client';

import React, { useState } from 'react';
import Grid from '@mui/material/GridLegacy';
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
} from '@mui/material';
import Image from 'next/image';
import {
  mockStatisticsSummary,
  mockCorrelationMatrix,
  mockCorrelationPValues,
  mockSheds,
} from '@/constants/mockData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Style for the modal content
const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 1, // Add a little padding
  outline: 'none',
};

const DataAnalysisPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [shed, setShed] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const handleOpenModal = (imgSrc: string) => {
    setSelectedImage(imgSrc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const allVariables = mockStatisticsSummary.map((s) => s.variable);
  const correlationVariables = Object.keys(mockCorrelationMatrix);
  const displayedStatistics = selectedVariables.length
    ? mockStatisticsSummary.filter((s) => selectedVariables.includes(s.variable))
    : mockStatisticsSummary;
  const displayedCorrelationVariables = selectedVariables.length
    ? correlationVariables.filter((v) => selectedVariables.includes(v))
    : correlationVariables; 

  const [pThreshold, setPThreshold] = useState<number>(0.05);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  const generateReport = () => {
  const vars = selectedVariables.length > 0 ? selectedVariables : allVariables;
  const now = new Date().toLocaleString();

  // 1. 统计信息整理
  const statsMap = new Map(
    mockStatisticsSummary.map(s => [s.variable, s])
  );

  
  // 2. 核心结论（Executive Summary）

  const riskVars: string[] = [];
  const highVarVars: string[] = [];

  vars.forEach(v => {
    const s = statsMap.get(v);
    if (!s) return;
    const relStd = s.mean !== 0 ? s.std / Math.abs(s.mean) : 0;
    if (relStd > 0.2) highVarVars.push(v);

    const low = v.toLowerCase();
    if (
      (low.includes('temp') && (s.mean > 25 || s.mean < 18)) ||
      (low.includes('humidity') && (s.mean > 70 || s.mean < 40)) ||
      (low.includes('nh3') && s.mean > 20) ||
      (low.includes('co2') && s.mean > 1000)
    ) {
      riskVars.push(v);
    }
  });

  // 3. 相关性分析
  const corrPairs: {
    a: string;
    b: string;
    r: number;
    p: number;
  }[] = [];

  for (let i = 0; i < vars.length; i++) {
    for (let j = i + 1; j < vars.length; j++) {
      const a = vars[i];
      const b = vars[j];
      const r = mockCorrelationMatrix[a]?.[b] ?? mockCorrelationMatrix[b]?.[a];
      const p = mockCorrelationPValues[a]?.[b] ?? mockCorrelationPValues[b]?.[a];
      if (r !== undefined && p !== undefined) {
        corrPairs.push({ a, b, r, p });
      }
    }
  }

  const significantCorr = corrPairs
    .filter(p => p.p <= pThreshold)
    .sort((x, y) => Math.abs(y.r) - Math.abs(x.r));

  // 4. 报表生成


  const report = `
数据分析报告
生成时间：${now}


一、核心结论
${riskVars.length > 0
    ? `部分环境变量（${riskVars.join('、')}）偏离正常范围，可能对畜舍环境稳定性与动物健康产生不利影响。`
    : `整体环境指标处于合理区间，未发现明显超限风险。`
}
${highVarVars.length > 0
    ? `部分变量（${highVarVars.join('、')}）波动性较大，在后续建模与监测中需重点关注其稳定性。`
    : `各变量整体波动性可控，时序表现较为平稳。`
}
${significantCorr.length > 0
    ? `检测到 ${significantCorr.length} 对显著相关关系（p ≤ ${pThreshold}），表明环境变量之间存在一定联动变化特征。`
    : `未发现显著变量相关关系，变量间相对独立。`
}


二、数据与变量说明
分析变量包括：${vars.join('、')}。
统计结果基于当前选定畜舍与时间区间生成。


三、关键统计特征分析
${vars.map(v => {
  const s = statsMap.get(v);
  return s
    ? `${v}：均值=${s.mean.toFixed(2)}，标准差=${s.std.toFixed(2)}，最小值=${s.min}，最大值=${s.max}`
    : `${v}：无统计数据`;
}).join('\n')}


四、变量诊断分析
${vars.map(v => {
  const s = statsMap.get(v);
  if (!s) return `${v}：无数据，无法分析。`;
  const relStd = s.mean !== 0 ? s.std / Math.abs(s.mean) : 0;
  let msg = '';

  const low = v.toLowerCase();
  if (low.includes('temp')) {
    msg = s.mean > 25
      ? '温度偏高，存在热应激风险'
      : s.mean < 18
        ? '温度偏低，存在低温风险'
        : '温度处于合理范围';
  } else if (low.includes('humidity')) {
    msg = s.mean > 70
      ? '湿度偏高，可能诱发健康问题'
      : s.mean < 40
        ? '湿度偏低，需关注干燥影响'
        : '湿度水平适中';
  } else if (low.includes('nh3')) {
    msg = s.mean > 20
      ? '氨气浓度偏高，需加强通风与清洁管理'
      : '氨气浓度处于可接受范围';
  } else if (low.includes('co2')) {
    msg = s.mean > 1000
      ? 'CO₂ 浓度偏高，提示通风不足'
      : 'CO₂ 浓度正常';
  } else {
    msg = relStd > 0.2
      ? '波动性较大，可能存在周期性或异常事件'
      : '数值表现稳定';
  }

  return `${v}：${msg}（均值=${s.mean.toFixed(2)}，标准差=${s.std.toFixed(2)}）`;
}).join('\n')}


五、变量相关性与潜在机制分析
${significantCorr.length > 0
    ? significantCorr.map(p => {
        const direction = p.r > 0 ? '正相关' : '负相关';
        return `${p.a} 与 ${p.b} 呈显著${direction}（r=${p.r.toFixed(2)}, p=${p.p.toFixed(3)}），
可能与通风条件、环境调控或动物活动强度等共同因素有关。`;
      }).join('\n')
    : '未检测到显著相关关系。'
}


六、时序特性与建模建议
ACF 图显示部分变量可能存在趋势或周期性特征。
建议在建模前：
- 对关键变量进行平稳性检验
- 对非平稳序列执行差分处理
- 在预测模型中考虑日周期或环境调控因素


七、风险提示与管理建议
${riskVars.length > 0
    ? riskVars.map((v, i) => `${i + 1}. 建议重点监测 ${v}，并结合通风、降温或清洁措施进行调控。`).join('\n')
    : '当前未发现需立即干预的环境风险。'
}

`;

  setReportText(report.trim());
  setReportOpen(true);
};

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-analysis-report-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---------------- Data Modeling State & Helpers ----------------
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

  // simple seeded RNG (mulberry32)
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
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      // Box-Muller for normal
      const u1 = rnd() || 1e-9;
      const u2 = rnd() || 1e-9;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      out.push(mean + z0 * Math.max(std, 0.0001));
    }
    return out;
  };

  // linear algebra helpers for small matrices
  const transpose = (A: number[][]) => A[0].map((_, c) => A.map((r) => r[c]));
  const mul = (A: number[][], B: number[][]) => A.map((r) => transpose(B).map((c) => r.reduce((s, v, i) => s + v * c[i], 0)));
  const addEye = (A: number[][], lambda: number) => A.map((r, i) => r.map((v, j) => v + (i === j ? lambda : 0)));

  // solve linear system using normal equations: beta = (X'X + lambda I)^{-1} X'y
  const solveNormal = (X: number[][], y: number[], lambda = 0) => {
    const Xt = transpose(X);
    const XtX = mul(Xt, X);
    const XtXreg = addEye(XtX, lambda);
    // invert XtXreg (small n) using Gauss-Jordan
    const n = XtXreg.length;
    const M = XtXreg.map((r) => r.slice());
    const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
    // augment
    for (let i = 0; i < n; i++) M[i] = M[i].concat(I[i]);
    // gauss-jordan
    for (let i = 0; i < n; i++) {
      let pivot = M[i][i];
      if (Math.abs(pivot) < 1e-12) {
        // find non-zero pivot
        for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(pivot)) (pivot = M[r][i]);
      }
      if (Math.abs(pivot) < 1e-12) continue;
      for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;
      for (let r = 0; r < n; r++) if (r !== i) {
        const factor = M[r][i];
        for (let j = 0; j < 2 * n; j++) M[r][j] -= factor * M[i][j];
      }
    }
    const inv = M.map((r) => r.slice(n));
    const Xty = Xt.map((row) => row.reduce((s, v, i) => s + v * y[i], 0));
    const beta = inv.map((row) => row.reduce((s, v, i) => s + v * Xty[i], 0));
    return beta;
  };

  const metrics = (y: number[], yhat: number[]) => {
    const n = y.length;
    const mean = y.reduce((s, v) => s + v, 0) / n;
    const ssRes = y.reduce((s, v, i) => s + Math.pow(v - yhat[i], 2), 0);
    const ssTot = y.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
    const r2 = 1 - ssRes / (ssTot || 1);
    const mse = ssRes / n;
    const mae = y.reduce((s, v, i) => s + Math.abs(v - yhat[i]), 0) / n;
    return { r2, mse, mae };
  };

  // Get unit for a variable by heuristic
  const getUnit = (v: string) => {
    const s = v.toLowerCase();
    if (s.includes('tem') || s.includes('temp')) return '°C';
    if (s.includes('rh') || s.includes('humidity')) return '%';
    if (s.includes('co2')) return 'ppm';
    if (s.includes('nh3')) return 'ppm';
    if (s.includes('pm')) return 'µg/m³';
    if (s.includes('ammonia')) return 'ppm';
    return '';
  };

  const runModel = () => {
    if (!modelDependent || modelIndependents.length === 0) {
      setModelResults({ error: '请选择因变量与至少一个自变量' });
      return;
    }
    const n = 100;
    const rnd = seededRandom(modelSeed || 42);

    // generate synthetic series for each variable using mockStatisticsSummary
    const series: Record<string, number[]> = {};
    [...new Set([modelDependent, ...modelIndependents])].forEach((v) => {
      const s = mockStatisticsSummary.find((m) => m.variable === v);
      const mean = s ? s.mean : 0;
      const std = s ? s.std || 1 : 1;
      series[v] = sampleSeries(mean, std || 1, n, rnd);
    });

    // build X and y
    const X: number[][] = [];
    const y: number[] = series[modelDependent];
    for (let i = 0; i < n; i++) {
      const row = [1]; // intercept
      modelIndependents.forEach((v) => row.push(series[v][i]));
      X.push(row);
    }

    let beta: number[] = [];
    let yhat: number[] = [];
    if (modelMethod === 'OLS') {
      beta = solveNormal(X, y, 0);
      yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
    } else if (modelMethod === 'Ridge') {
      beta = solveNormal(X, y, alpha);
      yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
    } else if (modelMethod === 'Lasso') {
      // approximate Lasso by shrinking small coefficients (mock)
      beta = solveNormal(X, y, alpha);
      beta = beta.map((b) => (Math.abs(b) < alpha * 0.5 ? 0 : b * 0.9));
      yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
    } else if (modelMethod === 'ElasticNet') {
      // combine L2 + soft-threshold L1 (mock)
      const lambda = alpha * (1 - l1Ratio);
      beta = solveNormal(X, y, lambda);
      const thresh = alpha * l1Ratio * 0.5;
      beta = beta.map((b) => {
        const sgn = Math.sign(b);
        return sgn * Math.max(0, Math.abs(b) - thresh);
      });
      yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
    } else if (modelMethod === 'GradientBoosting') {
      // simple additive boosting on residuals (mock)
      let yhatIter = Array(n).fill(y.reduce((s, v) => s + v, 0) / n);
      const sumBeta = Array(modelIndependents.length + 1).fill(0);
      for (let it = 0; it < nEstimators; it++) {
        const resid = y.map((yi, i) => yi - yhatIter[i]);
        const bi = solveNormal(X, resid, 0.1);
        // update predictions
        for (let i = 0; i < n; i++) {
          const inc = X[i].reduce((s, v, k) => s + v * bi[k], 0);
          yhatIter[i] += learningRate * inc;
        }
        for (let k = 0; k < sumBeta.length; k++) sumBeta[k] += learningRate * bi[k];
      }
      beta = sumBeta;
      yhat = yhatIter;
    } else if (modelMethod === 'RandomForest') {
      // mock RF: use linear model + random perturbation
      const base = solveNormal(X, y, 0.1);
      beta = base.map((b) => b * (0.8 + rnd() * 0.4));
      yhat = X.map((r) => {
        const mu = r.reduce((s, v, i) => s + v * beta[i], 0);
        return mu + (rnd() - 0.5) * Math.abs(mu) * 0.1;
      });
    } else if (modelMethod === 'SVR') {
      // epsilon-insensitive SVR (mock iterative re-fit)
      beta = solveNormal(X, y, 1 / Math.max(1, svrC));
      yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
      for (let iter = 0; iter < 3; iter++) {
        // targets: push predictions for residuals within epsilon to current prediction, else move target closer by epsilon
        const newTargets = y.map((yi, i) => {
          const r = yi - yhat[i];
          if (Math.abs(r) <= svrEps) return yhat[i];
          return yi - Math.sign(r) * svrEps;
        });
        beta = solveNormal(X, newTargets, 1 / Math.max(1, svrC));
        yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
      }
    }

    const met = metrics(y, yhat);

    // prepare plot data: if single independent, scatter (x vs y) with fitted line
    let plotData: any = null;
    if (modelIndependents.length === 1) {
      const x = series[modelIndependents[0]];
      const pts = x.map((xi, i) => ({ x: xi, y: y[i], yhat: yhat[i] }));
      // sort by x for line
      const sorted = pts.slice().sort((a, b) => a.x - b.x);
      plotData = { pts, sortedLine: sorted.map((p) => ({ x: p.x, y: p.yhat })) };
    } else {
      // predicted vs actual
      const pts = y.map((yi, i) => ({ x: yi, y: yhat[i] }));
      plotData = { pts, line: [{ x: Math.min(...y), y: Math.min(...y) }, { x: Math.max(...y), y: Math.max(...y) }] };
    }

    setModelResults({ method: modelMethod, beta, met, plotData, independents: modelIndependents, dependent: modelDependent });
  };

  const clearModel = () => {
    setModelIndependents([]);
    setModelDependent('');
    setModelMethod('OLS');
    setModelResults(null);
  };

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          数据分析
        </Typography>

        {/* Control Panel */}
        <Card component={Paper} elevation={2}>
          <CardHeader title={<Typography variant="h6">分析设置</Typography>} />
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems="center"
            >
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="shed-select-label">选择畜舍</InputLabel>
                <Select
                  labelId="shed-select-label"
                  id="shed-select"
                  value={shed}
                  label="选择畜舍"
                  onChange={(e) => setShed(e.target.value)}
                >
                  {mockSheds.map((shed) => (
                    <MenuItem key={shed.id} value={shed.id}>
                      {shed.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="variable-multi-select-label">选择数据</InputLabel>
                <Select
                  labelId="variable-multi-select-label"
                  id="variable-multi-select"
                  multiple
                  value={selectedVariables}
                  onChange={(e) =>
                    setSelectedVariables(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])
                  }
                  input={<OutlinedInput label="选择数据" />}
                  renderValue={(selected) =>
                    (selected as string[]).length > 0
                      ? (selected as string[]).join(', ')
                      : '全部'
                  }
                >
                  {allVariables.map((v) => (
                    <MenuItem key={v} value={v}>
                      <Checkbox checked={selectedVariables.indexOf(v) > -1} />
                      <ListItemText primary={v} />
                    </MenuItem>
                  ))}
                </Select>
                
              </FormControl>

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="开始日期"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="结束日期"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <Button variant="contained">开始分析</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Results Display */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="data analysis tabs"
            >
              <Tab label="描述性统计" id="analysis-tab-0" />
              <Tab label="相关性分析" id="analysis-tab-1" />
              <Tab label="平稳性分析 (ACF)" id="analysis-tab-2" />
              <Tab label="数据建模" id="analysis-tab-3" />
              <Tab label="生成数据分析报表" id="analysis-tab-4" />
            </Tabs>
          </Box>

          {/* Tab 1: Descriptive Statistics */}
          <TabPanel value={tabValue} index={0}>
            <Card component={Paper} elevation={2}>
              <CardHeader
                title={<Typography variant="h6">统计摘要</Typography>}
              />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>变量</TableCell>
                        <TableCell>均值</TableCell>
                        <TableCell>方差</TableCell>
                        <TableCell>标准差</TableCell>
                        <TableCell>最小值</TableCell>
                        <TableCell>最大值</TableCell>
                        <TableCell>计数</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedStatistics.map((row) => (
                        <TableRow key={row.variable}>
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{ fontWeight: 'medium' }}
                          >
                            {row.variable}
                          </TableCell>
                          <TableCell>{row.mean.toFixed(2)}</TableCell>
                          <TableCell>{row.variance.toFixed(2)}</TableCell>
                          <TableCell>{row.std.toFixed(2)}</TableCell>
                          <TableCell>{row.min}</TableCell>
                          <TableCell>{row.max}</TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 2: Correlation Analysis */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card component={Paper} elevation={2} sx={{ height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6">Pearson 相关系数矩阵</Typography>}
                  />
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <TextField
                        label="p 值阈值"
                        type="number"
                        inputProps={{ step: 0.001, min: 0, max: 1 }}
                        value={pThreshold}
                        onChange={(e) =>
                          setPThreshold(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))
                        }
                        sx={{ width: 160 }}
                      />
                      <Typography variant="caption">p ≤ 阈值时相关系数高亮</Typography>
                    </Stack>
                    <TableContainer component={Paper} sx={{ maxHeight: 450 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>变量</TableCell>
                            {displayedCorrelationVariables.map((v) => (
                              <TableCell key={v}>{v}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedCorrelationVariables.map((rowVar) => (
                            <TableRow key={rowVar}>
                              <TableCell
                                component="th"
                                scope="row"
                                sx={{ fontWeight: 'medium' }}
                              >
                                {rowVar}
                              </TableCell>
                              {displayedCorrelationVariables.map((colVar) => {
                                const coef = mockCorrelationMatrix[rowVar]?.[colVar];
                                const pval = mockCorrelationPValues[rowVar]?.[colVar];
                                const highlight = pval !== undefined && pval <= pThreshold;
                                return (
                                  <TableCell
                                    key={colVar}
                                    sx={highlight ? { color: 'error.main', fontWeight: 'bold' } : undefined}
                                  >
                                    {coef !== undefined ? coef.toFixed(2) : 'N/A'}
                                    
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 3: Stationarity Analysis (ACF) */}
          <TabPanel value={tabValue} index={2}>
            <Card component={Paper} elevation={2}>
              <CardHeader
                title={<Typography variant="h6">ACF 平稳性分析</Typography>}
              />
              <CardContent>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  当前分析变量：{selectedVariables.length > 0 ? selectedVariables.join(', ') : '全部'}
                </Typography>
                <Box
                  onClick={() => handleOpenModal('/acf_all_variables.png')}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 300, md: 400 },
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  <Image
                    src="/acf_all_variables.png"
                    alt="ACF Plot"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Modeling (Regression) */}
          <TabPanel value={tabValue} index={3}>
            <Card component={Paper} elevation={2}>
              <CardHeader title={<Typography variant="h6">数据建模</Typography>} />
              <CardContent>
                <Stack spacing={2}>
                  
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel id="independent-select-label">自变量（X）</InputLabel>
                      <Select
                        labelId="independent-select-label"
                        id="independent-select"
                        multiple
                        value={modelIndependents}
                        onChange={(e) => setModelIndependents(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                        input={<OutlinedInput label="自变量（X）" />}
                        renderValue={(selected) => (selected as string[]).join(', ')}
                      >
                        {allVariables.map((v) => (
                          <MenuItem key={v} value={v}>
                            <Checkbox checked={modelIndependents.indexOf(v) > -1} />
                            <ListItemText primary={v} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel id="dependent-select-label">因变量（Y）</InputLabel>
                      <Select
                        labelId="dependent-select-label"
                        id="dependent-select"
                        value={modelDependent}
                        label="因变量（Y）"
                        onChange={(e) => setModelDependent(e.target.value)}
                      >
                        {allVariables.map((v) => (
                          <MenuItem key={v} value={v}>{v}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 160 }}>
                      <InputLabel id="method-select-label">方法</InputLabel>
                      <Select
                        labelId="method-select-label"
                        id="method-select"
                        value={modelMethod}
                        label="方法"
                        onChange={(e) => setModelMethod(e.target.value)}
                      >
                        <MenuItem value="OLS">最小二乘回归</MenuItem>
                        <MenuItem value="Ridge">Ridge回归</MenuItem>
                        <MenuItem value="Lasso">Lasso回归</MenuItem>
                        <MenuItem value="ElasticNet">ElasticNet（L1+L2 近似）</MenuItem>
                        <MenuItem value="GradientBoosting">Gradient Boosting</MenuItem>
                        <MenuItem value="RandomForest">随机森林</MenuItem>
                        <MenuItem value="SVR">支持向量回归</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField label="随机种子" type="number" value={modelSeed} onChange={(e) => setModelSeed(parseInt(e.target.value || '0'))} sx={{ width: 140 }} />

                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    {(modelMethod === 'Ridge' || modelMethod === 'Lasso' || modelMethod === 'ElasticNet') && (
                      <>
                        <TextField label="alpha" type="number" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value || '0'))} sx={{ width: 120 }} />
                        {modelMethod === 'ElasticNet' && (
                          <TextField label="l1_ratio" type="number" inputProps={{ step: 0.05, min: 0, max: 1 }} value={l1Ratio} onChange={(e) => setL1Ratio(Math.max(0, Math.min(1, parseFloat(e.target.value || '0'))))} sx={{ width: 120 }} />
                        )}
                      </>
                    )}
                    {modelMethod === 'RandomForest' && (
                      <>
                        <TextField label="n_estimators" type="number" value={nEstimators} onChange={(e) => setNEstimators(parseInt(e.target.value || '0'))} sx={{ width: 140 }} />
                        <TextField label="max_depth" type="number" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value || '0'))} sx={{ width: 120 }} />
                      </>
                    )}

                    {modelMethod === 'GradientBoosting' && (
                      <>
                        <TextField label="n_estimators" type="number" value={nEstimators} onChange={(e) => setNEstimators(parseInt(e.target.value || '0'))} sx={{ width: 140 }} />
                        <TextField label="learning_rate" type="number" inputProps={{ step: 0.01, min: 0 }} value={learningRate} onChange={(e) => setLearningRate(parseFloat(e.target.value || '0'))} sx={{ width: 140 }} />
                        <TextField label="max_depth" type="number" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value || '0'))} sx={{ width: 120 }} />
                      </>
                    )}

                    {modelMethod === 'SVR' && (
                      <>
                        <TextField label="C" type="number" inputProps={{ step: 0.1, min: 0.001 }} value={svrC} onChange={(e) => setSvrC(parseFloat(e.target.value || '0'))} sx={{ width: 120 }} />
                        <TextField label="epsilon" type="number" inputProps={{ step: 0.01, min: 0 }} value={svrEps} onChange={(e) => setSvrEps(parseFloat(e.target.value || '0'))} sx={{ width: 120 }} />
                      </>
                    )}

                    <Stack direction="row" spacing={2} sx={{ ml: { md: 2 } }}>
                      <Button variant="contained" onClick={runModel}>运行建模</Button>
                      <Button variant="outlined" onClick={clearModel}>清空模型</Button>
                    </Stack>
                  </Stack>

                  {/* Results */}
                  {modelResults ? (
                    <Card component={Paper} elevation={1} sx={{ mt: 1 }}>
                      <CardContent>
                        {modelResults.error ? (
                          <Typography color="error">{modelResults.error}</Typography>
                        ) : (
                          <>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>模型结果（{modelResults.method}）</Typography>
                            <Stack spacing={2}>
                              {/* Centered Plot */}
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Box sx={{ border: '1px solid #eee', p: 1, mt: 1, width: '100%', maxWidth: 720 }}>
                                  {modelResults.plotData ? (
                                    (() => {
                                      const pd = modelResults.plotData;
                                      const width = 720; const height = 360; const pad = 56;
                                      const pts = pd.pts;

                                      // determine axis labels and units
                                      const xLabel = modelIndependents.length === 1 ? `${modelIndependents[0]}${getUnit(modelIndependents[0]) ? ' (' + getUnit(modelIndependents[0]) + ')' : ''}` : `${modelDependent} (实际)`;
                                      const yLabel = modelIndependents.length === 1 ? `${modelDependent}${getUnit(modelDependent) ? ' (' + getUnit(modelDependent) + ')' : ''}` : `${modelDependent} (预测)`;

                                      const xs = pts.map((p: any) => p.x);
                                      const ys = pts.map((p: any) => p.y);

                                      // include fitted values (if any) so axes cover both observed and predicted ranges
                                      const fittedXs = pd.sortedLine ? pd.sortedLine.map((p: any) => p.x) : (pd.line ? pd.line.map((p: any) => p.x) : []);
                                      const fittedYs = pd.sortedLine ? pd.sortedLine.map((p: any) => p.y) : (pd.line ? pd.line.map((p: any) => p.y) : []);

                                      const xMin = Math.min(...xs, ...(fittedXs.length ? fittedXs : [Infinity]));
                                      const xMax = Math.max(...xs, ...(fittedXs.length ? fittedXs : [-Infinity]));
                                      const yMin = Math.min(...ys, ...(fittedYs.length ? fittedYs : [Infinity]));
                                      const yMax = Math.max(...ys, ...(fittedYs.length ? fittedYs : [-Infinity]));

                                      // add small padding so lines/ticks don't touch edges
                                      const xRange = (xMax - xMin) || 1;
                                      const yRange = (yMax - yMin) || 1;
                                      const extraPad = 0.06;
                                      const axisXmin = xMin - xRange * extraPad;
                                      const axisXmax = xMax + xRange * extraPad;
                                      const axisYmin = yMin - yRange * extraPad;
                                      const axisYmax = yMax + yRange * extraPad;

                                      // use a larger left padding to leave space for y label outside ticks
                                      const leftPad = pad + 45;
                                      const scaleX = (v: number) => leftPad + ((v - axisXmin) / (axisXmax - axisXmin || 1)) * (width - leftPad - pad);
                                      const scaleY = (v: number) => height - pad - ((v - axisYmin) / (axisYmax - axisYmin || 1)) * (height - pad * 2);

                                      // ticks (based on expanded axis ranges)
                                      const ticks = 5;
                                      const xTicks = Array.from({ length: ticks }, (_, i) => axisXmin + (i / (ticks - 1)) * (axisXmax - axisXmin || 1));
                                      const yTicks = Array.from({ length: ticks }, (_, i) => axisYmin + (i / (ticks - 1)) * (axisYmax - axisYmin || 1));

                                      // legend position
                                      const legendX = width - pad - 160;
                                      const legendY = Math.max(18, pad / 2);

                                      return (
                                        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
                                          {/* axes */}
                                          <line x1={leftPad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#444" />
                                          <line x1={leftPad} y1={pad} x2={leftPad} y2={height - pad} stroke="#444" />

                                          {/* legend */}
                                          {pd.sortedLine ? (
                                            <g>
                                              <circle cx={legendX + 8} cy={legendY} r={5} fill="#1976d2" />
                                              <text x={legendX + 18} y={legendY + 4} fontSize={12}>观测值</text>
                                              <line x1={legendX + 90} y1={legendY} x2={legendX + 130} y2={legendY} stroke="#d32f2f" strokeWidth={2} />
                                              <text x={legendX + 140} y={legendY + 4} fontSize={12}>拟合值</text>
                                            </g>
                                          ) : (
                                            <g>
                                              <circle cx={legendX + 8} cy={legendY} r={5} fill="#1976d2" />
                                              <text x={legendX + 18} y={legendY + 4} fontSize={12}>实际值</text>
                                              <line x1={legendX + 90} y1={legendY} x2={legendX + 130} y2={legendY} stroke="#d32f2f" strokeWidth={2} strokeDasharray="4 2" />
                                              <text x={legendX + 140} y={legendY + 4} fontSize={12}>预测值</text>
                                            </g>
                                          )}

                                          {/* x ticks and labels */}
                                          {xTicks.map((t, i) => (
                                            <g key={i}>
                                              <line x1={scaleX(t)} y1={height - pad} x2={scaleX(t)} y2={height - pad + 6} stroke="#444" />
                                              <text x={scaleX(t)} y={height - pad + 18} fontSize={12} textAnchor="middle">{t.toFixed(2)}</text>
                                            </g>
                                          ))}

                                          {/* y ticks and labels */}
                                          {yTicks.map((t, i) => (
                                            <g key={i}>
                                              <line x1={leftPad - 6} y1={scaleY(t)} x2={leftPad} y2={scaleY(t)} stroke="#444" />
                                              <text x={leftPad - 14} y={scaleY(t) + 4} fontSize={12} textAnchor="end">{t.toFixed(2)}</text>
                                            </g>
                                          ))}

                                          {/* axis labels */}
                                          <text x={width / 2} y={height - 4} fontSize={13} textAnchor="middle" fill="#333">{xLabel}</text>
                                          {/* move y label outside of ticks to avoid overlap */}
                                          <text x={leftPad / 2} y={height / 2} fontSize={13} textAnchor="middle" transform={`rotate(-90 ${leftPad / 2} ${height / 2})`} fill="#333">{yLabel}</text>
                                          {/* points */}
                                          {pts.map((p: any, i: number) => (
                                            <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} fill="#1976d2" opacity={0.9} />
                                          ))}

                                          {/* fitted line when single X */}
                                              {pd.sortedLine ? (
                                            // fitted line for single-X case: use fitted yhat values included in axis range
                                            <polyline
                                              fill="none"
                                              stroke="#d32f2f"
                                              strokeWidth={2}
                                              points={pd.sortedLine.map((pt: any) => `${scaleX(pt.x)},${scaleY(pt.y)}`).join(' ')}
                                            />
                                          ) : (
                                            // predicted vs actual: draw diagonal y=x within the same scaling for x and y
                                            (() => {
                                              // ensure diagonal covers the union of observed and predicted ranges
                                              // extend diagonal across the union of axis ranges (including padding)
                                              const diagMin = Math.min(axisXmin, axisYmin);
                                              const diagMax = Math.max(axisXmax, axisYmax);
                                              return (
                                                <line
                                                  x1={scaleX(diagMin)}
                                                  y1={scaleY(diagMin)}
                                                  x2={scaleX(diagMax)}
                                                  y2={scaleY(diagMax)}
                                                  stroke="#d32f2f"
                                                  strokeWidth={2}
                                                  strokeDasharray="4 2"
                                                />
                                              );
                                            })()
                                          )}
                                        </svg>
                                      );
                                    })()
                                  ) : (
                                    <Typography variant="caption">无图形数据</Typography>
                                  )}
                                </Box>
                              </Box>

                              {/* Metrics & Coeffs below plot as tables */}
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                                  <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper', width: '100%' }}>
                                    <Table size="small" sx={{ height: '100%' }}>
                                      <TableHead>
                                        <TableRow>
                                          <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>评价指标</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>R²</TableCell>
                                          <TableCell align="right">{modelResults.met.r2.toFixed(3)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>MSE</TableCell>
                                          <TableCell align="right">{modelResults.met.mse.toFixed(3)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>MAE</TableCell>
                                          <TableCell align="right">{modelResults.met.mae.toFixed(3)}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Grid>

                                <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                                  <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper', width: '100%' }}>
                                    <Table size="small" sx={{ height: '100%' }}>
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 'bold' }}>系数（含截距）</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>值</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {modelResults.beta.map((b: number, i: number) => (
                                          <TableRow key={i}>
                                            <TableCell>{i === 0 ? 'Intercept' : modelResults.independents[i - 1]}</TableCell>
                                            <TableCell align="right">{b.toFixed(4)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Grid>
                              </Grid>
                            </Stack>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}

                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Card component={Paper} elevation={2}>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  报表基于当前选择的畜舍、时间区间与选择的数据属性生成简要分析结论。
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Button variant="contained" onClick={generateReport}>生成报表</Button>
                  <Button variant="outlined" onClick={() => { setReportText(''); setReportOpen(false); }}>清空</Button>
                  <Button variant="outlined" onClick={() => setReportOpen(true)}>查看报表</Button>
                  <Button variant="contained" onClick={downloadReport}>下载报表</Button>
                </Stack>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: 300, overflow: 'auto' }}>
                  {reportText || '请点击“生成报表”生成内容。'}
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

        </Box>
      </Stack>

      {/* Report Modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={reportOpen}>
          <Box sx={{ ...modalStyle, width: { xs: '90vw', md: 600 }, maxHeight: '80vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>数据分析报告</Typography>
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 13, mb: 2 }}>{reportText}</Box>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="contained" onClick={downloadReport}>下载报表</Button>
              <Button variant="outlined" onClick={() => setReportOpen(false)}>关闭</Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>

      {/* Image Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            <img
              src={selectedImage}
              alt="Enlarged view"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                maxHeight: 'calc(90vh - 16px)', // Adjust for padding (p:1 -> 8px * 2)
                objectFit: 'contain',
              }}
            />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default DataAnalysisPage;
