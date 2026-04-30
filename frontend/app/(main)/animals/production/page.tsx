'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Paper, Typography, Stack, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Alert, Skeleton, Chip, Select, MenuItem, FormControl, InputLabel, Card, CardContent,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { productionApi, animalApi, SlaughterRecord, MortalityRecord, ProductionStats } from '@/lib/api/apiService';
import type { AnimalRecord } from '@/types';

// ─── helpers ────────────────────────────────────────────────
interface TabPanelProps { children?: React.ReactNode; value: number; index: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}
const TODAY = new Date().toISOString().split('T')[0];

// ─── Stats Cards ─────────────────────────────────────────────
function StatsCards({ stats, loading }: { stats: ProductionStats | null; loading: boolean }) {
  const cards = [
    { label: '本月出栏', value: loading ? '...' : stats?.month_slaughter_count ?? 0, unit: '头', color: '#2e7d32' },
    { label: '本月死亡', value: loading ? '...' : stats?.month_mortality_count ?? 0, unit: '头', color: '#c62828' },
    { label: '本月收入', value: loading ? '...' : `¥${((stats?.month_total_revenue ?? 0) / 10000).toFixed(2)}万`, unit: '', color: '#1565c0' },
    { label: '死亡率', value: loading ? '...' : `${((stats?.mortality_rate ?? 0) * 100).toFixed(1)}%`, unit: '', color: '#e65100' },
  ];
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((c) => (
        <Grid item xs={6} sm={3} key={c.label}>
          <Card elevation={2} sx={{ borderRadius: 2, borderTop: `3px solid ${c.color}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: c.color }}>{c.value}</Typography>
              {c.unit && <Typography variant="caption" color="text.secondary">{c.unit}</Typography>}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── 出栏录入弹窗 ─────────────────────────────────────────────
function SlaughterFormDialog({ open, onClose, onSave, animals }: { open: boolean; onClose: () => void; onSave: () => void; animals: AnimalRecord[] }) {
  const [form, setForm] = useState({
    animal_id: '', slaughter_date: TODAY, slaughter_weight_kg: '',
    price_per_kg: '', buyer: '', destination: '', operator: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ animal_id: '', slaughter_date: TODAY, slaughter_weight_kg: '', price_per_kg: '', buyer: '', destination: '', operator: '', notes: '' });
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.animal_id) { setError('请选择动物'); return; }
    setSaving(true); setError(null);
    try {
      await productionApi.createSlaughter({
        animal_id: Number(form.animal_id),
        slaughter_date: form.slaughter_date,
        slaughter_weight_kg: form.slaughter_weight_kg ? Number(form.slaughter_weight_kg) : undefined,
        price_per_kg: form.price_per_kg ? Number(form.price_per_kg) : undefined,
        buyer: form.buyer || undefined,
        destination: form.destination || undefined,
        operator: form.operator || undefined,
        notes: form.notes || undefined,
      });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增出栏记录</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>选择动物*</InputLabel>
            <Select value={form.animal_id} label="选择动物*" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, animal_id: e.target.value }))}>
              {animals.map(a => <MenuItem key={a.id} value={a.id}>{a.name} ({a.breed})</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="出栏日期*" value={form.slaughter_date} onChange={(e) => setForm(p => ({ ...p, slaughter_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="number" label="出栏体重 (kg)" value={form.slaughter_weight_kg} onChange={(e) => setForm(p => ({ ...p, slaughter_weight_kg: e.target.value }))} inputProps={{ min: 0, step: 0.1 }} />
          <TextField size="small" type="number" label="单价 (元/kg)" value={form.price_per_kg} onChange={(e) => setForm(p => ({ ...p, price_per_kg: e.target.value }))} inputProps={{ min: 0, step: 0.1 }} />
          <TextField size="small" label="买家" value={form.buyer} onChange={(e) => setForm(p => ({ ...p, buyer: e.target.value }))} />
          <TextField size="small" label="目的地" value={form.destination} onChange={(e) => setForm(p => ({ ...p, destination: e.target.value }))} />
          <TextField size="small" label="操作人员" value={form.operator} onChange={(e) => setForm(p => ({ ...p, operator: e.target.value }))} />
          <TextField size="small" label="备注" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 死亡录入弹窗 ─────────────────────────────────────────────
function MortalityFormDialog({ open, onClose, onSave, animals }: { open: boolean; onClose: () => void; onSave: () => void; animals: AnimalRecord[] }) {
  const [form, setForm] = useState({
    animal_id: '', death_date: TODAY, cause: '', disposal_method: '',
    vet_confirmation: false, loss_amount: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ animal_id: '', death_date: TODAY, cause: '', disposal_method: '', vet_confirmation: false, loss_amount: '', notes: '' });
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.animal_id) { setError('请选择动物'); return; }
    setSaving(true); setError(null);
    try {
      await productionApi.createMortality({
        animal_id: Number(form.animal_id),
        death_date: form.death_date,
        cause: form.cause || undefined,
        disposal_method: form.disposal_method || undefined,
        vet_confirmation: form.vet_confirmation,
        loss_amount: form.loss_amount ? Number(form.loss_amount) : undefined,
        notes: form.notes || undefined,
      });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增死亡记录</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>选择动物*</InputLabel>
            <Select value={form.animal_id} label="选择动物*" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, animal_id: e.target.value }))}>
              {animals.map(a => <MenuItem key={a.id} value={a.id}>{a.name} ({a.breed})</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="死亡日期*" value={form.death_date} onChange={(e) => setForm(p => ({ ...p, death_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="死亡原因" value={form.cause} onChange={(e) => setForm(p => ({ ...p, cause: e.target.value }))} />
          <FormControl size="small" fullWidth>
            <InputLabel>处置方式</InputLabel>
            <Select value={form.disposal_method} label="处置方式" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, disposal_method: e.target.value }))}>
              <MenuItem value="">未设置</MenuItem>
              <MenuItem value="burial">深埋</MenuItem>
              <MenuItem value="incineration">焚烧</MenuItem>
              <MenuItem value="composting">堆肥</MenuItem>
              <MenuItem value="rendering">化制</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>兽医确认</InputLabel>
            <Select value={form.vet_confirmation ? 'yes' : 'no'} label="兽医确认" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, vet_confirmation: e.target.value === 'yes' }))}>
              <MenuItem value="no">否</MenuItem>
              <MenuItem value="yes">是</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" type="number" label="损失金额 (元)" value={form.loss_amount} onChange={(e) => setForm(p => ({ ...p, loss_amount: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
          <TextField size="small" label="备注" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" color="error" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function ProductionPage() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [animals, setAnimals] = useState<AnimalRecord[]>([]);

  const [slaughters, setSlaughters] = useState<SlaughterRecord[]>([]);
  const [slaughterTotal, setSlaughterTotal] = useState(0);
  const [slaughterPage, setSlaughterPage] = useState(0);
  const [loadingSlaughter, setLoadingSlaughter] = useState(false);
  const [openSlaughterForm, setOpenSlaughterForm] = useState(false);

  const [mortalities, setMortalities] = useState<MortalityRecord[]>([]);
  const [mortalityTotal, setMortalityTotal] = useState(0);
  const [mortalityPage, setMortalityPage] = useState(0);
  const [loadingMortality, setLoadingMortality] = useState(false);
  const [openMortalityForm, setOpenMortalityForm] = useState(false);

  const PAGE_SIZE = 15;

  // 加载统计
  useEffect(() => {
    productionApi.getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  // 加载活跃动物列表（用于出栏/死亡选择）
  useEffect(() => {
    animalApi.getAnimals({ page_size: 500 })
      .then(res => setAnimals(res.items.filter(a => a.health_status !== 'removal')))
      .catch(() => setAnimals([]));
  }, []);

  const fetchSlaughters = useCallback(async (page: number) => {
    setLoadingSlaughter(true);
    try {
      const res = await productionApi.getSlaughters({ page: page + 1, page_size: PAGE_SIZE });
      setSlaughters(res.items);
      setSlaughterTotal(res.total);
    } catch { setSlaughters([]); } finally { setLoadingSlaughter(false); }
  }, []);

  const fetchMortalities = useCallback(async (page: number) => {
    setLoadingMortality(true);
    try {
      const res = await productionApi.getMortalities({ page: page + 1, page_size: PAGE_SIZE });
      setMortalities(res.items);
      setMortalityTotal(res.total);
    } catch { setMortalities([]); } finally { setLoadingMortality(false); }
  }, []);

  useEffect(() => { fetchSlaughters(slaughterPage); }, [fetchSlaughters, slaughterPage]);
  useEffect(() => { fetchMortalities(mortalityPage); }, [fetchMortalities, mortalityPage]);

  const refreshStats = () => {
    setLoadingStats(true);
    productionApi.getStats().then(setStats).catch(() => setStats(null)).finally(() => setLoadingStats(false));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>生产管理</Typography>
          <Typography variant="body2" color="text.secondary">管理出栏、死亡记录，追踪生产绩效</Typography>
        </Box>
      </Stack>

      {/* 统计卡片 */}
      <StatsCards stats={stats} loading={loadingStats} />

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab label="出栏记录" />
          <Tab label="死亡记录" />
        </Tabs>

        {/* ─── 出栏记录 ─── */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenSlaughterForm(true)}>新增出栏记录</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>动物编号</TableCell>
                    <TableCell>出栏日期</TableCell>
                    <TableCell>出栏体重(kg)</TableCell>
                    <TableCell>单价(元/kg)</TableCell>
                    <TableCell>总价(元)</TableCell>
                    <TableCell>买家</TableCell>
                    <TableCell>目的地</TableCell>
                    <TableCell>操作人</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingSlaughter ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={8}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : slaughters.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 4 }}>暂无出栏记录</TableCell></TableRow>
                  ) : slaughters.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{r.animal_name ?? `#${r.animal_id}`}</Typography></TableCell>
                      <TableCell>{r.slaughter_date}</TableCell>
                      <TableCell>{r.slaughter_weight_kg ?? '-'}</TableCell>
                      <TableCell>{r.price_per_kg ?? '-'}</TableCell>
                      <TableCell>{r.total_price != null ? `¥${r.total_price.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>{r.buyer ?? '-'}</TableCell>
                      <TableCell>{r.destination ?? '-'}</TableCell>
                      <TableCell>{r.operator ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={slaughterTotal}
              page={slaughterPage}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setSlaughterPage(p)}
            />
          </Box>
        </TabPanel>

        {/* ─── 死亡记录 ─── */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <Button variant="contained" color="error" size="small" startIcon={<AddIcon />} onClick={() => setOpenMortalityForm(true)}>新增死亡记录</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>动物编号</TableCell>
                    <TableCell>死亡日期</TableCell>
                    <TableCell>死亡原因</TableCell>
                    <TableCell>处置方式</TableCell>
                    <TableCell>兽医确认</TableCell>
                    <TableCell>损失金额</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingMortality ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : mortalities.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>暂无死亡记录</TableCell></TableRow>
                  ) : mortalities.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{r.animal_name ?? `#${r.animal_id}`}</Typography></TableCell>
                      <TableCell>{r.death_date}</TableCell>
                      <TableCell>{r.cause ?? '-'}</TableCell>
                      <TableCell>{r.disposal_method ?? '-'}</TableCell>
                      <TableCell>
                        <Chip label={r.vet_confirmation ? '已确认' : '未确认'} size="small" color={r.vet_confirmation ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell>{r.loss_amount != null ? `¥${r.loss_amount.toFixed(2)}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={mortalityTotal}
              page={mortalityPage}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, p) => setMortalityPage(p)}
            />
          </Box>
        </TabPanel>
      </Paper>

      <SlaughterFormDialog
        open={openSlaughterForm}
        onClose={() => setOpenSlaughterForm(false)}
        onSave={() => { fetchSlaughters(0); setSlaughterPage(0); refreshStats(); }}
        animals={animals}
      />
      <MortalityFormDialog
        open={openMortalityForm}
        onClose={() => setOpenMortalityForm(false)}
        onSave={() => { fetchMortalities(0); setMortalityPage(0); refreshStats(); }}
        animals={animals}
      />
    </Container>
  );
}
