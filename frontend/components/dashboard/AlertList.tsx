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
} from '@mui/material';
import { Sensor, Camera } from '../../types';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { mockSheds } from '@/constants/mockData';

type Device = (Sensor | Camera) & { deviceType: 'Sensor' | 'Camera' };

interface DeviceStatusListProps {
  devices: Device[];
}

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

const DeviceStatusList: React.FC<DeviceStatusListProps> = ({ devices }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        异常设备列表
      </Typography>
      {devices.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%' }}>
            <Typography color="text.secondary">所有设备运行正常</Typography>
        </Box>
      ) : (
        <List dense>
          {devices.map((device) => {
            const shedName = mockSheds.find(shed => shed.id === device.shedId)?.name || '未知羊舍';
            return (
              <ListItem key={device.id} secondaryAction={getStatusChip(device.status)}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getStatusIcon(device.status)}
                </ListItemIcon>
                <ListItemText
                  primary={device.name}
                  secondary={`${device.deviceType} @ ${shedName}`}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
};

export default DeviceStatusList;
