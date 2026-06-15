/**
 * 通知中心 E2E 测试 — 对应操作手册 G1-G4
 */

import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("通知中心", () => {
  test("G: 通知页面可加载", async ({ page }) => {
    await login(page);
    await page.goto("/notifications");

    // 页面标题
    await expect(page.getByRole("heading", { name: "通知中心" }).first()).toBeVisible({ timeout: 5000 });
  });

  test("G API: 通知列表接口返回 200", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: "test@test.com", password: "test123" },
    });

    const res = await request.get("/api/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("notifications");
    expect(Array.isArray(body.notifications)).toBe(true);
  });
});
