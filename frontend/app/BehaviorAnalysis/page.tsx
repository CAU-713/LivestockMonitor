// app/BehaviorAnalysis/page.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

import {
  mockSheds,
  mockCameras,
  mockBehaviorSummaries,
} from '../../constants/mockData';

type BehaviorSummary = {
  id: string;
  cameraId: string;
  timestamp: string;
  eatingCount?: number;
  drinkingCount?: number;
  lickingCount?: number;
  standingCount?: number;
  lyingCount?: number;
};

// pick a default shed and camera for display (fall back gracefully)
const defaultShed = mockSheds && mockSheds.length > 0 ? mockSheds[0] : null;
const defaultCamera = (() => {
  if (mockCameras && mockCameras.length === 0) return null;
  // prefer a camera in the chosen shed if available
  const camInShed = mockCameras.find((c) => c.shedId === defaultShed?.id);
  return camInShed ?? mockCameras[0];
})();

export default function BehaviorAnalysisPage() {
  // dropdown & selection state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedShedId, setExpandedShedId] = useState<string | null>(
    mockSheds.length > 0 ? mockSheds[0].id : null
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    defaultCamera?.id ?? null
  );

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

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
              <div className={styles.infoRow}>
                <span className={styles.label}>舍: </span>
                <span className={styles.value}>
                  {mockSheds.find((s) => s.id === selectedCamera?.shedId)
                    ?.name ??
                    defaultShed?.name ??
                    '-'}
                </span>
              </div>

              <div className={styles.infoRow} style={{ alignItems: 'center' }}>
                <span className={styles.label}>摄像头：</span>
                <span className={styles.value}>
                  {selectedCamera?.name ?? selectedCamera?.id ?? '-'}
                </span>

                <div className={styles.dropdownWrapper} ref={dropdownRef}>
                  <button
                    className={styles.dropdownButton}
                    onClick={() => setIsDropdownOpen((v) => !v)}
                    aria-expanded={isDropdownOpen}
                  >
                    ▾
                  </button>

                  {isDropdownOpen ? (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownList}>
                        {mockSheds.map((shed) => (
                          <div key={shed.id} className={styles.shedBlock}>
                            <div
                              className={styles.shedHeader}
                              onClick={() =>
                                setExpandedShedId((prev) =>
                                  prev === shed.id ? null : shed.id
                                )
                              }
                            >
                              <span>{shed.name}</span>
                              <span className={styles.expandIcon}>
                                {expandedShedId === shed.id ? '▾' : '▸'}
                              </span>
                            </div>
                            {expandedShedId === shed.id ? (
                              <div className={styles.cameraList}>
                                {mockCameras
                                  .filter((c) => c.shedId === shed.id)
                                  .map((cam) => (
                                    <div
                                      key={cam.id}
                                      className={
                                        selectedCameraId === cam.id
                                          ? `${styles.cameraItem} ${styles.cameraItemActive}`
                                          : styles.cameraItem
                                      }
                                      onClick={() => {
                                        setSelectedCameraId(cam.id);
                                        // intentionally keep dropdown open after selection
                                      }}
                                    >
                                      {cam.name}
                                    </div>
                                  ))}
                                {mockCameras.filter((c) => c.shedId === shed.id)
                                  .length === 0 && (
                                  <div className={styles.cameraItemDisabled}>
                                    (无摄像头)
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>视频源：</span>
                <span className={styles.value}>
                  {selectedCamera?.thumbnailUrl ??
                    selectedCamera?.streamUrl ??
                    '-'}
                </span>
              </div>
            </header>
            <div className={styles.videoPlayer}>
              <video
                key={selectedCamera?.id ?? 'video-default'}
                className={styles.video}
                src={selectedCamera?.streamUrl ?? undefined}
                controls
                autoPlay
                muted
              >
                Your browser does not support HTML5 video.
              </video>
            </div>
          </section>

          {/* 状态概览（基于所选摄像头的最近统计） */}
          <section className={styles.statusPanel}>
            <div className={styles.statusHeader}>
              <h2 className={styles.statusTitle}>状态概览</h2>
              <div className={styles.statusDesc}>
                基于摄像头 <strong>{selectedCamera?.name ?? '-'}</strong>{' '}
                的最新汇总数据。 最近更新时间：
                {formatDate(latestSummary?.timestamp ?? undefined)}
              </div>
            </div>

            <div className={styles.statusCards}>
              <div className={styles.statusCard}>
                <div className={styles.statusLabel}>站立</div>
                <div className={styles.statusValue}>
                  {latestSummary?.standingCount ?? 0}
                </div>
              </div>
              <div className={styles.statusCard}>
                <div className={styles.statusLabel}>躺卧</div>
                <div className={styles.statusValue}>
                  {latestSummary?.lyingCount ?? 0}
                </div>
              </div>
              <div className={styles.statusCard}>
                <div className={styles.statusLabel}>饮水</div>
                <div className={styles.statusValue}>
                  {latestSummary?.drinkingCount ?? 0}
                </div>
              </div>
              <div className={styles.statusCard}>
                <div className={styles.statusLabel}>进食</div>
                <div className={styles.statusValue}>
                  {latestSummary?.eatingCount ?? 0}
                </div>
              </div>
              <div className={styles.statusCard}>
                <div className={styles.statusLabel}>舔舐</div>
                <div className={styles.statusValue}>
                  {latestSummary?.lickingCount ?? 0}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
