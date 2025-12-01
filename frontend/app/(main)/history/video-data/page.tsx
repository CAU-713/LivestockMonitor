'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Paper, Typography, Stack, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

import CameraHeader from '../../../../components/monitor/CameraHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';
import BehaviorSummaryPanel from '../../../../components/monitor/BehaviorSummaryPanel';
import ExportButton from '../../../../components/ui/ExportButton';

import { mockSheds, mockCameras } from '../../../../constants/mockData';
import type { BehaviorSummary } from '../../../../types';

const MAX_SPAN_MS = 10 * 60 * 1000; // 10 minutes

export default function HistoryVideoPage() {
  const defaultShed = mockSheds?.[0] ?? null;
  const defaultCamera = mockCameras.find((c) => c.shedId === defaultShed?.id) ?? mockCameras[0] ?? null;

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(defaultCamera?.id ?? null);
  
  // Simplified state management with dayjs
  const [startTime, setStartTime] = useState<Dayjs>(dayjs().subtract(10, 'minute'));
  const [endTime, setEndTime] = useState<Dayjs>(dayjs());

  const handleStartTimeChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setStartTime(newValue);
      // If the new start time makes the range too long, adjust the end time
      if (endTime.diff(newValue) > MAX_SPAN_MS) {
        setEndTime(newValue.add(MAX_SPAN_MS, 'millisecond'));
      }
    }
  };

  const handleEndTimeChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setEndTime(newValue);
      // If the new end time makes the range too long, adjust the start time
      if (newValue.diff(startTime) > MAX_SPAN_MS) {
        setStartTime(newValue.subtract(MAX_SPAN_MS, 'millisecond'));
      }
    }
  };
  
  const spanMs = endTime.diff(startTime);

  const [avgSummary, setAvgSummary] = useState<BehaviorSummary>({
    id: 'avg-1', cameraId: selectedCameraId ?? '', timestamp: new Date().toISOString(),
    eatingCount: 6, drinkingCount: 5, lickingCount: 1, standingCount: 12, lyingCount: 8,
  });

  useEffect(() => {
    setAvgSummary((prev) => ({ ...prev, timestamp: endTime.toISOString(), cameraId: selectedCameraId ?? '' }));
  }, [endTime, selectedCameraId]);

  const seekToRangeStart = useCallback(() => {
    // This logic can be simplified or adapted if the video source represents a long recording
    // For now, we just seek to the beginning as a placeholder action.
    const video = document.getElementById(`video-${selectedCameraId}`) as HTMLVideoElement;
    if (video) {
        video.currentTime = 0; // Or map startTime to a position in the video if applicable
    }
  }, [selectedCameraId]);

  useEffect(() => {
    seekToRangeStart();
  }, [startTime, seekToRangeStart]);

  const selectedCamera = mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;
  const formatDate = (date: Dayjs) => date.format('YYYY-MM-DD HH:mm:ss');

  // Prepare behavior data for export
  const behaviorExportData = [
    {
      '时间': formatDate(endTime),
      '摄像头': selectedCamera?.name ?? '-',
      '采食次数': avgSummary.eatingCount,
      '饮水次数': avgSummary.drinkingCount,
      '舔舐次数': avgSummary.lickingCount,
      '站立次数': avgSummary.standingCount,
      '躺卧次数': avgSummary.lyingCount,
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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

              <Box sx={{ mt: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.primary">
                    {formatDate(startTime)} — {formatDate(endTime)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    时长 {String(Math.floor(spanMs / 60000)).padStart(2, '0')}:{String(Math.floor((spanMs % 60000) / 1000)).padStart(2, '0')}
                  </Typography>
                </Stack>
                
                {/* Simplified DateTime Pickers */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <DateTimePicker
                        label="开始时间"
                        value={startTime}
                        onChange={handleStartTimeChange}
                        sx={{ width: '100%' }}
                    />
                    <DateTimePicker
                        label="结束时间"
                        value={endTime}
                        onChange={handleEndTimeChange}
                        sx={{ width: '100%' }}
                    />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    (选择任意时间区间，最大时长 10 分钟)
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <BehaviorSummaryPanel
            title={'历史区间概览'}
            selectedCameraName={selectedCamera?.name ?? '-'}
            latestTimestamp={endTime.toISOString()}
            rangeStart={startTime.toISOString()}
            rangeEnd={endTime.toISOString()}
            formatDate={(iso) => iso ? dayjs(iso).format('YYYY-MM-DD HH:mm:ss') : '-'}
            summary={avgSummary}
            headerAction={
              <ExportButton
                data={behaviorExportData}
                fileName='behavior_data'
              />
            }
          />
        </Stack>
      </Container>
    </LocalizationProvider>
  );
}
