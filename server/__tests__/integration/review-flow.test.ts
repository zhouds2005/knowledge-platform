/**
 * Integration tests for knowledge object lifecycle: create → submit → approve → reject → resubmit.
 * Requires PostgreSQL with DATABASE_URL set and seed data.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users, knowledgeObjects, knowledgeSpaces } from "../../db/schema";
import { hashPassword } from "../../lib/password";
import { submitForReview, approveReview, rejectReview } from "../../lib/review";

const db = drizzle(process.env.DATABASE_URL!);
const TEST_EMAIL = "integration-test@test.com";
const TEST_PASS = "test123";

let testUserId: string;

describe("Knowledge Object Lifecycle", () => {
  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    const [user] = await db.insert(users).values({
      name: "Test User", email: TEST_EMAIL, passwordHash: await hashPassword(TEST_PASS), role: "editor",
    }).returning();
    testUserId = user.id;
  });

  it("should go from draft → published via review", async () => {
    const [space] = await db.select().from(knowledgeSpaces).limit(1);
    expect(space).toBeDefined();

    const sourceId = crypto.randomUUID();
    const [obj] = await db.insert(knowledgeObjects).values({
      type: "document", title: "Publish Test", departmentId: space.departmentId,
      spaceId: space.id, ownerId: testUserId, sourceTable: "test", sourceId,
    }).returning();

    expect(obj.status).toBe("draft");

    const { object } = await submitForReview(obj.id);
    expect(object.status).toBe("pending_review");

    const published = await approveReview(object.id, testUserId);
    expect(published.status).toBe("published");
  });

  it("should reject and allow resubmit", async () => {
    const [space] = await db.select().from(knowledgeSpaces).limit(1);
    const sourceId = crypto.randomUUID();
    const [obj] = await db.insert(knowledgeObjects).values({
      type: "wiki", title: "Reject Test", departmentId: space.departmentId,
      spaceId: space.id, ownerId: testUserId, sourceTable: "test", sourceId,
    }).returning();

    await submitForReview(obj.id);
    const rejected = await rejectReview(obj.id, testUserId, "needs work");
    expect(rejected.status).toBe("draft");

    const { object } = await submitForReview(obj.id);
    expect(object.status).toBe("pending_review");
  });
});
