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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Alert,
  Skeleton,
  SelectChangeEvent,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddAlertIcon from '@mui/icons-material/AddAlert';

import { alertApi, shedApi } from '@/lib/api/apiService';
import type { Alert as AlertType, AlertStats, Shed } from '@/types';

// ─── helpers ────────────────────────────────────────────────

const severityConfig = {
  high: { label: '高危', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> },
  medium: { label: '中危', color: 'warning' as const, icon: <WarningAmberIcon fontSize="small" /> },
  low: { label: '低危', color: 'info' as const, icon: <InfoIcon fontSize="small" /> },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Stats card ─────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  unresolved?: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, unresolved, color, bgColor, icon }: StatCardProps) {
  return (
    <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 140 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ color, fontSize: 36 }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{label}</Typography>
          {unresolved != null && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              未解决 {unresolved} 条
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── Main page ──────────────────────────────────────────────

export default function AlertsPage() {
  // 列表数据
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 统计
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 筛选
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [filterShed, setFilterShed] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterResolved, setFilterResolved] = useState<string>('');

  // 分页
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // 解决告警弹窗
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<AlertType | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [resolving, setResolving] = useState(false);

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AlertType | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── 加载羊舍列表
  useEffect(() => {
    shedApi.getSheds().then(setSheds).catch(console.error);
  }, []);

  // ── 加载统计数据
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await alertApi.getStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── 加载告警列表
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await alertApi.getAlerts({
        shed_id: filterShed ? Number(filterShed) : undefined,
        severity: filterSeverity || undefined,
        resolved: filterResolved === '' ? undefined : filterResolved === 'true',
        page: page + 1,
        page_size: pageSize,
      });
      setAlerts(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [filterShed, filterSeverity, filterResolved, page, pageSize]);

  useEffect(() => {
    loadStats();
    loadAlerts();
  }, [loadStats, loadAlerts]);

  // ── 解决告警
  const handleResolve = async () => {
    if (!resolveTarget || !resolvedBy.trim()) return;
    setResolving(true);
    try {
      await alertApi.resolveAlert(resolveTarget.id, resolvedBy.trim());
      setResolveDialogOpen(false);
      setResolvedBy('');
      loadAlerts();
      loadStats();
    } catch (e: any) {
      alert(e.message || '操作失败');
    } finally {
      setResolving(false);
    }
  };

  // ── 删除告警
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await alertApi.deleteAlert(deleteTarget.id);
      setDeleteDialogOpen(false);
      loadAlerts();
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
          <Box sx={{ borderLeft: '4px solid #C62828', pl: 1.5 }}>
            <Typography variant="h5" fontWeight={700}>告警中心</Typography>
            <Typography variant="body2" color="text.secondary">实时监控所有告警事件，及时处置风险</Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadAlerts(); loadStats(); }}
          >
            刷新
          </Button>
        </Stack>

        {/* 统计卡片 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          {statsLoading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rectangular" height={90} sx={{ flex: 1, minWidth: 140, borderRadius: 2 }} />)
          ) : stats ? (
            <>
              <StatCard label="未解决告警" value={stats.unresolved} color="#C62828" bgColor="#FFEBEE" icon={<AddAlertIcon fontSize="large" />} />
              <StatCard label="高危告警" value={stats.high} unresolved={stats.high_unresolved} color="#B71C1C" bgColor="#FFEBEE" icon={<ErrorIcon fontSize="large" />} />
              <StatCard label="中危告警" value={stats.medium} unresolved={stats.medium_unresolved} color="#E65100" bgColor="#FFF3E0" icon={<WarningAmberIcon fontSize="large" />} />
              <StatCard label="低危告警" value={stats.low} unresolved={stats.low_unresolved} color="#1565C0" bgColor="#E3F2FD" icon={<InfoIcon fontSize="large" />} />
            </>
          ) : null}
        </Stack>

        {/* 筛选栏 */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>羊舍</InputLabel>
              <Select value={filterShed} label="羊舍" onChange={(e: SelectChangeEvent) => { setFilterShed(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                {sheds.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>严重程度</InputLabel>
              <Select value={filterSeverity} label="严重程度" onChange={(e: SelectChangeEvent) => { setFilterSeverity(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="high">高危</MenuItem>
                <MenuItem value="medium">中危</MenuItem>
                <MenuItem value="low">低危</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>处理状态</InputLabel>
              <Select value={filterResolved} label="处理状态" onChange={(e: SelectChangeEvent) => { setFilterResolved(e.target.value); setPage(0); }}>
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="false">未解决</MenuItem>
                <MenuItem value="true">已解决</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* 告警列表 */}
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>ID</TableCell>
                  <TableCell>严重程度</TableCell>
                  <TableCell>羊舍</TableCell>
                  <TableCell>告警描述</TableCell>
                  <TableCell>告警时间</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>处理人</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">暂无告警记录</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => {
                    const sc = severityConfig[alert.severity] ?? severityConfig.low;
                    return (
                      <TableRow key={alert.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>{alert.id}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={sc.label}
                            color={sc.color}
                            icon={sc.icon}
                          />
                        </TableCell>
                        <TableCell>{alert.shed_name || `#${alert.shed_id}`}</TableCell>
                        <TableCell sx={{ maxWidth: 400, minWidth: 200 }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {alert.description}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(alert.alert_time)}
                        </TableCell>
                        <TableCell>
                          {alert.resolved ? (
                            <Chip size="small" label="已解决" color="success" icon={<CheckCircleIcon fontSize="small" />} />
                          ) : (
                            <Chip size="small" label="未解决" color="default" />
                          )}
                        </TableCell>
                        <TableCell>{alert.resolved_by || '-'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {!alert.resolved && (
                              <Tooltip title="标记已解决">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => { setResolveTarget(alert); setResolveDialogOpen(true); }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="删除">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => { setDeleteTarget(alert); setDeleteDialogOpen(true); }}
                              >
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

      {/* 解决告警弹窗 */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>标记告警已解决</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            告警：{resolveTarget?.description}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="处理人姓名"
            value={resolvedBy}
            onChange={(e) => setResolvedBy(e.target.value)}
            sx={{ mt: 2 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleResolve(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolve}
            disabled={!resolvedBy.trim() || resolving}
            startIcon={resolving ? <CircularProgress size={16} /> : null}
          >
            确认解决
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除此告警记录吗？此操作不可撤销。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
