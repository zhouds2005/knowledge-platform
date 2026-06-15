import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { notifications, knowledgeObjects } from "../db/schema";

const db = drizzle(process.env.DATABASE_URL!);

type NotificationType = "review_requested" | "review_approved" | "review_rejected" | "new_version" | "mentioned";

/** Insert a notification and return it. */
async function insert(userId: string, type: NotificationType, objectId: string, message: string) {
  const [n] = await db
    .insert(notifications)
    .values({ userId, type, objectId, message })
    .returning();
  return n;
}

/** Notify the assigned reviewer that an object has been submitted for review. */
export async function notifyReviewRequested(reviewerId: string, objectId: string) {
  const [obj] = await db
    .select({ title: knowledgeObjects.title })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, objectId))
    .limit(1);
  if (!obj) return;
  return insert(reviewerId, "review_requested", objectId, `"${obj.title}" 已提交审核`);
}

/** Notify the owner that their submission was approved. */
export async function notifyReviewApproved(ownerId: string, objectId: string) {
  const [obj] = await db
    .select({ title: knowledgeObjects.title })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, objectId))
    .limit(1);
  if (!obj) return;
  return insert(ownerId, "review_approved", objectId, `"${obj.title}" 审核已通过`);
}

/** Notify the owner that their submission was rejected. */
export async function notifyReviewRejected(ownerId: string, objectId: string, comment?: string) {
  const [obj] = await db
    .select({ title: knowledgeObjects.title })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, objectId))
    .limit(1);
  if (!obj) return;
  const msg = `"${obj.title}" 审核被驳回` + (comment ? `：${comment}` : "");
  return insert(ownerId, "review_rejected", objectId, msg);
}

/** Notify all users in the same space that new content has been published. */
export async function notifySpaceNewVersion(spaceId: string, objectId: string, excludeUserId?: string) {
  const [obj] = await db
    .select({ title: knowledgeObjects.title })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.id, objectId))
    .limit(1);
  if (!obj) return;

  // Find all distinct owners who have contributed to this space
  const contributors = await db
    .selectDistinct({ userId: knowledgeObjects.ownerId })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.spaceId, spaceId));

  for (const c of contributors) {
    if (c.userId === excludeUserId) continue;
    await insert(c.userId, "new_version", objectId, `知识空间有新内容发布："${obj.title}"`);
  }
}

/** Notify a user they've been @mentioned (reserved for future use). */
export async function notifyMentioned(userId: string, objectId: string, mentionedBy: string) {
  await insert(userId, "mentioned", objectId, `${mentionedBy} 在文档中提到了你`);
}
