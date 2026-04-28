// app/(main)/monitor/behavior/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Stack, Typography, Skeleton } from '@mui/material';

import { mockSheds, mockCameras } from '../../../../constants/mockData';

import CameraHeader from '../components/CameraHeader';
import VideoPlayer from '../components/VideoPlayer';
import BehaviorSummaryPanel from '../components/BehaviorSummaryPanel';

import { cameraApi, behaviorApi } from '@/lib/api/apiService';
import type { Camera, BehaviorSummary } from '@/types';

const defaultShed = mockSheds?.[0] ?? null;
const defaultCamera =
  mockCameras.find((c) => c.shedId === defaultShed?.id) ??
  mockCameras[0] ??
  null;

const BehaviorPage = () => {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    defaultCamera?.id ?? null
  );
  const [realCameras, setRealCameras] = useState<Camera[]>([]);

  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleString()
  );

  // 真实行为数据
  const [behaviorSummary, setBehaviorSummary] = useState<BehaviorSummary | null>(null);
  const [behaviorLoading, setBehaviorLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(
      () => setCurrentTime(new Date().toLocaleString()),
      1000
    );
    return () => clearInterval(t);
  }, []);

  // 加载真实摄像头列表
  useEffect(() => {
    cameraApi.getCameras().then((cams) => {
      setRealCameras(cams);
      // 如果当前选中的是 mock 摄像头，切换到第一个真实摄像头
      if (cams.length > 0 && !selectedCameraId) {
        setSelectedCameraId(cams[0].id);
      }
    }).catch(console.error);
  }, []);

  // 使用真实摄像头或 mock 摄像头
  const cameraList = realCameras.length > 0 ? realCameras : mockCameras;

  const selectedCamera =
    cameraList.find((c) => c.id === selectedCameraId) ?? defaultCamera;

  // 加载真实行为数据
  useEffect(() => {
    if (!selectedCameraId) return;
    const numericId = Number(selectedCameraId);
    if (!numericId || numericId <= 0) return;

    setBehaviorLoading(true);
    behaviorApi.getLatest(numericId)
      .then((data) => {
        if (data) {
          setBehaviorSummary({
            id: String(data.id || 0),
            cameraId: String(data.camera_id),
            timestamp: data.timestamp,
            eatingCount: data.eating_count,
            drinkingCount: data.drinking_count,
            lickingCount: data.licking_count,
            standingCount: data.standing_count,
            lyingCount: data.lying_count,
          });
        }
      })
      .catch(() => {
        // API 失败时保持 mock 数据
      })
      .finally(() => setBehaviorLoading(false));
  }, [selectedCameraId]);

  // Prepare displayed video source: hide specific picsum sample image
  const displayedSource = (() => {
    const src = selectedCamera?.thumbnailUrl ?? selectedCamera?.streamUrl;
    if (!src) return '-';
    if (src.includes('picsum.photos/seed/cam-a-01/400/300')) return '-';
    return src;
  })();

  // 如果有真实数据就用真实数据，否则用 mock 数据
  const displaySummary = behaviorSummary || {
    id: 'real-time-1',
    cameraId: selectedCameraId ?? '',
    timestamp: new Date().toISOString(),
    eatingCount: 6,
    drinkingCount: 5,
    lickingCount: 1,
    standingCount: 12,
    lyingCount: 8,
  };

  return (
    <Container maxWidth='lg'>
      <Stack spacing={3.5}>
        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Box sx={{ borderLeft: '4px solid #2E7D32', pl: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>实时视频监控</Typography>
                <Typography variant="body2" color="text.secondary">查看各畜舍摄像头实时画面与行为分析</Typography>
              </Box>
            </Stack>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ md: 'center' }}
              spacing={{ xs: 1.5, md: 3 }}
            >
              <CameraHeader
                sheds={mockSheds}
                cameras={cameraList}
                selectedCameraId={selectedCameraId}
                onSelectCamera={(id) => setSelectedCameraId(id)}
              />
              <Stack
                direction='row'
                spacing={1}
                sx={{ fontSize: 14, alignItems: 'center' }}
              >
                <Typography
                  variant='body2'
                  color='text.secondary'
                  fontWeight={500}
                >
                  时间:
                </Typography>
                <Typography variant='body2' fontWeight={500}>
                  {currentTime}
                </Typography>
              </Stack>
            </Stack>

            <VideoPlayer
              videoKey={selectedCamera?.id ?? 'video-default'}
              src={selectedCamera?.streamUrl ?? undefined}
            />

            {behaviorLoading ? (
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            ) : (
              <BehaviorSummaryPanel
                title={'实时行为概览'}
                selectedCameraName={selectedCamera?.name ?? '-'}
                latestTimestamp={currentTime}
                formatDate={(iso) => iso || '-'}
                summary={displaySummary}
              />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default BehaviorPage;