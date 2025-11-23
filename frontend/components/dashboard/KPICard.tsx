import React from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'danger';
}

const KPICard: React.FC<KPICardProps> = ({ icon, title, value, unit, status = 'normal' }) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'warning':
        return theme.palette.warning.main;
      case 'danger':
        return theme.palette.error.main;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (theme) => theme.palette.action.hover,
            color: (theme) => theme.palette.primary.main,
          }}
        >
          {icon}
        </Box>
        <Stack>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: getStatusColor() }}>
              {value}
            </Typography>
            {unit && (
              <Typography variant="h6" color="text.secondary">
                {unit}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default KPICard;
