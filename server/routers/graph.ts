import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { objectRelations, knowledgeObjects } from "../db/schema";
import { requireAuth } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/knowledge/:id/graph — relation graph for an object
router.get("/knowledge/:id/graph", requireAuth, async (req, res) => {
  const objectId = req.params.id as string;

  const relations = await db
    .select()
    .from(objectRelations)
    .where(
      or(
        eq(objectRelations.sourceObjectId, objectId),
        eq(objectRelations.targetObjectId, objectId),
      ),
    );

  // Collect all related object IDs
  const relatedIds = new Set<string>();
  relations.forEach((r) => {
    relatedIds.add(r.sourceObjectId);
    relatedIds.add(r.targetObjectId);
  });

  // Fetch related objects
  const objects = relatedIds.size > 0
    ? await db.select().from(knowledgeObjects).where(
        or(...Array.from(relatedIds).map(id => eq(knowledgeObjects.id, id))),
      )
    : [];

  return res.json({
    nodes: objects.map((o) => ({ id: o.id, title: o.title, type: o.type })),
    edges: relations.map((r) => ({
      source: r.sourceObjectId,
      target: r.targetObjectId,
      type: r.relationType,
    })),
  });
});

// POST /api/knowledge/:id/relation — create relation
router.post("/knowledge/:id/relation", requireAuth, async (req, res) => {
  const { targetId, relationType } = req.body;
  if (!targetId || !relationType) {
    return res.status(400).json({ error: "targetId and relationType are required" });
  }

  const id = req.params.id as string;
  const [rel] = await db
    .insert(objectRelations)
    .values({
      sourceObjectId: id,
      targetObjectId: targetId,
      relationType,
    })
    .returning();

  return res.status(201).json({ relation: rel });
});

export default router;
