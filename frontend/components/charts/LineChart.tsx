'use client';
import React, { useState, useEffect } from 'react';
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
  ReferenceLine,
} from 'recharts';
import { MergedChartData } from '@/types';
import { Box } from '@mui/material';

interface LineChartProps {
  chartData: MergedChartData;
}

const LineChart: React.FC<LineChartProps> = ({ chartData }) => {
  const { unit, lines, data, yAxes, referenceX } = chartData;

  // 每条线的可见性状态
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  // 当 lines 变化时，重置隐藏状态（新图表加载时全部显示）
  useEffect(() => {
    setHiddenKeys(new Set());
  }, [lines.length, data.length, chartData.title]);

  const handleLegendClick = (e: any) => {
    // e.dataKey 来自 Recharts 内部事件对象
    const key = e?.dataKey;
    if (!key) return;
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;
    return (
      <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
        {payload.map((entry: any) => {
          const isHidden = hiddenKeys.has(entry.dataKey);
          return (
            <li
              key={entry.value}
              onClick={() => handleLegendClick({ dataKey: entry.dataKey })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginRight: 14,
                cursor: 'pointer',
                userSelect: 'none',
                opacity: isHidden ? 0.4 : 1,
                textDecoration: isHidden ? 'line-through' : 'none',
                transition: 'opacity 0.15s',
              }}
              title={isHidden ? '点击恢复显示' : '点击隐藏'}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  marginRight: 6,
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#333' }}>{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const hasRange = lines.some((line) => line.dataKey === 'range');

  return (
    <Box sx={{ height: 320 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='time' />
          {referenceX && (
            <ReferenceLine
              x={referenceX}
              stroke='#999'
              strokeDasharray='3 3'
              label={{ value: '预测开始', position: 'insideTopRight', fontSize: 12, fill: '#666' }}
            />
          )}

          {yAxes && yAxes.length > 0 ? (
            yAxes.map((axis) => (
              <YAxis
                key={axis.id}
                yAxisId={axis.id}
                orientation={axis.orientation || 'left'}
                label={{
                  value: axis.unit,
                  angle: -90,
                  position:
                    axis.orientation === 'right' ? 'insideRight' : 'insideLeft',
                  style: { textAnchor: 'middle' },
                }}
                stroke={axis.color}
              />
            ))
          ) : (
            <YAxis
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
            />
          )}

          <Tooltip
            formatter={(value: any, name: any, item: any): any => {
              const line = lines.find((l) => l.dataKey === item.dataKey);
              let suffix = unit || '';
              if (line?.yAxisId && yAxes) {
                const axis = yAxes.find((a) => a.id === line.yAxisId);
                if (axis) suffix = axis.unit;
              }
              return [`${value ?? ''} ${suffix}`, name ?? ''];
            }}
          />
          <Legend content={renderLegend} />

          {hasRange && (
            <Area
              type='monotone'
              dataKey='range'
              stroke={lines.find((l) => l.dataKey === 'range')?.color}
              fill={lines.find((l) => l.dataKey === 'range')?.color}
              fillOpacity={0.2}
              strokeWidth={0}
              name='波动范围'
            />
          )}

          {lines
            .filter((l) => l.dataKey !== 'range')
            .map((line) => (
              <Line
                key={line.dataKey}
                yAxisId={line.yAxisId}
                type='monotone'
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                activeDot={{ r: 8 }}
                dot={false}
                hide={hiddenKeys.has(line.dataKey)}
                // 让图例默认行为不阻止我们的 click
                connectNulls
              />
            ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LineChart;
