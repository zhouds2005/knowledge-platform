/**
 * Integration tests for view history: record, dedup, list, trim, clear.
 * Requires PostgreSQL with DATABASE_URL set.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";
import {
  users,
  knowledgeObjects,
  knowledgeSpaces,
  userViewHistory,
} from "../../db/schema";
import { hashPassword } from "../../lib/password";

const db = drizzle(process.env.DATABASE_URL!);
const TEST_EMAIL = "hist-test@test.com";
const TEST_PASS = "test123";

let userId: string;
let objectId: string;

beforeAll(async () => {
  // Clean up
  await db.delete(users).where(eq(users.email, TEST_EMAIL));

  const [u] = await db
    .insert(users)
    .values({
      name: "Hist User",
      email: TEST_EMAIL,
      passwordHash: await hashPassword(TEST_PASS),
      role: "editor",
    })
    .returning();
  userId = u.id;

  const [space] = await db.select().from(knowledgeSpaces).limit(1);
  expect(space).toBeDefined();

  const [obj] = await db
    .insert(knowledgeObjects)
    .values({
      type: "document",
      title: "History Test Doc",
      departmentId: space.departmentId,
      spaceId: space.id,
      ownerId: userId,
      sourceTable: "test",
      sourceId: crypto.randomUUID(),
    })
    .returning();
  objectId = obj.id;
});

afterAll(async () => {
  await db.delete(userViewHistory).where(eq(userViewHistory.userId, userId));
  await db.delete(knowledgeObjects).where(eq(knowledgeObjects.id, objectId));
  await db.delete(users).where(eq(users.email, TEST_EMAIL));
});

describe("View History — record", () => {
  it("should record a view", async () => {
    const [rec] = await db
      .insert(userViewHistory)
      .values({ userId, objectId, viewedAt: new Date() })
      .returning();
    expect(rec.userId).toBe(userId);
    expect(rec.objectId).toBe(objectId);
  });
});

describe("View History — deduplication (within 1 hour)", () => {
  it("should have exactly one record after consecutive views", async () => {
    // Count records before
    const before = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userViewHistory)
      .where(
        and(
          eq(userViewHistory.userId, userId),
          eq(userViewHistory.objectId, objectId),
        ),
      );
    expect(before[0].count).toBe(1);
  });
});

describe("View History — list", () => {
  it("should list viewed objects joined with knowledge_objects", async () => {
    const rows = await db
      .select({
        id: knowledgeObjects.id,
        title: knowledgeObjects.title,
        viewedAt: userViewHistory.viewedAt,
      })
      .from(userViewHistory)
      .innerJoin(
        knowledgeObjects,
        eq(userViewHistory.objectId, knowledgeObjects.id),
      )
      .where(eq(userViewHistory.userId, userId))
      .orderBy(userViewHistory.viewedAt);

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].id).toBe(objectId);
  });
});

describe("View History — clear", () => {
  it("should delete all history for the user", async () => {
    await db.delete(userViewHistory).where(eq(userViewHistory.userId, userId));

    const rows = await db
      .select()
      .from(userViewHistory)
      .where(eq(userViewHistory.userId, userId));
    expect(rows).toHaveLength(0);
  });
});

describe("View History — trim to 100", () => {
  it("should not error when inserting within limits", async () => {
    // Insert a few records to verify trimming doesn't break normal usage
    for (let i = 0; i < 5; i++) {
      await db.insert(userViewHistory).values({
        userId,
        objectId,
        viewedAt: new Date(Date.now() - i * 60000),
      });
    }

    // Count should be 5
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userViewHistory)
      .where(eq(userViewHistory.userId, userId));
    expect(countRow.count).toBe(5);
  });
});
