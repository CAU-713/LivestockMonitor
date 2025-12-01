// app/(main)/monitor/behavior/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Container, Paper, Stack, Typography } from '@mui/material';

import {
  mockSheds,
  mockCameras,
} from '../../../../constants/mockData';

import CameraHeader from '../../../../components/monitor/CameraHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';

// types removed (no longer needed in this file)

const defaultShed = mockSheds?.[0] ?? null;
const defaultCamera = mockCameras.find((c) => c.shedId === defaultShed?.id) ?? mockCameras[0] ?? null;

const BehaviorPage = () => {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    defaultCamera?.id ?? null
  );

  const [currentTime, setCurrentTime] = useState<string>(() => new Date().toLocaleString());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(t);
  }, []);

  const selectedCamera =
    mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;

  // Prepare displayed video source: hide specific picsum sample image
  const displayedSource = (() => {
    const src = selectedCamera?.thumbnailUrl ?? selectedCamera?.streamUrl;
    if (!src) return '-';
    if (src.includes('picsum.photos/seed/cam-a-01/400/300')) return '-';
    return src;
  })();

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
                <Typography variant="body2" color="text.secondary" fontWeight={500}>时间:</Typography>
                <Typography variant="body2" fontWeight={500}>{currentTime}</Typography>
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
  );
};

export default BehaviorPage;
