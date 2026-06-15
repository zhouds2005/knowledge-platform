import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc } from "drizzle-orm";
import { notifications } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/notifications
router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, req.user!.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const unreadCount = rows.filter((n) => !n.read).length;
  return res.json({ notifications: rows, unreadCount });
});

// PUT /api/notifications/:id/read
router.put("/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.id, req.params.id as string), eq(notifications.userId, req.user!.id)),
    );
  return res.json({ ok: true });
});

export default router;
