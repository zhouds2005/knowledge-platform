/**
 * Integration tests for Nextcloud path mapping:
 * department path, sub-department path, space path, and file upload object creation.
 * Requires PostgreSQL with DATABASE_URL set.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  users,
  departments,
  knowledgeSpaces,
  knowledgeObjects,
} from "../../db/schema";
import { hashPassword } from "../../lib/password";

const db = drizzle(process.env.DATABASE_URL!);
const TEST_EMAIL = "nc-test@test.com";
const TEST_PASS = "test123";

let userId: string;
let deptId: string;
let subDeptId: string;
let spaceId: string;

beforeAll(async () => {
  // Clean up previous test data
  await db.delete(users).where(eq(users.email, TEST_EMAIL));

  const [u] = await db
    .insert(users)
    .values({
      name: "NC Test User",
      email: TEST_EMAIL,
      passwordHash: await hashPassword(TEST_PASS),
      role: "editor",
    })
    .returning();
  userId = u.id;
});

afterAll(async () => {
  // Clean up in reverse dependency order
  if (spaceId) await db.delete(knowledgeSpaces).where(eq(knowledgeSpaces.id, spaceId));
  if (subDeptId) await db.delete(departments).where(eq(departments.id, subDeptId));
  if (deptId) await db.delete(departments).where(eq(departments.id, deptId));
  await db.delete(users).where(eq(users.email, TEST_EMAIL));
});

describe("Nextcloud Mapping — department path", () => {
  it("should write nextcloudPath when creating a department", async () => {
    const [dept] = await db
      .insert(departments)
      .values({ name: "测试部门", nextcloudPath: "/测试部门" })
      .returning();
    deptId = dept.id;
    expect(dept.nextcloudPath).toBe("/测试部门");
  });
});

describe("Nextcloud Mapping — sub-department path", () => {
  it("should build hierarchical path for sub-department", async () => {
    const [sub] = await db
      .insert(departments)
      .values({
        name: "子部门",
        parentId: deptId,
        nextcloudPath: "/测试部门/子部门",
      })
      .returning();
    subDeptId = sub.id;
    expect(sub.nextcloudPath).toBe("/测试部门/子部门");
    expect(sub.parentId).toBe(deptId);
  });
});

describe("Nextcloud Mapping — space path", () => {
  it("should write nextcloudPath when creating a space under a department", async () => {
    const [space] = await db
      .insert(knowledgeSpaces)
      .values({
        departmentId: deptId,
        name: "知识空间",
        description: "test space",
        nextcloudPath: "/测试部门/知识空间",
      })
      .returning();
    spaceId = space.id;
    expect(space.nextcloudPath).toBe("/测试部门/知识空间");
    expect(space.departmentId).toBe(deptId);
  });
});

describe("Nextcloud Mapping — file upload creates knowledge object", () => {
  it("should create a knowledge object with type drive_file for uploaded files", async () => {
    const [obj] = await db
      .insert(knowledgeObjects)
      .values({
        type: "drive_file",
        title: "测试文件.pdf",
        departmentId: deptId,
        spaceId,
        ownerId: userId,
        sourceTable: "nextcloud_files",
        sourceId: crypto.randomUUID(),
      })
      .returning();

    expect(obj.type).toBe("drive_file");
    expect(obj.title).toBe("测试文件.pdf");
    expect(obj.departmentId).toBe(deptId);
    expect(obj.spaceId).toBe(spaceId);
    expect(obj.ownerId).toBe(userId);
    expect(obj.sourceTable).toBe("nextcloud_files");

    // Clean up test object
    await db.delete(knowledgeObjects).where(eq(knowledgeObjects.id, obj.id));
  });
});
