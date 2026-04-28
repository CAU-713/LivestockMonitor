'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import LineChart from '@/components/charts/LineChart';
import { animalApi, healthApi } from '@/lib/api/apiService';
import type { AnimalRecord, MergedChartData } from '@/types';

// ─── helpers ────────────────────────────────────────────────

interface TabPanelProps { children?: React.ReactNode; value: number; index: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

// ─── 体重录入弹窗 ────────────────────────────────────────────

function WeightFormDialog({ open, onClose, onSave, animalId }: { open: boolean; onClose: () => void; onSave: () => void; animalId: number }) {
  const [form, setForm] = useState({ record_date: new Date().toISOString().split('T')[0], weighing_time: '08:00:00', weight_kg: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.weight_kg || Number(form.weight_kg) <= 0) { setError('请输入有效体重'); return; }
    setSaving(true); setError(null);
    try {
      await healthApi.createWeightRecord({ animal_id: animalId, record_date: form.record_date, weighing_time: form.weighing_time, weight_kg: Number(form.weight_kg) });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>新增体重记录</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField size="small" type="date" label="测量日期" value={form.record_date} onChange={(e) => setForm(p => ({ ...p, record_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="time" label="测量时间" value={form.weighing_time.slice(0, 5)} onChange={(e) => setForm(p => ({ ...p, weighing_time: e.target.value + ':00' }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="number" label="体重 (kg)" value={form.weight_kg} onChange={(e) => setForm(p => ({ ...p, weight_kg: e.target.value }))} inputProps={{ min: 0, step: 0.1 }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 呼吸录入弹窗 ────────────────────────────────────────────

function RespirationFormDialog({ open, onClose, onSave, animalId }: { open: boolean; onClose: () => void; onSave: () => void; animalId: number }) {
  const [form, setForm] = useState({ record_date: new Date().toISOString().split('T')[0], monitoring_time: '08:00:00', respiratory_rate_per_minute: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.respiratory_rate_per_minute || Number(form.respiratory_rate_per_minute) <= 0) { setError('请输入有效呼吸频率'); return; }
    setSaving(true); setError(null);
    try {
      await healthApi.createRespirationRecord({ animal_id: animalId, record_date: form.record_date, monitoring_time: form.monitoring_time, respiratory_rate_per_minute: Number(form.respiratory_rate_per_minute) });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>新增呼吸记录</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField size="small" type="date" label="测量日期" value={form.record_date} onChange={(e) => setForm(p => ({ ...p, record_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="time" label="测量时间" value={form.monitoring_time.slice(0, 5)} onChange={(e) => setForm(p => ({ ...p, monitoring_time: e.target.value + ':00' }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="number" label="呼吸频率 (次/分钟)" value={form.respiratory_rate_per_minute} onChange={(e) => setForm(p => ({ ...p, respiratory_rate_per_minute: e.target.value }))} inputProps={{ min: 1 }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function AnimalHealthPage() {
  const params = useParams();
  const router = useRouter();
  const animalId = Number(params.id);

  const [animal, setAnimal] = useState<AnimalRecord | null>(null);
  const [tab, setTab] = useState(0);

  // 体重趋势
  const [weightTrend, setWeightTrend] = useState<MergedChartData | null>(null);
  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [weightTotal, setWeightTotal] = useState(0);
  const [weightLoading, setWeightLoading] = useState(false);

  // 体温记录
  const [tempRecords, setTempRecords] = useState<any[]>([]);
  const [tempTotal, setTempTotal] = useState(0);
  const [tempLoading, setTempLoading] = useState(false);

  // 呼吸记录
  const [respRecords, setRespRecords] = useState<any[]>([]);
  const [respTotal, setRespTotal] = useState(0);
  const [respLoading, setRespLoading] = useState(false);

  // 弹窗
  const [weightFormOpen, setWeightFormOpen] = useState(false);
  const [respFormOpen, setRespFormOpen] = useState(false);

  // 加载动物信息
  useEffect(() => {
    if (!animalId) return;
    animalApi.getAnimal(animalId).then(setAnimal).catch(console.error);
  }, [animalId]);

  // 加载体重数据
  const loadWeight = useCallback(async () => {
    if (!animalId) return;
    setWeightLoading(true);
    try {
      const [trend, records] = await Promise.all([
        healthApi.getWeightTrend(animalId),
        healthApi.getWeightRecords({ animal_id: animalId, page_size: 50 }),
      ]);

      // 构造折线图数据
      const chartData: MergedChartData = {
        title: '体重趋势',
        sensorType: 'Mixed',
        unit: 'kg',
        lines: [{ dataKey: 'weight_kg', name: '体重', color: '#2E7D32' }],
        data: (trend.data || []).map((d: any) => ({ time: d.date, weight_kg: d.weight_kg })),
      };
      setWeightTrend(chartData);
      setWeightRecords(records.items || []);
      setWeightTotal(records.total || 0);
    } catch (e) { console.error(e); } finally { setWeightLoading(false); }
  }, [animalId]);

  // 加载体温数据
  const loadTemp = useCallback(async () => {
    if (!animalId) return;
    setTempLoading(true);
    try {
      const res = await healthApi.getTemperatureRecords({ animal_id: animalId, page_size: 50 });
      setTempRecords(res.items || []);
      setTempTotal(res.total || 0);
    } catch (e) { console.error(e); } finally { setTempLoading(false); }
  }, [animalId]);

  // 加载呼吸数据
  const loadResp = useCallback(async () => {
    if (!animalId) return;
    setRespLoading(true);
    try {
      const res = await healthApi.getRespirationRecords({ animal_id: animalId, page_size: 50 });
      setRespRecords(res.items || []);
      setRespTotal(res.total || 0);
    } catch (e) { console.error(e); } finally { setRespLoading(false); }
  }, [animalId]);

  useEffect(() => {
    loadWeight();
    loadTemp();
    loadResp();
  }, [loadWeight, loadTemp, loadResp]);

  const healthLabel: Record<string, string> = { good: '健康', ill: '异常', under_treatment: '治疗中', removal: '已出栏' };
  const healthColor: Record<string, any> = { good: 'success', ill: 'error', under_treatment: 'warning', removal: 'default' };

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        {/* 页头 */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>返回</Button>
          <Box sx={{ borderLeft: '4px solid #2E7D32', pl: 1.5 }}>
            <Typography variant="h5" fontWeight={700}>
              {animal ? `${animal.name} 健康档案` : <Skeleton width={200} />}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {animal ? `${animal.breed} · ${animal.gender === 'female' ? '母' : '公'} · ${animal.age}月龄` : ''}
              {animal && (
                <Chip size="small" sx={{ ml: 1 }} label={healthLabel[animal.health_status] || animal.health_status} color={healthColor[animal.health_status] || 'default'} />
              )}
            </Typography>
          </Box>
        </Stack>

        {/* Tab 页 */}
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label="体重记录" />
            <Tab label="体温记录" />
            <Tab label="呼吸记录" />
          </Tabs>

          {/* 体重 Tab */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>体重趋势图</Typography>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setWeightFormOpen(true)}>新增记录</Button>
              </Stack>

              {weightLoading ? (
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1 }} />
              ) : weightTrend && weightTrend.data.length > 0 ? (
                <LineChart chartData={weightTrend} />
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">暂无体重记录</Typography>
                </Box>
              )}

              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>历史记录（共 {weightTotal} 条）</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>日期</TableCell>
                      <TableCell>时间</TableCell>
                      <TableCell>体重 (kg)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {weightRecords.map((r: any) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.record_date}</TableCell>
                        <TableCell>{r.weighing_time}</TableCell>
                        <TableCell><strong>{r.weight_kg}</strong> kg</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* 体温 Tab */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>体温记录（共 {tempTotal} 条）</Typography>
              </Stack>
              {tempLoading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                        <TableCell>日期</TableCell>
                        <TableCell>时间</TableCell>
                        <TableCell>耳部(℃)</TableCell>
                        <TableCell>背部(℃)</TableCell>
                        <TableCell>臀部(℃)</TableCell>
                        <TableCell>平均体表(℃)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tempRecords.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><Typography color="text.secondary">暂无体温记录</Typography></TableCell></TableRow>
                      ) : tempRecords.map((r: any) => (
                        <TableRow key={r.id} hover>
                          <TableCell>{r.record_date}</TableCell>
                          <TableCell>{r.measurement_time}</TableCell>
                          <TableCell>{r.ear_temperature}</TableCell>
                          <TableCell>{r.dorsal_midline_temperature}</TableCell>
                          <TableCell>{r.hip_temperature}</TableCell>
                          <TableCell><strong>{r.average_body_surface_temperature}</strong></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          {/* 呼吸 Tab */}
          <TabPanel value={tab} index={2}>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>呼吸记录（共 {respTotal} 条）</Typography>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setRespFormOpen(true)}>新增记录</Button>
              </Stack>
              {respLoading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                        <TableCell>日期</TableCell>
                        <TableCell>时间</TableCell>
                        <TableCell>呼吸频率 (次/分钟)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {respRecords.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }}><Typography color="text.secondary">暂无呼吸记录</Typography></TableCell></TableRow>
                      ) : respRecords.map((r: any) => (
                        <TableRow key={r.id} hover>
                          <TableCell>{r.record_date}</TableCell>
                          <TableCell>{r.monitoring_time}</TableCell>
                          <TableCell><strong>{r.respiratory_rate_per_minute}</strong> 次/分</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Stack>

      {/* 弹窗 */}
      <WeightFormDialog open={weightFormOpen} onClose={() => setWeightFormOpen(false)} onSave={loadWeight} animalId={animalId} />
      <RespirationFormDialog open={respFormOpen} onClose={() => setRespFormOpen(false)} onSave={loadResp} animalId={animalId} />
    </Container>
  );
}
