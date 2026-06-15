import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import { userViewHistory, knowledgeObjects } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/history
router.get("/history", requireAuth, async (req: AuthRequest, res) => {
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
      viewedAt: userViewHistory.viewedAt,
    })
    .from(userViewHistory)
    .innerJoin(knowledgeObjects, eq(userViewHistory.objectId, knowledgeObjects.id))
    .where(eq(userViewHistory.userId, req.user!.id))
    .orderBy(desc(userViewHistory.viewedAt))
    .limit(limit);

  return res.json({ objects: rows, limit });
});

// DELETE /api/history
router.delete("/history", requireAuth, async (req: AuthRequest, res) => {
  await db.delete(userViewHistory).where(eq(userViewHistory.userId, req.user!.id));
  return res.json({ ok: true });
});

/**
 * Record a view in user history. Called from knowledge detail endpoint.
 * Deduplicates: if same object viewed within 1 hour, just update timestamp.
 */
export async function recordView(userId: string, objectId: string) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check if user viewed this object recently
    const [recent] = await db
      .select({ id: userViewHistory.id })
      .from(userViewHistory)
      .where(
        and(
          eq(userViewHistory.userId, userId),
          eq(userViewHistory.objectId, objectId),
          sql`${userViewHistory.viewedAt} > ${oneHourAgo}`,
        ),
      )
      .limit(1);

    if (recent) {
      // Update timestamp
      await db
        .update(userViewHistory)
        .set({ viewedAt: new Date() })
        .where(eq(userViewHistory.id, recent.id));
    } else {
      // Insert new record
      await db.insert(userViewHistory).values({ userId, objectId, viewedAt: new Date() });
    }

    // Trim to 100 records per user
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userViewHistory)
      .where(eq(userViewHistory.userId, userId));
    const excess = (countRow?.count ?? 0) - 100;
    if (excess > 0) {
      // Delete oldest excess records
      const oldIds = await db
        .select({ id: userViewHistory.id })
        .from(userViewHistory)
        .where(eq(userViewHistory.userId, userId))
        .orderBy(userViewHistory.viewedAt)
        .limit(excess);
      if (oldIds.length > 0) {
        await db.delete(userViewHistory).where(
          and(
            eq(userViewHistory.userId, userId),
            sql`${userViewHistory.id} IN (${oldIds.map((r) => r.id).join(",")})`,
          ),
        );
      }
    }
  } catch (e) {
    // View history is non-critical; log and continue
    console.error("Failed to record view:", e);
  }
}

export default router;
