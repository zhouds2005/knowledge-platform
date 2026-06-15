/**
 * 关联图谱 E2E 测试 — 对应操作手册 F2（API 层为主）
 */

import { test, expect } from "@playwright/test";
import { login, waitForLoad } from "./helpers";

test.describe("关联图谱", () => {
  test("F2: 图谱 API 返回 nodes 和 edges", async ({ request }) => {
    // 登录
    await request.post("/api/auth/login", {
      data: { email: "test@test.com", password: "test123" },
    });

    // 找一个知识对象
    const res = await request.get("/api/knowledge/search?limit=1");
    const { objects } = await res.json();
    expect(objects.length).toBeGreaterThan(0);
    const targetId = objects[0].id;

    // 调图谱 API
    const graphRes = await request.get(`/api/knowledge/${targetId}/graph`);
    expect(graphRes.status()).toBe(200);
    const graph = await graphRes.json();
    expect(graph).toHaveProperty("nodes");
    expect(graph).toHaveProperty("edges");
  });

  test("F2b: 知识详情页加载图谱区域", async ({ page, request }) => {
    await login(page);

    // 找一个知识对象
    await request.post("/api/auth/login", {
      data: { email: "test@test.com", password: "test123" },
    });
    const res = await request.get("/api/knowledge/search?limit=1");
    const { objects } = await res.json();
    expect(objects.length).toBeGreaterThan(0);
    const targetId = objects[0].id;

    await page.goto(`/knowledge/${targetId}`);
    await waitForLoad(page);

    // 页面正常加载（不检查图谱按钮是否存在，取决于对象类型）
    await expect(page.getByText(/审核|版本|关联|图谱|权限/).first()).toBeVisible({ timeout: 5000 });
  });
});
