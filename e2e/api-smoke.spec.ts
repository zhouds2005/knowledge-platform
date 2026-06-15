/**
 * API 冒烟测试 —— 批量覆盖所有 GET 端点，确保每个路由都能正常返回。
 *
 * 用途：改完后端代码后跑一次，几秒内发现路由 404 / 认证拦截 / 返回空数据等问题。
 * 运行：npx playwright test e2e/api-smoke.spec.ts
 *
 * 覆盖策略：
 *   - 每个 GET 端点：断言 200 + 返回结构正确
 *   - 带参数的端点：用已知 ID 拼接路径
 *   - POST / PUT / DELETE 暂未包含（需要 mock 或种子数据，可在下阶段补充）
 */

import { test, expect } from "@playwright/test";

// ---------- 复用：登录 admin，拿到 session ----------

test.describe("API 冒烟测试（Admin 身份）", () => {
  // 所有测试共用一个已登录的 request context
  test.use({
    storageState: undefined, // 每个 test 独立 request，下面手动登录
  });

  // ============================================================
  // 认证
  // ============================================================

  test("POST /api/auth/login → 200", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "admin@company.com", password: "admin123" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.role).toBe("admin");
  });

  // ============================================================
  // 用户
  // ============================================================

  test("GET /api/users/list → 200 + 非空", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/users/list");
    expect(res.status()).toBe(200);
    const { users } = await res.json();
    expect(users.length).toBeGreaterThan(0);
  });

  test("GET /api/users → 200（admin only）", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/users");
    expect(res.status()).toBe(200);
    const { users } = await res.json();
    expect(users.length).toBeGreaterThan(0);
  });

  // ============================================================
  // 部门
  // ============================================================

  test("GET /api/departments → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/departments");
    expect(res.status()).toBe(200);
  });

  // ============================================================
  // 空间
  // ============================================================

  test("GET /api/spaces → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/spaces");
    expect(res.status()).toBe(200);
  });

  // ============================================================
  // 知识
  // ============================================================

  test("GET /api/knowledge/search → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/knowledge/search?limit=5");
    expect(res.status()).toBe(200);
    const { objects } = await res.json();
    expect(Array.isArray(objects)).toBe(true);
  });

  // ============================================================
  // 收藏
  // ============================================================

  test("GET /api/favorites → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/favorites");
    expect(res.status()).toBe(200);
  });

  // ============================================================
  // 历史
  // ============================================================

  test("GET /api/history → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/history");
    expect(res.status()).toBe(200);
  });

  // ============================================================
  // 通知
  // ============================================================

  test("GET /api/notifications → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/notifications");
    expect(res.status()).toBe(200);
  });

  // ============================================================
  // 审核队列
  // ============================================================

  test("GET /api/review/queue → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/review/queue");
    expect(res.status()).toBe(200);
  });

  // ============================================================
  // 当前用户
  // ============================================================

  test("GET /api/auth/me → 200", async ({ request }) => {
    await login(request);
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBe(200);
    const { user } = await res.json();
    expect(user.email).toBe("admin@company.com");
  });
});

// ---------- 辅助函数 ----------

async function login(request: any) {
  await request.post("/api/auth/login", {
    data: { email: "admin@company.com", password: "admin123" },
  });
}
