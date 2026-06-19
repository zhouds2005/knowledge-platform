import type { Response, NextFunction } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";

import { knowledgeObjects, objectPermissions, spaceMembers } from "../db/schema";
import { canRead, canEdit, canReview } from "../lib/permissions";
import type { AuthRequest } from "./auth";

const db = drizzle(process.env.DATABASE_URL!);

export function requireRead(req: AuthRequest, res: Response, next: NextFunction) {
  loadAndCheck(req, res, next, "read");
}

export function requireEdit(req: AuthRequest, res: Response, next: NextFunction) {
  loadAndCheck(req, res, next, "edit");
}

export function requireReview(req: AuthRequest, res: Response, next: NextFunction) {
  loadAndCheck(req, res, next, "review");
}

async function loadAndCheck(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  action: "read" | "edit" | "review",
) {
  const objectId = req.params.id;
  if (!objectId) return res.status(400).json({ error: "Missing object id" });

  const [obj] = await db
    .select()
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, objectId as string))
    .limit(1);

  if (!obj) return res.status(404).json({ error: "Not found" });

  const grants = await db
    .select()
    .from(objectPermissions)
    .where(eq(objectPermissions.objectId, objectId as string));

  const extraGrants = grants.map((g) => ({
    granteeType: g.granteeType,
    granteeId: g.granteeId,
    permission: g.permission,
  }));

  const objInfo = {
    id: obj.id,
    visibility: obj.visibility,
    ownerId: obj.ownerId,
    departmentId: obj.departmentId,
    status: obj.status,
  };

  let allowed = false;
  // 空间管理员自动有读写权
  if (req.user && (action === "read" || action === "edit")) {
    const [isAdmin] = await db.select().from(spaceMembers)
      .where(and(eq(spaceMembers.userId, req.user.id), eq(spaceMembers.spaceId, obj.spaceId), eq(spaceMembers.role, "admin")))
      .limit(1);
    if (isAdmin) { allowed = true; }
  }

  if (action === "read") allowed = canRead(req.user, objInfo, extraGrants);
  else if (action === "edit") allowed = canEdit(req.user, objInfo, extraGrants);
  else if (action === "review") allowed = canReview(req.user, objInfo, extraGrants);

  if (!allowed) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  next();
}
