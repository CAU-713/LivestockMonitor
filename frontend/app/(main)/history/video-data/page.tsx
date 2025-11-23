'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react'; // Import useMemo
import { Box, Slider, Container, Paper, Typography, Stack } from '@mui/material';

import CameraHeader from '../../../../components/monitor/CameraHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';
import BehaviorSummaryPanel from '../../../../components/monitor/BehaviorSummaryPanel';

import { mockSheds, mockCameras } from '../../../../constants/mockData';
import type { BehaviorSummary } from '../../../../types';

export default function HistoryVideoPage() {
  const defaultShed = mockSheds?.[0] ?? null;
  const defaultCamera = mockCameras.find((c) => c.shedId === defaultShed?.id) ?? mockCameras[0] ?? null;

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(defaultCamera?.id ?? null);

  const MAX_SPAN_MS = 10 * 60 * 1000;
  const AXIS_WINDOW_MS = 60 * 60 * 1000;

  const [baseStart] = useState(() => new Date(Date.now() - AXIS_WINDOW_MS));
  const [rangeMs, setRangeMs] = useState<[number, number]>([0, 5 * 60 * 1000]);

  // FIX: Memoize startTime and endTime to prevent re-creation on every render
  const startTime = useMemo(() => new Date(baseStart.getTime() + rangeMs[0]), [baseStart, rangeMs]);
  const endTime = useMemo(() => new Date(baseStart.getTime() + rangeMs[1]), [baseStart, rangeMs]);
  
  const spanMs = rangeMs[1] - rangeMs[0];

  const handleRangeChange = (_: any, newValue: number | number[], activeThumb: number) => {
    if (!Array.isArray(newValue)) return;
    let [s, e] = newValue;
    if (e - s > MAX_SPAN_MS) {
      if (activeThumb === 0) e = s + MAX_SPAN_MS;
      else s = e - MAX_SPAN_MS;
    }
    setRangeMs([Math.max(0, s), Math.min(AXIS_WINDOW_MS, e)]);
  };

  const marks = Array.from({ length: 61 }, (_, i) => ({
    value: i * 60 * 1000,
    label: i % 5 === 0 ? `${i}m` : '',
  }));

  const [avgSummary, setAvgSummary] = useState<BehaviorSummary>({
    id: 'avg-1', cameraId: selectedCameraId ?? '', timestamp: new Date().toISOString(),
    eatingCount: 6, drinkingCount: 5, lickingCount: 1, standingCount: 12, lyingCount: 8,
  });

  // The dependency array is now stable
  useEffect(() => {
    setAvgSummary((prev) => ({ ...prev, timestamp: endTime.toISOString(), cameraId: selectedCameraId ?? '' }));
  }, [endTime, selectedCameraId]);

  const sliderRootRef = useRef<HTMLDivElement | null>(null);
  const draggingRangeRef = useRef<{ startVal: number; startRange: [number, number] } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const valueForClientX = (clientX: number) => {
    const el = sliderRootRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.round(((clientX - rect.left) / rect.width) * AXIS_WINDOW_MS);
  };

  const onPointerMove = (ev: PointerEvent) => {
    if (!draggingRangeRef.current) return;
    const v = valueForClientX(ev.clientX);
    const delta = v - draggingRangeRef.current.startVal;
    let [s0, e0] = draggingRangeRef.current.startRange;
    let s = s0 + delta;
    let e = e0 + delta;
    if (s < 0) { e = Math.min(AXIS_WINDOW_MS, e - s); s = 0; }
    if (e > AXIS_WINDOW_MS) { s = Math.max(0, s - (e - AXIS_WINDOW_MS)); e = AXIS_WINDOW_MS; }
    setRangeMs([s, e]);
  };

  const seekToRangeStart = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const proportion = rangeMs[0] / AXIS_WINDOW_MS;
    if (isFinite(vid.duration) && vid.duration > 0) {
      vid.currentTime = Math.max(0, Math.min(vid.duration, proportion * vid.duration));
    }
  };

  const onPointerUp = () => {
    draggingRangeRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    seekToRangeStart();
  };

  const onPointerDown = (ev: React.PointerEvent) => {
    const v = valueForClientX(ev.clientX);
    if (v > rangeMs[0] && v < rangeMs[1]) {
      draggingRangeRef.current = { startVal: v, startRange: rangeMs };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      ev.preventDefault();
    }
  };

  const selectedCamera = mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;
  const formatDate = (iso?: string) => iso ? new Date(iso).toISOString().replace('T', ' ').slice(0, 19) : '-';

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
              ref={videoRef}
              videoKey={selectedCamera?.id ?? 'video-default'}
              src={selectedCamera?.streamUrl ?? undefined}
            />
            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.primary" suppressHydrationWarning>
                  {formatDate(startTime.toISOString())} — {formatDate(endTime.toISOString())}
                </Typography>
                <Typography variant="caption" color="text.secondary" suppressHydrationWarning>
                  时长 {String(Math.floor(spanMs / 60000)).padStart(2, '0')}:{String(Math.floor((spanMs % 60000) / 1000)).padStart(2, '0')}
                </Typography>
              </Stack>
              <Box ref={sliderRootRef} onPointerDown={onPointerDown} sx={{ cursor: 'grab' }}>
                <Slider
                  value={rangeMs} min={0} max={AXIS_WINDOW_MS} step={15000} marks={marks}
                  onChange={handleRangeChange}
                  onChangeCommitted={seekToRangeStart}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => formatDate(new Date(baseStart.getTime() + v).toISOString())}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  (滑动选择时间区间，最大 10 分钟)
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
        <BehaviorSummaryPanel
          title={'历史区间概览'}
          selectedCameraName={selectedCamera?.name ?? '-'}
          latestTimestamp={avgSummary.timestamp}
          rangeStart={startTime.toISOString()}
          rangeEnd={endTime.toISOString()}
          formatDate={formatDate}
          summary={avgSummary}
        />
      </Stack>
    </Container>
  );
}
