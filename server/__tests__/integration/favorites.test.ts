/**
 * Integration tests for favorites: add, list, dedup, remove, cross-user isolation.
 * Requires PostgreSQL with DATABASE_URL set.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc } from "drizzle-orm";
import { users, knowledgeObjects, knowledgeSpaces, userFavorites } from "../../db/schema";
import { hashPassword } from "../../lib/password";

const db = drizzle(process.env.DATABASE_URL!);
const TEST_EMAIL_A = "fav-test-a@test.com";
const TEST_EMAIL_B = "fav-test-b@test.com";
const TEST_PASS = "test123";

let userIdA: string;
let userIdB: string;
let objectId: string;

beforeAll(async () => {
  await db.delete(users).where(eq(users.email, TEST_EMAIL_A));
  await db.delete(users).where(eq(users.email, TEST_EMAIL_B));

  const [ua] = await db
    .insert(users)
    .values({
      name: "Fav User A",
      email: TEST_EMAIL_A,
      passwordHash: await hashPassword(TEST_PASS),
      role: "editor",
    })
    .returning();
  userIdA = ua.id;

  const [ub] = await db
    .insert(users)
    .values({
      name: "Fav User B",
      email: TEST_EMAIL_B,
      passwordHash: await hashPassword(TEST_PASS),
      role: "editor",
    })
    .returning();
  userIdB = ub.id;

  // Use an existing space for the test object
  const [space] = await db.select().from(knowledgeSpaces).limit(1);
  expect(space).toBeDefined();

  const [obj] = await db
    .insert(knowledgeObjects)
    .values({
      type: "document",
      title: "Favorites Test Doc",
      departmentId: space.departmentId,
      spaceId: space.id,
      ownerId: userIdA,
      sourceTable: "test",
      sourceId: crypto.randomUUID(),
    })
    .returning();
  objectId = obj.id;
});

afterAll(async () => {
  // Clean up
  await db.delete(userFavorites).where(eq(userFavorites.userId, userIdA));
  await db.delete(userFavorites).where(eq(userFavorites.userId, userIdB));
  await db.delete(knowledgeObjects).where(eq(knowledgeObjects.id, objectId));
  await db.delete(users).where(eq(users.email, TEST_EMAIL_A));
  await db.delete(users).where(eq(users.email, TEST_EMAIL_B));
});

describe("Favorites — add and dedup", () => {
  it("should insert a favorite", async () => {
    const [fav] = await db
      .insert(userFavorites)
      .values({ userId: userIdA, objectId })
      .returning();
    expect(fav.userId).toBe(userIdA);
    expect(fav.objectId).toBe(objectId);
  });

  it("should ignore duplicate favorite (onConflictDoNothing)", async () => {
    // Insert the same favorite again — should not create a second row
    await db
      .insert(userFavorites)
      .values({ userId: userIdA, objectId })
      .onConflictDoNothing();

    // Count favorites for this user+object
    const rows = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userIdA),
          eq(userFavorites.objectId, objectId),
        ),
      );
    expect(rows).toHaveLength(1);
  });
});

describe("Favorites — list", () => {
  it("should list favorited objects for user A", async () => {
    const rows = await db
      .select({
        id: knowledgeObjects.id,
        title: knowledgeObjects.title,
        favoritedAt: userFavorites.createdAt,
      })
      .from(userFavorites)
      .innerJoin(
        knowledgeObjects,
        eq(userFavorites.objectId, knowledgeObjects.id),
      )
      .where(eq(userFavorites.userId, userIdA))
      .orderBy(desc(userFavorites.createdAt));

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some((r) => r.id === objectId)).toBe(true);
  });
});

describe("Favorites — cross-user isolation", () => {
  it("should not show user A's favorites in user B's list", async () => {
    const rows = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userIdB));
    expect(rows).toHaveLength(0);
  });
});

describe("Favorites — remove", () => {
  it("should delete a favorite", async () => {
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userIdA),
          eq(userFavorites.objectId, objectId),
        ),
      );

    // Verify deletion
    const rows = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userIdA));
    expect(rows).toHaveLength(0);
  });

  it("removing a non-existent favorite should not error", async () => {
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userIdA),
          eq(userFavorites.objectId, objectId),
        ),
      );
    // If no error thrown, it passes
  });
});
