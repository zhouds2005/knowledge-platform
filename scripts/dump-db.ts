import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

const { Pool } = pg;

const TABLES = [
  "users", "sessions", "departments", "knowledge_spaces",
  "knowledge_objects", "object_permissions", "review_records",
  "notifications", "object_relations", "user_favorites", "user_view_history",
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  const outDir = path.resolve("migration/data");
  fs.mkdirSync(outDir, { recursive: true });

  try {
    for (const table of TABLES) {
      const { rows } = await client.query("SELECT * FROM " + table + " LIMIT 1000");
      fs.writeFileSync(path.join(outDir, table + ".json"), JSON.stringify(rows, null, 2));
      console.log(table + ": " + rows.length + " rows");
    }
    console.log("Done. Files in migration/data/");
  } finally {
    client.release();
    await pool.end();
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
