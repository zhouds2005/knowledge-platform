/**
 * Review state machine edge cases — 审核状态机的边界条件
 * 补充 review-flow.test.ts 没覆盖的错误路径
 */

import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users, knowledgeSpaces, knowledgeObjects } from "../../db/schema";
import { submitForReview, approveReview, rejectReview } from "../../lib/review";

const db = drizzle(process.env.DATABASE_URL!);

let adminId: string;
let editorId: string;

describe("Review State Machine — Edge Cases", () => {
  beforeAll(async () => {
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "admin@company.com"))
      .limit(1);
    adminId = admin.id;

    const [editor] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "zhangsan@company.com"))
      .limit(1);
    editorId = editor.id;
  });

  // ---- submitForReview 边界 ----

  it("已发布的不能再次提交", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "published"))
      .limit(1);
    if (!obj) return;

    await expect(submitForReview(obj.id)).rejects.toThrow("Cannot submit");
  });

  it("审核中的不能重复提交", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "pending_review"))
      .limit(1);
    if (!obj) return;

    await expect(submitForReview(obj.id)).rejects.toThrow("Cannot submit");
  });

  // ---- approveReview 边界 ----

  it("不能通过草稿状态的审核", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "draft"))
      .limit(1);
    if (!obj) return;

    await expect(approveReview(obj.id, editorId)).rejects.toThrow("Cannot approve");
  });

  it("非审核人不能通过（非 admin）", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id, reviewerId: knowledgeObjects.reviewerId })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "pending_review"))
      .limit(1);
    if (!obj || !obj.reviewerId) return;
    if (obj.reviewerId === editorId) return;

    await expect(approveReview(obj.id, editorId)).rejects.toThrow("Not authorized");
  });

  it("admin 可以绕过审核人限制通过", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "pending_review"))
      .limit(1);
    if (!obj) return;

    const result = await approveReview(obj.id, adminId, true);
    expect(result.status).toBe("published");

    // 恢复
    await db
      .update(knowledgeObjects)
      .set({ status: "pending_review" })
      .where(eq(knowledgeObjects.id, obj.id));
  });

  // ---- rejectReview 边界 ----

  it("不能驳回草稿状态", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "draft"))
      .limit(1);
    if (!obj) return;

    await expect(rejectReview(obj.id, editorId)).rejects.toThrow("Cannot reject");
  });

  it("驳回后状态回到 draft", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id, reviewerId: knowledgeObjects.reviewerId })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "pending_review"))
      .limit(1);
    if (!obj || !obj.reviewerId) return;

    const result = await rejectReview(obj.id, obj.reviewerId, "需要修改");
    expect(result.status).toBe("draft");

    // 恢复
    await db
      .update(knowledgeObjects)
      .set({ status: "pending_review" })
      .where(eq(knowledgeObjects.id, obj.id));
  });

  it("非审核人不能驳回（非 admin）", async () => {
    const [obj] = await db
      .select({ id: knowledgeObjects.id, reviewerId: knowledgeObjects.reviewerId })
      .from(knowledgeObjects)
      .where(eq(knowledgeObjects.status, "pending_review"))
      .limit(1);
    if (!obj || !obj.reviewerId) return;
    if (obj.reviewerId === editorId) return;

    await expect(rejectReview(obj.id, editorId)).rejects.toThrow("Not authorized");
  });
});
