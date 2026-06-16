import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, isNull } from "drizzle-orm";
import { knowledgeSpaces, users } from "../server/db/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function fix() {
  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@company.com")).limit(1);
  if (!admin) { console.log("admin 用户不存在"); process.exit(1); }

  const result = await db
    .update(knowledgeSpaces)
    .set({ defaultReviewerId: admin.id })
    .where(isNull(knowledgeSpaces.defaultReviewerId));

  console.log(`已为 ${result.rowCount} 个空间设置默认审核人`);
  process.exit(0);
}

fix();
