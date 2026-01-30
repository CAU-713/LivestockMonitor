'use client';
import React from 'react';
import { Chip, Box, Stack, Typography, Paper, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import type { BehaviorSummary } from '../../../../types';

type Props = {
  title?: string;
  selectedCameraName?: string;
  latestTimestamp?: string;
  formatDate: (iso?: string) => string;
  summary: BehaviorSummary | null;
  rangeStart?: string;
  rangeEnd?: string;
  headerAction?: React.ReactNode;
};

function BehaviorChips({ summary }: { summary: BehaviorSummary | null }) {
  const theme = useTheme();
  const items = [
    {
      key: 'standing',
      label: '站立',
      value: summary?.standingCount ?? 0,
      color: 'success',
    },
    {
      key: 'lying',
      label: '躺卧',
      value: summary?.lyingCount ?? 0,
      color: 'secondary',
    },
    {
      key: 'drinking',
      label: '饮水',
      value: summary?.drinkingCount ?? 0,
      color: 'info',
    },
    {
      key: 'eating',
      label: '进食',
      value: summary?.eatingCount ?? 0,
      color: 'warning',
    },
    {
      key: 'licking',
      label: '舔舐',
      value: summary?.lickingCount ?? 0,
      color: 'error',
    },
  ] as const;

  return (
    <Box display='flex' gap={1.5} flexWrap='wrap'>
      {items.map((it) => (
        <Chip
          key={it.key}
          label={`${it.label}：${it.value}`}
          color={it.color}
          variant='filled'
          sx={{
            fontWeight: 600,
            color: theme.palette.getContrastText(theme.palette[it.color].main),
            backgroundColor: theme.palette[it.color].light,
          }}
        />
      ))}
    </Box>
  );
}

export default function BehaviorSummaryPanel({
  title = '状态概览',
  selectedCameraName,
  latestTimestamp,
  formatDate,
  summary,
  rangeStart,
  rangeEnd,
  headerAction,
}: Props) {
  const isHistorical = Boolean(rangeStart && rangeEnd);

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        <Stack spacing={1}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h6' fontWeight={600}>
              {title}
            </Typography>
            {headerAction}
          </Stack>
        </Stack>
        <Divider />
        <BehaviorChips summary={summary} />
      </Stack>
    </Paper>
  );
}
