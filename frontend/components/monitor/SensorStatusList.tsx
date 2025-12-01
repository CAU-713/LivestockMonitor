'use client';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { Sensor } from '@/types';
import { SensorForList } from '@/app/(main)/monitor/environmental-data/page'; // Import the enhanced type

interface SensorStatusListProps {
  sensors: SensorForList[]; // Use the enhanced type
}

const SensorStatusList: React.FC<SensorStatusListProps> = ({ sensors }) => {
  const getStatusColor = (status: Sensor['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table aria-label='sensor status table'>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '30%' }}>名称</TableCell>
            <TableCell sx={{ width: '30%' }}>所属舍</TableCell>
            <TableCell sx={{ width: '20%' }}>状态</TableCell>
            <TableCell sx={{ width: '20%', textAlign: 'right' }}>最新数值</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sensors.length > 0 ? (
            sensors.map((sensor) => (
              <TableRow key={sensor.id}>
                <TableCell sx={{ width: '30%' }}>{sensor.name}</TableCell>
                <TableCell sx={{ width: '30%' }}>{sensor.shedName}</TableCell>
                <TableCell sx={{ width: '20%' }}>
                  <Chip
                    label={sensor.status}
                    color={getStatusColor(sensor.status)}
                    size='small'
                  />
                </TableCell>
                <TableCell sx={{ width: '20%', textAlign: 'right' }}>
                  {sensor.lastReading !== undefined
                    ? sensor.lastReading
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align='center'>
                <Typography sx={{ p: 2 }}>没有匹配的传感器</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SensorStatusList;
