import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { knowledgeObjects } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireReview } from "../middleware/rbac";
import { submitForReview, approveReview, rejectReview } from "../lib/review";
import { notifyReviewRequested, notifyReviewApproved, notifyReviewRejected, notifySpaceNewVersion } from "../lib/notify";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// POST /api/knowledge/:id/submit
router.post("/knowledge/:id/submit", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { object, reviewerId } = await submitForReview(id);
    if (reviewerId) {
      await notifyReviewRequested(reviewerId, object.id);
    }
    return res.json({ object });
  } catch (err: any) { return res.status(400).json({ error: err.message }); }
});

// POST /api/knowledge/:id/withdraw — withdraw from review
router.post("/knowledge/:id/withdraw", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const [obj] = await db.select().from(knowledgeObjects).where(eq(knowledgeObjects.id, id)).limit(1);
    if (!obj) return res.status(404).json({ error: "Not found" });
    if (obj.status !== "pending_review") return res.status(400).json({ error: "Can only withdraw pending_review objects" });
    if (obj.ownerId !== req.user!.id && req.user?.role !== "admin") return res.status(403).json({ error: "Only owner can withdraw" });

    const [updated] = await db
      .update(knowledgeObjects)
      .set({ status: "draft", updatedAt: new Date(), reviewerId: null })
      .where(eq(knowledgeObjects.id, id))
      .returning();

    return res.json({ object: updated });
  } catch (err: any) { return res.status(400).json({ error: err.message }); }
});

// POST /api/knowledge/:id/approve — requires review permission; admin always allowed
router.post("/knowledge/:id/approve", requireAuth, requireReview, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const isAdmin = req.user?.role === "admin";
    const obj = await approveReview(id, req.user!.id, isAdmin);
    await notifyReviewApproved(obj.ownerId, obj.id);
    await notifySpaceNewVersion(obj.spaceId, obj.id, obj.ownerId);
    return res.json({ object: obj });
  } catch (err: any) { return res.status(400).json({ error: err.message }); }
});

// POST /api/knowledge/:id/reject — requires review permission; admin always allowed
router.post("/knowledge/:id/reject", requireAuth, requireReview, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const isAdmin = req.user?.role === "admin";
    const { comment } = req.body;
    const obj = await rejectReview(id, req.user!.id, comment, isAdmin);
    await notifyReviewRejected(obj.ownerId, obj.id, comment);
    return res.json({ object: obj });
  } catch (err: any) { return res.status(400).json({ error: err.message }); }
});

// GET /api/review/queue
router.get("/review/queue", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(knowledgeObjects)
    .where(and(eq(knowledgeObjects.status, "pending_review"), eq(knowledgeObjects.reviewerId, req.user!.id)));
  return res.json({ objects: rows });
});

export default router;
