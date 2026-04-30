'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Paper, Typography, Stack, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Alert, Skeleton, Select, MenuItem, FormControl, InputLabel, Card, CardContent,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import GrassIcon from '@mui/icons-material/Grass';
import { feedApi, shedApi, FeedIntakeRecord } from '@/lib/api/apiService';
import type { Shed } from '@/types';

const TODAY = new Date().toISOString().split('T')[0];

// ─── 录入弹窗 ─────────────────────────────────────────────────
interface FormProps { open: boolean; onClose: () => void; onSave: () => void; pens: { id: number; name: string }[]; }
function FeedIntakeFormDialog({ open, onClose, onSave, pens }: FormProps) {
  const [form, setForm] = useState({
    pen_id: '', record_date: TODAY, sheep_count: '',
    morning_feeding_amount_kg: '', morning_box_weight_kg: '', morning_remaining_feed_kg: '',
    afternoon_feeding_amount_kg: '', afternoon_box_weight_kg: '', afternoon_remaining_feed_kg: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        pen_id: '', record_date: TODAY, sheep_count: '',
        morning_feeding_amount_kg: '', morning_box_weight_kg: '', morning_remaining_feed_kg: '',
        afternoon_feeding_amount_kg: '', afternoon_box_weight_kg: '', afternoon_remaining_feed_kg: '',
      });
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.pen_id) { setError('请选择圈舍'); return; }
    if (!form.sheep_count || Number(form.sheep_count) <= 0) { setError('请输入有效的羊只数量'); return; }
    setSaving(true); setError(null);
    try {
      await feedApi.createFeedIntake({
        pen_id: Number(form.pen_id),
        record_date: form.record_date,
        sheep_count: Number(form.sheep_count),
        morning_feeding_amount_kg: form.morning_feeding_amount_kg ? Number(form.morning_feeding_amount_kg) : undefined,
        morning_box_weight_kg: form.morning_box_weight_kg ? Number(form.morning_box_weight_kg) : undefined,
        morning_remaining_feed_kg: form.morning_remaining_feed_kg ? Number(form.morning_remaining_feed_kg) : undefined,
        afternoon_feeding_amount_kg: form.afternoon_feeding_amount_kg ? Number(form.afternoon_feeding_amount_kg) : undefined,
        afternoon_box_weight_kg: form.afternoon_box_weight_kg ? Number(form.afternoon_box_weight_kg) : undefined,
        afternoon_remaining_feed_kg: form.afternoon_remaining_feed_kg ? Number(form.afternoon_remaining_feed_kg) : undefined,
      });
      onSave(); onClose();
    } catch (e: any) { setError(e.message || '操作失败'); } finally { setSaving(false); }
  };

  const f = (label: string, field: keyof typeof form) => (
    <TextField
      size="small" type="number" label={label}
      value={form[field]}
      onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))}
      inputProps={{ min: 0, step: 0.01 }}
      fullWidth
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增采食量记录</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>选择圈舍*</InputLabel>
            <Select value={form.pen_id} label="选择圈舍*" onChange={(e: SelectChangeEvent) => setForm(p => ({ ...p, pen_id: e.target.value }))}>
              {pens.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="记录日期*" value={form.record_date} onChange={(e) => setForm(p => ({ ...p, record_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
          {f('羊只数量*', 'sheep_count')}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>上午饲喂</Typography>
          {f('上午投料量 (kg)', 'morning_feeding_amount_kg')}
          {f('上午料箱重量 (kg)', 'morning_box_weight_kg')}
          {f('上午剩余饲料 (kg)', 'morning_remaining_feed_kg')}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>下午饲喂</Typography>
          {f('下午投料量 (kg)', 'afternoon_feeding_amount_kg')}
          {f('下午料箱重量 (kg)', 'afternoon_box_weight_kg')}
          {f('下午剩余饲料 (kg)', 'afternoon_remaining_feed_kg')}
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
export default function FeedManagementPage() {
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [selectedPenId, setSelectedPenId] = useState<number | null>(null);
  const [records, setRecords] = useState<FeedIntakeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    shedApi.getSheds().then((s) => setSheds(s)).catch(() => setSheds([]));
  }, []);

  const fetchRecords = useCallback(async (pg: number, penId: number | null) => {
    setLoading(true);
    try {
      const params: Parameters<typeof feedApi.getFeedIntakes>[0] = { page: pg + 1, page_size: PAGE_SIZE };
      if (penId) params.pen_id = penId;
      const res = await feedApi.getFeedIntakes(params);
      setRecords(res.items);
      setTotal(res.total);
    } catch { setRecords([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(page, selectedPenId); }, [fetchRecords, page, selectedPenId]);

  // 平均统计
  const avgIntake = records.length > 0
    ? records.reduce((acc, r) => acc + (r.daily_total_feed_intake_kg ?? 0), 0) / records.length
    : 0;
  const avgIndividual = records.length > 0
    ? records.reduce((acc, r) => acc + (r.avg_individual_intake_kg ?? 0), 0) / records.length
    : 0;

  const pens = sheds.map(s => ({ id: Number(s.id), name: s.name }));

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <GrassIcon sx={{ color: 'success.main', fontSize: 32 }} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>饲料投喂管理</Typography>
          <Typography variant="body2" color="text.secondary">记录每日各圈舍采食量，监控饲料消耗</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>新增采食量记录</Button>
      </Stack>

      {/* 汇总卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: '记录总数', value: total, unit: '条' },
          { label: '近期日均采食量', value: avgIntake.toFixed(2), unit: 'kg/天' },
          { label: '个体日均采食量', value: avgIndividual.toFixed(3), unit: 'kg/头' },
        ].map((c) => (
          <Grid item xs={12} sm={4} key={c.label}>
            <Card elevation={2} sx={{ borderRadius: 2, borderTop: '3px solid #2e7d32' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{c.value}</Typography>
                <Typography variant="caption" color="text.secondary">{c.unit}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 筛选 */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>筛选圈舍</InputLabel>
            <Select
              value={selectedPenId != null ? String(selectedPenId) : ''}
              label="筛选圈舍"
              onChange={(e: SelectChangeEvent) => {
                const v = e.target.value;
                setSelectedPenId(v === '' ? null : Number(v));
                setPage(0);
              }}
            >
              <MenuItem value="">全部圈舍</MenuItem>
              {pens.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">共 {total} 条记录</Typography>
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>记录日期</TableCell>
                <TableCell>圈舍ID</TableCell>
                <TableCell>羊只数</TableCell>
                <TableCell>上午采食量(kg)</TableCell>
                <TableCell>下午采食量(kg)</TableCell>
                <TableCell>日总采食量(kg)</TableCell>
                <TableCell>个体采食量(kg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    暂无采食量记录，请点击&ldquo;新增采食量记录&rdquo;开始记录
                  </TableCell>
                </TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.record_date}</TableCell>
                  <TableCell>{r.pen_id}</TableCell>
                  <TableCell>{r.sheep_count}</TableCell>
                  <TableCell>{r.morning_feed_intake_kg?.toFixed(2) ?? '-'}</TableCell>
                  <TableCell>{r.afternoon_feed_intake_kg?.toFixed(2) ?? '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                    {r.daily_total_feed_intake_kg?.toFixed(2) ?? '-'}
                  </TableCell>
                  <TableCell>{r.avg_individual_intake_kg?.toFixed(3) ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          onPageChange={(_, p) => setPage(p)}
        />
      </Paper>

      <FeedIntakeFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={() => { fetchRecords(0, selectedPenId); setPage(0); }}
        pens={pens}
      />
    </Container>
  );
}
