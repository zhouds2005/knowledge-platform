import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { knowledgeSpaces } from "../db/schema";
import { knowledgeObjects } from "../db/schema";
import { requireAuth } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/spaces
router.get("/spaces", requireAuth, async (_req, res) => {
  const rows = await db.select().from(knowledgeSpaces);
  return res.json({ spaces: rows });
});

// GET /api/spaces/:id
router.get("/spaces/:id", requireAuth, async (req, res) => {
  const [space] = await db
    .select()
    .from(knowledgeSpaces)
    .where(eq(knowledgeSpaces.id, req.params.id as string))
    .limit(1);

  if (!space) return res.status(404).json({ error: "Space not found" });
  return res.json({ space });
});

// POST /api/spaces
router.post("/spaces", requireAuth, async (req, res) => {
  const { departmentId, name, description, defaultReviewerId } = req.body;
  if (!departmentId || !name)
    return res.status(400).json({ error: "departmentId and name are required" });

  const [space] = await db
    .insert(knowledgeSpaces)
    .values({ departmentId, name, description: description || null, defaultReviewerId: defaultReviewerId || null })
    .returning();

  return res.json({ space });
});

// PUT /api/spaces/:id
router.put("/spaces/:id", requireAuth, async (req, res) => {
  const { name, description, defaultReviewerId, autoPublish } = req.body;
  const [space] = await db
    .update(knowledgeSpaces)
    .set({ name, description, defaultReviewerId, autoPublish })
    .where(eq(knowledgeSpaces.id, req.params.id as string))
    .returning();

  if (!space) return res.status(404).json({ error: "Space not found" });
  return res.json({ space });
});

// DELETE /api/spaces/:id
router.delete("/spaces/:id", requireAuth, async (req, res) => {
  // 检查空间下是否有知识对象
  const children = await db
    .select({ id: knowledgeObjects.id })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.spaceId, req.params.id as string))
    .limit(1);
  if (children.length > 0) {
    return res.status(400).json({ error: "该空间下仍有知识对象，无法删除" });
  }

  await db.delete(knowledgeSpaces).where(eq(knowledgeSpaces.id, req.params.id as string));
  return res.json({ ok: true });
});

export default router;
