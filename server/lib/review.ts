import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { knowledgeObjects, knowledgeSpaces, reviewRecords, users } from "../db/schema";

const db = drizzle(process.env.DATABASE_URL!);

/** 检查用户是否有权限审核（管理员或指定审核人） */
async function checkReviewAuth(objectId: string, userId: string): Promise<void> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role === "admin") return;

  const [obj] = await db.select({ reviewerId: knowledgeObjects.reviewerId }).from(knowledgeObjects).where(eq(knowledgeObjects.id, objectId)).limit(1);
  if (!obj || obj.reviewerId !== userId) {
    throw new Error("Not authorized to review this object");
  }
}

export async function submitForReview(objectId: string) {
  const [obj] = await db.select().from(knowledgeObjects).where(eq(knowledgeObjects.id, objectId)).limit(1);
  if (!obj) throw new Error("Object not found");
  if (obj.status !== "draft") throw new Error(`Cannot submit object in "${obj.status}" status`);

  const reviewerId = obj.reviewerId || await getSpaceReviewer(obj.spaceId);
  const [updated] = await db
    .update(knowledgeObjects)
    .set({ status: "pending_review", reviewerId, updatedAt: new Date() })
    .where(eq(knowledgeObjects.id, objectId))
    .returning();

  return { object: updated, reviewerId };
}

async function getSpaceReviewer(spaceId: string): Promise<string | null> {
  const [space] = await db
    .select({ reviewerId: knowledgeSpaces.defaultReviewerId })
    .from(knowledgeSpaces)
    .where(eq(knowledgeSpaces.id, spaceId))
    .limit(1);
  return space?.reviewerId ?? null;
}

export async function approveReview(objectId: string, reviewerUserId: string) {
  const [obj] = await db.select().from(knowledgeObjects).where(eq(knowledgeObjects.id, objectId)).limit(1);
  if (!obj) throw new Error("Object not found");
  if (obj.status !== "pending_review") throw new Error(`Cannot approve object in "${obj.status}" status`);

  // 权限检查
  await checkReviewAuth(objectId, reviewerUserId);

  // Archive any existing published version with the same source
  await db
    .update(knowledgeObjects)
    .set({ status: "archived", updatedAt: new Date() })
    .where(
      and(
        eq(knowledgeObjects.sourceTable, obj.sourceTable),
        eq(knowledgeObjects.sourceId, obj.sourceId),
        eq(knowledgeObjects.status, "published"),
      ),
    );

  await db.insert(reviewRecords).values({ objectId, reviewerId: reviewerUserId, action: "approved" });

  const [updated] = await db
    .update(knowledgeObjects)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(knowledgeObjects.id, objectId))
    .returning();

  return updated;
}

export async function rejectReview(objectId: string, reviewerUserId: string, comment?: string) {
  const [obj] = await db.select().from(knowledgeObjects).where(eq(knowledgeObjects.id, objectId)).limit(1);
  if (!obj) throw new Error("Object not found");
  if (obj.status !== "pending_review") throw new Error(`Cannot reject object in "${obj.status}" status`);

  // 权限检查
  await checkReviewAuth(objectId, reviewerUserId);

  await db.insert(reviewRecords).values({ objectId, reviewerId: reviewerUserId, action: "rejected", comment: comment || null });

  const [updated] = await db
    .update(knowledgeObjects)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(knowledgeObjects.id, objectId))
    .returning();

  return updated;
}
