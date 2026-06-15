#!/bin/bash
# WSL 一键启动脚本 — 启动 PostgreSQL 和后端服务

set -e

echo "=== 启动 PostgreSQL ==="
if command -v docker &> /dev/null; then
  docker compose up -d db
  echo "等待 PostgreSQL 就绪…"
  sleep 5
elif sudo -u postgres pg_isready &> /dev/null; then
  echo "PostgreSQL 已在运行"
else
  echo "请手动启动 PostgreSQL 或使用 docker compose up -d db"
  exit 1
fi

echo ""
echo "=== 启动后端 ==="
npm run server &
SERVER_PID=$!
echo "后端 PID: $SERVER_PID"

echo ""
echo "=== 启动前端 ==="
npm run dev &
DEV_PID=$!
echo "前端 PID: $DEV_PID"

echo ""
echo "服务已启动："
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:3002"
echo ""
echo "按 Ctrl+C 停止所有服务"

wait
