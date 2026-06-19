import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, asc } from "drizzle-orm";
import { departments, users, knowledgeSpaces } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { ensureFolder } from "../lib/nextcloud";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

router.get("/departments", requireAuth, async (_req, res) => {
  const rows = await db.select().from(departments).orderBy(asc(departments.name));
  return res.json({ departments: rows });
});

router.post("/departments", requireAuth, async (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const [dept] = await db
    .insert(departments)
    .values({ name, parentId: parentId || null })
    .returning();

  // Auto-create department folder in Nextcloud with parent hierarchy
  (async () => {
    let folderPath = "/" + name;
    if (parentId) {
      const ancestors: string[] = [];
      let current = parentId;
      while (current) {
        const [p] = await db.select().from(departments).where(eq(departments.id, current));
        if (!p) break;
        ancestors.unshift(p.name);
        current = p.parentId;
      }
      folderPath = "/" + [...ancestors, name].join("/");
    }
    ensureFolder(folderPath).catch(() => {});
  })();

  return res.json({ department: dept });
});

router.put("/departments/:id", requireAuth, async (req, res) => {
  const { name, parentId } = req.body;
  const [dept] = await db
    .update(departments)
    .set({ name, parentId: parentId ?? null })
    .where(eq(departments.id, req.params.id as string))
    .returning();
  if (!dept) return res.status(404).json({ error: "Department not found" });
  return res.json({ department: dept });
});

router.delete("/departments/:id", requireAuth, async (req, res) => {
  // 检查部门下是否有用户
  const deptUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.departmentId, req.params.id as string))
    .limit(1);
  if (deptUsers.length > 0) {
    return res.status(400).json({ error: "该部门下仍有用户，无法删除" });
  }

  // 检查部门下是否有知识空间
  const deptSpaces = await db
    .select({ id: knowledgeSpaces.id })
    .from(knowledgeSpaces)
    .where(eq(knowledgeSpaces.departmentId, req.params.id as string))
    .limit(1);
  if (deptSpaces.length > 0) {
    return res.status(400).json({ error: "该部门下仍有知识空间，无法删除" });
  }

  await db.delete(departments).where(eq(departments.id, req.params.id as string));
  return res.json({ ok: true });
});

export default router;
