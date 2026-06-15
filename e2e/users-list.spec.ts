/**
 * 测试目标：确保用户列表 API 正常工作，权限编辑器的下拉框不会为空。
 *
 * 场景来源：手工发现——数据库有用户，但后端没重启导致路由 404，
 *          前端下拉框为空，无法添加权限。
 *
 * 运行方式：
 *   npx playwright test e2e/users-list.spec.ts
 */

import { test, expect } from "@playwright/test";

// ============================================================
// 第一层：API 测试（最快，不需要浏览器）
// ============================================================

test("API 层：/api/users/list 返回用户列表", async ({ request }) => {
  // 先用 admin 账号登录，拿到 session cookie
  const loginRes = await request.post("/api/auth/login", {
    data: { email: "admin@company.com", password: "admin123" },
  });
  expect(loginRes.status()).toBe(200);

  // 用同一个 request context（自动带 cookie）请求用户列表
  const usersRes = await request.get("/api/users/list");
  expect(usersRes.status()).toBe(200);

  const body = await usersRes.json();
  expect(body.users).toBeDefined();
  expect(body.users.length).toBeGreaterThan(0);

  // 确认返回字段齐全
  const firstUser = body.users[0];
  expect(firstUser).toHaveProperty("id");
  expect(firstUser).toHaveProperty("name");
  expect(firstUser).toHaveProperty("email");
});

// ============================================================
// 第二层：E2E 测试（模拟手工操作）
// ============================================================

test("E2E 层：权限编辑器下拉框有用户可选", async ({ page, request }) => {
  // 1. 打开登录页
  await page.goto("/login");

  // 2. 填邮箱和密码
  await page.getByPlaceholder("admin@company.com").fill("admin@company.com");
  await page.getByPlaceholder("••••••").fill("admin123");

  // 3. 点击登录
  await page.getByRole("button", { name: "登录" }).click();

  // 4. 等页面跳到首页
  await page.waitForURL((url) => !url.pathname.includes("/login"));

  // 5. 通过 API 拿一个知识条目的 ID
  //    注意：request 和 page 各自独立，需要单独登录
  await request.post("/api/auth/login", {
    data: { email: "admin@company.com", password: "admin123" },
  });
  const searchRes = await request.get("/api/knowledge/search?limit=1");
  expect(searchRes.status()).toBe(200);
  const { objects } = await searchRes.json();
  expect(objects.length).toBeGreaterThan(0);
  const targetId = objects[0].id;

  // 6. 直接进知识详情页
  await page.goto(`/knowledge/${targetId}`);

  // 7. 点"权限"按钮打开权限编辑器
  await page.getByRole("button", { name: "权限" }).click();

  // 8. 核心断言：选择用户的 <select> 里有真实选项（不仅仅 "选择用户…" 占位）
  //    注意：<option> 在收起状态下 playbook 判定为 hidden，用 count 断言即可
  const userSelect = page.locator("select").first();
  await expect(userSelect).toBeVisible();
  const optionCount = await userSelect.locator(
    'option[value]:not([value=""])'
  ).count();
  expect(optionCount).toBeGreaterThan(0);
});
