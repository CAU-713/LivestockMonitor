'use client';
import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import VideoHeader from '../../../../components/monitor/VideoHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';
import BehaviorSummaryPanel from '../../../../components/monitor/BehaviorSummaryPanel';
import ExportButton from '../../../../components/ui/ExportButton';

import { mockSheds, mockCameras } from '../../../../constants/mockData';
import type { BehaviorSummary } from '../../../../types';

export default function HistoryVideoPage() {
  const defaultShed = mockSheds?.[0] ?? null;
  const defaultCamera = mockCameras.find((c) => c.shedId === defaultShed?.id) ?? mockCameras[0] ?? null;

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(defaultCamera?.id ?? null);

  const selectedCamera = mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Stack spacing={3.5}>
          <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} spacing={{ xs: 1.5, md: 3 }}>
                <VideoHeader
                  sheds={mockSheds}
                  cameras={mockCameras}
                  selectedCameraId={selectedCameraId}
                  onSelectCamera={(id) => setSelectedCameraId(id)}
                />
                <Stack direction="row" spacing={1} sx={{ fontSize: 14, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}></Typography>
                </Stack>
              </Stack>
              
              <VideoPlayer
                videoKey={selectedCamera?.id ?? 'video-default'}
                src={selectedCamera?.streamUrl ?? undefined}
              />
            </Stack>
          </Paper>

        </Stack>
      </Container>
    </LocalizationProvider>
  );
}
