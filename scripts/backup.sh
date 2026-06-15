#!/bin/bash
# ============================================
#  数据库备份 — Ubuntu 24.04
#  用法: bash scripts/backup.sh
#  cron: 0 2 * * * cd /path/to/project && bash scripts/backup.sh
# ============================================
set -e
cd "$(dirname "$0")/.."

mkdir -p backups
BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"

echo "备份数据库 → $BACKUP_FILE"
pg_dump -U postgres -h localhost knowledge_platform > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    echo "备份成功 ($(du -h "$BACKUP_FILE" | cut -f1))"

    # 保留最近 30 个备份，删掉更早的
    ls -t backups/backup-*.sql 2>/dev/null | tail -n +31 | xargs -r rm
    echo "当前保留 $(ls backups/backup-*.sql 2>/dev/null | wc -l) 个备份"
else
    echo "备份失败！"
    exit 1
fi
