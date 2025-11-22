'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

import CameraHeader from '../../../../components/monitor/CameraHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';
import BehaviorSummaryPanel from '../../../../components/monitor/BehaviorSummaryPanel';

import { mockSheds, mockCameras } from '../../../../constants/mockData';
import type { BehaviorSummary } from '../../../../types';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
// useEffect imported above

export default function HistoryVideoPage() {
  // pick default camera like realtime page
  const defaultShed = mockSheds && mockSheds.length > 0 ? mockSheds[0] : null;
  const defaultCamera = (() => {
    if (mockCameras && mockCameras.length === 0) return null;
    const camInShed = mockCameras.find((c) => c.shedId === defaultShed?.id);
    return camInShed ?? mockCameras[0];
  })();

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    defaultCamera?.id ?? null
  );

  // Timeline slider constants and state
  const MAX_SPAN_MS = 10 * 60 * 1000; // 10 minutes
  const AXIS_WINDOW_MS = 60 * 60 * 1000; // 60 minutes

  const [baseStart] = useState<Date>(
    () => new Date(Date.now() - AXIS_WINDOW_MS)
  );
  const [rangeMs, setRangeMs] = useState<[number, number]>([0, 5 * 60 * 1000]);

  const startTime = new Date(baseStart.getTime() + rangeMs[0]);
  const endTime = new Date(baseStart.getTime() + rangeMs[1]);
  const spanMs = rangeMs[1] - rangeMs[0];

  const handleRangeChange = (
    _: any,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) return;
    let [s, e] = newValue as [number, number];

    if (e - s > MAX_SPAN_MS) {
      // keep the dragged thumb at user's position and move the other to keep window length <= MAX_SPAN_MS
      if (activeThumb === 0) {
        // start thumb moved — set end = start + MAX
        e = s + MAX_SPAN_MS;
      } else {
        // end thumb moved — set start = end - MAX
        s = e - MAX_SPAN_MS;
      }
    }

    s = Math.max(0, s);
    e = Math.min(AXIS_WINDOW_MS, e);
    setRangeMs([s, e]);
  };

  const marks = Array.from({ length: 61 }, (_, i) => ({
    value: i * 60 * 1000,
    label: i % 5 === 0 ? `${i}m` : '',
  }));

  const [avgSummary, setAvgSummary] = useState<BehaviorSummary>({
    id: 'avg-1',
    cameraId: selectedCameraId ?? defaultCamera?.id ?? '',
    timestamp: new Date().toISOString(),
    eatingCount: 6,
    drinkingCount: 5,
    lickingCount: 1,
    standingCount: 12,
    lyingCount: 8,
  });

  useEffect(() => {
    setAvgSummary((prev) => ({
      ...prev,
      timestamp: endTime.toISOString(),
      cameraId: selectedCameraId ?? defaultCamera?.id ?? '',
    }));
  }, [rangeMs, baseStart, selectedCameraId]);

  // refs and handlers to enable dragging the whole range by pointer-dragging the middle area
  const sliderRootRef = useRef<HTMLDivElement | null>(null);
  const draggingRangeRef = useRef<{
    startVal: number;
    startRange: [number, number];
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const valueForClientX = (clientX: number) => {
    const el = sliderRootRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const p = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(p * AXIS_WINDOW_MS);
  };

  const onPointerMove = (ev: PointerEvent) => {
    if (!draggingRangeRef.current) return;
    const v = valueForClientX(ev.clientX);
    const delta = v - draggingRangeRef.current.startVal;
    let [s0, e0] = draggingRangeRef.current.startRange;
    let s = s0 + delta;
    let e = e0 + delta;
    const span = e - s;
    if (span > MAX_SPAN_MS) {
      e = s + MAX_SPAN_MS;
    }
    // clamp to bounds
    if (s < 0) {
      e = Math.min(AXIS_WINDOW_MS, e - s);
      s = 0;
    }
    if (e > AXIS_WINDOW_MS) {
      s = Math.max(0, s - (e - AXIS_WINDOW_MS));
      e = AXIS_WINDOW_MS;
    }
    setRangeMs([Math.round(s), Math.round(e)]);
  };

  const onPointerUp = () => {
    draggingRangeRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    // when dragging the whole range ends, seek video to range start
    seekToRangeStart();
  };

  const onPointerDown = (ev: React.PointerEvent) => {
    const clientX = ev.clientX;
    const v = valueForClientX(clientX);
    const [s, e] = rangeMs;
    if (v > s && v < e) {
      // start dragging the whole window
      draggingRangeRef.current = { startVal: v, startRange: [s, e] };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      ev.preventDefault();
    }
  };

  const seekToRangeStart = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const v = rangeMs[0];
    // If duration available and finite, map axis proportionally to video duration
    const duration = vid.duration;
    if (typeof duration === 'number' && isFinite(duration) && duration > 0) {
      const proportion = v / AXIS_WINDOW_MS;
      const target = Math.max(0, Math.min(duration, proportion * duration));
      try {
        vid.currentTime = target;
      } catch (e) {
        // ignore seek errors
      }
    } else {
      // fallback: try seeking to 0
      try {
        vid.currentTime = 0;
      } catch (e) {}
    }
  };

  const selectedCamera =
    mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    } catch {
      return iso;
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}></aside>
      <main className={styles.page}>
        <div className={styles.wrapper} suppressHydrationWarning>
          {/* Timeline selector moved under the video (see below) */}

          {/* 视频播放区域 + 上方信息*/}
          <section className={styles.videoBlock}>
            <header className={styles.videoHeader}>
              <CameraHeader
                styles={styles}
                sheds={mockSheds}
                cameras={mockCameras}
                selectedCameraId={selectedCameraId}
                onSelectCamera={(id) => setSelectedCameraId(id)}
              />

              <div className={styles.infoRow}>
                <span className={styles.label}>视频源：</span>
                <span className={styles.value}>
                  {selectedCamera?.thumbnailUrl ??
                    selectedCamera?.streamUrl ??
                    '-'}
                </span>
              </div>
            </header>

            <VideoPlayer
              ref={videoRef}
              styles={styles}
              videoKey={selectedCamera?.id ?? 'video-default'}
              src={selectedCamera?.streamUrl ?? undefined}
            />

            {/* slider moved beneath the video (was above previously) */}
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
                suppressHydrationWarning
              >
                <div style={{ fontSize: 13, color: 'var(--text-main)' }}>
                  {formatDate(startTime.toISOString())} —{' '}
                  {formatDate(endTime.toISOString())}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  时长 {String(Math.floor(spanMs / 60000)).padStart(2, '0')}:
                  {String(Math.floor((spanMs % 60000) / 1000)).padStart(2, '0')}
                </div>
              </div>

              <div ref={sliderRootRef} onPointerDown={onPointerDown}>
                <Slider
                  value={rangeMs}
                  min={0}
                  max={AXIS_WINDOW_MS}
                  step={15000}
                  marks={marks}
                  onChange={handleRangeChange}
                  onChangeCommitted={(_e, _v) => {
                    seekToRangeStart();
                  }}
                  valueLabelDisplay='auto'
                  valueLabelFormat={(v) =>
                    formatDate(new Date(baseStart.getTime() + v).toISOString())
                  }
                  aria-labelledby='history-range-slider'
                />
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  (滑动选择时间区间，最大 10 分钟)
                </div>
              </div>
            </div>
          </section>

          {/* 历史区间概览（平均值 mock） */}
          <BehaviorSummaryPanel
            styles={styles}
            title={'历史区间概览'}
            selectedCameraName={selectedCamera?.name ?? '-'}
            latestTimestamp={avgSummary.timestamp}
            rangeStart={startTime.toISOString()}
            rangeEnd={endTime.toISOString()}
            formatDate={formatDate}
            summary={avgSummary}
          />
        </div>
      </main>
    </div>
  );
}
