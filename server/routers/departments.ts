import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, asc } from "drizzle-orm";
import { departments } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { validate, createDepartmentSchema, updateDepartmentSchema } from "../lib/validate";
import { ensureFolder } from "../lib/nextcloud";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

router.get("/departments", requireAuth, async (_req, res) => {
  const rows = await db.select().from(departments).orderBy(asc(departments.name));
  return res.json({ departments: rows });
});

router.post("/departments", requireAuth, validate(createDepartmentSchema), async (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  // Build nextcloud path: /parent_path/name or /name for root departments
  let folderPath = "/" + name;
  if (parentId) {
    const ancestors: string[] = [];
    let current: string | null = parentId;
    while (current) {
      const [p] = await db.select().from(departments).where(eq(departments.id, current));
      if (!p) break;
      ancestors.unshift(p.name);
      current = p.parentId;
    }
    folderPath = "/" + [...ancestors, name].join("/");
  }

  // Create Nextcloud folder and save path
  await ensureFolder(folderPath).catch(() => {});

  const [dept] = await db
    .insert(departments)
    .values({ name, parentId: parentId || null, nextcloudPath: folderPath })
    .returning();

  return res.json({ department: dept });
});

router.put("/departments/:id", requireAuth, validate(updateDepartmentSchema), async (req, res) => {
  const id = req.params.id as string;
  const { name, parentId } = req.body;
  const [dept] = await db
    .update(departments)
    .set({ name, parentId: parentId ?? null })
    .where(eq(departments.id, id))
    .returning();
  if (!dept) return res.status(404).json({ error: "Department not found" });
  return res.json({ department: dept });
});

router.delete("/departments/:id", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  await db.delete(departments).where(eq(departments.id, id));
  return res.json({ ok: true });
});

export default router;
