import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc } from "drizzle-orm";
import { userFavorites, knowledgeObjects } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/favorites
router.get("/favorites", requireAuth, async (req: AuthRequest, res) => {
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const rows = await db
    .select({
      id: knowledgeObjects.id,
      type: knowledgeObjects.type,
      title: knowledgeObjects.title,
      description: knowledgeObjects.description,
      tags: knowledgeObjects.tags,
      status: knowledgeObjects.status,
      ownerId: knowledgeObjects.ownerId,
      updatedAt: knowledgeObjects.updatedAt,
      favoritedAt: userFavorites.createdAt,
    })
    .from(userFavorites)
    .innerJoin(knowledgeObjects, eq(userFavorites.objectId, knowledgeObjects.id))
    .where(eq(userFavorites.userId, req.user!.id))
    .orderBy(desc(userFavorites.createdAt))
    .limit(limit)
    .offset(offset);

  return res.json({ objects: rows, offset, limit });
});

// POST /api/knowledge/:id/favorite
router.post("/knowledge/:id/favorite", requireAuth, async (req: AuthRequest, res) => {
  const objectId = req.params.id as string;
  const userId = req.user!.id;

  // Check object exists
  const [obj] = await db.select({ id: knowledgeObjects.id }).from(knowledgeObjects).where(eq(knowledgeObjects.id, objectId)).limit(1);
  if (!obj) return res.status(404).json({ error: "Not found" });

  // Upsert: ignore if already favorited
  await db.insert(userFavorites).values({ userId, objectId }).onConflictDoNothing();

  return res.json({ ok: true, isFavorited: true });
});

// DELETE /api/knowledge/:id/favorite
router.delete("/knowledge/:id/favorite", requireAuth, async (req: AuthRequest, res) => {
  const objectId = req.params.id as string;
  const userId = req.user!.id;

  await db.delete(userFavorites).where(
    and(eq(userFavorites.userId, userId), eq(userFavorites.objectId, objectId)),
  );

  return res.json({ ok: true, isFavorited: false });
});

export default router;
