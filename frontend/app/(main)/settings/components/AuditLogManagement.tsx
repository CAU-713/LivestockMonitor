'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Paper, Chip,
  Skeleton, Alert, Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Button,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { SelectChangeEvent } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { auditApi, OperationLog, AuditStats } from '@/lib/api/apiService';

const ACTION_LABELS: Record<string, { label: string; color: 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary' }> = {
  CREATE: { label: '新增', color: 'success' },
  UPDATE: { label: '修改', color: 'primary' },
  DELETE: { label: '删除', color: 'error' },
  LOGIN: { label: '登录', color: 'info' },
  RESOLVE: { label: '处理', color: 'warning' },
};

const RESOURCE_LABELS: Record<string, string> = {
  animal: '动物档案',
  shed: '圈舍',
  sensor: '传感器',
  alert: '告警',
  user: '用户',
  rule: '告警规则',
};

function StatsSection({ stats, loading }: { stats: AuditStats | null; loading: boolean }) {
  if (loading) return <Skeleton height={80} sx={{ mb: 2 }} />;
  if (!stats) return null;
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <Card elevation={1} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">近7天操作总数</Typography>
            <Typography variant="h4" fontWeight={700} color="primary">{stats.total_7days}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card elevation={1} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">按操作类型（近7天）</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
              {stats.by_action.map(i => {
                const cfg = ACTION_LABELS[i.action] ?? { label: i.action, color: 'default' as const };
                return <Chip key={i.action} label={`${cfg.label} ${i.count}`} color={cfg.color} size="small" />;
              })}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card elevation={1} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">按资源类型（近7天）</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
              {stats.by_resource_type.map(i => (
                <Chip key={i.action} label={`${RESOURCE_LABELS[i.action] ?? i.action} ${i.count}`} size="small" variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function AuditLogManagement() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [filters, setFilters] = useState({
    operator: '', action: '', resource_type: '', start_date: '', end_date: '',
  });

  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async (pg: number, f: typeof filters) => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({
        operator: f.operator || undefined,
        action: f.action || undefined,
        resource_type: f.resource_type || undefined,
        start_date: f.start_date || undefined,
        end_date: f.end_date || undefined,
        page: pg + 1,
        page_size: PAGE_SIZE,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch { setLogs([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    auditApi.getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => { fetchLogs(page, filters); }, [fetchLogs, page, filters]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>操作日志</Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={() => fetchLogs(page, filters)}>刷新</Button>
      </Stack>

      <StatsSection stats={stats} loading={loadingStats} />

      {/* 筛选栏 */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={2}>
            <TextField size="small" fullWidth label="操作人员" value={filters.operator} onChange={(e) => setFilters(p => ({ ...p, operator: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>操作类型</InputLabel>
              <Select value={filters.action} label="操作类型" onChange={(e: SelectChangeEvent) => setFilters(p => ({ ...p, action: e.target.value }))}>
                <MenuItem value="">全部</MenuItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>资源类型</InputLabel>
              <Select value={filters.resource_type} label="资源类型" onChange={(e: SelectChangeEvent) => setFilters(p => ({ ...p, resource_type: e.target.value }))}>
                <MenuItem value="">全部</MenuItem>
                {Object.entries(RESOURCE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField size="small" fullWidth type="date" label="开始日期" InputLabelProps={{ shrink: true }} value={filters.start_date} onChange={(e) => setFilters(p => ({ ...p, start_date: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField size="small" fullWidth type="date" label="结束日期" InputLabelProps={{ shrink: true }} value={filters.end_date} onChange={(e) => setFilters(p => ({ ...p, end_date: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button size="small" onClick={() => { setFilters({ operator: '', action: '', resource_type: '', start_date: '', end_date: '' }); setPage(0); }}>
              重置筛选
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>时间</TableCell>
              <TableCell>操作人</TableCell>
              <TableCell>操作类型</TableCell>
              <TableCell>资源类型</TableCell>
              <TableCell>资源</TableCell>
              <TableCell>详情</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 6 }}>
                  暂无操作日志记录
                </TableCell>
              </TableRow>
            ) : logs.map((log) => {
              const actionCfg = ACTION_LABELS[log.action] ?? { label: log.action, color: 'default' as const };
              return (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'text.secondary' }}>
                    {new Date(log.created_at).toLocaleString('zh-CN', { hour12: false })}
                  </TableCell>
                  <TableCell>{log.operator_name}</TableCell>
                  <TableCell>
                    <Chip label={actionCfg.label} color={actionCfg.color} size="small" />
                  </TableCell>
                  <TableCell>{RESOURCE_LABELS[log.resource_type] ?? log.resource_type}</TableCell>
                  <TableCell>{log.resource_name ?? (log.resource_id ? `#${log.resource_id}` : '-')}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {log.detail ?? '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{log.ip_address ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          onPageChange={(_, p) => setPage(p)}
        />
      </TableContainer>
    </Box>
  );
}
