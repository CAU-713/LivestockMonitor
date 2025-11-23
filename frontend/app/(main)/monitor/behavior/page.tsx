// app/(main)/monitor/behavior/page.tsx
'use client';
import React, { useState } from 'react';
import { Container, Paper, Stack, Typography } from '@mui/material';

import {
  mockSheds,
  mockCameras,
  mockBehaviorSummaries,
} from '../../../../constants/mockData';

import CameraHeader from '../../../../components/monitor/CameraHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';
import BehaviorSummaryPanel from '../../../../components/monitor/BehaviorSummaryPanel';

import type { BehaviorSummary } from '../../../../types';

const defaultShed = mockSheds?.[0] ?? null;
const defaultCamera = mockCameras.find((c) => c.shedId === defaultShed?.id) ?? mockCameras[0] ?? null;

const BehaviorPage = () => {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    defaultCamera?.id ?? null
  );

  const selectedCamera =
    mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
    } catch {
      return iso;
    }
  };

  const latestSummary =
    (mockBehaviorSummaries as BehaviorSummary[])
      .slice()
      .reverse()
      .find((s) => s.cameraId === selectedCamera?.id) ?? null;

  return (
    <Container maxWidth="lg">
      <Stack spacing={3.5}>
        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} spacing={{ xs: 1.5, md: 3 }}>
              <CameraHeader
                sheds={mockSheds}
                cameras={mockCameras}
                selectedCameraId={selectedCameraId}
                onSelectCamera={(id) => setSelectedCameraId(id)}
              />
              <Stack direction="row" spacing={1} sx={{ fontSize: 14, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>视频源:</Typography>
                <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
                  {selectedCamera?.thumbnailUrl ?? selectedCamera?.streamUrl ?? '-'}
                </Typography>
              </Stack>
            </Stack>
            
            <VideoPlayer
              videoKey={selectedCamera?.id ?? 'video-default'}
              src={selectedCamera?.streamUrl ?? undefined}
            />
          </Stack>
        </Paper>

        <BehaviorSummaryPanel
          selectedCameraName={selectedCamera?.name ?? '-'}
          latestTimestamp={latestSummary?.timestamp ?? undefined}
          formatDate={formatDate}
          summary={latestSummary}
        />
      </Stack>
    </Container>
  );
};

export default BehaviorPage;
