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
            <TableCell>传感器ID</TableCell>
            <TableCell>名称</TableCell>
            <TableCell>所属舍</TableCell> {/* Changed from ID to Name */}
            <TableCell>类型</TableCell>
            <TableCell>状态</TableCell>
            <TableCell align='right'>最新读数</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sensors.length > 0 ? (
            sensors.map((sensor) => (
              <TableRow key={sensor.id}>
                <TableCell component='th' scope='row'>
                  {sensor.id}
                </TableCell>
                <TableCell>{sensor.name}</TableCell>
                <TableCell>{sensor.shedName}</TableCell>{' '}
                {/* Display shedName */}
                <TableCell>{sensor.type}</TableCell>
                <TableCell>
                  <Chip
                    label={sensor.status}
                    color={getStatusColor(sensor.status)}
                    size='small'
                  />
                </TableCell>
                <TableCell align='right'>
                  {sensor.lastReading !== undefined
                    ? sensor.lastReading
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align='center'>
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
