'use client';
import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

import type { BehaviorSummary } from '../../types';

type Props = {
  styles: Record<string, string>;
  title?: string;
  selectedCameraName?: string;
  latestTimestamp?: string;
  formatDate: (iso?: string) => string;
  summary: BehaviorSummary | null;
  rangeStart?: string;
  rangeEnd?: string;
};

function BehaviorChips({
  styles,
  summary,
}: {
  styles: Record<string, string>;
  summary: BehaviorSummary | null;
}) {
  const latest = summary;
  const items = [
    {
      key: 'standing',
      label: '站立 平均',
      value: latest?.standingCount ?? 0,
      bg: '#E8F5E9',
    },
    {
      key: 'lying',
      label: '躺卧 平均',
      value: latest?.lyingCount ?? 0,
      bg: '#F3E5F5',
    },
    {
      key: 'drinking',
      label: '饮水 平均',
      value: latest?.drinkingCount ?? 0,
      bg: '#E3F2FD',
    },
    {
      key: 'eating',
      label: '进食 平均',
      value: latest?.eatingCount ?? 0,
      bg: '#FFF3E0',
    },
    {
      key: 'licking',
      label: '舔舐 平均',
      value: latest?.lickingCount ?? 0,
      bg: '#FFEBEE',
    },
  ];

  return (
    <Box display='flex' gap={1} flexWrap='wrap'>
      {items.map((it) => (
        <Chip
          key={it.key}
          label={`${it.label}：${it.value}`}
          sx={{
            backgroundColor: it.bg,
            fontWeight: 700,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        />
      ))}
    </Box>
  );
}

export default function BehaviorSummaryPanel({
  styles,
  title = '状态概览',
  selectedCameraName,
  latestTimestamp,
  formatDate,
  summary,
  rangeStart,
  rangeEnd,
}: Props) {
  const isHistorical = Boolean(rangeStart && rangeEnd);

  return (
    <section className={styles.statusPanel}>
      <div className={styles.statusHeader}>
        <h2 className={styles.statusTitle}>{title}</h2>
        <div className={styles.statusDesc} suppressHydrationWarning>
          {isHistorical ? (
            <>
              时间范围：<strong>{formatDate(rangeStart)}</strong> —{' '}
              <strong>{formatDate(rangeEnd)}</strong>。
              区间平均值（mock）：最近更新时间{' '}
              {formatDate(latestTimestamp ?? undefined)}
            </>
          ) : (
            <>
              基于摄像头 <strong>{selectedCameraName ?? '-'} </strong>{' '}
              的最新汇总数据。 最近更新时间：
              {formatDate(latestTimestamp ?? undefined)}
            </>
          )}
        </div>
      </div>

      <div className={styles.statusCards}>
        <BehaviorChips styles={styles} summary={summary} />
      </div>
    </section>
  );
}
