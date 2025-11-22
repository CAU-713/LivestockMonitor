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
} from 'recharts';
import { MergedChartData } from '@/types';
import { Box, Typography, Paper } from '@mui/material';

interface LineChartProps {
  chartData: MergedChartData;
}

const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
  const { title, unit, lines, data } = chartData;

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" component="div" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: unit, angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: number, name) => [`${value} ${unit}`, name]} />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                activeDot={{ r: 8 }}
                dot={false} // Hide dots for cleaner look with dense data
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default LineChart;
