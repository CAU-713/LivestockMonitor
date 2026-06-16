# LivestockMonitor 服务器运维参考手册

> 本文档补充 `livestock-deploy` skill 中未覆盖的运维细节。
> 部署命令和常用排查请参见 [SKILL.md](../SKILL.md)。

---

## 数据库操作

### 检查数据库是否健康

```bash
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker inspect postgres_db --format='健康状态: {{.State.Health.Status}}'"
```

### 查看数据库列表

```bash
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker exec postgres_db psql -U postgres -c '\l' 2>&1"
```

### 数据库被删（ransomware/入侵）时恢复

```bash
# 第 1 步：重建数据库
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker exec postgres_db psql -U postgres -c 'CREATE DATABASE postgres_db_name;' 2>&1"

# 第 2 步：执行初始化 SQL
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ubuntu@120.53.24.48 "
  sudo docker exec -i postgres_db psql -U postgres -d postgres_db_name \
    < /root/LivestockMonitor/db_init/01_schema_and_data.sql 2>&1 | \
    grep -E 'NOTICE|ERROR' | head -30
"

# 第 3 步：重启后端（重新连接 DB）
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "cd /root/LivestockMonitor && timeout 30 sudo docker compose restart backend 2>&1"
```

### 查询某张表数据量

```bash
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker exec postgres_db psql -U postgres -d postgres_db_name \
   -c 'SELECT COUNT(*) FROM sensor_record;' 2>&1"
```

### 进入数据库交互式 Shell

```bash
# 注意：这个命令会开启交互式会话，用完后输入 \q 退出
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 -t ubuntu@120.53.24.48 \
  "sudo docker exec -it postgres_db psql -U postgres -d postgres_db_name"
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
- ⚠️ `8000`（后端）目前对外暴露——建议在腾讯云安全组中关闭 8000 端口（前端通过 `/api/*` rewrite 代理访问后端，不需要 8000 对外）。但 **WebSocket 端点 `/ws/alerts` 需要浏览器直连后端**，关闭 8000 后 WebSocket 需改用前端代理或升级到 wss
- ✅ 前端容器有 `mem_limit: 800m` 防止 OOM

**判断是否被入侵的症状：**
- 前端日志出现 `wget http://x.x.x.x/x86` 或 `Connecting to world...`
- 数据库被删，只剩 `readme_to_recover` 数据库（勒索软件标志）
- 后端大量 `OperationalError: database "postgres_db_name" does not exist`

---

## 部署踩坑摘要

> 完整部署命令见 [SKILL.md 部署流程](../SKILL.md#部署流程代码变更后)。

1. **磁盘不足**：后端构建报 `No space left on device` → 先 `sudo docker system prune -af` 清理（可回收 16GB+），确认可用空间 > 10GB 再 build
2. **权限问题**：scp/rsync 报 `Permission denied` → `sudo chown -R ubuntu:ubuntu /root/LivestockMonitor`
3. **构建超时**：后端镜像含 torch+CUDA 约 8.65GB，首次构建需 5-8 分钟，timeout 必须设 **600+** 秒
4. **rsync vs scp**：scp 会全量上传 `node_modules`(数百MB) 和 `.next`，用 rsync 排除这些目录效率更高

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

- 前端通过 `NEXT_PUBLIC_BACKEND_URL` 的 host 部分 + `/ws/alerts` 连接 WebSocket
- 如果 `NEXT_PUBLIC_BACKEND_URL` 未设置，则自动使用 `window.location.host`（即前端自身地址），此时需要前端 Next.js 代理 WebSocket
- ⚠️ **当前 Next.js rewrites 只代理 HTTP `/api/*`，不代理 WebSocket `/ws/*`**——这意味着浏览器直连 `ws://120.53.24.48:8000/ws/alerts`，需要后端 8000 端口对外暴露
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
