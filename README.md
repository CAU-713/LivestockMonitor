# 🐑 LivestockMonitor 智慧牧场监控平台

基于 **FastAPI + Next.js + PostgreSQL** 构建的全栈智慧牧场管理系统，提供实时环境监控、传感器数据分析、动物健康追踪、视频监控等功能。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | Next.js 15 · React 19 · Material UI 7 · TypeScript |
| 后端 | FastAPI · Python 3.12 · SQLModel · Uvicorn |
| 数据库 | PostgreSQL 16（pgvector 扩展） |
| 缓存 | Redis |
| 容器化 | Docker · Docker Compose |

---

## 目录结构

```
LivestockMonitor/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── main.py   # 应用入口
│   │   ├── models/   # 数据模型
│   │   ├── routers/  # API 路由
│   │   └── services/ # 业务逻辑
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # Next.js 前端
│   ├── app/          # 页面路由
│   ├── components/   # 组件库
│   ├── Dockerfile
│   └── package.json
├── db_init/          # 数据库初始化 SQL（首次建库时自动执行）
├── docker-compose.yml
├── .env.example      # 环境变量模板
└── deploy.sh         # ⭐ 一键部署脚本
```

---

## ⭐ 快速部署（推荐）

> 使用 `deploy.sh` 脚本可以在**本地或服务器**上一键完成所有部署工作。

### 前提条件

- [Docker](https://docs.docker.com/get-docker/) v20.0+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0+

验证安装：

```bash
docker --version
docker compose version
```

### 本地一键启动

```bash
git clone https://github.com/CAU-713/LivestockMonitor.git
cd LivestockMonitor
./deploy.sh
```

脚本会自动：
1. 从 `.env.example` 生成 `.env`
2. 设置 `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
3. 自动生成随机 `SECRET_KEY`
4. 执行 `docker compose up -d --build`
5. 等待服务就绪并打印访问地址

启动后访问：
- 前端页面：<http://localhost:3000>
- 接口文档：<http://localhost:8000/docs>
- 默认账号：`admin` / 密码：`admin`

### 服务器一键部署

```bash
git clone https://github.com/CAU-713/LivestockMonitor.git
cd LivestockMonitor
./deploy.sh --prod
```

`--prod` 模式会自动检测服务器公网 IP，并询问确认后填入 `.env`。
如果无法自动检测，脚本会提示手动输入。

```
[INFO]  检测到公网 IP: 120.53.24.48
        使用 http://120.53.24.48:8000 作为后端地址？[Y/n]
```

---

## 手动部署（进阶）

如果你想手动控制每个步骤：

### 第 1 步：配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，**必须修改**以下字段：

```ini
# 服务器部署时，改为你的公网 IP 或域名
NEXT_PUBLIC_BACKEND_URL=http://your-server-ip:8000

# 生产环境务必修改，可用 openssl rand -hex 32 生成
SECRET_KEY=your_random_secret_key
```

> `.env` 中的 `DB_HOST=db` 和 `BACKEND_URL=http://backend:8000` 是 Docker 内网地址，**保持不变**。

### 第 2 步：启动所有服务

```bash
docker compose up -d --build
```

首次启动时 PostgreSQL 会自动执行 `db_init/` 下的初始化脚本，写入表结构和示例数据。

### 第 3 步：验证

```bash
# 查看所有容器状态
docker compose ps

# 查看后端日志
docker compose logs -f backend
```

访问 <http://your-server-ip:3000> 即可看到系统界面。

---

## 本地开发模式

仅开发某一端时，可以只启动中间件（数据库 + 缓存），然后在本地运行前端或后端。

### 只启动中间件

```bash
docker compose up -d db redis
```

### 后端开发

```bash
# 创建 Python 3.12 虚拟环境（推荐 conda）
conda create -n LivestockMonitor python=3.12 -y
conda activate LivestockMonitor

# 安装依赖
cd backend
pip install -r requirements.txt

# 启动后端（需要在 .env 中将 DB_HOST 改为 localhost）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> 本地直连数据库时，临时将 `.env` 中 `DB_HOST=db` 改为 `DB_HOST=localhost`，并在 `docker-compose.yml` 中临时打开 `5432` 端口映射。

访问 <http://localhost:8000/docs> 查看 Swagger 接口文档。

### 前端开发

```bash
# 需要 Node.js v20+
cd frontend
npm install

# 本地开发启动（Turbopack 热更新）
npm run dev
```

访问 <http://localhost:3000> 查看前端页面。

> 前端通过 `next.config.ts` 中的 `rewrites` 将 `/api/*` 请求代理到后端，无需跨域配置。

---

## 环境变量说明

完整的环境变量说明参见 [`.env.example`](.env.example)，核心字段如下：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `POSTGRES_USER` | 数据库用户名 | `postgres` |
| `POSTGRES_PASSWORD` | 数据库密码 | `password` |
| `POSTGRES_DB` | 数据库名 | `postgres_db_name` |
| `SECRET_KEY` | JWT 签名密钥，**生产必改** | 占位符 |
| `NEXT_PUBLIC_BACKEND_URL` | 浏览器访问后端的地址，**服务器部署必改** | `http://your-server-ip:8000` |
| `BACKEND_URL` | 容器内部代理地址，固定不变 | `http://backend:8000` |
| `DB_HOST` | 后端连接数据库的主机，Docker 内为服务名 `db` | `db` |

---

## 常用运维命令

```bash
# 查看所有服务状态
docker compose ps

# 实时查看所有日志
docker compose logs -f

# 只看后端日志
docker compose logs -f backend

# 重启某个服务
docker compose restart backend

# 拉取最新代码后重新构建并部署
git pull
docker compose up -d --build

# 停止所有服务（保留数据）
docker compose down

# 停止并清空所有数据（重置数据库）
docker compose down -v

# 进入后端容器调试
docker exec -it backend_app bash

# 进入数据库
docker exec -it postgres_db psql -U postgres -d postgres_db_name
```

---

## 数据初始化说明

`db_init/` 目录下的 SQL 脚本会在 PostgreSQL **首次初始化**（volume 为空）时自动执行：

| 文件 | 内容 |
|------|------|
| `00_ensure_db.sh` | 确保目标数据库存在 |
| `01_schema_and_data.sql` | 基础数据：羊舍、传感器、动物等 |
| `02_enterprise_env_data.sql` | 企业育肥环境历史数据（210 条） |
| `03_house_env_data.sql` | 综合环境监测历史数据（8652 条） |

> 数据库已存在时（volume 非空），这些脚本不会重复执行。
> 如需重置所有数据：`docker compose down -v && ./deploy.sh`

---

## 安全提示

生产环境部署前，请务必：

1. 修改 `SECRET_KEY` 为随机值：`openssl rand -hex 32`
2. 修改数据库密码 `POSTGRES_PASSWORD`
3. 确保 `5432`（PostgreSQL）和 `6379`（Redis）端口**不对外暴露**
4. 建议使用 Nginx / Caddy 反向代理并配置 HTTPS
