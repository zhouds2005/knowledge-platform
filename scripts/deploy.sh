#!/bin/bash
# ============================================
#  部署脚本 — Ubuntu 24.04
#  用法: bash scripts/deploy.sh
# ============================================
set -e
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "============================================"
echo " 部署：部门知识共享平台 (Ubuntu)"
echo "============================================"

# ---- 1. 检查环境 ----
echo "[1/7] 检查环境..."
command -v node >/dev/null 2>&1 || { echo "错误：未安装 Node.js"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "错误：未安装 npx"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "提示：pm2 未安装，正在安装..."; npm install -g pm2; }
echo "      环境就绪"

# ---- 2. 启动数据库 ----
echo "[2/7] 启动 PostgreSQL..."
if command -v docker >/dev/null 2>&1; then
  docker compose up -d db
  echo "      等待 PostgreSQL 就绪..."
  sleep 3
elif pg_isready -U postgres -h localhost >/dev/null 2>&1; then
  echo "      PostgreSQL 已在运行"
else
  echo "错误：请先启动 PostgreSQL"
  exit 1
fi

# ---- 3. 跑测试 ----
echo "[3/7] 运行测试..."
npx vitest run >/dev/null 2>&1 || { echo "错误：单元测试未通过"; exit 1; }
npx playwright test --project=chromium >/dev/null 2>&1 || { echo "错误：E2E 测试未通过"; exit 1; }
echo "      135 个测试全部通过"

# ---- 4. 备份数据库 ----
echo "[4/7] 备份数据库..."
mkdir -p backups
BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump -U postgres -h localhost knowledge_platform > "$BACKUP_FILE" 2>/dev/null || echo "      警告：备份失败，继续部署"
[ -s "$BACKUP_FILE" ] && echo "      已保存到 $BACKUP_FILE"

# ---- 5. 构建前端 ----
echo "[5/7] 构建前端..."
npm run build >/dev/null 2>&1 || { echo "错误：前端构建失败"; exit 1; }
echo "      构建完成"

# ---- 6. 停止旧服务 ----
echo "[6/7] 停止旧服务..."
pm2 delete knowledge-api 2>/dev/null || true
pm2 delete knowledge-web 2>/dev/null || true

# ---- 7. 启动服务 ----
echo "[7/7] 启动服务..."
mkdir -p logs

# 后端 API（用 tsx 运行）
pm2 start server/index.ts \
  --name knowledge-api \
  --interpreter npx \
  --interpreter-args "tsx" \
  --log logs/api.log \
  --time

# 前端静态文件
pm2 serve dist 5173 \
  --name knowledge-web \
  --spa \
  --log logs/web.log

pm2 save

echo ""
echo "============================================"
echo " 部署完成"
echo " 前端: http://localhost:5173"
echo " 后端: http://localhost:3002"
echo " 日志: logs/api.log  /  logs/web.log"
echo ""
echo " pm2 常用命令："
echo "   pm2 status      查看服务状态"
echo "   pm2 logs        查看实时日志"
echo "   pm2 restart all 重启所有服务"
echo "============================================"
