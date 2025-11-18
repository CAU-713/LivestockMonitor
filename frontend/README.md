# 智慧动物行为识别与预警系统 (前端)

本项目是 **智慧动物行为识别与预警系统** 的前端工程，基于 Next.js (App Router) 和 Tailwind CSS 构建。

当前版本：**v0.1 (第一阶段 - 静态原型)**
主要目标：展示系统的交互逻辑、页面布局以及视觉风格，暂时使用本地 Mock 数据驱动。

## 🛠 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI 组件库**: Material-UI (MUI)
- **图表库**: Recharts
- **部署**: Docker

## 🚀 快速开始

确保你的本地环境已安装 Node.js (v18+) 和 npm。

1. **安装依赖**
    ```
    cd frontend
    npm install
    ```
2. **启动开发服务器**
    ```
    npm run dev
    ```
3. **访问页面**

    打开浏览器访问 http://localhost:3000 即可看到系统。

## 📂 项目目录结构

为了保持多人协作的整洁，请严格遵守以下目录规范：
```
frontend/
├── app/
│   ├── (main)/              # 主应用页面 (包含侧边栏布局)
│   │   ├── dashboard/       # [总览] 页面
│   │   ├── realtime-data/   # [实时数据] 页面 (全局列表视图)
│   │   ├── monitor/         # [实时监控] 页面 (视频+局部数据)
│   │   ├── analysis/        # [数据分析] 页面 (历史趋势+报表)
│   │   ├── alerts/          # [告警中心] 页面
│   │   └── settings/        # [系统设置] 页面
│   ├── globals.css          # 全局样式 (Tailwind指令)
│   └── layout.tsx           # 根布局
├── components/              # UI 组件库
│   ├── layout/              # 布局组件 (Sidebar, Header)
│   ├── dashboard/           # 总览页专用组件 (KPICard, Charts)
│   ├── monitor/             # 监控页专用组件 (VideoPlayer)
│   └── ui/                  # 通用基础组件 (Button, Card)
├── constants/               # [关键] 静态模拟数据
│   └── mockData.ts          # 存放所有页面的假数据
└── types/                   # TypeScript 类型定义
```

## 🎨 开发指南 (第一阶段)

目前我们处于 **"静态原型"** 开发阶段，不需要编写后端 API 请求代码。请遵循以下步骤进行开发：

### 1. 页面开发流程
   - **新建路由 (如果需要)**: 在 `app/(main)/` 下新建文件夹（如 `new-page`），并在其中创建 `page.tsx`。
   - **使用布局**: 页面会自动继承 `app/(main)/layout.tsx` 中的侧边栏结构，无需重复编写导航栏。

### 2. 使用 Mock 数据
   - 所有展示的数据（如温度、羊只数量、告警列表）请先在 `constants/mockData.ts` 中定义。
   - **错误示范**: 在组件里直接写死 `<h3>38.5℃</h3>`。
   - **正确示范**:
     1. 在 mockData.ts 定义 `export const TEMP_DATA = { current: 38.5 };`
     2. 在组件引入 `import { TEMP_DATA } from '@/constants/mockData';`
     3. 渲染 `<h3>{TEMP_DATA.current}℃</h3>`

### 3. 样式规范 (Tailwind CSS)
   - 尽量避免写传统的 `.css` 文件。
   - 直接在 className 中使用 Tailwind 类名。
   - **布局技巧**:
     - 弹性盒子: `flex flex-row items-center justify-between`
     - 网格布局: `grid grid-cols-1 md:grid-cols-3 gap-4` (移动端单列，大屏三列)
     - 间距: 使用 `p-4` (padding), `m-4` (margin), `gap-4`。

## 🧩 功能模块说明

### 1. 总览 (Dashboard)
   - 目标用户：
   - 核心内容：待定

### 2. **实时数据 (Real-time Data)**
   - 目标用户：
   - 核心内容：**全局筛选器**。以列表或表格形式展示**所有**圈舍、**所有**传感器的最新数据，支持按数据类型、状态和圈舍进行筛选和排序。

### 3. **实时监控 (Live Monitor)**
   - 目标用户：
   - 核心内容：**单元化视图**。专注于单个摄像头画面的展示，并叠加 AI 识别框（支持识别框显示/隐藏切换）。页面下方展示**与该摄像头绑定**的行为统计数据，实现场景化判断。后期根据需求可能还要加入与摄像头绑定的环境/生理实时数据。

### 4. 数据分析 (Data Analysis)
   - 目标用户：
   - 核心内容：历史数据的可视化。支持切换 **"粗粒度 (按时/日/月/年)"** 和 **"细粒度 (按具体时刻时间戳)"** 两种视图，分析环境与行为的相关性。

### 5. 告警中心 (Alerts)
   - 目标用户：
   - 核心内容：待定

### 6. 系统设置 (Settings)
   - 目标用户：
   - 核心内容：用户管理、设备绑定、告警规则配置。

## 📜 代码规范 (Linting & Formatting)

为了保证代码质量和风格统一，项目集成了 ESLint 和 Prettier。

- **ESLint**: 负责代码质量检查，发现潜在的 Bug 和不合理的写法。
- **Prettier**: 负责代码风格统一，如单双引号、分号、缩进等。
- **`prettier-plugin-tailwindcss`**: 自动对 Tailwind CSS 的 `className` 进行排序，保持样式定义的一致性。

### 编辑器集成 (强烈推荐)

为了获得最佳开发体验，请在 VS Code 中安装以下插件，并配置保存时自动格式化：

1.  **安装插件**:
    - `ESLint` (dbaeumer.vscode-eslint)
    - `Prettier - Code formatter` (esbenp.prettier-vscode)

2.  **配置 VS Code (`settings.json`)**:
    按下 `Ctrl + Shift + P` 并搜索 "Open User Settings (JSON)"，添加以下配置：
    ```json
    {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
      }
    }
    ```
    配置完成后，每次保存文件时，代码将被自动格式化并修复简单的 ESLint 问题。

### JetBrains IDEs (WebStorm / PyCharm Pro)

WebStorm 和 PyCharm Professional 对此提供了优秀的内置支持和插件。

1.  **安装插件（可能已自带）**:
    打开 `Settings/Preferences` > `Plugins` > `Marketplace`，安装以下插件：
    - `Prettier`
    - `Tailwind CSS`

2.  **开启自动格式化与修复**:
    - **ESLint**: 进入 `Settings/Preferences` > `Languages & Frameworks` > `JavaScript` > `Code Quality Tools` > `ESLint`，选择 `Automatic ESLint configuration` 并勾选 `Run eslint --fix on save`。
    - **Prettier**: 进入 `Settings/Preferences` > `Languages & Frameworks` > `JavaScript` > `Prettier`，勾选 `On save`。

    配置完成后，IDE 会在保存时自动使用 Prettier 格式化代码，并用 ESLint 修复问题。


## ⚠️ 注意事项

- **响应式设计**: 开发时请同时测试 窗口全屏 和 窗口缩小 时的效果，确保布局不会崩坏。
- **暗色模式**: 系统默认支持 Dark Mode，在编写样式时，如有必要请使用 `dark:bg-gray-800` 等前缀适配深色背景。
- **代码提交**: 提交前请确保 `npm run build` 没有报错。