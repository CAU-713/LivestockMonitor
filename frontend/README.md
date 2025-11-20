# 智慧动物行为识别与预警系统 (前端)

本项目是 **智慧动物行为识别与预警系统** 的前端工程，基于 Next.js (App Router) 和 Material-UI (MUI) 构建。

当前版本：**v0.1 (第一阶段 - 静态原型)**
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
│       ├── monitor/         # [实时监控] 页面 (视频+局部数据)
│       ├── analysis/        # [数据分析] 页面 (历史趋势+报表)
│       ├── alerts/          # [告警中心] 页面
│       └── settings/        # [系统设置] 页面
├── components/              # React 组件库
│   ├── layout/              # 布局组件 (Sidebar, Header)
│   ├── dashboard/           # 总览页专用组件 (KPICard, Charts)
│   ├── monitor/             # 监控页专用组件 (VideoPlayer)
│   ├── charts/              # 图表组件封装
│   └── ui/                  # 通用基础UI组件 (Button, Modal)
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
   - **构建组件**: 在 `components/` 目录中创建可复用的UI组件。
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
     - 最新的告警信息列表。

### 2. 实时监控 (Live Monitor)
   - **核心内容**: **场景化单元视图**。
     - 用户选择一个 **摄像头 (Camera)** 进行观看。
     - 页面展示该摄像头的实时视频流。
     - 页面下方或侧边展示与该摄像头关联的数据，例如：
       - AI 识别出的实时行为统计 (进食、饮水数量)。
       - 该摄像头所在 **舍 (Shed)** 的所有环境传感器的实时数据。

### 3. 数据分析 (Data Analysis)
   - **核心内容**: 历史数据的可视化与关联分析。
     - 支持选择特定的 **动物 (Animal)** 或 **圈 (Pen)**。
     - 分析该对象的历史生产性能 (采食量、增重) 与其所在 **圈 (Pen)** 的环境数据 (温度、湿度) 之间的关联。
     - 支持按日、周、月等不同时间粒度进行图表切换。

### 4. 告警中心 (Alerts)
   - **核心内容**: 集中展示和管理所有告警事件。
     - 列表形式展示所有历史告警。
     - 支持按告警类型 (如高温告警、设备离线) 和 **舍 (Shed)** 进行筛选。

### 5. 系统设置 (Settings)
   - **核心内容**: 系统的配置与管理。
     - 用户管理。
     - 设备管理：添加/编辑/删除舍、圈、传感器、摄像头。
     - 告警规则配置。

## 📜 代码规范 (Linting & Formatting)

为了保证代码质量和风格统一，项目集成了 ESLint 和 Prettier。请在你的 IDE (VSCode, WebStorm 等) 中安装相应的插件并开启 "Format on Save" 功能，以获得最佳的开发体验。
