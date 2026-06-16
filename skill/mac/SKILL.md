---
name: livestock-deploy
description: This skill should be used when the user asks to "deploy", "部署", "push到服务器", "上传代码", "重建前端/后端", "重启服务", "docker compose", "rsync", "scp", "查看容器状态", "查看日志", "排查服务器问题", "恢复数据库", "开发环境搭建", "本地开发", "npm run dev", "run backend", or discusses LivestockMonitor project deployment, server operations, container management, database recovery, or local development environment setup. Provides complete guidance for deploying, operating, and developing the LivestockMonitor livestock monitoring system.
version: 1.0.0
---

# LivestockMonitor 部署与开发指南

面向 AI 编程助手的运维和开发速查手册，新会话读完即可独立操作。

---

## 基本信息速查

| 项目 | 值 |
|------|----|
| 服务器 IP | `120.53.24.48` |
| SSH 用户 | `ubuntu` |
| SSH 密钥 | `~/.ssh/id_ed25519`（本地 Mac） |
| 项目根目录 | `/root/LivestockMonitor` |
| Git 分支 | `aicodingv2` |
| 数据库名 | `postgres_db_name` |
| 前端地址 | `http://120.53.24.48:3000` |
| 后端地址 | `http://120.53.24.48:8000` |
| 前端内存限制 | `800m`（docker compose `mem_limit`） |

---

## 最重要规则：SSH 命令必须加超时

**所有 SSH 远程命令必须加 `ConnectTimeout` 和 `timeout`，否则遇到无响应会一直卡死。**

```bash
# 标准格式
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 "timeout 30 <命令>"
```

- `ConnectTimeout=10`：连接超时 10 秒
- `timeout 30`：命令执行超时 30 秒（根据命令调整）
- `docker logs` 等必须加 `--tail=100` 限制行数

---

## 部署流程（代码变更后）

### 快速部署前端（仅改了前端代码）

```bash
# 1. 本地提交代码
cd /Users/houzhuoyan/PycharmProjects/LivestockMonitor
git add . && git commit -m "feat: xxx" && git push

# 2. rsync 上传前端源码（排除 node_modules/.next）
rsync -avz --delete --exclude='node_modules' --exclude='.next' \
  -e "ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10" \
  ./frontend/ ubuntu@120.53.24.48:/root/LivestockMonitor/frontend/

# 3. 构建并重启前端
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 300 bash -c 'cd /root/LivestockMonitor && sudo docker compose build frontend 2>&1 | tail -10'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate frontend 2>&1'"
```

### 快速部署后端（仅改了后端代码）

> **重要**：后端镜像含 torch+CUDA 约 8.65GB，首次构建需 5-8 分钟，timeout 必须 **600+**。

```bash
# 1. rsync 上传后端源码（排除 __pycache__/.venv）
rsync -avz --delete --exclude='__pycache__' --exclude='.venv' \
  -e "ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10" \
  ./backend/ ubuntu@120.53.24.48:/root/LivestockMonitor/backend/

# 2. 构建并重启后端（timeout 600）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 600 bash -c 'cd /root/LivestockMonitor && sudo docker compose build backend 2>&1 | tail -10'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate backend 2>&1'"
```

### 部署前必做：检查权限和磁盘

```bash
# 确保 ubuntu 用户有写权限（首次部署或服务器重启后必做）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo chown -R ubuntu:ubuntu /root/LivestockMonitor"

# 检查磁盘空间（低于 10GB 时需先清理）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 df -h /"
```

---

## 常用排查命令

### 容器状态

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

### 容器日志

```bash
# 前端日志
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 15 sudo docker logs livestockmonitor-frontend-1 --tail=50 2>&1"

# 后端日志
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 15 sudo docker logs backend_app --tail=50 2>&1"
```

### 验证服务

```bash
# 前端
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 curl -sI http://localhost:3000/ 2>&1 | head -5"

# 后端
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 curl -s http://localhost:8000/api/sheds 2>&1 | head -200"

# WebSocket 端点（curl 返回 426 是正常的，说明端点存在但不接受 HTTP）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 5 curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/ws/alerts"
```

---

## 本地开发环境

### 前端本地开发

```bash
cd frontend
npm install
npm run dev   # 启动开发服务器 http://localhost:3000
npm run build # 验证构建是否通过（部署前必做）
```

前端通过 `next.config.ts` rewrites 代理 `/api/*` 到后端：
- 生产环境：`BACKEND_URL=http://backend:8000`（Docker 内网）
- 开发环境：默认 `http://localhost:8000`

### 后端本地开发

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后端依赖 PostgreSQL 和 Redis，本地开发需先启动这两个服务。

### 数据库初始化

数据库容器启动时自动执行 `db_init/01_schema_and_data.sql`（通过 `docker-entrypoint-initdb.d`）。
如果数据库被清空，手动恢复：

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "sudo docker exec -i postgres_db psql -U postgres -d postgres_db_name \
   < /root/LivestockMonitor/db_init/01_schema_and_data.sql 2>&1 | grep -E 'NOTICE|ERROR' | head -30"
```

---

## 踩坑速查

详细踩坑记录和故障排查决策树见 `references/server-ops.md`。

### 关键踩坑

1. **磁盘不足**：后端构建报 `No space left on device` → `sudo docker system prune -af` 清理后再 build
2. **权限问题**：scp/rsync 报 `Permission denied` → `sudo chown -R ubuntu:ubuntu /root/LivestockMonitor`
3. **构建超时**：后端 timeout 必须设 600+ 秒
4. **MUI Grid**：MUI v6 不支持旧 Grid API，必须用 `@mui/material/GridLegacy`
5. **WebSocket**：前端直连后端 8000 端口的 `/ws/alerts`，Next.js rewrites 不代理 WebSocket
6. **Grid 重复声明**：批量 import `@mui/material` 包含 Grid 时，与 GridLegacy 单独导入冲突，需从批量导入中移除 Grid

---

## 容器架构

```
┌─────────────────────────────────────────┐
│              服务器公网                   │
│  :3000 → frontend (Next.js)             │
│  :8000 → backend (FastAPI)              │
└──────────┬──────────────────────────────┘
           │ Docker 内网
  ┌────────┴─────────────────────────────┐
  │  postgres_db  (5432，不对外暴露)      │
  │  redis_cache  (6379，不对外暴露)      │
  └──────────────────────────────────────┘
```

| 容器名 | 对外端口 | 备注 |
|--------|----------|------|
| `livestockmonitor-frontend-1` | `3000` | Next.js，mem_limit 800m |
| `backend_app` | `8000` | FastAPI + torch，镜像约 8.65GB |
| `postgres_db` | 无 | 仅 Docker 内网，5432 |
| `redis_cache` | 无 | 仅 Docker 内网，6379 |
