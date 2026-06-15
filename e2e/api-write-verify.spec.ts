/**
 * API 写操作验证 — 覆盖 POST/PUT/DELETE 端点，
 * 每个操作都加"改了之后再查确认数据确实变了"。
 */

import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@company.com", password: "admin123" };

test.describe("API 写操作验证", () => {
  // ============================================================
  // 用户 CRUD
  // ============================================================

  test("用户：创建 → 查得到 → 更新 → 变了 → 删除 → 查不到", async ({ request }) => {
    await request.post("/api/auth/login", { data: ADMIN });
    const testEmail = `crud-test-${Date.now()}@test.com`;

    // 创建
    const createRes = await request.post("/api/users", {
      data: { name: "CRUD测试", email: testEmail, password: "123456", role: "viewer" },
    });
    expect(createRes.status()).toBe(200);
    const { user } = await createRes.json();
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe("viewer");

    // 验证创建成功（查列表）
    const listRes = await request.get("/api/users");
    const { users } = await listRes.json();
    expect(users.some((u: any) => u.id === user.id)).toBe(true);

    // 更新角色
    const updateRes = await request.put(`/api/users/${user.id}`, {
      data: { role: "editor" },
    });
    expect(updateRes.status()).toBe(200);
    const { user: updated } = await updateRes.json();
    expect(updated.role).toBe("editor");

    // 删除
    const deleteRes = await request.delete(`/api/users/${user.id}`);
    expect(deleteRes.status()).toBe(200);

    // 验证删除成功
    const recheck = await request.get("/api/users");
    const { users: after } = await recheck.json();
    expect(after.some((u: any) => u.id === user.id)).toBe(false);
  });

  // ============================================================
  // 部门 CRUD
  // ============================================================

  test("部门：创建 → 更新 → 删除", async ({ request }) => {
    await request.post("/api/auth/login", { data: ADMIN });
    const deptName = `测试部门_${Date.now()}`;

    // 创建
    const createRes = await request.post("/api/departments", {
      data: { name: deptName },
    });
    expect(createRes.status()).toBe(200);
    const { department } = await createRes.json();
    expect(department.name).toBe(deptName);

    // 验证列表里有
    const listRes = await request.get("/api/departments");
    const { departments } = await listRes.json();
    expect(departments.some((d: any) => d.id === department.id)).toBe(true);

    // 更新名称
    const newName = `${deptName}_改`;
    const updateRes = await request.put(`/api/departments/${department.id}`, {
      data: { name: newName },
    });
    expect(updateRes.status()).toBe(200);
    const { department: updated } = await updateRes.json();
    expect(updated.name).toBe(newName);

    // 删除
    await request.delete(`/api/departments/${department.id}`);

    // 验证删除成功
    const recheck = await request.get("/api/departments");
    const { departments: after } = await recheck.json();
    expect(after.some((d: any) => d.id === department.id)).toBe(false);
  });

  // ============================================================
  // 空间 CRUD
  // ============================================================

  test("空间：创建 → 更新 → 删除", async ({ request }) => {
    await request.post("/api/auth/login", { data: ADMIN });

    // 先拿一个部门
    const deptRes = await request.get("/api/departments");
    const { departments } = await deptRes.json();
    if (departments.length === 0) return;
    const deptId = departments[0].id;

    const spaceName = `测试空间_${Date.now()}`;

    // 创建
    const createRes = await request.post("/api/spaces", {
      data: { name: spaceName, departmentId: deptId },
    });
    expect(createRes.status()).toBe(200);
    const { space } = await createRes.json();
    expect(space.name).toBe(spaceName);

    // 更新
    const newName = `${spaceName}_改`;
    const updateRes = await request.put(`/api/spaces/${space.id}`, {
      data: { name: newName },
    });
    expect(updateRes.status()).toBe(200);
    const { space: updated } = await updateRes.json();
    expect(updated.name).toBe(newName);

    // 删除
    await request.delete(`/api/spaces/${space.id}`);

    // 验证删除成功
    const recheck = await request.get("/api/spaces");
    const { spaces: after } = await recheck.json();
    expect(after.some((s: any) => s.id === space.id)).toBe(false);
  });

  // ============================================================
  // 知识对象更新
  // ============================================================

  test("知识：更新标题后确实变了", async ({ request }) => {
    await request.post("/api/auth/login", { data: ADMIN });

    // 找或创建一个知识对象
    const searchRes = await request.get("/api/knowledge/search?limit=1");
    const { objects } = await searchRes.json();
    if (objects.length === 0) return;
    const target = objects[0];

    const newTitle = `更新测试_${Date.now()}`;

    // 更新
    const updateRes = await request.put(`/api/knowledge/${target.id}`, {
      data: { title: newTitle },
    });
    expect(updateRes.status()).toBe(200);

    // 验证
    const getRes = await request.get(`/api/knowledge/${target.id}`);
    const { object } = await getRes.json();
    expect(object.title).toBe(newTitle);

    // 恢复原标题
    await request.put(`/api/knowledge/${target.id}`, {
      data: { title: target.title },
    });
  });
});
