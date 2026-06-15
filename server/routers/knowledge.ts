import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { knowledgeObjects, userFavorites } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireEdit } from "../middleware/rbac";
import { searchQuery } from "../lib/search";
import { validate, createKnowledgeSchema, updateKnowledgeSchema } from "../lib/validate";
import { recordView } from "./history";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/knowledge/search
router.get("/knowledge/search", requireAuth, async (req: AuthRequest, res) => {
  const { q, type, space_id, department_id, status, owner_id, reviewer_id } = req.query;
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const conditions: SQL[] = [];

  if (q && typeof q === "string" && q.length > 0) conditions.push(searchQuery(q));
  if (type && typeof type === "string") conditions.push(eq(knowledgeObjects.type, type as any));
  if (space_id && typeof space_id === "string") conditions.push(eq(knowledgeObjects.spaceId, space_id));
  if (department_id && typeof department_id === "string") conditions.push(eq(knowledgeObjects.departmentId, department_id));
  if (status && typeof status === "string") conditions.push(eq(knowledgeObjects.status, status as any));
  if (owner_id && typeof owner_id === "string") conditions.push(eq(knowledgeObjects.ownerId, owner_id));
  if (reviewer_id && typeof reviewer_id === "string") conditions.push(eq(knowledgeObjects.reviewerId, reviewer_id));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(knowledgeObjects)
    .where(where)
    .orderBy(desc(knowledgeObjects.updatedAt))
    .limit(limit)
    .offset(offset);

  // Count total matching rows for pagination
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeObjects)
    .where(where);
  const total = countRow?.count ?? rows.length;

  return res.json({ objects: rows, total, offset, limit });
});

// GET /api/knowledge/space/:spaceId
router.get("/knowledge/space/:spaceId", requireAuth, async (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const rows = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.spaceId, req.params.spaceId as string))
    .orderBy(desc(knowledgeObjects.updatedAt))
    .limit(limit)
    .offset(offset);
  return res.json({ objects: rows, offset, limit });
});

// GET /api/knowledge/:id — with version history
router.get("/knowledge/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const [obj] = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, id))
    .limit(1);

  if (!obj) return res.status(404).json({ error: "Not found" });

  // Increment view count
  db.update(knowledgeObjects)
    .set({ viewCount: sql`${knowledgeObjects.viewCount} + 1` })
    .where(eq(knowledgeObjects.id, id))
    .execute()
    .catch((e) => console.error("View count update failed:", e));

  // Record view history (non-blocking)
  if (req.user) {
    recordView(req.user.id, id).catch(() => {});
  }

  // Fetch version history: all objects with same source_table + source_id
  const versions = await db
    .select({ id: knowledgeObjects.id, version: knowledgeObjects.version, status: knowledgeObjects.status, updatedAt: knowledgeObjects.updatedAt })
    .from(knowledgeObjects)
    .where(and(eq(knowledgeObjects.sourceTable, obj.sourceTable), eq(knowledgeObjects.sourceId, obj.sourceId)))
    .orderBy(desc(knowledgeObjects.version));

  // Check if current user has favorited this object
  let isFavorited = false;
  if (req.user) {
    const [fav] = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, req.user.id), eq(userFavorites.objectId, id)))
      .limit(1);
    isFavorited = !!fav;
  }

  return res.json({ object: obj, versions, isFavorited });
});

// POST /api/knowledge
router.post("/knowledge", requireAuth, validate(createKnowledgeSchema), async (req: AuthRequest, res) => {
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

// PUT /api/knowledge/:id — requires edit permission
// - If published: create a NEW draft version (version+1), keep published intact
// - If draft/pending_review: update in place
router.put("/knowledge/:id", requireAuth, requireEdit, validate(updateKnowledgeSchema), async (req: AuthRequest, res) => {
  const { title, description, tags, visibility } = req.body;
  const id = req.params.id as string;

  const [existing] = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, id))
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
    .where(eq(knowledgeObjects.id, id))
    .returning();

  return res.json({ object: updated });
});

// DELETE /api/knowledge/:id (soft → archived) — requires edit permission
router.delete("/knowledge/:id", requireAuth, requireEdit, async (req, res) => {
  const id = req.params.id as string;
  await db
    .update(knowledgeObjects)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(knowledgeObjects.id, id));
  return res.json({ ok: true });
});

export default router;
