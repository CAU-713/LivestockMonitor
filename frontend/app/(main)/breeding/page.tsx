'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Skeleton,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import RefreshIcon from '@mui/icons-material/Refresh';
import FemaleIcon from '@mui/icons-material/Female';

import { animalApi } from '@/lib/api/apiService';
import type { AnimalRecord } from '@/types';

// ─── helpers ────────────────────────────────────────────────

const breedingStatusConfig: Record<string, { label: string; color: any }> = {
  empty: { label: '空怀', color: 'default' },
  mated_wait: { label: '已配待妊检', color: 'info' },
  pregnant: { label: '妊娠', color: 'primary' },
  perinatal: { label: '围产', color: 'warning' },
  lactation: { label: '泌乳', color: 'success' },
  abortion: { label: '流产', color: 'error' },
};

// ─── 繁殖状态统计卡片 ──────────────────────────────────────

function StatusCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 110, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// ─── 更新繁殖状态弹窗 ─────────────────────────────────────

interface BreedingEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  animal: AnimalRecord | null;
}

function BreedingEditDialog({ open, onClose, onSave, animal }: BreedingEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    breeding_status: '',
    mating_date: '',
    delivery_date: '',
    sire_id: '',
  });

  useEffect(() => {
    if (open && animal) {
      setForm({
        breeding_status: animal.breeding_status || '',
        mating_date: animal.mating_date || '',
        delivery_date: animal.delivery_date || '',
        sire_id: animal.sire_id || '',
      });
      setError(null);
    }
  }, [open, animal]);

  const handleSave = async () => {
    if (!animal) return;
    setSaving(true);
    setError(null);
    try {
      await animalApi.updateBreedingStatus(animal.id, {
        breeding_status: form.breeding_status || undefined,
        mating_date: form.mating_date || undefined,
        delivery_date: form.delivery_date || undefined,
        sire_id: form.sire_id || undefined,
      });
      onSave();
      onClose();
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>更新繁殖状态 — {animal?.name}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>繁殖状态</InputLabel>
            <Select value={form.breeding_status} label="繁殖状态" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, breeding_status: e.target.value }))}>
              <MenuItem value="">清除（未设置）</MenuItem>
              <MenuItem value="empty">空怀</MenuItem>
              <MenuItem value="mated_wait">已配待妊检</MenuItem>
              <MenuItem value="pregnant">妊娠</MenuItem>
              <MenuItem value="perinatal">围产</MenuItem>
              <MenuItem value="lactation">泌乳</MenuItem>
              <MenuItem value="abortion">流产</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="配种日期" value={form.mating_date} onChange={(e) => setForm(p => ({ ...p, mating_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="分娩日期" value={form.delivery_date} onChange={(e) => setForm(p => ({ ...p, delivery_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="父本ID / 精液批次" value={form.sire_id} onChange={(e) => setForm(p => ({ ...p, sire_id: e.target.value }))} />
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

export default function BreedingPage() {
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<AnimalRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await animalApi.getBreedingAnimals();
      setAnimals(records);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnimals(); }, [loadAnimals]);

  // 统计各状态数量
  const statusCounts = Object.keys(breedingStatusConfig).reduce((acc, key) => {
    acc[key] = animals.filter((a) => a.breeding_status === key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        {/* 页头 */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ borderLeft: '4px solid #6A1B9A', pl: 1.5 }}>
            <Typography variant="h5" fontWeight={700}>繁殖管理</Typography>
            <Typography variant="body2" color="text.secondary">管理母羊配种、妊娠、产仔全流程</Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAnimals}>刷新</Button>
        </Stack>

        {/* 统计看板 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <StatusCard label="空怀" value={statusCounts.empty || 0} color="#757575" />
          <StatusCard label="已配待妊检" value={statusCounts.mated_wait || 0} color="#1565C0" />
          <StatusCard label="妊娠" value={statusCounts.pregnant || 0} color="#6A1B9A" />
          <StatusCard label="围产" value={statusCounts.perinatal || 0} color="#E65100" />
          <StatusCard label="泌乳" value={statusCounts.lactation || 0} color="#2E7D32" />
          <StatusCard label="流产" value={statusCounts.abortion || 0} color="#C62828" />
        </Stack>

        {/* 繁殖动物列表 */}
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FemaleIcon sx={{ color: '#6A1B9A' }} />
              <Typography variant="subtitle1" fontWeight={700}>繁殖动物列表（共 {animals.length} 条）</Typography>
            </Stack>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>编号</TableCell>
                  <TableCell>品种</TableCell>
                  <TableCell>年龄(月)</TableCell>
                  <TableCell>所属羊舍</TableCell>
                  <TableCell>繁殖状态</TableCell>
                  <TableCell>配种日期</TableCell>
                  <TableCell>预产/分娩日期</TableCell>
                  <TableCell>父本/精液批次</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : animals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">暂无繁殖中的动物</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  animals.map((a) => {
                    const sc = breedingStatusConfig[a.breeding_status || ''] || { label: a.breeding_status || '-', color: 'default' };
                    return (
                      <TableRow key={a.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{a.name}</Typography></TableCell>
                        <TableCell>{a.breed}</TableCell>
                        <TableCell>{a.age}</TableCell>
                        <TableCell>{a.shed_name || `#${a.shed_id}`}</TableCell>
                        <TableCell>
                          <Chip size="small" label={sc.label} color={sc.color} />
                        </TableCell>
                        <TableCell>{a.mating_date || '-'}</TableCell>
                        <TableCell>{a.delivery_date || '-'}</TableCell>
                        <TableCell>{a.sire_id || '-'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="更新繁殖状态">
                            <IconButton size="small" color="secondary" onClick={() => { setEditTarget(a); setEditOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      {/* 更新繁殖状态弹窗 */}
      <BreedingEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={loadAnimals}
        animal={editTarget}
      />
    </Container>
  );
}
