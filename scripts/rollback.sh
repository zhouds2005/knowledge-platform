#!/bin/bash
# ============================================
#  回滚脚本 — Ubuntu 24.04
#  用法: bash scripts/rollback.sh
# ============================================
set -e
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "============================================"
echo " 回滚：恢复上一个版本"
echo "============================================"

# ---- 显示最近提交 ----
echo "最近 3 次提交："
git log --oneline -3
echo ""
echo "即将回退到上一个版本"
read -p "确认回滚？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# ---- 1. 回退代码 ----
echo "[1/3] 回退代码..."
git stash
git reset --hard HEAD~1
echo "      已回退到 $(git log --oneline -1)"

# ---- 2. 重新构建 ----
echo "[2/3] 重新构建..."
npm run build >/dev/null 2>&1
echo "      构建完成"

# ---- 3. 重启服务 ----
echo "[3/3] 重启服务..."
pm2 restart all

echo ""
echo "============================================"
echo " 回滚完成"
echo " 如需恢复到回滚前: git reflog 查找 commit"
echo "============================================"
