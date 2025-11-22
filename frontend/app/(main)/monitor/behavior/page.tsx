// app/(main)/monitor/behavior/page.tsx
'use client';
import React, { useState } from 'react';
import styles from './page.module.css';

import {
  mockSheds,
  mockCameras,
  mockBehaviorSummaries,
} from '../../../../constants/mockData';

import CameraHeader from '../../../../components/monitor/CameraHeader';
import VideoPlayer from '../../../../components/monitor/VideoPlayer';
import BehaviorSummaryPanel from '../../../../components/monitor/BehaviorSummaryPanel';

import type { BehaviorSummary } from '../../../../types';

// pick a default shed and camera for display (fall back gracefully)
const defaultShed = mockSheds && mockSheds.length > 0 ? mockSheds[0] : null;
const defaultCamera = (() => {
  if (mockCameras && mockCameras.length === 0) return null;
  // prefer a camera in the chosen shed if available
  const camInShed = mockCameras.find((c) => c.shedId === defaultShed?.id);
  return camInShed ?? mockCameras[0];
})();

const BehaviorPage = () => {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    defaultCamera?.id ?? null
  );

  const selectedCamera =
    mockCameras.find((c) => c.id === selectedCameraId) ?? defaultCamera;

  // stable date formatter to avoid SSR/CSR locale differences
  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      // produce stable, locale-independent timestamp: YYYY-MM-DD HH:mm:ss
      return d.toISOString().replace('T', ' ').slice(0, 19);
    } catch {
      return iso;
    }
  };

  // latest summary for selected camera (used by status badges)
  const latestSummary =
    (mockBehaviorSummaries as BehaviorSummary[])
      .slice()
      .reverse()
      .find((s) => s.cameraId === selectedCamera?.id) ?? null;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}></aside>
      <main className={styles.page}>
        <div className={styles.wrapper}>
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
              styles={styles}
              videoKey={selectedCamera?.id ?? 'video-default'}
              src={selectedCamera?.streamUrl ?? undefined}
            />
          </section>

          <BehaviorSummaryPanel
            styles={styles}
            selectedCameraName={selectedCamera?.name ?? '-'}
            latestTimestamp={latestSummary?.timestamp ?? undefined}
            formatDate={formatDate}
            summary={latestSummary}
          />
        </div>
      </main>
    </div>
  );
};

export default BehaviorPage;
