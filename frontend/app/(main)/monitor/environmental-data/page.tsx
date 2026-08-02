'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Switch,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getPoints, type SparkPoint } from '@/lib/api/sparksApi';
import { typeNameMap, typeColorMap, isBoolPoint } from '@/constants/sensorTypes';

const EnvironmentalDataPage = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<SparkPoint[]>([]);
  const [activeType, setActiveType] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPoints();
        setPoints(data.points || []);
      } catch (e) {
        console.error('Failed to load points:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pointTypes = useMemo(() => {
    const types = new Set(points.map((p) => p.type));
    return Array.from(types).sort();
  }, [points]);

  const displayPoints = useMemo(() => {
    if (activeType === 'all') return points;
    return points.filter((p) => p.type === activeType);
  }, [points, activeType]);

  return (
    <Box>
      <Box sx={{ mb: 2, borderLeft: '4px solid #2E7D32', pl: 1.5, py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" fontWeight={700}>环境数据监控</Typography>
          {loading && <CircularProgress size={18} sx={{ color: '#2E7D32' }} />}
        </Box>
        <Typography variant="body2" color="text.secondary">实时查看所有测点数据，点击类型标签快速筛选</Typography>
      </Box>

      {/* 筛选栏：Chip 标签云 */}
      <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, borderTop: '4px solid #2E7D32', mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <FilterListIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={700}>测点类型</Typography>
          <Typography variant="caption" color="text.secondary">
            （当前显示 {displayPoints.length} 个测点）
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={`全部 (${points.length})`}
            variant={activeType === 'all' ? 'filled' : 'outlined'}
            color={activeType === 'all' ? 'primary' : 'default'}
            onClick={() => setActiveType('all')}
            sx={{
              fontWeight: activeType === 'all' ? 700 : 500,
              fontSize: '0.82rem',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-1px)', boxShadow: 1 },
            }}
          />
          {pointTypes.map((type) => {
            const count = points.filter((p) => p.type === type).length;
            const tc = typeColorMap[type] || { bg: '#f5f5f5', color: '#555' };
            const isActive = activeType === type;
            return (
              <Chip
                key={type}
                label={`${typeNameMap[type] || type} (${count})`}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() => setActiveType(type)}
                sx={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.82rem',
                  bgcolor: isActive ? tc.color : 'transparent',
                  color: isActive ? '#fff' : tc.color,
                  borderColor: tc.color,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive ? tc.color : `${tc.color}15`,
                    borderColor: tc.color,
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                  },
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {/* 数据表 */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(46,125,50,0.08)', '& th': { fontWeight: 700, fontSize: '0.875rem' } }}>
              <TableCell sx={{ width: '28%' }}>测点名称</TableCell>
              <TableCell sx={{ width: '14%' }}>测点ID</TableCell>
              <TableCell sx={{ width: '12%' }}>类型</TableCell>
              <TableCell sx={{ width: '10%' }}>在线状态</TableCell>
              <TableCell sx={{ width: '18%' }}>最新值</TableCell>
              <TableCell sx={{ width: '18%' }}>更新时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayPoints.length > 0 ? (
              displayPoints.map((p) => {
                const tc = typeColorMap[p.type] || { bg: '#f5f5f5', color: '#555' };
                const isDevice = isBoolPoint(p.point_id);
                const switchOn = p.value === 'true';
                return (
                  <TableRow key={p.point_id} sx={{ '&:hover': { backgroundColor: 'rgba(46,125,50,0.04)' }, '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{p.point_name || p.point_id}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.point_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={typeNameMap[p.type] || p.type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20, borderColor: tc.color, color: tc.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="在线" color="success" size="small" />
                    </TableCell>
                    <TableCell>
                      {isDevice ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Switch
                            size="small"
                            checked={switchOn}
                            readOnly
                            color={switchOn ? 'success' : 'default'}
                            sx={{ '& .MuiSwitch-track': { opacity: 0.3 } }}
                          />
                          <Typography variant="body2" sx={{ color: switchOn ? '#2E7D32' : '#999', fontWeight: 600, fontSize: '0.85rem' }}>
                            {switchOn ? '开' : '关'}
                          </Typography>
                        </Stack>
                      ) : (
                        <Box component="span" sx={{ fontWeight: 600, color: tc.color, fontSize: '0.9rem' }}>
                          {p.value} {p.unit}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      {p.updated_at ? new Date(p.updated_at).toLocaleString('zh-CN') : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography sx={{ p: 3, color: 'text.secondary' }}>
                    {loading ? '加载中...' : '该类型下暂无测点'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EnvironmentalDataPage;
