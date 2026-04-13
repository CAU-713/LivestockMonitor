#!/usr/bin/env bash
# =============================================================
#  LivestockMonitor 一键部署脚本
#  用法：./deploy.sh [--local | --prod]
#    --local  本地模式（默认，NEXT_PUBLIC_BACKEND_URL=http://localhost:8000）
#    --prod   生产模式（自动检测公网 IP 或手动填写）
# =============================================================
set -euo pipefail

# ── 颜色输出 ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── 解析参数 ─────────────────────────────────────────────────
MODE="local"
for arg in "$@"; do
  case "$arg" in
    --prod)  MODE="prod"  ;;
    --local) MODE="local" ;;
    *)       warn "未知参数 '$arg'，已忽略" ;;
  esac
done

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   LivestockMonitor 一键部署脚本  [$MODE 模式]${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# ── 检查依赖 ─────────────────────────────────────────────────
info "检查运行环境..."

if ! command -v docker &>/dev/null; then
  error "未检测到 Docker，请先安装：https://docs.docker.com/get-docker/"
fi

DOCKER_VER=$(docker --version | grep -oP '\d+\.\d+' | head -1)
info "Docker 版本: $DOCKER_VER"

if ! docker compose version &>/dev/null 2>&1; then
  error "未检测到 Docker Compose（需要 v2.0+），请升级 Docker Desktop 或安装 docker-compose-plugin"
fi

COMPOSE_VER=$(docker compose version --short 2>/dev/null || docker compose version | grep -oP '\d+\.\d+' | head -1)
info "Docker Compose 版本: $COMPOSE_VER"

# ── 准备 .env ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ ! -f ".env.example" ]; then
    error "找不到 .env.example，请确保在项目根目录下运行此脚本"
  fi
  cp .env.example .env
  info "已从 .env.example 生成 .env"
fi

# 根据模式填写 NEXT_PUBLIC_BACKEND_URL
if [ "$MODE" = "local" ]; then
  BACKEND_PUBLIC_URL="http://localhost:8000"
  info "本地模式：NEXT_PUBLIC_BACKEND_URL=$BACKEND_PUBLIC_URL"
  # 更新 .env（如果未设置或仍是占位符）
  if grep -qE "^NEXT_PUBLIC_BACKEND_URL=(http://your-server-ip|http://your_server_ip|$)" .env; then
    sed -i.bak "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=${BACKEND_PUBLIC_URL}|" .env
    rm -f .env.bak
    success ".env 已更新 NEXT_PUBLIC_BACKEND_URL → $BACKEND_PUBLIC_URL"
  fi
else
  # 生产模式：尝试自动获取公网 IP
  CURRENT_VAL=$(grep -E "^NEXT_PUBLIC_BACKEND_URL=" .env | cut -d'=' -f2- | tr -d ' ')
  if echo "$CURRENT_VAL" | grep -qE "(your-server-ip|your_server_ip|^$)"; then
    # 尝试自动获取公网 IP
    PUB_IP=""
    for cmd in "curl -s ifconfig.me" "curl -s ipinfo.io/ip" "curl -s icanhazip.com"; do
      PUB_IP=$(eval "$cmd" 2>/dev/null | tr -d '\n' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
      [ -n "$PUB_IP" ] && break
    done

    if [ -n "$PUB_IP" ]; then
      BACKEND_PUBLIC_URL="http://${PUB_IP}:8000"
      warn "检测到公网 IP: $PUB_IP"
      read -r -p "    使用 $BACKEND_PUBLIC_URL 作为后端地址？[Y/n] " yn
      yn=${yn:-Y}
      if [[ "$yn" =~ ^[Yy]$ ]]; then
        sed -i.bak "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=${BACKEND_PUBLIC_URL}|" .env
        rm -f .env.bak
        success ".env 已更新 NEXT_PUBLIC_BACKEND_URL → $BACKEND_PUBLIC_URL"
      else
        read -r -p "    请手动输入后端地址（例：http://1.2.3.4:8000）: " MANUAL_URL
        sed -i.bak "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=${MANUAL_URL}|" .env
        rm -f .env.bak
        BACKEND_PUBLIC_URL="$MANUAL_URL"
        success ".env 已更新 NEXT_PUBLIC_BACKEND_URL → $BACKEND_PUBLIC_URL"
      fi
    else
      warn "无法自动获取公网 IP，请手动编辑 .env 中的 NEXT_PUBLIC_BACKEND_URL"
      warn "格式示例: NEXT_PUBLIC_BACKEND_URL=http://1.2.3.4:8000"
      read -r -p "    现在输入后端地址（或直接回车跳过）: " MANUAL_URL
      if [ -n "$MANUAL_URL" ]; then
        sed -i.bak "s|^NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=${MANUAL_URL}|" .env
        rm -f .env.bak
        BACKEND_PUBLIC_URL="$MANUAL_URL"
        success ".env 已更新 NEXT_PUBLIC_BACKEND_URL → $BACKEND_PUBLIC_URL"
      fi
    fi
  else
    BACKEND_PUBLIC_URL="$CURRENT_VAL"
    info "使用已配置的地址: $BACKEND_PUBLIC_URL"
  fi
fi

# 提取访问 IP/域名（用于最终提示）
FRONTEND_IP=$(echo "${BACKEND_PUBLIC_URL:-http://localhost:8000}" | grep -oE 'https?://[^:]+' | sed 's|https://||;s|http://||')
FRONTEND_IP=${FRONTEND_IP:-localhost}

# ── 生成 SECRET_KEY（如果还是占位符）─────────────────────────
if grep -q "generate_a_new_secret_key_for_production" .env; then
  if command -v openssl &>/dev/null; then
    NEW_KEY=$(openssl rand -hex 32)
    sed -i.bak "s|generate_a_new_secret_key_for_production|${NEW_KEY}|" .env
    rm -f .env.bak
    success "已自动生成随机 SECRET_KEY"
  else
    warn "未找到 openssl，请手动在 .env 中设置 SECRET_KEY"
  fi
fi

# ── 构建并启动 ───────────────────────────────────────────────
echo ""
info "开始构建并启动所有服务（首次构建可能需要 5-10 分钟）..."
echo ""

docker compose up -d --build

echo ""
info "等待服务健康检查（最多 90 秒）..."

# 等待后端就绪
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' backend_app 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "healthy" ] || curl -sf "http://localhost:8000/docs" >/dev/null 2>&1; then
    break
  fi
  # 检查容器是否存在（没有 healthcheck 的情况）
  if docker ps --format '{{.Names}}' | grep -q "^backend_app$"; then
    sleep 3 && ELAPSED=$((ELAPSED + 3))
    # 再次尝试连接
    if curl -sf "http://localhost:8000/docs" >/dev/null 2>&1; then
      break
    fi
  else
    sleep 3 && ELAPSED=$((ELAPSED + 3))
  fi
done

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   🎉 部署完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "  📺 前端页面:     ${BLUE}http://${FRONTEND_IP}:3000${NC}"
echo -e "  🔌 后端 API:     ${BLUE}http://${FRONTEND_IP}:8000${NC}"
echo -e "  📖 接口文档:     ${BLUE}http://${FRONTEND_IP}:8000/docs${NC}"
echo ""
echo -e "  默认账号:  ${YELLOW}admin${NC}  /  密码: ${YELLOW}admin${NC}"
echo ""
echo -e "  运维命令:"
echo -e "    查看日志:  docker compose logs -f"
echo -e "    停止服务:  docker compose down"
echo -e "    重启服务:  docker compose restart"
echo ""
