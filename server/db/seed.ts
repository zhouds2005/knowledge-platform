/**
 * Seed initial data for development and CI.
 * Run with: npx tsx server/db/seed.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users, departments, knowledgeSpaces } from "./schema";
import { hashPassword } from "../lib/password";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("Seeding database…");
  const pwHash = await hashPassword("admin123");

  // ---- 用户 ----
  const userRecords = [
    { name: "系统管理员", email: "admin@company.com", passwordHash: pwHash, role: "admin" as const },
    { name: "张三", email: "zhangsan@company.com", passwordHash: pwHash, role: "editor" as const },
    { name: "李四", email: "lisi@company.com", passwordHash: pwHash, role: "editor" as const },
    { name: "王五", email: "wangwu@company.com", passwordHash: pwHash, role: "viewer" as const },
    { name: "测试用户", email: "test@test.com", passwordHash: await hashPassword("test123"), role: "editor" as const },
  ];
  const userIds: Record<string, string> = {};
  for (const u of userRecords) {
    const [row] = await db.insert(users).values(u).onConflictDoNothing().returning();
    if (row) userIds[u.email] = row.id;
    else {
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
      if (existing) userIds[u.email] = existing.id;
    }
    console.log(row ? `  User: ${u.email}` : `  User exists: ${u.email}`);
  }

  // ---- 部门 ----
  const deptRecords = [
    { name: "技术研发部", nextcloudPath: "/技术研发部" },
    { name: "综合管理部", nextcloudPath: "/综合管理部" },
  ];
  const deptIds: Record<string, string> = {};
  for (const d of deptRecords) {
    const [row] = await db.insert(departments).values(d).onConflictDoNothing().returning();
    if (row) {
      deptIds[d.name] = row.id;
    } else {
      const [existing] = await db.select({ id: departments.id }).from(departments).where(eq(departments.name, d.name)).limit(1);
      if (existing) deptIds[d.name] = existing.id;
    }
    console.log(row ? `  Dept: ${d.name}` : `  Dept exists: ${d.name}`);
  }

  // ---- 空间（带默认审核人） ----
  const adminId = userIds["admin@company.com"];
  const spaceRecords = [
    { departmentId: deptIds["技术研发部"], name: "技术研发知识库", description: "技术研发知识共享空间", defaultReviewerId: adminId },
    { departmentId: deptIds["综合管理部"], name: "综合管理知识库", description: "综合管理知识共享空间", defaultReviewerId: adminId },
  ];
  for (const s of spaceRecords) {
    if (!s.departmentId) { console.log(`  Space skipped (no dept): ${s.name}`); continue; }
    const [row] = await db.insert(knowledgeSpaces).values(s).onConflictDoNothing().returning();
    console.log(row ? `  Space: ${s.name}` : `  Space exists: ${s.name}`);
  }

  console.log("Seed complete.");
}

seed().catch(console.error).finally(() => process.exit());
