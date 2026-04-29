import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import { Sensor, Camera, Alert } from '../../../../types';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import { mockSheds } from '@/constants/mockData';
import { alertApi } from '@/lib/api/apiService';

type Device = (Sensor | Camera) & { deviceType: 'Sensor' | 'Camera' };

interface DeviceStatusListProps {
  devices: Device[];
}



const getStatusChip = (status: Sensor['status'] | Camera['status']) => {
  switch (status) {
    case 'inactive':
      return <Chip label='Inactive' color='warning' size='small' />;
    case 'error':
      return <Chip label='Error' color='error' size='small' />;
    case 'offline':
      return <Chip label='Offline' color='error' size='small' />;
    default:
      return null;
  }
};

const getStatusIcon = (status: Sensor['status'] | Camera['status']) => {
  switch (status) {
    case 'inactive':
      return <WarningAmberIcon color='warning' />;
    case 'error':
    case 'offline':
      return <ErrorOutlineIcon color='error' />;
    default:
      return null;
  }
};

const getSeverityChip = (severity: Alert['severity']) => {
  switch (severity) {
    case 'low':
      return <Chip label='低危' color='info' size='small' />;
    case 'medium':
      return <Chip label='中危' color='warning' size='small' />;
    case 'high':
      return <Chip label='高危' color='error' size='small' />;
    default:
      return null;
  }
};

const getSeverityIcon = (severity: Alert['severity']) => {
  switch (severity) {
    case 'low':
      return <InfoIcon color='info' />;
    case 'medium':
      return <WarningAmberIcon color='warning' />;
    case 'high':
      return <ErrorOutlineIcon color='error' />;
    default:
      return null;
  }
};

const DeviceStatusList: React.FC<DeviceStatusListProps> = ({ devices }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载未解决的告警列表
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const res = await alertApi.getAlerts({
          resolved: false,
          page_size: 10,
        });
        setAlerts(res.items);
      } catch (e) {
        console.warn('[DeviceStatusList] 加载告警失败', e);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 3,
        // 限制最大高度以保证不向下扩展（保留原始区域大小）
        maxHeight: 410,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }}
    >
      {/* 上部：异常设备列表（放入独立小卡片，内部可滚动） */}
      <Box
        sx={{
          p: 0,
          minHeight: 0,
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.25,
            borderRadius: 2,
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant='h6' gutterBottom sx={{ mb: 0.5 }}>
            异常设备列表
          </Typography>
          <Box
            sx={{
              display: 'flex',
              px: 1.5,
              py: 0.5,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Box sx={{ minWidth: 40 }} />
            <Typography
              variant='subtitle2'
              fontWeight={500}
              sx={{ flex: 1, ml: 2, fontSize: 16 }}
            >
              设备名
            </Typography>
            <Typography
              variant='subtitle2'
              fontWeight={500}
              sx={{ width: 80, fontSize: 16, textAlign: 'right' }}
            >
              设备情况
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {devices.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 120,
                }}
              >
                <Typography color='text.secondary'>所有设备运行正常</Typography>
              </Box>
            ) : (
              <List dense sx={{ py: 0 }}>
                {devices.map((device) => {
                  const shedName =
                    mockSheds.find((shed) => shed.id === device.shedId)?.name ||
                    '未知羊舍';
                  return (
                    <ListItem
                      key={device.id}
                      secondaryAction={
                        <Box
                          sx={{
                            width: 80,
                            display: 'flex',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {getStatusChip(device.status)}
                        </Box>
                      }
                      sx={{ px: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getStatusIcon(device.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={device.name}
                        secondary={`${device.deviceType} @ ${shedName}`}
                        sx={{
                          flex: 1,
                          '.MuiListItemText-primary': {
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>
      </Box>

      {/* 下部：预警信息列表（放入独立小卡片，内部可滚动） */}
      <Box
        sx={{
          p: 0,
          minHeight: 0,
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.25,
            borderRadius: 2,
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant='subtitle1' gutterBottom sx={{ mb: 0.5 }}>
            告警信息列表
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <List dense sx={{ py: 0 }}>
              {loading ? (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={<Typography color='text.secondary'>加载中...</Typography>}
                  />
                </ListItem>
              ) : alerts.length === 0 ? (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={<Typography color='text.secondary'>暂无未解决告警</Typography>}
                  />
                </ListItem>
              ) : (
                alerts.map((alert) => (
                  <React.Fragment key={alert.id}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getSeverityIcon(alert.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant='body2'
                            sx={{
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const,
                              overflow: 'hidden',
                            }}
                          >
                            {alert.description}
                            <Typography
                              component='span'
                              variant='caption'
                              color='text.secondary'
                              sx={{ ml: 1 }}
                            >
                              · {alert.shed_name || `羊舍#${alert.shed_id}`} · {formatAlertTime(alert.alert_time)}
                            </Typography>
                          </Typography>
                        }
                        sx={{ flex: 1, my: 0 }}
                      />
                      <Box
                        sx={{
                          width: 56,
                          display: 'flex',
                          justifyContent: 'flex-end',
                          ml: 1,
                        }}
                      >
                        {getSeverityChip(alert.severity)}
                      </Box>
                    </ListItem>
                    <Divider component='li' sx={{ opacity: 0.6 }} />
                  </React.Fragment>
                ))
              )}
            </List>
          </Box>
        </Paper>
      </Box>
    </Paper>
  );
};

// 格式化告警时间，避免 hydration 错误
const formatAlertTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default DeviceStatusList;
