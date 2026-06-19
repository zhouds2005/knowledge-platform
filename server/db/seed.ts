/**
 * Seed initial data: default admin user, example departments and spaces.
 * Run with: npx tsx server/db/seed.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, departments, knowledgeSpaces } from "./schema";
import { hashPassword } from "../lib/password";

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("🌱 Seeding knowledge_platform database...");

  // Create departments
  const deptRows = await db
    .insert(departments)
    .values([
      { name: "综合管理部" },
      { name: "技术研发部" },
      { name: "市场销售部" },
      { name: "财务部" },
    ])
    .returning();

  console.log(`  ✅ Created ${deptRows.length} departments`);

  // Create admin user in 综合管理部
  const adminHash = await hashPassword("admin123");
  const [admin] = await db
    .insert(users)
    .values({
      name: "系统管理员",
      email: "admin@company.com",
      passwordHash: adminHash,
      role: "admin",
      departmentId: deptRows[0]!.id,
    })
    .returning();

  console.log(`  ✅ Created admin user: ${admin.email}`);

  // Create demo user in each department
  const demoUsers = await db
    .insert(users)
    .values([
      {
        name: "张三",
        email: "zhangsan@company.com",
        passwordHash: await hashPassword("123456"),
        role: "editor",
        departmentId: deptRows[1]!.id,
      },
      {
        name: "李四",
        email: "lisi@company.com",
        passwordHash: await hashPassword("123456"),
        role: "editor",
        departmentId: deptRows[2]!.id,
      },
      {
        name: "王五",
        email: "wangwu@company.com",
        passwordHash: await hashPassword("123456"),
        role: "viewer",
        departmentId: deptRows[3]!.id,
      },
    ])
    .returning();

  console.log(`  ✅ Created ${demoUsers.length} demo users`);

  // Create knowledge spaces (one per department)
  const spaceRows = await db
    .insert(knowledgeSpaces)
    .values([
      {
        departmentId: deptRows[0]!.id,
        name: "综合管理知识库",
        description: "公司制度、流程规范、行政文档",
        defaultReviewerId: admin.id,
      },
      {
        departmentId: deptRows[1]!.id,
        name: "技术研发知识库",
        description: "技术方案、API 文档、架构设计",
        defaultReviewerId: admin.id,
      },
      {
        departmentId: deptRows[2]!.id,
        name: "市场销售知识库",
        description: "销售话术、客户案例、市场分析",
        defaultReviewerId: admin.id,
      },
      {
        departmentId: deptRows[3]!.id,
        name: "财务知识库",
        description: "报销流程、预算模板、合规文档",
        defaultReviewerId: admin.id,
      },
    ])
    .returning();

  console.log(`  ✅ Created ${spaceRows.length} knowledge spaces`);
  console.log("\n🎉 Seed complete!");
  console.log("\n   Login credentials:");
  console.log("   admin@company.com / admin123 (admin)");
  console.log("   zhangsan@company.com / 123456 (editor)");
  console.log("   lisi@company.com / 123456 (editor)");
  console.log("   wangwu@company.com / 123456 (viewer)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
