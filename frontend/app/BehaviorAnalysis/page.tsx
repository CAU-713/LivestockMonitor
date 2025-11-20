// app/BehaviorAnalysis/page.tsx
import React from "react";
import styles from "./page.module.css";

type BarnInfo = {
  barnName: string; //舍的名称 or 编号
  cameraId: string; // 摄像头编号
  videoSource: string; // 视频源（地址字符串）
  streamUrl: string; //前端实际播放用的视频地址
};
type BehaviorRecord = {
  id: number;
  timestamp: string; // 行为发生时间
  animalId: string; // 动物编号
  species: string; // 物种，如sheep / goat / cow
  behavior: string; // 行为描述
  confidence: number; // 置信度 0～1
  note?: string; // 备注（可选）
};
const barn: BarnInfo = {
  barnName: "羊舍 3",
  cameraId: "CAM-YS-003",
  videoSource: "rtsp://192.168.1.23:554/stream/ys-3",
  // 前端实际播放的视频地址（测试时可以换成 mp4）
  streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
};

const behaviorRecords: BehaviorRecord[] = [
  {
    id: 1,
    timestamp: "2025-11-19 10:21:35",
    animalId: "SHEEP-001",
    species: "sheep",
    behavior: "feeding",
    confidence: 0.94,
    note: "站立在饲槽附近",
  },
  {
    id: 2,
    timestamp: "2025-11-19 10:22:10",
    animalId: "SHEEP-004",
    species: "sheep",
    behavior: "lying",
    confidence: 0.88,
    note: "持续躺卧超过 10 分钟",
  },
  {
    id: 3,
    timestamp: "2025-11-19 10:22:45",
    animalId: "SHEEP-002",
    species: "sheep",
    behavior: "walking",
    confidence: 0.91,
  },
  {
    id: 4,
    timestamp: "2025-11-19 10:23:02",
    animalId: "SHEEP-003",
    species: "sheep",
    behavior: "abnormal",
    confidence: 0.76,
    note: "动作频繁，疑似不适",
  },
];

export default function BehaviorAnalysisPage() {
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
                <span className={styles.value}>{barn.barnName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>摄像头：</span>
                <span className={styles.value}>{barn.cameraId}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>视频源：</span>
                <span className={styles.value}>{barn.videoSource}</span>
              </div>
            </header>
            <video
              className={styles.video}
              src={barn.streamUrl}
              controls
              autoPlay
              muted
            >
              Your browser does not support HTML5 video.
            </video>
          </section>

          {/* 行为分析列表 */}
          <section>
            <h2 className={styles.sectionTitle}>动物行为分析</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>动物编号</th>
                    <th>种类</th>
                    <th>行为</th>
                    <th>置信度</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {behaviorRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.timestamp}</td>
                      <td>{record.animalId}</td>
                      <td>{record.species}</td>
                      <td>{record.behavior}</td>
                      <td>{Math.round(record.confidence * 100)}%</td>
                      <td>{record.note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
