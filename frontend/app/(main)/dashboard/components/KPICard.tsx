import React from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'danger';
  accentColor?: string;   // 图标区和左侧色条颜色
  bgColor?: string;       // 图标背景色
  subtitle?: string;      // 底部小文字描述（可选）
}

const KPICard: React.FC<KPICardProps> = ({
  icon,
  title,
  value,
  unit,
  status = 'normal',
  accentColor = '#2E7D32',
  bgColor = '#E8F5E9',
  subtitle,
}) => {

  const getValueColor = () => {
    switch (status) {
      case 'warning':
        return '#FB8C00';
      case 'danger':
        return '#E53935';
      default:
        return '#1A1A1A';
    }
  };

  const getStatusDot = () => {
    if (status === 'normal') return null;
    return (
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: status === 'warning' ? '#FB8C00' : '#E53935',
          flexShrink: 0,
        }}
      />
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        borderRadius: 3,
        height: '100%',
        borderLeft: `4px solid ${accentColor}`,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: `0 6px 20px rgba(0,0,0,0.12)`,
          transform: 'translateY(-2px)',
        },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 右上角装饰半圆 */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: bgColor,
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative' }}>
        {/* 图标区 */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        {/* 文字区 */}
        <Stack sx={{ flex: 1 }} spacing={0.25}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
              {title}
            </Typography>
            {getStatusDot()}
          </Stack>

          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color: getValueColor(), lineHeight: 1.1 }}
            >
              {value}
            </Typography>
            {unit && (
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {unit}
              </Typography>
            )}
          </Stack>

          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default KPICard;
