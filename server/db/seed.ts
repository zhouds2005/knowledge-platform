/**
 * Seed initial data: default admin user, example departments and spaces.
 * Run with: npx tsx server/db/seed.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, departments, knowledgeSpaces } from "./schema";
import { hashPassword } from "../lib/password";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("Seeding database…");

  // Create default admin user
  const pwHash = await hashPassword("admin123");
  const [admin] = await db
    .insert(users)
    .values({ name: "Admin", email: "admin@example.com", passwordHash: pwHash, role: "admin" })
    .onConflictDoNothing()
    .returning();
  console.log(admin ? "Admin user created" : "Admin user exists");

  // Create a demo department
  const [dept] = await db
    .insert(departments)
    .values({ name: "技术部" })
    .onConflictDoNothing()
    .returning();
  console.log(dept ? "Demo department created" : "Demo department exists");

  // Create a demo knowledge space
  if (dept) {
    await db
      .insert(knowledgeSpaces)
      .values({
        departmentId: dept.id,
        name: "通用知识库",
        description: "部门通用知识共享空间",
      })
      .onConflictDoNothing();
    console.log("Demo knowledge space created");
  }

  console.log("Seed complete.");
}

seed().catch(console.error).finally(() => process.exit());
