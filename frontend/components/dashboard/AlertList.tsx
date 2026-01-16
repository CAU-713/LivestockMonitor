import React from 'react';
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
import { Sensor, Camera } from '../../types';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import { mockSheds } from '@/constants/mockData';

type Device = (Sensor | Camera) & { deviceType: 'Sensor' | 'Camera' };

interface DeviceStatusListProps {
  devices: Device[];
}

type WarningItem = {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  shedId?: string;
};

// 局部假数据：预警信息，由智能化流程产生（示例）
const mockWarnings: WarningItem[] = [
  { id: 'warn-1', title: '热应激预警', message: '基于温湿度与行为，检测到热应激上升', severity: 'warning', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), shedId: 'shed-b' },
  { id: 'warn-2', title: '氨气短时上升', message: '氨气浓度短时升高，建议排风', severity: 'critical', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), shedId: 'shed-a' },
  { id: 'warn-3', title: '行为突增', message: '摄像头检测到行为突增，可能被惊扰', severity: 'info', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), shedId: 'shed-a' },
];

const getStatusChip = (status: Sensor['status'] | Camera['status']) => {
  switch (status) {
    case 'inactive':
      return <Chip label="Inactive" color="warning" size="small" />;
    case 'error':
      return <Chip label="Error" color="error" size="small" />;
    case 'offline':
      return <Chip label="Offline" color="error" size="small" />;
    default:
      return null;
  }
};

const getStatusIcon = (status: Sensor['status'] | Camera['status']) => {
    switch (status) {
      case 'inactive':
        return <WarningAmberIcon color="warning" />;
      case 'error':
      case 'offline':
        return <ErrorOutlineIcon color="error" />;
      default:
        return null;
    }
  };

const getSeverityChip = (severity: WarningItem['severity']) => {
  switch (severity) {
    case 'info':
      return <Chip label="信息" color="info" size="small" />;
    case 'warning':
      return <Chip label="警告" color="warning" size="small" />;
    case 'critical':
      return <Chip label="严重" color="error" size="small" />;
    default:
      return null;
  }
};

const getSeverityIcon = (severity: WarningItem['severity']) => {
  switch (severity) {
    case 'info':
      return <InfoIcon color="info" />;
    case 'warning':
      return <WarningAmberIcon color="warning" />;
    case 'critical':
      return <ErrorOutlineIcon color="error" />;
    default:
      return null;
  }
};

const DeviceStatusList: React.FC<DeviceStatusListProps> = ({ devices }) => {
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
      <Box sx={{ p: 0, minHeight: 0, flex: '1 1 50%', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Paper elevation={1} sx={{ p: 1.25, borderRadius: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0.5 }}>
            异常设备列表
          </Typography>
          <Box sx={{ display: 'flex', px: 1.5, py: 0.5, alignItems: 'center', width: '100%' }}>
            <Box sx={{ minWidth: 40 }} />
            <Typography variant="subtitle2" fontWeight={500} sx={{ flex: 1, ml: 2, fontSize: 16 }}>
              设备名
            </Typography>
            <Typography variant="subtitle2" fontWeight={500} sx={{ width: 80, fontSize: 16, textAlign: 'right' }}>
              设备情况
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {devices.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <Typography color="text.secondary">所有设备运行正常</Typography>
              </Box>
            ) : (
              <List dense sx={{ py: 0 }}>
                {devices.map((device) => {
                  const shedName = mockSheds.find(shed => shed.id === device.shedId)?.name || '未知羊舍';
                  return (
                    <ListItem
                      key={device.id}
                      secondaryAction={
                        <Box sx={{ width: 80, display: 'flex', justifyContent: 'flex-end' }}>
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
      <Box sx={{ p: 0, minHeight: 0, flex: '1 1 50%', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Paper elevation={1} sx={{ p: 1.25, borderRadius: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5 }}>
            预警信息列表
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <List dense sx={{ py: 0 }}>
              {mockWarnings.map((w) => {
                const shedName = mockSheds.find(s => s.id === w.shedId)?.name || '未知羊舍';
                return (
                  <React.Fragment key={w.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>{getSeverityIcon(w.severity)}</ListItemIcon>
                      <ListItemText
                        primary={w.title}
                        secondary={`${w.message} · ${shedName} · ${formatWarningTime(w.timestamp)}`}
                        sx={{
                          flex: 1,
                          '.MuiListItemText-primary': {
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                      <Box sx={{ width: 90, display: 'flex', justifyContent: 'flex-end' }}>{getSeverityChip(w.severity)}</Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        </Paper>
      </Box>
    </Paper>
  );
};

// 格式化警告时间，避免 hydration 错误
const formatWarningTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default DeviceStatusList;
