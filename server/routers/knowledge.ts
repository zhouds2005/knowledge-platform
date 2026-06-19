import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { knowledgeObjects } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { searchQuery } from "../lib/search";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/knowledge/search
router.get("/knowledge/search", requireAuth, async (req, res) => {
  const { q, type, space_id, department_id, status } = req.query;
  const conditions: SQL[] = [];

  if (q && typeof q === "string" && q.length > 0) conditions.push(searchQuery(q));
  if (type && typeof type === "string") conditions.push(eq(knowledgeObjects.type, type as any));
  if (space_id && typeof space_id === "string") conditions.push(eq(knowledgeObjects.spaceId, space_id as string));
  if (department_id && typeof department_id === "string") conditions.push(eq(knowledgeObjects.departmentId, department_id as string));
  if (status && typeof status === "string") conditions.push(eq(knowledgeObjects.status, status as any));

  const rows = await db
    .select()
    .from(knowledgeObjects)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(knowledgeObjects.updatedAt))
    .limit(50);

  return res.json({ objects: rows, total: rows.length });
});

// GET /api/knowledge/space/:spaceId
router.get("/knowledge/space/:spaceId", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.spaceId, req.params.spaceId as string))
    .orderBy(desc(knowledgeObjects.updatedAt))
    .limit(30);
  return res.json({ objects: rows });
});

// GET /api/knowledge/:id — with version history
router.get("/knowledge/:id", requireAuth, async (req, res) => {
  const [obj] = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, req.params.id as string))
    .limit(1);

  if (!obj) return res.status(404).json({ error: "Not found" });

  // Increment view count
  db.update(knowledgeObjects)
    .set({ viewCount: sql`${knowledgeObjects.viewCount} + 1` })
    .where(eq(knowledgeObjects.id, obj.id))
    .execute()
    .catch(() => {});

  // Fetch version history: all objects with same source_table + source_id
  const versions = await db
    .select({ id: knowledgeObjects.id, version: knowledgeObjects.version, status: knowledgeObjects.status, updatedAt: knowledgeObjects.updatedAt })
    .from(knowledgeObjects)
    .where(and(eq(knowledgeObjects.sourceTable, obj.sourceTable), eq(knowledgeObjects.sourceId, obj.sourceId)))
    .orderBy(desc(knowledgeObjects.version));

  return res.json({ object: obj, versions });
});

// POST /api/knowledge
router.post("/knowledge", requireAuth, async (req: AuthRequest, res) => {
  const { type, title, description, tags, spaceId, visibility, sourceTable, sourceId } = req.body;
  if (!type || !title || !spaceId) return res.status(400).json({ error: "type, title, and spaceId are required" });

  const { knowledgeSpaces } = await import("../db/schema");
  const [space] = await db
    .select({ departmentId: knowledgeSpaces.departmentId })
    .from(knowledgeSpaces)
    .where(eq(knowledgeSpaces.id, spaceId))
    .limit(1);

  const [obj] = await db
    .insert(knowledgeObjects)
    .values({
      type,
      title,
      description: description || null,
      tags: tags || [],
      departmentId: space?.departmentId ?? req.user!.departmentId!,
      spaceId,
      visibility: visibility || "space",
      ownerId: req.user!.id,
      sourceTable: sourceTable || "",
      sourceId: sourceId || crypto.randomUUID(),
      reviewerId: null,
    })
    .returning();

  return res.status(201).json({ object: obj });
});

// PUT /api/knowledge/:id
// - If published: create a NEW draft version (version+1), keep published intact
// - If draft/pending_review: update in place
router.put("/knowledge/:id", requireAuth, async (req: AuthRequest, res) => {
  const { title, description, tags, visibility } = req.body;

  const [existing] = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, req.params.id as string))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });

  if (existing.status === "published") {
    // Create new draft version
    const [draft] = await db
      .insert(knowledgeObjects)
      .values({
        type: existing.type,
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        tags: tags ?? existing.tags,
        departmentId: existing.departmentId,
        spaceId: existing.spaceId,
        status: "draft",
        visibility: visibility ?? existing.visibility,
        ownerId: req.user!.id,
        sourceTable: existing.sourceTable,
        sourceId: existing.sourceId,
        version: existing.version + 1,
        reviewerId: null,
      })
      .returning();

    return res.json({ object: draft, isNewDraft: true });
  }

  // Draft or pending_review — update in place
  const [updated] = await db
    .update(knowledgeObjects)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
      ...(visibility !== undefined && { visibility }),
      updatedAt: new Date(),
    })
    .where(eq(knowledgeObjects.id, req.params.id as string))
    .returning();

  return res.json({ object: updated });
});

// DELETE /api/knowledge/:id (soft → archived)
router.delete("/knowledge/:id", requireAuth, async (req, res) => {
  await db
    .update(knowledgeObjects)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(knowledgeObjects.id, req.params.id as string));
  return res.json({ ok: true });
});

export default router;
