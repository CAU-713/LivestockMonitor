# LivestockMonitor 服务器运维速查手册（AI 会话参考）

> 本文档面向 AI 编程助手会话使用。任何需要操作服务器的新会话，读完本文档即可独立排查和修复问题。

---

## 基本信息

| 项目 | 值 |
|------|----|
| 服务器 IP | `120.53.24.48` |
| SSH 用户 | `ubuntu` |
| SSH 密钥路径 | `~/.ssh/id_ed25519`（本地 Mac） |
| 项目根目录 | `/root/LivestockMonitor` |
| Git 分支 | `aicodingv2` |
| 前端访问地址 | `http://120.53.24.48:3000` |
| 后端 API 地址 | `http://120.53.24.48:8000` |

---

## 最重要规则：SSH 命令必须加超时

**所有 SSH 远程命令必须加 `ConnectTimeout` 和 `timeout`，否则遇到无响应会一直卡死。**

```bash
# 标准格式（所有命令都要这样写）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 "timeout 30 <命令>"
```

- `ConnectTimeout=10`：连接超时 10 秒
- `timeout 30`：命令执行超时 30 秒（根据命令调整）
- `docker logs` 等可能输出大量内容的命令，必须加 `--tail=100` 限制行数

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

| 容器名 | 镜像/来源 | 对外端口 | 容器内部服务名 |
|--------|-----------|----------|---------------|
| `livestockmonitor-frontend-1` | `./frontend` build | `3000` | `frontend` |
| `backend_app` | `./backend` build | `8000` | `backend` |
| `postgres_db` | `pgvector/pgvector:pg16` | **无**（仅内网） | `db` |
| `redis_cache` | `redis:alpine` | **无**（仅内网） | `redis` |

---

## 常用排查命令（带超时的标准写法）

### 查看所有容器状态

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

### 查看某个容器日志

```bash
# 前端日志（最后 50 行）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 15 sudo docker logs livestockmonitor-frontend-1 --tail=50 2>&1"

# 后端日志（最后 50 行）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 15 sudo docker logs backend_app --tail=50 2>&1"

# 数据库日志（最后 30 行）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 15 sudo docker logs postgres_db --tail=30 2>&1"
```

### 验证服务是否正常响应

```bash
# 前端是否返回 HTTP 200/307
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 curl -sI http://localhost:3000/ 2>&1 | head -5"

# 后端 API 健康检查
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 curl -s http://localhost:8000/api/sheds 2>&1 | head -200"
```

### 检查端口监听

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo ss -tlnp | grep -E '3000|8000|5432|6379'"
```

---

## 重建某个服务（代码变更后部署）

**重要：代码变更后必须先 build，再 force-recreate，否则容器不会用新镜像。**

### 重建前端（最常用）

```bash
# 在本地：用 scp 上传前端代码到服务器
scp -i ~/.ssh/id_ed25519 -r ./frontend ubuntu@120.53.24.48:/root/LivestockMonitor/

# 在服务器上构建并重启（可以用 cache，除非镜像被污染）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 300 bash -c 'cd /root/LivestockMonitor && sudo docker compose build frontend 2>&1 | tail -10'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate frontend 2>&1'"
```

### 重建后端

> **⚠️ 重要**：后端镜像包含 torch + CUDA 依赖，约 8.65GB。首次构建（无缓存）需 5-8 分钟，
> `timeout` 必须设 **600 秒以上**。如果磁盘空间不足（<10GB可用），构建会因 pip 安装失败。

```bash
# 在本地：用 scp 上传后端代码到服务器
scp -i ~/.ssh/id_ed25519 -r ./backend ubuntu@120.53.24.48:/root/LivestockMonitor/

# 在服务器上构建并重启（timeout 必须 600+，首次构建很慢）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 600 bash -c 'cd /root/LivestockMonitor && sudo docker compose build backend 2>&1 | tail -10'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate backend 2>&1'"
```

**如果构建因磁盘空间不足失败（`No space left on device`）**，先清理 Docker 缓存再重建：

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 60 sudo docker system prune -af 2>&1 | tail -5"
# 之后再执行 build + up
```

### 紧急情况：镜像被入侵，必须用 --no-cache 重建

```bash
# 停止并删除被污染的容器
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 15 bash -c 'sudo docker stop livestockmonitor-frontend-1 && sudo docker rm livestockmonitor-frontend-1'"

# 查看并删除被污染的镜像
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker images | grep frontend"
# 记录镜像 ID 后：
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker rmi <IMAGE_ID> -f"

# 从头重建（无缓存）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 300 bash -c 'cd /root/LivestockMonitor && sudo docker compose build --no-cache frontend 2>&1 | tail -20'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate frontend 2>&1'"
```

---

## 数据库操作

### 检查数据库是否健康

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker inspect postgres_db --format='健康状态: {{.State.Health.Status}}'"
```

### 查看数据库列表

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker exec postgres_db psql -U postgres -c '\l' 2>&1"
```

### 数据库被删（ransomware/入侵）时恢复

```bash
# 第 1 步：重建数据库
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker exec postgres_db psql -U postgres -c 'CREATE DATABASE postgres_db_name;' 2>&1"

# 第 2 步：执行初始化 SQL（造假数据）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 "
  sudo docker exec -i postgres_db psql -U postgres -d postgres_db_name \
    < /root/LivestockMonitor/db_init/01_schema_and_data.sql 2>&1 | \
    grep -E 'NOTICE|ERROR' | head -30
"

# 第 3 步：重启后端（重新连接 DB）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "cd /root/LivestockMonitor && timeout 30 sudo docker compose restart backend 2>&1"
```

### 查询某张表数据量

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker exec postgres_db psql -U postgres -d postgres_db_name \
   -c 'SELECT COUNT(*) FROM sensor_record;' 2>&1"
```

### 进入数据库交互式 Shell

```bash
# 注意：这个命令会开启交互式会话，用完后输入 \q 退出
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 -t ubuntu@120.53.24.48 \
  "sudo docker exec -it postgres_db psql -U postgres -d postgres_db_name"
```

---

## 从本地推送代码并部署（完整流程）

> **注意**：服务器上 `/root/LivestockMonitor` **没有 git 仓库**，代码通过 `scp` 直接上传文件同步。
> 本地仍用 git 管理（推送到 GitHub），但服务器不 pull，而是直接 scp 覆盖文件。

```bash
# 1. 本地修改代码，提交到 GitHub（可选，保留版本历史）
cd /Users/houzhuoyan/PycharmProjects/LivestockMonitor
git add .
git commit -m "feat: xxx"
git push origin aicodingv2

# 2. 用 scp 上传修改的文件到服务器
# 上传单个文件
scp -i ~/.ssh/id_ed25519 ./frontend/app/xxx/page.tsx \
  ubuntu@120.53.24.48:/root/LivestockMonitor/frontend/app/xxx/page.tsx

# 上传整个目录（-r 递归）
scp -i ~/.ssh/id_ed25519 -r ./frontend \
  ubuntu@120.53.24.48:/root/LivestockMonitor/frontend

scp -i ~/.ssh/id_ed25519 -r ./backend \
  ubuntu@120.53.24.48:/root/LivestockMonitor/backend

# 3. 重建并重启对应服务
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 300 bash -c 'cd /root/LivestockMonitor && sudo docker compose build frontend 2>&1 | tail -10'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate frontend 2>&1'"
```

### 常用 scp 模式速查

```bash
# 上传前端整个目录
scp -i ~/.ssh/id_ed25519 -r ./frontend ubuntu@120.53.24.48:/root/LivestockMonitor/

# 上传后端整个目录
scp -i ~/.ssh/id_ed25519 -r ./backend ubuntu@120.53.24.48:/root/LivestockMonitor/

# 上传单个配置文件
scp -i ~/.ssh/id_ed25519 ./docker-compose.yml ubuntu@120.53.24.48:/root/LivestockMonitor/docker-compose.yml

# 上传数据库初始化脚本
scp -i ~/.ssh/id_ed25519 ./db_init/01_schema_and_data.sql \
  ubuntu@120.53.24.48:/root/LivestockMonitor/db_init/01_schema_and_data.sql
```

### 推荐：用 rsync 替代 scp 上传前端

> 前端目录含 `node_modules`（数百MB）和 `.next`（构建缓存），scp 会全量上传。
> 用 rsync 可以排除这些目录，只同步源代码，大幅提升上传速度。

```bash
# rsync 上传前端（排除 node_modules 和 .next）
rsync -avz --delete --exclude='node_modules' --exclude='.next' \
  -e "ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10" \
  ./frontend/ ubuntu@120.53.24.48:/root/LivestockMonitor/frontend/

# rsync 上传后端（排除 __pycache__ 和 .venv）
rsync -avz --delete --exclude='__pycache__' --exclude='.venv' \
  -e "ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10" \
  ./backend/ ubuntu@120.53.24.48:/root/LivestockMonitor/backend/
```

### ⚠️ scp 权限问题

> 服务器 `/root/` 目录默认属 `root:root`，`ubuntu` 用户无写权限。
> 如果 scp 报 `Permission denied`，需先在服务器上修改目录权限：

```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo chown -R ubuntu:ubuntu /root/LivestockMonitor"
```

---

## 安全加固记录（历史事件）

| 日期 | 事件 | 处置 |
|------|------|------|
| 2026-04 | Postgres `5432` 暴露公网，被 ransomware 删库 | 删库+恢复数据+关闭端口映射 |
| 2026-04-12 | 前端容器被入侵，植入挖矿木马（wget 176.65.139.42） | 删容器+删镜像+--no-cache 重建 |
| 2026-04-28 | 后端构建因磁盘不足失败（No space left on device） | `docker system prune -af` 清理 17.6GB 旧镜像/cache 后重建成功 |

**当前安全配置：**
- ✅ `5432`（PostgreSQL）不对外暴露
- ✅ `6379`（Redis）不对外暴露
- ⚠️ `8000`（后端）目前对外暴露，需在腾讯云控制台关闭（前端通过 `/api/*` rewrite 代理访问后端，不需要 8000 对外）

**判断是否被入侵的症状：**
- 前端日志出现 `wget http://x.x.x.x/x86` 或 `Connecting to world...`
- 数据库被删，只剩 `readme_to_recover` 数据库（勒索软件标志）
- 后端大量 `OperationalError: database "postgres_db_name" does not exist`

---

## 部署踩坑记录

### 1. 后端构建超时与磁盘空间

**问题**：后端镜像含 torch + CUDA 依赖，约 8.65GB。首次无缓存构建需 5-8 分钟。
- 原文档建议 `timeout 120` **远远不够**，必须设 `timeout 600+`
- 构建日志中出现 `No space left on device` → pip 安装失败
- 服务器磁盘 40GB，4个容器+旧镜像会占 30GB+，留给构建的可用空间可能不足

**解决方案**：
```bash
# 先清理旧镜像和构建缓存（可回收 16GB+）
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 60 sudo docker system prune -af 2>&1 | tail -5"
# 再重建（timeout 600）
ssh ... "timeout 600 bash -c 'cd /root/LivestockMonitor && sudo docker compose build backend 2>&1'"
```

**预防措施**：部署前先 `df -h /` 检查可用空间，低于 10GB 时先清理 Docker 缓存。

### 2. scp 权限问题

**问题**：服务器 `/root/` 目录默认属 `root:root`，`ubuntu` 用户 scp 上传时报 `Permission denied`。

**解决方案**：
```bash
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo chown -R ubuntu:ubuntu /root/LivestockMonitor"
```

### 3. 前端 rsync 比 scp 更高效

**问题**：`scp -r ./frontend` 会全量上传 `node_modules`（数百MB）和 `.next`（构建缓存），浪费时间。

**解决方案**：用 rsync 排除这些目录：
```bash
rsync -avz --delete --exclude='node_modules' --exclude='.next' \
  -e "ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10" \
  ./frontend/ ubuntu@120.53.24.48:/root/LivestockMonitor/frontend/
```

---

## 前端开发注意事项

### MUI Grid 组件兼容性（重要）

**问题**：本项目使用 Next.js 15 + MUI 6。MUI 6 的 `<Grid>` 组件已升级为新 API，
不再支持 `item` / `xs` / `container` 等旧属性。直接使用会报类型错误：

```
Type error: No overload matches this call.
Property 'item' does not exist on type ...
```

**解决方案**：必须使用 `GridLegacy` 组件：
```tsx
// ✅ 正确
import Grid from '@mui/material/GridLegacy';
<Grid container spacing={2}>
  <Grid item xs={12}>...</Grid>
</Grid>

// ❌ 错误（MUI 6 不支持）
import { Grid } from '@mui/material';
<Grid container spacing={2}>
  <Grid item xs={12}>...</Grid>
</Grid>
```

**注意**：如果同一个文件中从 `@mui/material` 批量导入时包含了 `Grid`，
同时又单独 `import Grid from '@mui/material/GridLegacy'`，
会报 `Identifier 'Grid' has already been declared` 错误。
需要从批量导入中移除 `Grid`，只保留 GridLegacy 的单独导入。

### 后端路由自动注册机制

**问题**：后端 `main.py` 通过自动发现 `routers/` 目录下的 `.py` 文件来注册路由，
**不需要手动 import**。新增路由文件后，只要放到 `backend/app/routers/` 目录下，
文件内有 `router = APIRouter(...)` 变量，就会自动被加载。

**但也意味着**：修改 `main.py` 本身（如新增 WebSocket 端点）时，需要重建后端镜像。

### WebSocket 告警推送端点

**新增端点**：`/ws/alerts`（WebSocket 协议，非 HTTP）

- 前端通过 `ws://120.53.24.48:8000/ws/alerts` 连接
- 心跳格式：客户端发 `{ "type": "ping" }` → 服务端回 `{ "type": "pong" }`
- 告警推送格式：服务端主动发 `{ "type": "alert", "data": { ... } }`
- 自动重连：前端每 5 秒重试，每 30 秒心跳
- 创建告警时（`POST /api/alerts`）会同步通过 WebSocket 推送到所有连接的客户端

---

## 故障排查决策树

```
页面打不开 / 转圈圈
  ├─ curl http://localhost:3000 无响应？
  │    └─ 查 frontend 日志
  │         ├─ "Connecting to world..." → 容器被入侵，重建镜像（--no-cache）
  │         ├─ "clientModules" error → 通常也是入侵导致，重建镜像
  │         └─ "Ready in Xms" 但页面不通 → 检查端口映射/防火墙
  │
  ├─ 前端正常，但 API 500？
  │    └─ 查 backend 日志
  │         ├─ "database does not exist" → 数据库被删，执行恢复流程
  │         ├─ "OperationalError / connection refused" → postgres_db 容器不健康
  │         └─ 正常日志但 500 → 查具体接口逻辑
  │
  ├─ 后端正常，但数据为空？
  │    └─ 检查 postgres_db 是否初始化
  │         └─ 执行 db_init/01_schema_and_data.sql 重新导入数据
  │
  └─ docker compose build 失败？
       ├─ "No space left on device" → 磁盘不足
       │    └─ sudo docker system prune -af 清理旧镜像
       │    └─ df -h / 确认可用空间 > 10GB 后再 build
       │
       ├─ 构建超时（timeout 120 不够）→ 后端需 timeout 600+
       │    └─ 后端含 torch+CUDA，首次构建需 5-8 分钟
       │
       └─ scp "Permission denied" → 目录权限问题
            └─ sudo chown -R ubuntu:ubuntu /root/LivestockMonitor
```

---

## 环境变量（.env 核心字段）

```ini
# 数据库
POSTGRES_DB=postgres_db_name
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password        # ⚠️ 生产环境应改强密码

# 后端
DB_HOST=db                        # Docker 内网服务名，固定不变
DB_NAME=postgres_db_name
SECRET_KEY=<随机32字节hex>         # JWT 签名密钥

# 前端
NEXT_PUBLIC_BACKEND_URL=http://120.53.24.48:8000   # 浏览器直接访问后端（公网）
BACKEND_URL=http://backend:8000                      # Next.js 服务端 rewrite 代理（内网）
```

`.env` 文件位于服务器 `/root/LivestockMonitor/.env`，**不在 Git 中**（已 gitignore）。
