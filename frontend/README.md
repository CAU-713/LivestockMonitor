# 智慧动物行为识别与预警系统 (前端)

本项目是 **智慧动物行为识别与预警系统** 的前端工程，基于 Next.js (App Router) 和 Material-UI (MUI) 构建。

当前版本：**v0.2 (架构重构)**
主要目标：展示系统的交互逻辑、页面布局以及视觉风格，使用本地 Mock 数据驱动。

## 🛠 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI 组件库**: Material-UI (MUI) v5+
- **样式方案**: Emotion (MUI 内置)
- **图表库**: Recharts
- **代码规范**: ESLint, Prettier

## 🚀 快速开始

确保你的本地环境已安装 Node.js (v18+) 和 npm。

1. **安装依赖**
    ```bash
    cd frontend
    npm install
    ```
2. **启动开发服务器**
    ```bash
    npm run dev
    ```
3. **访问页面**

    打开浏览器访问 http://localhost:3000 即可看到系统。

## 📂 项目目录结构

为了保持多人协作的整洁，请严格遵守以下目录规范：
```
frontend/
├── app/
│   ├── (auth)/              # 认证页面 (登录、注册)
│   │   └── Login/
│   └── (main)/              # 主应用页面 (包含侧边栏和顶部栏布局)
│       ├── dashboard/       # [总览] 页面
│       │   └── components/  # 总览页专用组件
│       ├── monitor/         # [实时监控] 页面 (分为环境和视频)
│       │   └── components/  # 监控页专用组件
│       ├── history/         # [历史数据] 页面
│       │   ├── environmental-data/
│       │   └── video-data/
│       └── settings/        # [系统设置] 页面
│           └── components/  # 设置页专用组件
├── components/              # 共享组件库 (跨页面复用)
│   ├── layout/              # 布局组件 (Sidebar, Header)
│   ├── charts/              # 通用图表组件封装
│   ├── ui/                  # 通用基础UI组件 (Button, Modal)
│   └── chat/                # 共享聊天组件
├── constants/               # [关键] 静态模拟数据
│   └── mockData.ts          # 存放所有页面的假数据
├── public/                  # 静态资源 (图片, 图标)
├── theme/                   # MUI 主题配置
│   └── theme.ts             # 全局颜色、字体、组件样式定义
└── types/                   # TypeScript 类型定义
    └── index.ts             # 全局类型和接口
```

## 🎨 开发指南 (第一阶段)

目前我们处于 **"静态原型"** 开发阶段，不需要编写后端 API 请求代码。

### 1. 数据驱动开发流程
   - **定义数据结构**: 在 `types/index.ts` 中定义新的数据接口。
   - **创建模拟数据**: 在 `constants/mockData.ts` 中根据接口创建具体的假数据。
   - **构建组件**:
     - **页面专用组件**: 放在 `app/(main)/<route>/components/` 中。
     - **共享组件**: 放在 `components/` 中。
   - **组合页面**: 在 `app/(main)/` 对应的页面中，导入并组合组件，使用模拟数据进行渲染。

### 2. 使用 Mock 数据
   - 所有展示的数据（如温度、羊只数量、告警列表）都必须从 `constants/mockData.ts` 中导入。
   - **错误示范**: 在组件里直接写死 `<h3>38.5℃</h3>`。
   - **正确示范**:
     1. 在 `mockData.ts` 定义 `export const mockSensors = [{ id: 't1', lastReading: 38.5 }];`
     2. 在组件引入 `import { mockSensors } from '@/constants/mockData';`
     3. 渲染 `<h3>{mockSensors[0].lastReading}℃</h3>`

### 3. 数据关系核心
- **层级关系**: `Shed (舍)` -> `Pen (圈)`
- **绑定关系**:
    - `Animal (动物)` 直接绑定到 `Pen`。
    - `Sensor (传感器)` 直接绑定到 `Pen`，但同时保留 `shedId` 用于按舍进行粗粒度筛选。
    - `Camera (摄像头)` 直接绑定到 `Shed`。

## 🧩 功能模块说明

### 1. 总览 (Dashboard)
   - **核心内容**: 整个牧场的宏观数据概览。包括但不限于：
     - 各个 **舍 (Shed)** 的环境数据摘要 (平均温度、湿度等)。
     - 活跃与非活跃的设备 (传感器/摄像头) 数量统计。
     - 最新的行为数据摘要。

### 2. 实时数据 (Live Monitor)
   - **核心内容**: **场景化单元视图**，分为环境数据和视频数据。
     - **环境数据**: 以列表和数值形式实时展示所有传感器的读数。
     - **视频数据**: 用户选择一个 **摄像头 (Camera)** 进行观看，并查看AI识别出的实时行为统计（如当前帧站立、躺卧、饮水、进食等行为的个体数）。

### 3. 历史数据 (Historical Data)
   - **核心内容**: 历史数据的可视化、查询与导出。
     - **环境数据**: 支持按时间范围、设备、区域查询历史传感器数据，并以图表（折线图）形式展示，支持导出为文本文件（CSV）。
     - **视频数据**: 支持按时间范围、摄像头查询历史监控视频（限制时长不超过10分钟）以及行为统计数据（如进食、饮水次数），并支持导出文本文件（CSV）。

### 4. 系统设置 (Settings)
   - **核心内容**: 系统的配置与管理。
     - 用户管理。
     - 操作日志（管理员）。

## 📜 代码规范 (Linting & Formatting)

为了保证代码质量和风格统一，项目集成了 ESLint 和 Prettier。请在你的 IDE (VSCode, WebStorm 等) 中安装相应的插件并开启 "Format on Save" 功能，以获得最佳的开发体验。
