#!/bin/bash
# ============================================
#  回滚脚本 — Ubuntu 24.04（不依赖 git）
#  用法: bash scripts/rollback.sh
#  原理: 每次部署把旧 dist/ 备份到 dist.prev/，回滚时换回来
# ============================================
set -e
cd "$(dirname "$0")/.."

echo "============================================"
echo " 回滚：恢复上一个版本"
echo "============================================"

if [ ! -d "dist.prev" ]; then
    echo "没有可回滚的版本（dist.prev 不存在）"
    exit 1
fi

echo "当前版本: $(cat dist/version.txt 2>/dev/null || echo '未知')"
echo "回滚版本: $(cat dist.prev/version.txt 2>/dev/null || echo '未知')"
echo ""
read -p "确认回滚？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 交换 dist 和 dist.prev
rm -rf dist.old 2>/dev/null || true
mv dist dist.old
mv dist.prev dist
mv dist.old dist.prev 2>/dev/null || true

# 重启前端
pm2 restart knowledge-web

echo ""
echo "============================================"
echo " 回滚完成，前端已切换到上一版本"
echo " 如需要切回: bash scripts/rollback.sh"
echo "============================================"
