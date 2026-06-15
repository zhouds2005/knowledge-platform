import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { knowledgeSpaces, departments } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { validate, createSpaceSchema, updateSpaceSchema } from "../lib/validate";
import { ensureFolder } from "../lib/nextcloud";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/spaces
router.get("/spaces", requireAuth, async (_req, res) => {
  const rows = await db.select().from(knowledgeSpaces);
  return res.json({ spaces: rows });
});

// GET /api/spaces/:id
router.get("/spaces/:id", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  const [space] = await db
    .select()
    .from(knowledgeSpaces)
    .where(eq(knowledgeSpaces.id, id))
    .limit(1);

  if (!space) return res.status(404).json({ error: "Space not found" });
  return res.json({ space });
});

// POST /api/spaces
router.post("/spaces", requireAuth, validate(createSpaceSchema), async (req, res) => {
  const { departmentId, name, description, defaultReviewerId } = req.body;
  if (!departmentId || !name)
    return res.status(400).json({ error: "departmentId and name are required" });

  // Build nextcloud path: department_path/space_name
  let folderPath: string | null = null;
  const [dept] = await db
    .select({ nextcloudPath: departments.nextcloudPath })
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);

  if (dept?.nextcloudPath) {
    folderPath = dept.nextcloudPath + "/" + name;
    await ensureFolder(folderPath).catch(() => {});
  }

  const [space] = await db
    .insert(knowledgeSpaces)
    .values({
      departmentId,
      name,
      description: description || null,
      defaultReviewerId: defaultReviewerId || null,
      nextcloudPath: folderPath,
    })
    .returning();

  return res.json({ space });
});

// PUT /api/spaces/:id
router.put("/spaces/:id", requireAuth, validate(updateSpaceSchema), async (req, res) => {
  const id = req.params.id as string;
  const { name, description, defaultReviewerId, autoPublish } = req.body;
  const [space] = await db
    .update(knowledgeSpaces)
    .set({ name, description, defaultReviewerId, autoPublish })
    .where(eq(knowledgeSpaces.id, id))
    .returning();

  if (!space) return res.status(404).json({ error: "Space not found" });
  return res.json({ space });
});

// DELETE /api/spaces/:id
router.delete("/spaces/:id", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  await db.delete(knowledgeSpaces).where(eq(knowledgeSpaces.id, id));
  return res.json({ ok: true });
});

export default router;
