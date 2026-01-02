'use client';
import React from 'react';
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CloudIcon from '@mui/icons-material/Cloud';

export interface ComfortAssessment {
  status: 'comfort' | 'mild-heat-stress' | 'moderate-heat-stress' | 'severe-heat-stress' | 'cold-stress';
  label: string;
  color: string;
  backgroundColor: string;
  description: string;
  thi?: number; // Temperature Humidity Index
}

interface ComfortAssessmentPanelProps {
  assessment: ComfortAssessment;
}

const ComfortAssessmentPanel: React.FC<ComfortAssessmentPanelProps> = ({ assessment }) => {
  const getChipColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'comfort':
        return 'success';
      case 'mild-heat-stress':
      case 'cold-stress':
        return 'warning';
      case 'moderate-heat-stress':
      case 'severe-heat-stress':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        // 收窄纵向高度并允许内部滚动，避免撑高父容器
        maxHeight: 110,
        overflow: 'auto',
        background: `linear-gradient(135deg, ${assessment.backgroundColor}20 0%, ${assessment.backgroundColor}10 100%)`,
        border: `2px solid ${assessment.color}40`,
      }}
    >
      <Stack spacing={1.5}>
        {/* 标题和状态指示 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            环境舒适度
          </Typography>
          <Chip
            label={assessment.label}
            color={getChipColor(assessment.status)}
            size="small"
            icon={<ThermostatIcon />}
          />
        </Box>

        {/* THI指数显示 */}
        {assessment.thi !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon sx={{ fontSize: 18, color: assessment.color }} />
            <Typography variant="body2" sx={{ fontSize: '12px' }}>
              THI指数: <strong style={{ color: assessment.color }}>{assessment.thi.toFixed(1)}</strong>
            </Typography>
          </Box>
        )}

        {/* 描述信息 */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.4,
            fontSize: '11px',
          }}
        >
          {assessment.description}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default ComfortAssessmentPanel;
export type { ComfortAssessment };
