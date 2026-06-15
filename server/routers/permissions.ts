import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { objectPermissions } from "../db/schema";
import { requireAuth } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/knowledge/:id/permissions
router.get("/knowledge/:id/permissions", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  const grants = await db
    .select()
    .from(objectPermissions)
    .where(eq(objectPermissions.objectId, id));

  return res.json({ permissions: grants });
});

// PUT /api/knowledge/:id/permissions
router.put("/knowledge/:id/permissions", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  const { grants } = req.body; // [{ granteeType, granteeId, permission }]

  if (!Array.isArray(grants)) {
    return res.status(400).json({ error: "grants must be an array" });
  }

  // Delete old grants and insert new ones in a transaction-style approach
  await db
    .delete(objectPermissions)
    .where(eq(objectPermissions.objectId, id));

  if (grants.length > 0) {
    await db.insert(objectPermissions).values(
      grants.map((g: any) => ({
        objectId: id,
        granteeType: g.granteeType,
        granteeId: g.granteeId,
        permission: g.permission,
      })),
    );
  }

  const updated = await db
    .select()
    .from(objectPermissions)
    .where(eq(objectPermissions.objectId, id));

  return res.json({ permissions: updated });
});

export default router;
