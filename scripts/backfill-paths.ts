import pg from "pg";
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    // 1. Backfill departments: /name for root departments
    const deptRes = await client.query(
      `UPDATE departments SET nextcloud_path = '/' || name WHERE nextcloud_path IS NULL RETURNING id, name, nextcloud_path`
    );
    console.log(`Departments updated: ${deptRes.rowCount}`);
    for (const r of deptRes.rows) {
      console.log(`  ${r.name} → ${r.nextcloud_path}`);
    }

    // 2. Backfill spaces: department_path/space_name
    const spaceRes = await client.query(
      `UPDATE knowledge_spaces s
       SET nextcloud_path = d.nextcloud_path || '/' || s.name
       FROM departments d
       WHERE s.department_id = d.id AND s.nextcloud_path IS NULL
       RETURNING s.id, s.name, s.nextcloud_path`
    );
    console.log(`Spaces updated: ${spaceRes.rowCount}`);
    for (const r of spaceRes.rows) {
      console.log(`  ${r.name} → ${r.nextcloud_path}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
