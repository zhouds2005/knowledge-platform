#!/bin/bash
# 数据库还原脚本 — 在 WSL 中运行
# 前提：PostgreSQL 已运行，DATABASE_URL 已配置

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/migration/data"

if [ ! -d "$DATA_DIR" ]; then
  echo "错误：找不到 $DATA_DIR 目录"
  exit 1
fi

# 先推 schema（建表）
npx drizzle-kit push --force

echo ""
echo "=== 导入数据 ==="

# 用 Node.js 逐表导入 JSON 数据
node -e "
const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

const { Pool } = pg;
const TABLES = [
  'users','sessions','departments','knowledge_spaces',
  'knowledge_objects','object_permissions','review_records',
  'notifications','object_relations','user_favorites','user_view_history'
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    for (const table of TABLES) {
      const filePath = path.join('$DATA_DIR', table + '.json');
      if (!fs.existsSync(filePath)) {
        console.log(table + ': 文件不存在，跳过');
        continue;
      }
      const rows = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (rows.length === 0) {
        console.log(table + ': 0 行，跳过');
        continue;
      }
      // 逐行 INSERT … ON CONFLICT DO NOTHING
      const cols = Object.keys(rows[0]);
      let count = 0;
      for (const row of rows) {
        const vals = cols.map(c => row[c]);
        const placeholders = vals.map((_, i) => '\$' + (i + 1)).join(',');
        try {
          await client.query(
            'INSERT INTO ' + table + ' (' + cols.join(',') + ') VALUES (' + placeholders + ') ON CONFLICT DO NOTHING'
          , vals);
          count++;
        } catch (e) {
          // 跳过重复行
        }
      }
      console.log(table + ': ' + count + '/' + rows.length + ' 行');
    }
    console.log('\\n导入完成');
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "=== 数据还原完成 ==="
