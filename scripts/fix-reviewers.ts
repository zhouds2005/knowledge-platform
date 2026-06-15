import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    // Check current state
    const { rows: spaces } = await client.query(
      "SELECT name, default_reviewer_id, id FROM knowledge_spaces"
    );
    console.log("当前状态:");
    for (const s of spaces) {
      console.log("  " + s.name + " | reviewer: " + (s.default_reviewer_id || "NULL"));
    }

    // Get admin ID
    const { rows: admins } = await client.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (admins.length === 0) {
      console.log("没有找到 admin 用户");
      return;
    }
    const adminId = admins[0].id;

    // Update all spaces without reviewer
    const { rowCount } = await client.query(
      "UPDATE knowledge_spaces SET default_reviewer_id = $1 WHERE default_reviewer_id IS NULL",
      [adminId]
    );
    console.log("已更新 " + (rowCount ?? 0) + " 个空间");

    // Verify
    const { rows: after } = await client.query(
      "SELECT name, default_reviewer_id FROM knowledge_spaces"
    );
    console.log("更新后:");
    for (const s of after) {
      console.log("  " + s.name + " | reviewer: " + (s.default_reviewer_id || "NULL"));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
