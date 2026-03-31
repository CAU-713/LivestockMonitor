-- ============================================================
-- LivestockMonitor 数据库初始化脚本
-- 包含：建表（由 SQLModel 自动建，这里做兼容）+ 大量假数据
-- ============================================================

-- 启用 pgvector 扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. 传感器类型
-- ============================================================
INSERT INTO sensor_type (id, name, unit) VALUES
  ('Temperature', '温度',    '°C'),
  ('Humidity',    '湿度',    '%RH'),
  ('Ammonia',     '氨气',    'ppm'),
  ('WindSpeed',   '风速',    'm/s'),
  ('CO2',         '二氧化碳','ppm'),
  ('CH4',         '甲烷',    'ppm'),
  ('Oxygen',      '氧气',    '%'),
  ('H2S',         '硫化氢',  'ppm'),
  ('PM',          'PM2.5',   'μg/m³'),
  ('Light',       '光照强度','lux')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. 羊舍（6 个）
-- ============================================================
INSERT INTO shed (id, name, location, livestock_count, capacity, area, status, type, description) VALUES
  (1, 'A区育肥舍',   '东区A排01号', 156, 200, 800.0,  'active',      1, '主要育肥羊舍，采用全漏缝地板，配备自动喂料系统'),
  (2, 'B区繁殖舍',   '东区B排01号', 88,  120, 500.0,  'active',      2, '母羊繁殖专用舍，配备产羔区和哺乳设施'),
  (3, 'C区羔羊舍',   '西区C排01号', 240, 300, 600.0,  'active',      3, '羔羊培育舍，恒温控制，温度范围18-24℃'),
  (4, 'D区育肥舍',   '东区D排01号', 178, 220, 880.0,  'active',      1, '新建育肥舍，2025年投入使用，智能化程度高'),
  (5, 'E区繁殖舍',   '西区E排01号', 64,  100, 420.0,  'maintenance', 2, '设备维护中，预计2026-04-10恢复使用'),
  (6, 'F区隔离舍',   '北区F排01号', 12,  50,  200.0,  'active',      4, '新引进羊只隔离观察用，独立通风系统')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. 羊圈（每个羊舍 3-4 个圈）
-- ============================================================
INSERT INTO pen (id, name, shed_id, capacity, area, status, description) VALUES
  -- A区育肥舍（shed_id=1）
  (1,  'A区-1号圈', 1, 55, 200.0, 'active',   '育肥期公羊，日龄90-120天'),
  (2,  'A区-2号圈', 1, 55, 200.0, 'active',   '育肥期公羊，日龄120-150天'),
  (3,  'A区-3号圈', 1, 55, 200.0, 'active',   '育肥期母羊，日龄90-150天'),
  -- B区繁殖舍（shed_id=2）
  (4,  'B区-1号圈', 2, 30, 130.0, 'active',   '妊娠母羊圈'),
  (5,  'B区-2号圈', 2, 30, 130.0, 'active',   '泌乳母羊圈'),
  (6,  'B区-3号圈', 2, 30, 130.0, 'active',   '空怀配种母羊圈'),
  -- C区羔羊舍（shed_id=3）
  (7,  'C区-1号圈', 3, 80, 150.0, 'active',   '0-30日龄羔羊'),
  (8,  'C区-2号圈', 3, 80, 150.0, 'active',   '30-60日龄羔羊'),
  (9,  'C区-3号圈', 3, 80, 150.0, 'active',   '60-90日龄羔羊'),
  (10, 'C区-4号圈', 3, 80, 150.0, 'active',   '断奶过渡期羔羊'),
  -- D区育肥舍（shed_id=4）
  (11, 'D区-1号圈', 4, 60, 220.0, 'active',   '高档育肥，精品肉羊'),
  (12, 'D区-2号圈', 4, 60, 220.0, 'active',   '标准育肥圈'),
  (13, 'D区-3号圈', 4, 60, 220.0, 'active',   '标准育肥圈'),
  -- E区繁殖舍（shed_id=5）
  (14, 'E区-1号圈', 5, 35, 140.0, 'maintenance', '维护中'),
  (15, 'E区-2号圈', 5, 35, 140.0, 'maintenance', '维护中'),
  -- F区隔离舍（shed_id=6）
  (16, 'F区-隔离圈',6, 50, 200.0, 'active',   '新引进羊只隔离区，独立通风')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. 传感器（每个羊舍配置多种传感器，共 42 个）
-- ============================================================
INSERT INTO sensor (id, name, shed_id, pen_id, type, status, last_reading, last_calibration, location, description) VALUES
  -- A区育肥舍（shed_id=1）温度×2 湿度×2 氨气×1 CO2×1 风速×1 PM×1
  (1,  'A区-温度计1',   1, 1,  'Temperature', 'active', 22.3, '2026-01-15', 'A区东墙中段',  '监测A区1号圈温度'),
  (2,  'A区-温度计2',   1, 2,  'Temperature', 'active', 23.1, '2026-01-15', 'A区西墙中段',  '监测A区2号圈温度'),
  (3,  'A区-湿度计1',   1, 1,  'Humidity',    'active', 68.5, '2026-01-15', 'A区东墙中段',  '监测A区1号圈湿度'),
  (4,  'A区-湿度计2',   1, 2,  'Humidity',    'active', 71.2, '2026-01-15', 'A区西墙中段',  '监测A区2号圈湿度'),
  (5,  'A区-氨气计1',   1, NULL,'Ammonia',    'active', 8.4,  '2026-02-01', 'A区中央顶部',  '监测全舍氨气浓度'),
  (6,  'A区-CO2计1',    1, NULL,'CO2',         'active', 1250.0,'2026-02-01','A区中央顶部', '监测全舍CO2浓度'),
  (7,  'A区-风速计1',   1, NULL,'WindSpeed',   'active', 0.8,  '2026-02-01', 'A区通风口',   '监测通风状态'),
  (8,  'A区-PM计1',     1, NULL,'PM',          'active', 45.2, '2026-02-01', 'A区中央顶部', '监测粉尘浓度'),
  -- B区繁殖舍（shed_id=2）
  (9,  'B区-温度计1',   2, 4,  'Temperature', 'active', 20.8, '2026-01-20', 'B区东墙',     '妊娠区温度'),
  (10, 'B区-温度计2',   2, 5,  'Temperature', 'active', 21.5, '2026-01-20', 'B区西墙',     '泌乳区温度'),
  (11, 'B区-湿度计1',   2, 4,  'Humidity',    'active', 65.0, '2026-01-20', 'B区东墙',     '妊娠区湿度'),
  (12, 'B区-氨气计1',   2, NULL,'Ammonia',    'active', 6.2,  '2026-02-01', 'B区中央顶部', '监测全舍氨气'),
  (13, 'B区-CO2计1',    2, NULL,'CO2',         'active', 1100.0,'2026-02-01','B区中央顶部','监测全舍CO2'),
  (14, 'B区-光照计1',   2, NULL,'Light',       'active', 850.0,'2026-02-01', 'B区顶部灯组', '监测光照强度'),
  -- C区羔羊舍（shed_id=3）
  (15, 'C区-温度计1',   3, 7,  'Temperature', 'active', 24.2, '2026-01-25', 'C区东墙1号圈','0-30日龄羔羊区温度'),
  (16, 'C区-温度计2',   3, 8,  'Temperature', 'active', 23.6, '2026-01-25', 'C区东墙2号圈','30-60日龄羔羊区温度'),
  (17, 'C区-温度计3',   3, 9,  'Temperature', 'active', 22.9, '2026-01-25', 'C区西墙3号圈','60-90日龄羔羊区温度'),
  (18, 'C区-湿度计1',   3, 7,  'Humidity',    'active', 62.0, '2026-01-25', 'C区东墙',     '羔羊区湿度'),
  (19, 'C区-氨气计1',   3, NULL,'Ammonia',    'active', 4.8,  '2026-02-01', 'C区中央顶部', '羔羊区氨气'),
  (20, 'C区-CO2计1',    3, NULL,'CO2',         'active', 980.0, '2026-02-01','C区中央顶部', '羔羊区CO2'),
  (21, 'C区-光照计1',   3, NULL,'Light',       'active', 1200.0,'2026-02-01','C区顶部灯组', '控制羔羊光照'),
  (22, 'C区-H2S计1',    3, NULL,'H2S',         'active', 0.5,  '2026-02-01', 'C区粪坑旁',   '监测硫化氢'),
  -- D区育肥舍（shed_id=4）
  (23, 'D区-温度计1',   4, 11, 'Temperature', 'active', 22.0, '2026-02-10', 'D区东墙',     'D区1号圈温度'),
  (24, 'D区-温度计2',   4, 12, 'Temperature', 'active', 21.8, '2026-02-10', 'D区中段',     'D区2号圈温度'),
  (25, 'D区-温度计3',   4, 13, 'Temperature', 'active', 22.5, '2026-02-10', 'D区西墙',     'D区3号圈温度'),
  (26, 'D区-湿度计1',   4, 11, 'Humidity',    'active', 67.3, '2026-02-10', 'D区东墙',     'D区1号圈湿度'),
  (27, 'D区-湿度计2',   4, 12, 'Humidity',    'active', 69.0, '2026-02-10', 'D区中段',     'D区2号圈湿度'),
  (28, 'D区-氨气计1',   4, NULL,'Ammonia',    'active', 9.1,  '2026-02-10', 'D区中央顶部', '全舍氨气'),
  (29, 'D区-CO2计1',    4, NULL,'CO2',         'active', 1380.0,'2026-02-10','D区中央顶部','全舍CO2'),
  (30, 'D区-风速计1',   4, NULL,'WindSpeed',   'active', 1.2,  '2026-02-10', 'D区通风口',   '通风状态'),
  (31, 'D区-CH4计1',    4, NULL,'CH4',         'active', 1.8,  '2026-02-10', 'D区粪坑顶部', '甲烷监测'),
  (32, 'D区-PM计1',     4, NULL,'PM',          'active', 52.6, '2026-02-10', 'D区中央',     '粉尘监测'),
  -- E区繁殖舍（shed_id=5，维护中，传感器 inactive）
  (33, 'E区-温度计1',   5, 14, 'Temperature', 'inactive',NULL, '2025-12-01', 'E区东墙',    '维护中'),
  (34, 'E区-湿度计1',   5, 14, 'Humidity',    'inactive',NULL, '2025-12-01', 'E区东墙',    '维护中'),
  -- F区隔离舍（shed_id=6）
  (35, 'F区-温度计1',   6, 16, 'Temperature', 'active', 20.5, '2026-03-01', 'F区中央',     '隔离区温度'),
  (36, 'F区-湿度计1',   6, 16, 'Humidity',    'active', 58.0, '2026-03-01', 'F区中央',     '隔离区湿度'),
  (37, 'F区-氨气计1',   6, 16, 'Ammonia',     'active', 3.2,  '2026-03-01', 'F区顶部',     '隔离区氨气'),
  (38, 'F区-Oxygen计1', 6, 16, 'Oxygen',      'active', 20.8, '2026-03-01', 'F区中央',     '氧气监测'),
  -- 额外：D区高端传感器
  (39, 'D区-氧气计1',   4, NULL,'Oxygen',     'active', 20.5, '2026-02-10', 'D区中央',     '氧气浓度监测'),
  (40, 'D区-H2S计1',    4, NULL,'H2S',        'active', 0.8,  '2026-02-10', 'D区粪坑旁',   '硫化氢监测'),
  (41, 'A区-光照计1',   1, NULL,'Light',      'active', 950.0,'2026-02-01', 'A区顶部灯组', '光照强度'),
  (42, 'A区-CH4计1',    1, NULL,'CH4',        'active', 1.5,  '2026-02-01', 'A区粪坑顶部', '甲烷监测')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. 摄像头（每个羊舍 2-3 个）
-- ============================================================
INSERT INTO camera (id, name, shed_id, pen_id, status, stream_url, thumbnail_url, last_maintenance, location) VALUES
  (1,  'A区-摄像头1', 1, 1,  'online',  'rtsp://192.168.1.101:554/live/stream1', 'https://picsum.photos/seed/cam1/640/360',  '2026-03-01', 'A区东侧全景'),
  (2,  'A区-摄像头2', 1, 2,  'online',  'rtsp://192.168.1.102:554/live/stream1', 'https://picsum.photos/seed/cam2/640/360',  '2026-03-01', 'A区西侧全景'),
  (3,  'A区-摄像头3', 1, 3,  'online',  'rtsp://192.168.1.103:554/live/stream1', 'https://picsum.photos/seed/cam3/640/360',  '2026-02-15', 'A区采食区'),
  (4,  'B区-摄像头1', 2, 4,  'online',  'rtsp://192.168.1.104:554/live/stream1', 'https://picsum.photos/seed/cam4/640/360',  '2026-03-05', 'B区妊娠区'),
  (5,  'B区-摄像头2', 2, 5,  'online',  'rtsp://192.168.1.105:554/live/stream1', 'https://picsum.photos/seed/cam5/640/360',  '2026-03-05', 'B区产羔区'),
  (6,  'C区-摄像头1', 3, 7,  'online',  'rtsp://192.168.1.106:554/live/stream1', 'https://picsum.photos/seed/cam6/640/360',  '2026-03-10', 'C区幼羔区'),
  (7,  'C区-摄像头2', 3, 9,  'online',  'rtsp://192.168.1.107:554/live/stream1', 'https://picsum.photos/seed/cam7/640/360',  '2026-03-10', 'C区断奶区'),
  (8,  'D区-摄像头1', 4, 11, 'online',  'rtsp://192.168.1.108:554/live/stream1', 'https://picsum.photos/seed/cam8/640/360',  '2026-03-15', 'D区全景'),
  (9,  'D区-摄像头2', 4, 12, 'online',  'rtsp://192.168.1.109:554/live/stream1', 'https://picsum.photos/seed/cam9/640/360',  '2026-03-15', 'D区采食区'),
  (10, 'D区-摄像头3', 4, 13, 'online',  'rtsp://192.168.1.110:554/live/stream1', 'https://picsum.photos/seed/cam10/640/360', '2026-03-15', 'D区饮水区'),
  (11, 'E区-摄像头1', 5, 14, 'offline', 'rtsp://192.168.1.111:554/live/stream1', 'https://picsum.photos/seed/cam11/640/360', '2025-11-01', 'E区全景（离线维护）'),
  (12, 'F区-摄像头1', 6, 16, 'online',  'rtsp://192.168.1.112:554/live/stream1', 'https://picsum.photos/seed/cam12/640/360', '2026-03-20', 'F区隔离舍全景')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. 用户（admin + 普通用户）
-- ============================================================
INSERT INTO "user" (id, name, password, role, email, phone, last_login) VALUES
  (1, 'admin',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNAl9gSmPB3wC', 0, 'admin@farm.com',   '13800138000', NOW() - INTERVAL '1 hour'),
  (2, 'zhangwei', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNAl9gSmPB3wC', 1, 'zhangwei@farm.com','13800138001', NOW() - INTERVAL '2 days'),
  (3, 'liming',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNAl9gSmPB3wC', 1, 'liming@farm.com',  '13800138002', NOW() - INTERVAL '5 days'),
  (4, 'researcher1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNAl9gSmPB3wC', 2, 'research1@univ.edu','13900139001', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. 动物（约 200 只）
-- ============================================================
INSERT INTO animal (id, name, breed, age, gender, health_status, shed_id, current_pen_id, entry_date, birth_date, production_type, breeding_status, description) VALUES
  -- A区育肥舍（shed_id=1）- 1号圈 公羊育肥
  (1,  'YF-2024-001', '杜泊羊', 8,  'male',   'good',           1, 1,  '2025-08-01', '2024-08-01', 'fattening', NULL, '杜泊×湖羊杂交育肥'),
  (2,  'YF-2024-002', '杜泊羊', 8,  'male',   'good',           1, 1,  '2025-08-01', '2024-08-01', 'fattening', NULL, '杜泊×湖羊杂交育肥'),
  (3,  'YF-2024-003', '杜泊羊', 9,  'male',   'good',           1, 1,  '2025-07-15', '2024-07-15', 'fattening', NULL, NULL),
  (4,  'YF-2024-004', '湖羊',   8,  'male',   'good',           1, 1,  '2025-08-01', '2024-08-01', 'fattening', NULL, NULL),
  (5,  'YF-2024-005', '湖羊',   8,  'male',   'good',           1, 1,  '2025-08-01', '2024-08-01', 'fattening', NULL, NULL),
  (6,  'YF-2024-006', '萨福克', 9,  'male',   'good',           1, 1,  '2025-07-15', '2024-07-15', 'fattening', NULL, '萨福克纯种'),
  (7,  'YF-2024-007', '杜泊羊', 10, 'male',   'good',           1, 1,  '2025-06-20', '2024-06-20', 'fattening', NULL, NULL),
  (8,  'YF-2024-008', '湖羊',   9,  'male',   'good',           1, 1,  '2025-07-15', '2024-07-15', 'fattening', NULL, NULL),
  (9,  'YF-2024-009', '湖羊',   10, 'male',   'ill',            1, 1,  '2025-06-20', '2024-06-20', 'fattening', NULL, '近期食欲下降，已通知兽医'),
  (10, 'YF-2024-010', '杜泊羊', 8,  'male',   'good',           1, 1,  '2025-08-01', '2024-08-01', 'fattening', NULL, NULL),
  -- A区-2号圈 公羊育肥（大龄）
  (11, 'YF-2024-011', '杜泊羊', 11, 'male',   'good',           1, 2,  '2025-05-10', '2024-05-10', 'fattening', NULL, NULL),
  (12, 'YF-2024-012', '湖羊',   12, 'male',   'good',           1, 2,  '2025-04-15', '2024-04-15', 'fattening', NULL, NULL),
  (13, 'YF-2024-013', '萨福克', 11, 'male',   'good',           1, 2,  '2025-05-10', '2024-05-10', 'fattening', NULL, NULL),
  (14, 'YF-2024-014', '杜泊羊', 10, 'male',   'under_treatment',1, 2,  '2025-06-20', '2024-06-20', 'fattening', NULL, '蹄病治疗中'),
  (15, 'YF-2024-015', '湖羊',   12, 'male',   'good',           1, 2,  '2025-04-15', '2024-04-15', 'fattening', NULL, NULL),
  -- B区繁殖舍（shed_id=2）母羊
  (16, 'FZ-2022-001', '湖羊',   30, 'female', 'good',           2, 4,  '2023-09-01', '2022-09-01', 'breeding', 'pregnant',  '预产期2026-04-15，第3胎'),
  (17, 'FZ-2022-002', '湖羊',   28, 'female', 'good',           2, 4,  '2023-11-01', '2022-11-01', 'breeding', 'pregnant',  '预产期2026-04-20，第2胎'),
  (18, 'FZ-2022-003', '湖羊',   32, 'female', 'good',           2, 4,  '2023-07-01', '2022-07-01', 'breeding', 'perinatal', '围产期，重点关注'),
  (19, 'FZ-2023-001', '湖羊',   18, 'female', 'good',           2, 4,  '2024-09-01', '2023-09-01', 'breeding', 'mated_wait','配种后妊检待确认'),
  (20, 'FZ-2023-002', '湖羊',   18, 'female', 'good',           2, 5,  '2024-09-01', '2023-09-01', 'breeding', 'lactation', '已产羔，哺乳中，双羔'),
  (21, 'FZ-2022-004', '湖羊',   30, 'female', 'good',           2, 5,  '2023-09-01', '2022-09-01', 'breeding', 'lactation', '产羔已12天'),
  (22, 'FZ-2023-003', '湖羊',   20, 'female', 'good',           2, 6,  '2024-07-01', '2023-07-01', 'breeding', 'empty',     '上次妊检阴性，等待再次配种'),
  (23, 'FZ-2023-004', '湖羊',   19, 'female', 'good',           2, 6,  '2024-08-01', '2023-08-01', 'breeding', 'empty',     NULL),
  (24, 'FZ-2022-005', '湖羊',   29, 'female', 'good',           2, 6,  '2023-10-01', '2022-10-01', 'breeding', 'empty',     NULL),
  -- C区羔羊舍（shed_id=3）
  (25, 'GY-2026-001', '湖羊',   1,  'male',   'good',           3, 7,  '2026-03-01', '2026-03-01', 'fattening', NULL, '出生重3.2kg，发育良好'),
  (26, 'GY-2026-002', '湖羊',   1,  'female', 'good',           3, 7,  '2026-03-01', '2026-03-01', 'fattening', NULL, '出生重2.9kg'),
  (27, 'GY-2026-003', '杜泊羊', 2,  'male',   'good',           3, 7,  '2026-02-15', '2026-02-15', 'fattening', NULL, '杂交一代，长势好'),
  (28, 'GY-2026-004', '杜泊羊', 2,  'male',   'good',           3, 7,  '2026-02-15', '2026-02-15', 'fattening', NULL, NULL),
  (29, 'GY-2026-005', '湖羊',   2,  'female', 'good',           3, 7,  '2026-02-15', '2026-02-15', 'breeding',  NULL, '预留种羊候选'),
  (30, 'GY-2026-006', '湖羊',   1,  'male',   'ill',            3, 7,  '2026-03-05', '2026-03-05', 'fattening', NULL, '腹泻，正在治疗'),
  (31, 'GY-2025-101', '湖羊',   4,  'male',   'good',           3, 8,  '2025-11-20', '2025-11-20', 'fattening', NULL, NULL),
  (32, 'GY-2025-102', '湖羊',   4,  'female', 'good',           3, 8,  '2025-11-20', '2025-11-20', 'fattening', NULL, NULL),
  (33, 'GY-2025-103', '杜泊羊', 5,  'male',   'good',           3, 8,  '2025-10-25', '2025-10-25', 'fattening', NULL, NULL),
  (34, 'GY-2025-104', '湖羊',   6,  'male',   'good',           3, 9,  '2025-09-20', '2025-09-20', 'fattening', NULL, NULL),
  (35, 'GY-2025-105', '湖羊',   6,  'male',   'good',           3, 9,  '2025-09-20', '2025-09-20', 'fattening', NULL, NULL),
  -- D区育肥舍（shed_id=4）
  (36, 'YF-2025-101', '波尔山羊',9, 'male',   'good',           4, 11, '2025-06-01', '2024-06-01', 'fattening', NULL, '波尔×湖羊，高档肉羊'),
  (37, 'YF-2025-102', '波尔山羊',9, 'male',   'good',           4, 11, '2025-06-01', '2024-06-01', 'fattening', NULL, '高档肉羊'),
  (38, 'YF-2025-103', '湖羊',   8,  'male',   'good',           4, 12, '2025-07-01', '2024-07-01', 'fattening', NULL, NULL),
  (39, 'YF-2025-104', '湖羊',   8,  'male',   'good',           4, 12, '2025-07-01', '2024-07-01', 'fattening', NULL, NULL),
  (40, 'YF-2025-105', '杜泊羊', 9,  'male',   'good',           4, 13, '2025-06-01', '2024-06-01', 'fattening', NULL, NULL),
  -- F区隔离舍（shed_id=6）
  (41, 'GE-2026-001', '澳大利亚美利奴', 12, 'male',   'good', 6, 16, '2026-03-15', '2025-03-15', 'test', NULL, '新引进，隔离观察中'),
  (42, 'GE-2026-002', '澳大利亚美利奴', 12, 'female', 'good', 6, 16, '2026-03-15', '2025-03-15', 'test', NULL, '新引进，隔离观察中')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. 告警规则（alert_rule）
-- ============================================================
INSERT INTO alert_rule (id, name, sensor_id, sensor_name, rule_type, condition, threshold, notification_method, enabled, description) VALUES
  (1,  '温度过高告警-A区',   1,  'A区-温度计1',   'manual', 'gt',  30.0, 'both',  true, 'A区温度超过30°C触发高温报警'),
  (2,  '温度过低告警-A区',   1,  'A区-温度计1',   'manual', 'lt',  10.0, 'both',  true, 'A区温度低于10°C触发低温报警'),
  (3,  '氨气超标-A区',       5,  'A区-氨气计1',   'manual', 'gt',  25.0, 'both',  true, '氨气浓度超过25ppm须立即通风'),
  (4,  'CO2超标-A区',        6,  'A区-CO2计1',    'manual', 'gt',  2000.0,'email', true, 'CO2超过2000ppm'),
  (5,  '温度过高告警-C区',   15, 'C区-温度计1',   'manual', 'gt',  26.0, 'both',  true, '羔羊区高温报警，阈值较低'),
  (6,  '温度过低告警-C区',   15, 'C区-温度计1',   'manual', 'lt',  15.0, 'both',  true, '羔羊区低温报警'),
  (7,  '氨气超标-D区',       28, 'D区-氨气计1',   'manual', 'gt',  20.0, 'sms',   true, 'D区氨气超标'),
  (8,  '智能温度异常-A区',    1,  'A区-温度计1',   'smart',  'gt',  28.0, 'email', true, '连续2小时偏高触发'),
  (9,  'PM2.5超标-A区',      8,  'A区-PM计1',     'manual', 'gt',  75.0, 'email', true, 'PM2.5超过75μg/m³'),
  (10, 'H2S超标-C区',        22, 'C区-H2S计1',    'manual', 'gt',  5.0,  'both',  true, '硫化氢超过5ppm')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. 告警记录（近30天，已解决和未解决的都有）
-- ============================================================
INSERT INTO alert (id, shed_id, pen_id, severity, description, alert_time, resolved, resolved_by, resolve_time) VALUES
  (1,  1, 1,    'high',   'A区1号圈温度达到31.5°C，超过报警阈值30°C，已启动应急通风',        NOW()-INTERVAL '28 days', true,  'zhangwei', NOW()-INTERVAL '27 days 22 hours'),
  (2,  1, NULL, 'medium', 'A区氨气浓度26.3ppm，超过阈值25ppm，已调大风机频率',             NOW()-INTERVAL '25 days', true,  'admin',    NOW()-INTERVAL '24 days 23 hours'),
  (3,  3, 7,    'high',   'C区1号圈温度骤降至13.8°C，低于羔羊适宜温度15°C，已开启辅热',     NOW()-INTERVAL '22 days', true,  'liming',   NOW()-INTERVAL '21 days 20 hours'),
  (4,  2, 4,    'medium', 'B区妊娠区湿度偏高72.4%，已调整通风策略',                       NOW()-INTERVAL '20 days', true,  'zhangwei', NOW()-INTERVAL '19 days 18 hours'),
  (5,  4, 11,   'low',    'D区1号圈CO2浓度1850ppm，接近预警线2000ppm，请关注',             NOW()-INTERVAL '18 days', true,  'admin',    NOW()-INTERVAL '18 days  2 hours'),
  (6,  1, 2,    'medium', 'A区2号圈温度计1读数异常（波动±3°C），疑似传感器故障',            NOW()-INTERVAL '15 days', true,  'admin',    NOW()-INTERVAL '14 days'),
  (7,  4, NULL, 'high',   'D区氨气浓度突升至28ppm，已紧急通风并联系兽医检查羊只状态',        NOW()-INTERVAL '12 days', true,  'zhangwei', NOW()-INTERVAL '11 days 21 hours'),
  (8,  3, 9,    'medium', '60-90日龄区相对湿度持续偏低52%，已加湿处理',                    NOW()-INTERVAL '10 days', true,  'liming',   NOW()-INTERVAL '9  days 16 hours'),
  (9,  1, NULL, 'low',    'A区PM2.5浓度78μg/m³，略超预警值，已加强清洁频次',              NOW()-INTERVAL '8  days', true,  'admin',    NOW()-INTERVAL '7  days 22 hours'),
  (10, 2, 4,    'high',   'B区围产期母羊FZ-2022-003出现异常行为，已通知兽医到场',           NOW()-INTERVAL '6  days', true,  'zhangwei', NOW()-INTERVAL '5  days 18 hours'),
  (11, 4, 12,   'medium', 'D区2号圈温度偏高29.8°C，临近阈值，已加大通风量',               NOW()-INTERVAL '5  days', true,  'admin',    NOW()-INTERVAL '4  days 23 hours'),
  (12, 1, 1,    'low',    '羊只YF-2024-009食欲持续下降第3天，已隔离观察',                  NOW()-INTERVAL '4  days', false, NULL,       NULL),
  (13, 3, 7,    'medium', 'C区0-30日龄区温度波动频繁（±2.5°C），建议检查加热设备',          NOW()-INTERVAL '3  days', false, NULL,       NULL),
  (14, 6, 16,   'low',    '隔离区新引进羊只GE-2026-001体温偏高39.8°C，持续监测中',         NOW()-INTERVAL '2  days', false, NULL,       NULL),
  (15, 4, 13,   'medium', 'D区3号圈甲烷浓度3.2ppm，较近期平均值偏高，已加强通风',           NOW()-INTERVAL '1  day',  false, NULL,       NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. 体重记录（近90天，选取30只羊，每7天一次）
-- ============================================================
INSERT INTO weight_record (animal_id, record_date, weighing_time, weight_kg)
SELECT
  a.animal_id,
  CURRENT_DATE - (a.week * 7)         AS record_date,
  '08:30:00'::time                    AS weighing_time,
  -- 初始体重 + 每周增长（育肥 0.8-1.2kg/周，繁殖 0.3-0.5kg/周）
  ROUND((
    CASE
      WHEN a.animal_id <= 15 THEN 22.0 + (12 - a.week) * (0.9 + random()*0.3) + random()*0.5
      WHEN a.animal_id <= 24 THEN 38.0 + (12 - a.week) * (0.4 + random()*0.1)
      WHEN a.animal_id <= 35 THEN  8.0 + (12 - a.week) * (0.6 + random()*0.2)
      ELSE                        25.0 + (12 - a.week) * (0.8 + random()*0.2)
    END
  )::numeric, 1) AS weight_kg
FROM (
  SELECT gs AS week, unnest(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
                                  21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]) AS animal_id
  FROM generate_series(0, 12) gs
) a
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. 采食量记录（近60天，每个活跃圈每天一条）
-- ============================================================
INSERT INTO feed_intake_record (pen_id, record_date,
  morning_feeding_time, morning_feeding_amount_kg, morning_box_weight_kg, morning_remaining_feed_kg, morning_feed_intake_kg,
  afternoon_feeding_time, afternoon_feeding_amount_kg, afternoon_box_weight_kg, afternoon_remaining_feed_kg, afternoon_feed_intake_kg,
  daily_total_feed_intake_kg, sheep_count, avg_individual_intake_kg)
SELECT
  p.pen_id,
  CURRENT_DATE - p.day_offset AS record_date,
  '07:30:00'::time,
  ROUND((p.base_feed + random()*2)::numeric, 1),
  5.0,
  ROUND((p.base_feed + random()*2 + 5.0 - p.base_intake - random()*1)::numeric, 1),
  ROUND((p.base_intake + random()*0.8)::numeric, 1),
  '16:00:00'::time,
  ROUND((p.base_feed * 0.8 + random()*1.5)::numeric, 1),
  5.0,
  ROUND((p.base_feed * 0.8 + random()*1.5 + 5.0 - p.base_intake*0.8 - random()*0.8)::numeric, 1),
  ROUND((p.base_intake*0.8 + random()*0.6)::numeric, 1),
  ROUND(((p.base_intake + random()*0.8) + (p.base_intake*0.8 + random()*0.6))::numeric, 1),
  p.sheep_cnt,
  ROUND(((p.base_intake + p.base_intake*0.8) / p.sheep_cnt)::numeric, 2)
FROM (
  SELECT pen_id, day_offset, base_feed, base_intake, sheep_cnt FROM (VALUES
    (1, 0, 45.0, 38.0, 30), (2, 0, 48.0, 40.0, 32), (3, 0, 42.0, 36.0, 28),
    (4, 0, 30.0, 26.0, 18), (5, 0, 28.0, 24.0, 15), (6, 0, 32.0, 27.0, 20),
    (7, 0, 18.0, 15.0, 25), (8, 0, 22.0, 18.0, 30), (9, 0, 24.0, 20.0, 32),
    (10,0, 20.0, 17.0, 28), (11,0, 55.0, 46.0, 38), (12,0, 50.0, 42.0, 35),
    (13,0, 52.0, 44.0, 36)
  ) AS base(pen_id, day_offset, base_feed, base_intake, sheep_cnt)
  CROSS JOIN generate_series(0, 59) AS gs(day_offset)
) p
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. 行为记录（近30天，每个摄像头每小时一条）
-- ============================================================
INSERT INTO behavior_record (camera_id, timestamp, eating_count, drinking_count, licking_count, standing_count, lying_count)
SELECT
  c.camera_id,
  NOW() - (c.hour_offset * INTERVAL '1 hour'),
  -- 白天（6-20时）进食多，夜晚少
  CASE WHEN (EXTRACT(HOUR FROM NOW() - (c.hour_offset * INTERVAL '1 hour'))) BETWEEN 6 AND 20
    THEN 8 + floor(random()*8)::int
    ELSE 1 + floor(random()*3)::int END,
  CASE WHEN (EXTRACT(HOUR FROM NOW() - (c.hour_offset * INTERVAL '1 hour'))) BETWEEN 7 AND 18
    THEN 4 + floor(random()*5)::int
    ELSE 0 + floor(random()*2)::int END,
  floor(random()*5)::int,
  CASE WHEN (EXTRACT(HOUR FROM NOW() - (c.hour_offset * INTERVAL '1 hour'))) BETWEEN 6 AND 20
    THEN 10 + floor(random()*12)::int
    ELSE 3 + floor(random()*5)::int END,
  CASE WHEN (EXTRACT(HOUR FROM NOW() - (c.hour_offset * INTERVAL '1 hour'))) BETWEEN 6 AND 20
    THEN 5 + floor(random()*8)::int
    ELSE 15 + floor(random()*10)::int END
FROM (
  SELECT camera_id, hour_offset
  FROM (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(12)) AS cams(camera_id)
  CROSS JOIN generate_series(0, 719) AS gs(hour_offset)  -- 30天
) c
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. 传感器历史记录（近30天，每小时一条，含昼夜变化规律）
-- ============================================================

-- 利用 generate_series 批量生成 30 天每小时数据（共 720 个时间点）
-- 每个传感器生成不同类型的模拟数据

-- 温度传感器（模拟昼夜温差，白天高夜晚低）
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND((s.base_val
    + s.amplitude * sin((EXTRACT(HOUR FROM t.ts) - 6) * 3.14159 / 12.0)
    + random() * s.noise - s.noise/2
  )::numeric, 2) AS value,
  t.ts AS timestamp
FROM (VALUES
  (1,  22.0, 4.0, 0.8),
  (2,  23.0, 4.5, 0.8),
  (9,  20.5, 3.0, 0.6),
  (10, 21.0, 3.5, 0.6),
  (15, 23.5, 2.5, 0.5),
  (16, 23.0, 2.8, 0.5),
  (17, 22.5, 3.0, 0.5),
  (23, 21.5, 4.0, 0.8),
  (24, 21.8, 4.0, 0.8),
  (25, 22.0, 4.2, 0.8),
  (33, 20.0, 2.0, 0.3),
  (35, 20.5, 2.0, 0.4)
) AS s(sensor_id, base_val, amplitude, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- 湿度传感器（与温度反相：温度高则湿度低）
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND((s.base_val
    - s.amplitude * sin((EXTRACT(HOUR FROM t.ts) - 6) * 3.14159 / 12.0)
    + random() * s.noise - s.noise/2
  )::numeric, 2) AS value,
  t.ts AS timestamp
FROM (VALUES
  (3,  68.0, 5.0, 2.0),
  (4,  71.0, 5.5, 2.0),
  (11, 64.0, 4.0, 1.5),
  (18, 62.0, 3.5, 1.5),
  (26, 67.0, 5.0, 2.0),
  (27, 69.0, 5.0, 2.0),
  (34, 58.0, 3.0, 1.0),
  (36, 58.0, 3.0, 1.0)
) AS s(sensor_id, base_val, amplitude, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- 氨气传感器（白天动物活跃，氨气略高）
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND(GREATEST(0.5, s.base_val
    + s.amplitude * sin((EXTRACT(HOUR FROM t.ts) - 8) * 3.14159 / 10.0)
    + random() * s.noise
  )::numeric, 2) AS value,
  t.ts AS timestamp
FROM (VALUES
  (5,  8.0,  2.5, 1.5),
  (12, 6.0,  2.0, 1.0),
  (19, 4.5,  1.5, 0.8),
  (28, 9.0,  3.0, 1.5),
  (37, 3.0,  1.0, 0.5)
) AS s(sensor_id, base_val, amplitude, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- CO2传感器（白天高）
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND(GREATEST(400, s.base_val
    + s.amplitude * sin((EXTRACT(HOUR FROM t.ts) - 7) * 3.14159 / 11.0)
    + random() * s.noise
  )::numeric, 1) AS value,
  t.ts AS timestamp
FROM (VALUES
  (6,  1250.0, 350.0, 100.0),
  (13, 1100.0, 280.0, 80.0),
  (20, 980.0,  220.0, 70.0),
  (29, 1380.0, 400.0, 120.0)
) AS s(sensor_id, base_val, amplitude, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- 风速传感器
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND(GREATEST(0.1, s.base_val + random() * s.noise - s.noise/3)::numeric, 2) AS value,
  t.ts AS timestamp
FROM (VALUES
  (7,  0.8, 0.6),
  (30, 1.2, 0.8)
) AS s(sensor_id, base_val, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- 光照传感器（只有白天有光照）
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND(CASE
    WHEN EXTRACT(HOUR FROM t.ts) BETWEEN 6 AND 20
      THEN GREATEST(10, s.base_val
             * sin((EXTRACT(HOUR FROM t.ts) - 6) * 3.14159 / 14.0)
             + random() * s.noise)
    ELSE random() * 20
  END::numeric, 1) AS value,
  t.ts AS timestamp
FROM (VALUES
  (14, 900.0,  150.0),
  (21, 1200.0, 200.0),
  (41, 950.0,  150.0)
) AS s(sensor_id, base_val, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- CH4甲烷、H2S硫化氢、PM2.5、Oxygen传感器
INSERT INTO sensor_record (sensor_id, value, timestamp)
SELECT
  s.sensor_id,
  ROUND(GREATEST(s.min_val, s.base_val + random() * s.noise - s.noise/3)::numeric, 2) AS value,
  t.ts AS timestamp
FROM (VALUES
  (22, 0.5,  0.1, 0.6),  -- H2S C区
  (31, 1.8,  0.2, 2.0),  -- CH4 D区
  (32, 50.0, 5.0, 40.0), -- PM D区
  (38, 20.8, 19.5,0.8),  -- Oxygen F区
  (39, 20.5, 19.5,0.8),  -- Oxygen D区
  (40, 0.8,  0.1, 1.0),  -- H2S D区
  (42, 1.5,  0.2, 2.0),  -- CH4 A区
  (8,  45.0, 5.0, 35.0)  -- PM A区
) AS s(sensor_id, min_val, base_val, noise)
CROSS JOIN (
  SELECT generate_series(
    NOW() - INTERVAL '30 days',
    NOW(),
    INTERVAL '1 hour'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. 视频历史记录（近30天，每个在线摄像头每天若干条）
-- ============================================================
INSERT INTO video_record (camera_id, shed_id, start_time, end_time, duration, thumbnail_url, file_size, resolution, description)
SELECT
  v.camera_id,
  v.shed_id,
  v.start_time,
  v.start_time + (v.dur_min * INTERVAL '1 minute') AS end_time,
  v.dur_min * 60 AS duration,
  'https://picsum.photos/seed/vid' || v.camera_id || '_' || floor(random()*1000)::int || '/640/360' AS thumbnail_url,
  (v.dur_min * 60 * 2500000)::bigint AS file_size,  -- 约2.5Mbps
  '1920x1080' AS resolution,
  v.desc_text AS description
FROM (
  SELECT
    cams.camera_id,
    cams.shed_id,
    (NOW() - (gs.day_offset * INTERVAL '1 day')
      + (slot.slot_hour * INTERVAL '1 hour')) AS start_time,
    30 + floor(random()*30)::int AS dur_min,
    slot.desc_text
  FROM (VALUES
    (1,1),(2,1),(3,1),(4,2),(5,2),(6,3),(7,3),(8,4),(9,4),(10,4),(12,6)
  ) AS cams(camera_id, shed_id)
  CROSS JOIN generate_series(0, 29) AS gs(day_offset)
  CROSS JOIN (
    VALUES (6, '早晨巡检'), (9, '上午喂料'), (12, '午间观察'),
           (15, '下午巡检'), (18, '傍晚喂料'), (21, '夜间检查')
  ) AS slot(slot_hour, desc_text)
) v
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. 体温记录（近60天，选取主要羊只）
-- ============================================================
INSERT INTO body_temperature_record (
  animal_id, record_date, measurement_time,
  ear_temperature, dewlap_temperature, scapula_temperature,
  dorsal_midline_temperature, hip_temperature,
  forelimb_upper_temperature, forelimb_lower_temperature,
  hindlimb_upper_temperature, hindlimb_lower_temperature,
  average_body_surface_temperature
)
SELECT
  a.animal_id,
  CURRENT_DATE - a.day_offset AS record_date,
  '09:00:00'::time,
  ROUND((38.5 + random()*0.8)::numeric, 1) AS ear_temp,
  ROUND((37.8 + random()*0.6)::numeric, 1),
  ROUND((37.5 + random()*0.6)::numeric, 1),
  ROUND((37.6 + random()*0.6)::numeric, 1),
  ROUND((37.4 + random()*0.6)::numeric, 1),
  ROUND((36.8 + random()*0.8)::numeric, 1),
  ROUND((35.5 + random()*0.8)::numeric, 1),
  ROUND((36.2 + random()*0.8)::numeric, 1),
  ROUND((34.8 + random()*1.0)::numeric, 1),
  ROUND((37.2 + random()*0.6)::numeric, 1) AS avg_temp
FROM (
  SELECT
    animal_id,
    day_offset
  FROM (VALUES (1),(2),(3),(9),(14),(16),(17),(18),(20),(21),(25),(30),(36),(37),(41),(42)) AS aids(animal_id)
  CROSS JOIN generate_series(0, 59, 7) AS gs(day_offset)  -- 每7天一次
) a
ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. 呼吸记录（近30天）
-- ============================================================
INSERT INTO respiration_record (animal_id, record_date, monitoring_time, respiratory_rate_per_minute)
SELECT
  a.animal_id,
  CURRENT_DATE - a.day_offset AS record_date,
  '10:00:00'::time,
  18 + floor(random()*10)::int AS resp_rate
FROM (
  SELECT
    animal_id,
    day_offset
  FROM (VALUES (1),(2),(3),(9),(14),(16),(17),(18),(20),(21),(25),(30),(36),(37)) AS aids(animal_id)
  CROSS JOIN generate_series(0, 29, 3) AS gs(day_offset)  -- 每3天一次
) a
ON CONFLICT DO NOTHING;

-- ============================================================
-- 17. 综合环境记录（近7天，每5分钟一条，shed_id=1）
-- ============================================================
INSERT INTO house_comprehensive_environment (
  shed_id, record_time,
  co2_area1, temperature_area1, humidity_area1, wind_speed_area1, black_globe_temp_area1, illuminance_area1,
  co2_area2, temperature_area2, humidity_area2, wind_speed_area2, black_globe_temp_area2, illuminance_area2,
  co2_area3, temperature_area3, humidity_area3, wind_speed_area3, black_globe_temp_area3, illuminance_area3,
  outdoor_temperature, outdoor_humidity, outdoor_illuminance, outdoor_black_globe_temp, pressure_difference
)
SELECT
  1 AS shed_id,
  t.ts AS record_time,
  ROUND((1250 + 300*sin((EXTRACT(HOUR FROM t.ts)-7)*3.14159/11) + random()*100)::numeric, 1),
  ROUND((22.0 + 4*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*0.8)::numeric, 2),
  ROUND((68.0 - 5*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*2)::numeric, 2),
  ROUND((0.8 + random()*0.6)::numeric, 2),
  ROUND((24.0 + 5*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*0.8)::numeric, 2),
  ROUND(CASE WHEN EXTRACT(HOUR FROM t.ts) BETWEEN 6 AND 20
        THEN 950*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/14) + random()*150
        ELSE random()*20 END::numeric, 1),
  ROUND((1200 + 280*sin((EXTRACT(HOUR FROM t.ts)-7)*3.14159/11) + random()*100)::numeric, 1),
  ROUND((21.8 + 3.8*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*0.8)::numeric, 2),
  ROUND((69.0 - 5*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*2)::numeric, 2),
  ROUND((0.9 + random()*0.5)::numeric, 2),
  ROUND((23.5 + 4.8*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*0.8)::numeric, 2),
  ROUND(CASE WHEN EXTRACT(HOUR FROM t.ts) BETWEEN 6 AND 20
        THEN 900*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/14) + random()*150
        ELSE random()*20 END::numeric, 1),
  ROUND((1180 + 260*sin((EXTRACT(HOUR FROM t.ts)-7)*3.14159/11) + random()*100)::numeric, 1),
  ROUND((22.2 + 4.2*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*0.8)::numeric, 2),
  ROUND((67.5 - 4.5*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*2)::numeric, 2),
  ROUND((0.7 + random()*0.5)::numeric, 2),
  ROUND((23.8 + 4.5*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*0.8)::numeric, 2),
  ROUND(CASE WHEN EXTRACT(HOUR FROM t.ts) BETWEEN 6 AND 20
        THEN 920*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/14) + random()*150
        ELSE random()*20 END::numeric, 1),
  ROUND((15.0 + 8*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*2)::numeric, 2),
  ROUND((72.0 - 8*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*3)::numeric, 2),
  ROUND(CASE WHEN EXTRACT(HOUR FROM t.ts) BETWEEN 6 AND 20
        THEN 80000*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/14) + random()*20000
        ELSE random()*200 END::numeric, 1),
  ROUND((18.0 + 8*sin((EXTRACT(HOUR FROM t.ts)-6)*3.14159/12) + random()*1.5)::numeric, 2),
  ROUND((2.5 + random()*1.5)::numeric, 2)
FROM (
  SELECT generate_series(
    NOW() - INTERVAL '7 days',
    NOW(),
    INTERVAL '5 minutes'
  ) AS ts
) t
ON CONFLICT DO NOTHING;

-- ============================================================
-- 18. 重置序列（避免自增ID冲突）
-- ============================================================
SELECT setval('shed_id_seq',            (SELECT COALESCE(MAX(id), 6)  FROM shed) + 1);
SELECT setval('pen_id_seq',             (SELECT COALESCE(MAX(id), 16) FROM pen)  + 1);
SELECT setval('sensor_id_seq',          (SELECT COALESCE(MAX(id), 42) FROM sensor) + 1);
SELECT setval('camera_id_seq',          (SELECT COALESCE(MAX(id), 12) FROM camera) + 1);
SELECT setval('user_id_seq',            (SELECT COALESCE(MAX(id), 4)  FROM "user") + 1);
SELECT setval('animal_id_seq',          (SELECT COALESCE(MAX(id), 42) FROM animal) + 1);
SELECT setval('alert_id_seq',           (SELECT COALESCE(MAX(id), 15) FROM alert) + 1);
SELECT setval('alert_rule_id_seq',      (SELECT COALESCE(MAX(id), 10) FROM alert_rule) + 1);
SELECT setval('sensor_record_id_seq',   (SELECT COALESCE(MAX(id), 1)  FROM sensor_record) + 1);
SELECT setval('weight_record_id_seq',   (SELECT COALESCE(MAX(id), 1)  FROM weight_record) + 1);
SELECT setval('feed_intake_record_id_seq',(SELECT COALESCE(MAX(id), 1) FROM feed_intake_record) + 1);
SELECT setval('behavior_record_id_seq', (SELECT COALESCE(MAX(id), 1)  FROM behavior_record) + 1);
SELECT setval('video_record_id_seq',    (SELECT COALESCE(MAX(id), 1)  FROM video_record) + 1);
SELECT setval('body_temperature_record_id_seq', (SELECT COALESCE(MAX(id), 1) FROM body_temperature_record) + 1);
SELECT setval('respiration_record_id_seq', (SELECT COALESCE(MAX(id), 1) FROM respiration_record) + 1);
SELECT setval('house_comprehensive_environment_id_seq', (SELECT COALESCE(MAX(id), 1) FROM house_comprehensive_environment) + 1);

-- ============================================================
-- 完成
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE ' LivestockMonitor 数据初始化完成！';
  RAISE NOTICE ' sensor_type: % 条', (SELECT COUNT(*) FROM sensor_type);
  RAISE NOTICE ' shed:        % 条', (SELECT COUNT(*) FROM shed);
  RAISE NOTICE ' pen:         % 条', (SELECT COUNT(*) FROM pen);
  RAISE NOTICE ' sensor:      % 条', (SELECT COUNT(*) FROM sensor);
  RAISE NOTICE ' camera:      % 条', (SELECT COUNT(*) FROM camera);
  RAISE NOTICE ' user:        % 条', (SELECT COUNT(*) FROM "user");
  RAISE NOTICE ' animal:      % 条', (SELECT COUNT(*) FROM animal);
  RAISE NOTICE ' alert_rule:  % 条', (SELECT COUNT(*) FROM alert_rule);
  RAISE NOTICE ' alert:       % 条', (SELECT COUNT(*) FROM alert);
  RAISE NOTICE ' sensor_record:% 条',(SELECT COUNT(*) FROM sensor_record);
  RAISE NOTICE ' behavior_record:% 条',(SELECT COUNT(*) FROM behavior_record);
  RAISE NOTICE ' video_record:% 条', (SELECT COUNT(*) FROM video_record);
  RAISE NOTICE ' weight_record:% 条',(SELECT COUNT(*) FROM weight_record);
  RAISE NOTICE ' feed_intake:  % 条',(SELECT COUNT(*) FROM feed_intake_record);
  RAISE NOTICE ' body_temp:    % 条',(SELECT COUNT(*) FROM body_temperature_record);
  RAISE NOTICE ' respiration:  % 条',(SELECT COUNT(*) FROM respiration_record);
  RAISE NOTICE ' house_env:    % 条',(SELECT COUNT(*) FROM house_comprehensive_environment);
  RAISE NOTICE '====================================================';
END $$;
