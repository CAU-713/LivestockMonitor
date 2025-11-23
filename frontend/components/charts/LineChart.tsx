'use client';
import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { MergedChartData } from '@/types';
import { Box, Typography, Paper } from '@mui/material';

interface LineChartProps {
  chartData: MergedChartData;
}

const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
  // The title is now handled by the parent dashboard page
  const { unit, lines, data } = chartData;

  const hasRange = lines.some(line => line.dataKey === 'range');

  return (
    // The Paper and Title are now handled by the parent dashboard page
    <Box sx={{ height: 320 }}> 
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: unit, angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number, name) => [`${value} ${unit}`, name]} />
          <Legend />

          {hasRange && (
            <Area
              type="monotone"
              dataKey="range"
              stroke={lines.find(l => l.dataKey === 'range')?.color}
              fill={lines.find(l => l.dataKey === 'range')?.color}
              fillOpacity={0.2}
              strokeWidth={0}
              name="波动范围"
            />
          )}

          {lines.filter(l => l.dataKey !== 'range').map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              activeDot={{ r: 8 }}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LineChart;
