'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { mockAlertRules, SENSOR_NAMES, CONDITIONS, NOTIFICATION_METHODS } from '@/constants/mockData';
import { AlertRule } from '@/types';

type AlertRuleFormData = Omit<AlertRule, 'id'> & { id?: string };

export default function AlertRuleManagement() {
  const [rules, setRules] = useState<AlertRule[]>(mockAlertRules);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlertRuleFormData>({
    name: '',
    sensorName: '所有设备',
    condition: 'gt',
    threshold: 0,
    notificationMethod: 'email',
    enabled: true,
  });

  const handleOpenDialog = (rule?: AlertRule) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({
        id: rule.id,
        name: rule.name,
        sensorName: rule.sensorName,
        condition: rule.condition,
        threshold: rule.threshold,
        notificationMethod: rule.notificationMethod,
        enabled: rule.enabled,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        sensorName: '所有设备',
        condition: 'gt',
        threshold: 0,
        notificationMethod: 'email',
        enabled: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name || formData.threshold === undefined) {
      alert('请填写所有必填字段');
      return;
    }

    if (editingId) {
      setRules(
        rules.map((r) =>
          r.id === editingId
            ? {
                ...r,
                name: formData.name,
                sensorName: formData.sensorName,
                condition: formData.condition,
                threshold: formData.threshold,
                notificationMethod: formData.notificationMethod,
                enabled: formData.enabled,
              }
            : r,
        ),
      );
    } else {
      const newRule: AlertRule = {
        id: String(Math.max(...rules.map((r) => parseInt(r.id)), 0) + 1),
        name: formData.name,
        sensorName: formData.sensorName,
        condition: formData.condition,
        threshold: formData.threshold,
        notificationMethod: formData.notificationMethod,
        enabled: formData.enabled,
      };
      setRules([...rules, newRule]);
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该告警规则吗？')) {
      setRules(rules.filter((r) => r.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const getConditionLabel = (condition: string) => {
    return CONDITIONS.find((c) => c.value === condition)?.label || condition;
  };

  const getNotificationMethodLabel = (method: string) => {
    return NOTIFICATION_METHODS.find((m) => m.value === method)?.label || method;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
          }}
        >
          添加规则
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>规则名称</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>传感器名称</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>条件</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>阈值</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>通知方式</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>启用状态</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow
                key={rule.id}
                sx={{
                  '&:hover': { backgroundColor: '#fafafa' },
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell sx={{ fontWeight: 500 }}>{rule.name}</TableCell>
                <TableCell>
                  <Chip label={rule.sensorName} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{getConditionLabel(rule.condition)}</TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 500 }}>{rule.threshold}</TableCell>
                <TableCell>{getNotificationMethodLabel(rule.notificationMethod)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Switch
                    size="small"
                    checked={rule.enabled}
                    onChange={() => handleToggle(rule.id)}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(rule)}
                      sx={{ color: '#1976d2' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(rule.id)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? '编辑告警规则' : '添加告警规则'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="规则名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              size="small"
              placeholder="输入规则名称"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>传感器名称</InputLabel>
              <Select
                value={formData.sensorName}
                onChange={(e) => setFormData({ ...formData, sensorName: e.target.value })}
                label="传感器名称"
              >
                {SENSOR_NAMES.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>条件</InputLabel>
              <Select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                label="条件"
              >
                {CONDITIONS.map((cond) => (
                  <MenuItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="阈值"
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
              size="small"
              placeholder="输入阈值"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>通知方式</InputLabel>
              <Select
                value={formData.notificationMethod}
                onChange={(e) =>
                  setFormData({ ...formData, notificationMethod: e.target.value as any })
                }
                label="通知方式"
              >
                {NOTIFICATION_METHODS.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
              }
              label="启用"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
