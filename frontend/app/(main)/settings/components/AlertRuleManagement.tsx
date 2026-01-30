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
import { mockAlertRules, SENSOR_NAMES, CONDITIONS, NOTIFICATION_METHODS, SMART_RULE_DESCRIPTIONS } from '@/constants/mockData';
import { AlertRule } from '@/types';

type AlertRuleFormData = Omit<AlertRule, 'id'> & { id?: string };

export default function AlertRuleManagement() {
  const [rules, setRules] = useState<AlertRule[]>(mockAlertRules);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlertRuleFormData>({
    name: '',
    sensorName: '所有设备',
    ruleType: 'manual',
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
        ruleType: rule.ruleType,
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
        ruleType: 'manual',
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
    if (!formData.name) {
      alert('请填写规则名称');
      return;
    }

    // 只有手动模式需要验证阈值
    if (formData.ruleType === 'manual' && formData.threshold === undefined) {
      alert('请填写阈值');
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
                ruleType: formData.ruleType,
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
        ruleType: formData.ruleType,
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

  // 获取智能规则的描述信息
  const getSmartRuleDescription = (sensorName: string, condition: string) => {
    const descriptions = {
      '温度': SMART_RULE_DESCRIPTIONS.temperature,
      '湿度': SMART_RULE_DESCRIPTIONS.humidity,
      '氨气': SMART_RULE_DESCRIPTIONS.gas,
      'CO2': SMART_RULE_DESCRIPTIONS.gas,
      '光照': SMART_RULE_DESCRIPTIONS.general,
      '所有设备': SMART_RULE_DESCRIPTIONS.general
    };
    
    for (const [key, description] of Object.entries(descriptions)) {
      if (sensorName.includes(key)) {
        return description;
      }
    }
    return SMART_RULE_DESCRIPTIONS.general;
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
            <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>模式</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>条件/描述</TableCell>
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
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <span>{rule.ruleType === 'smart' ? '🧠' : '📌'}</span>
                    <Switch
                      size="small"
                      checked={rule.ruleType === 'smart'}
                      onChange={() => {
                        setRules(rules.map((r) => 
                          r.id === rule.id 
                            ? { ...r, ruleType: r.ruleType === 'smart' ? 'manual' : 'smart' } 
                            : r
                        ));
                      }}
                    />
                    <span>{rule.ruleType === 'smart' ? '智能' : '手动'}</span>
                  </Box>
                </TableCell>
                <TableCell>
                  {rule.ruleType === 'smart' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span style={{ fontWeight: 500, color: '#1976d2' }}>AI智能模式</span>
                    </Box>
                  ) : (
                    getConditionLabel(rule.condition)
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {rule.ruleType === 'smart' ? (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>无</span>
                  ) : (
                    <span style={{ fontWeight: 500 }}>{rule.threshold}</span>
                  )}
                </TableCell>
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
          {editingId ? '编辑警告规则' : '添加警告规则'}
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

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ruleType === 'smart'}
                    onChange={(e) => {
                      const isSmart = e.target.checked;
                      const smartDefaults = {
                        '东侧温度计': { name: '智能温度异常检测', threshold: 0 },
                        '西侧温度计': { name: '智能温度自适应预警', threshold: 0 },
                        '中央湿度计': { name: '湿度自适应预警', threshold: 0 },
                        '南侧湿度计': { name: '智能湿度监测', threshold: 0 },
                        '氨气传感器': { name: '气体浓度智能监测', threshold: 0 },
                        'CO2传感器': { name: '二氧化碳智能监测', threshold: 0 },
                        '光照传感器': { name: '光照智能监测', threshold: 0 },
                        '所有设备': { name: '设备异常智能检测', threshold: 0 }
                      };
                      
                      const defaultForSensor = smartDefaults[formData.sensorName as keyof typeof smartDefaults] || 
                        { name: '智能监测规则', threshold: 0 };

                      setFormData({ 
                        ...formData, 
                        ruleType: isSmart ? 'smart' : 'manual',
                        name: isSmart ? defaultForSensor.name : formData.name.replace(/智能|AI|监测|检测/g, '').trim() || '规则',
                        condition: isSmart ? 'gt' : (formData.condition || 'gt'),
                        threshold: isSmart ? 0 : (formData.threshold || 25)
                      });
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.ruleType === 'smart' ? (
                      <>
                        <span>🧠</span>
                        <span>智能规则</span>
                      </>
                    ) : (
                      <>
                        <span>📌</span>
                        <span>手动规则</span>
                      </>
                    )}
                  </Box>
                }
                labelPlacement="start"
                sx={{ 
                  justifyContent: 'space-between',
                  marginLeft: 0,
                  marginRight: 0,
                  width: '100%'
                }}
              />

            {formData.ruleType === 'manual' ? (
              <>
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
              </>
            ) : (
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  fontSize: '0.875rem',
                  color: 'text.secondary'
                }}
              >
                <Box sx={{ mb: 1, fontWeight: 500 }}>🧠 智能规则特性：</Box>
                <Box>• AI模型自动分析历史数据，动态调整警告规则，无需手动设置固定阈值</Box>
                {formData.sensorName && (
                  <Box sx={{ mt: 1, fontStyle: 'italic' }}>
                    当前针对: {formData.sensorName} - {getSmartRuleDescription(formData.sensorName, formData.condition)}
                  </Box>
                )}
              </Box>
            )}

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
