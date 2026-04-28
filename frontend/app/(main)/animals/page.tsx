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
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Skeleton,
  Tooltip,
  SelectChangeEvent,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RefreshIcon from '@mui/icons-material/Refresh';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import Grid from '@mui/material/GridLegacy';
import Link from 'next/link';

import { animalApi, shedApi } from '@/lib/api/apiService';
import type { AnimalRecord, AnimalStats, Shed } from '@/types';

// ─── helpers ────────────────────────────────────────────────

const healthStatusConfig = {
  good: { label: '健康', color: 'success' as const },
  ill: { label: '异常', color: 'error' as const },
  under_treatment: { label: '治疗中', color: 'warning' as const },
  removal: { label: '已出栏', color: 'default' as const },
};

const genderLabel = { male: '公', female: '母' };
const productionTypeLabel = { breeding: '种羊', fattening: '育肥', test: '试验' };

// ─── 统计卡片 ────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 130 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color, fontSize: 36 }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{label}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── 动物表单对话框 ──────────────────────────────────────────

interface AnimalFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  animal?: AnimalRecord | null;
  sheds: Shed[];
}

function AnimalFormDialog({ open, onClose, onSave, animal, sheds }: AnimalFormProps) {
  const isEdit = !!animal;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: 0,
    gender: 'female',
    health_status: 'good',
    shed_id: 0,
    entry_date: '',
    birth_date: '',
    production_type: 'fattening',
    breeding_status: '',
    mating_date: '',
    delivery_date: '',
    sire_id: '',
    description: '',
  });

  useEffect(() => {
    if (open) {
      if (animal) {
        setForm({
          name: animal.name,
          breed: animal.breed,
          age: animal.age,
          gender: animal.gender,
          health_status: animal.health_status,
          shed_id: animal.shed_id,
          entry_date: animal.entry_date,
          birth_date: animal.birth_date,
          production_type: animal.production_type,
          breeding_status: animal.breeding_status || '',
          mating_date: animal.mating_date || '',
          delivery_date: animal.delivery_date || '',
          sire_id: animal.sire_id || '',
          description: animal.description || '',
        });
      } else {
        setForm({
          name: '', breed: '', age: 0, gender: 'female', health_status: 'good',
          shed_id: sheds[0] ? Number(sheds[0].id) : 0,
          entry_date: new Date().toISOString().split('T')[0],
          birth_date: new Date().toISOString().split('T')[0],
          production_type: 'fattening', breeding_status: '',
          mating_date: '', delivery_date: '', sire_id: '', description: '',
        });
      }
      setError(null);
    }
  }, [open, animal, sheds]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.breed.trim() || !form.shed_id || !form.entry_date || !form.birth_date) {
      setError('请填写必填字段：编号、品种、羊舍、进舍日期、出生日期');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        name: form.name,
        breed: form.breed,
        age: Number(form.age),
        gender: form.gender,
        health_status: form.health_status,
        shed_id: Number(form.shed_id),
        entry_date: form.entry_date,
        birth_date: form.birth_date,
        production_type: form.production_type,
        breeding_status: form.breeding_status || null,
        mating_date: form.mating_date || null,
        delivery_date: form.delivery_date || null,
        sire_id: form.sire_id || null,
        description: form.description || null,
      };
      if (isEdit) {
        await animalApi.updateAnimal(animal!.id, payload);
      } else {
        await animalApi.createAnimal(payload);
      }
      onSave();
      onClose();
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? '编辑动物档案' : '新增动物档案'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>基本信息</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="编号 *" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="品种 *" value={form.breed} onChange={(e) => update('breed', e.target.value)} placeholder="如：湖羊、杜泊" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="年龄（月）" value={form.age} onChange={(e) => update('age', e.target.value)} inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>性别 *</InputLabel>
              <Select value={form.gender} label="性别 *" onChange={(e: SelectChangeEvent) => update('gender', e.target.value)}>
                <MenuItem value="female">母</MenuItem>
                <MenuItem value="male">公</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>所属羊舍 *</InputLabel>
              <Select value={String(form.shed_id)} label="所属羊舍 *" onChange={(e: SelectChangeEvent) => update('shed_id', Number(e.target.value))}>
                {sheds.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="date" label="出生日期 *" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="date" label="进舍日期 *" value={form.entry_date} onChange={(e) => update('entry_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>健康状态</InputLabel>
              <Select value={form.health_status} label="健康状态" onChange={(e: SelectChangeEvent) => update('health_status', e.target.value)}>
                <MenuItem value="good">健康</MenuItem>
                <MenuItem value="ill">异常</MenuItem>
                <MenuItem value="under_treatment">治疗中</MenuItem>
                <MenuItem value="removal">已出栏</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>生产类别 *</InputLabel>
              <Select value={form.production_type} label="生产类别 *" onChange={(e: SelectChangeEvent) => update('production_type', e.target.value)}>
                <MenuItem value="breeding">种羊</MenuItem>
                <MenuItem value="fattening">育肥</MenuItem>
                <MenuItem value="test">试验</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 繁殖信息 */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>繁殖信息（选填）</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>繁殖状态</InputLabel>
              <Select value={form.breeding_status} label="繁殖状态" onChange={(e: SelectChangeEvent) => update('breeding_status', e.target.value)}>
                <MenuItem value="">未设置</MenuItem>
                <MenuItem value="empty">空怀</MenuItem>
                <MenuItem value="mated_wait">已配待妊检</MenuItem>
                <MenuItem value="pregnant">妊娠</MenuItem>
                <MenuItem value="perinatal">围产</MenuItem>
                <MenuItem value="lactation">泌乳</MenuItem>
                <MenuItem value="abortion">流产</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="date" label="配种日期" value={form.mating_date} onChange={(e) => update('mating_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="date" label="分娩日期" value={form.delivery_date} onChange={(e) => update('delivery_date', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="父本ID/精液批次" value={form.sire_id} onChange={(e) => update('sire_id', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="备注" multiline rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>
          {isEdit ? '保存修改' : '创建档案'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AnimalStats | null>(null);
  const [sheds, setSheds] = useState<Shed[]>([]);

  // 筛选
  const [filterShed, setFilterShed] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchText, setSearchText] = useState('');

  // 分页
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // 弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AnimalRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnimalRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载羊舍
  useEffect(() => {
    shedApi.getSheds().then(setSheds).catch(console.error);
  }, []);

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const s = await animalApi.getStats();
      setStats(s);
    } catch (e) { console.error(e); }
  }, []);

  // 加载列表
  const loadAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await animalApi.getAnimals({
        shed_id: filterShed ? Number(filterShed) : undefined,
        health_status: filterHealth || undefined,
        gender: filterGender || undefined,
        production_type: filterType || undefined,
        search: searchText || undefined,
        page: page + 1,
        page_size: pageSize,
      });
      setAnimals(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [filterShed, filterHealth, filterGender, filterType, searchText, page, pageSize]);

  useEffect(() => {
    loadStats();
    loadAnimals();
  }, [loadStats, loadAnimals]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await animalApi.deleteAnimal(deleteTarget.id);
      setDeleteDialogOpen(false);
      loadAnimals();
      loadStats();
    } catch (e: any) {
      alert(e.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        {/* 页头 */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ borderLeft: '4px solid #2E7D32', pl: 1.5 }}>
            <Typography variant="h5" fontWeight={700}>动物档案</Typography>
            <Typography variant="body2" color="text.secondary">管理所有牲畜档案信息</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadAnimals(); loadStats(); }}>刷新</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>新增档案</Button>
          </Stack>
        </Stack>

        {/* 统计卡片 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          {stats ? (
            <>
              <StatCard label="总数" value={stats.total} color="#1565C0" icon={<PetsIcon fontSize="large" />} />
              <StatCard label="健康" value={stats.good} color="#2E7D32" icon={<FavoriteIcon fontSize="large" />} />
              <StatCard label="异常" value={stats.ill} color="#C62828" icon={<MedicalServicesIcon fontSize="large" />} />
              <StatCard label="治疗中" value={stats.under_treatment} color="#E65100" icon={<MedicalServicesIcon fontSize="large" />} />
              <StatCard label="种羊" value={stats.breeding_count} color="#6A1B9A" icon={<PetsIcon fontSize="large" />} />
              <StatCard label="育肥" value={stats.fattening_count} color="#00695C" icon={<PetsIcon fontSize="large" />} />
            </>
          ) : (
            [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} variant="rectangular" height={90} sx={{ flex: 1, minWidth: 130, borderRadius: 2 }} />)
          )}
        </Stack>

        {/* 筛选栏 */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small" label="搜索编号/品种" value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 180 }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>羊舍</InputLabel>
              <Select value={filterShed} label="羊舍" onChange={(e: SelectChangeEvent) => { setFilterShed(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                {sheds.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>健康状态</InputLabel>
              <Select value={filterHealth} label="健康状态" onChange={(e: SelectChangeEvent) => { setFilterHealth(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="good">健康</MenuItem>
                <MenuItem value="ill">异常</MenuItem>
                <MenuItem value="under_treatment">治疗中</MenuItem>
                <MenuItem value="removal">已出栏</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>性别</InputLabel>
              <Select value={filterGender} label="性别" onChange={(e: SelectChangeEvent) => { setFilterGender(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="female">母</MenuItem>
                <MenuItem value="male">公</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>生产类别</InputLabel>
              <Select value={filterType} label="生产类别" onChange={(e: SelectChangeEvent) => { setFilterType(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="breeding">种羊</MenuItem>
                <MenuItem value="fattening">育肥</MenuItem>
                <MenuItem value="test">试验</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* 动物列表 */}
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>编号</TableCell>
                  <TableCell>品种</TableCell>
                  <TableCell>性别</TableCell>
                  <TableCell>年龄(月)</TableCell>
                  <TableCell>所属羊舍</TableCell>
                  <TableCell>健康状态</TableCell>
                  <TableCell>生产类别</TableCell>
                  <TableCell>繁殖状态</TableCell>
                  <TableCell>进舍日期</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : animals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">暂无动物档案</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  animals.map((a) => {
                    const hc = healthStatusConfig[a.health_status] ?? healthStatusConfig.good;
                    return (
                      <TableRow key={a.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                        </TableCell>
                        <TableCell>{a.breed}</TableCell>
                        <TableCell>{genderLabel[a.gender] || a.gender}</TableCell>
                        <TableCell>{a.age}</TableCell>
                        <TableCell>{a.shed_name || `#${a.shed_id}`}</TableCell>
                        <TableCell>
                          <Chip size="small" label={hc.label} color={hc.color} />
                        </TableCell>
                        <TableCell>{productionTypeLabel[a.production_type] || a.production_type}</TableCell>
                        <TableCell>
                          {a.breeding_status ? (
                            <Chip size="small" label={a.breeding_status} variant="outlined" color="secondary" />
                          ) : '-'}
                        </TableCell>
                        <TableCell>{a.entry_date}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="查看健康数据">
                              <IconButton size="small" color="primary" component={Link} href={`/animals/${a.id}/health`}>
                                <MedicalServicesIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="编辑档案">
                              <IconButton size="small" onClick={() => { setEditTarget(a); setFormOpen(true); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除">
                              <IconButton size="small" color="error" onClick={() => { setDeleteTarget(a); setDeleteDialogOpen(true); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="每页"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
          />
        </Paper>
      </Stack>

      {/* 新增/编辑弹窗 */}
      <AnimalFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={() => { loadAnimals(); loadStats(); }}
        animal={editTarget}
        sheds={sheds}
      />

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除动物档案 <strong>{deleteTarget?.name}</strong> 吗？此操作不可撤销。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
