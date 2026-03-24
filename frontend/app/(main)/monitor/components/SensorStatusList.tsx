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
  Box,
} from '@mui/material';
import { Sensor } from '@/types';
import { SensorForList } from '@/app/(main)/monitor/environmental-data/page';

interface SensorStatusListProps {
  sensors: SensorForList[];
}

const getStatusConfig = (status: Sensor['status']): { label: string; color: 'success' | 'default' | 'error' | 'warning' } => {
  switch (status) {
    case 'active':
      return { label: '在线', color: 'success' };
    case 'inactive':
      return { label: '未激活', color: 'warning' };
    case 'error':
      return { label: '故障', color: 'error' };
    default:
      return { label: status, color: 'default' };
  }
};

const SensorStatusList: React.FC<SensorStatusListProps> = ({ sensors }) => {
  return (
    <TableContainer
      component={Paper}
      elevation={2}
      sx={{
        mt: 2,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Table aria-label="sensor status table">
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: 'rgba(46,125,50,0.08)',
              '& th': { fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' },
            }}
          >
            <TableCell sx={{ width: '30%' }}>传感器名称</TableCell>
            <TableCell sx={{ width: '25%' }}>所属畜舍</TableCell>
            <TableCell sx={{ width: '15%' }}>类型</TableCell>
            <TableCell sx={{ width: '15%' }}>状态</TableCell>
            <TableCell sx={{ width: '15%', textAlign: 'right' }}>最新读数</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sensors.length > 0 ? (
            sensors.map((sensor) => {
              const statusCfg = getStatusConfig(sensor.status);
              const isError = sensor.status === 'error';
              return (
                <TableRow
                  key={sensor.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(46,125,50,0.04)' },
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{sensor.name}</TableCell>
                  <TableCell>{sensor.shedName}</TableCell>
                  <TableCell>
                    <Chip
                      label={sensor.type}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        borderColor: 'rgba(46,125,50,0.3)',
                        color: '#2E7D32',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusCfg.label}
                      color={statusCfg.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: isError ? 'error.main' : 'text.primary',
                        fontSize: '0.9rem',
                      }}
                    >
                      {sensor.lastReading !== undefined ? sensor.lastReading : 'N/A'}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography sx={{ p: 3, color: 'text.secondary' }}>没有匹配的传感器</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SensorStatusList;
