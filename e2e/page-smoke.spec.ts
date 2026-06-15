/**
 * 页面冒烟测试 — 覆盖尚未有 E2E 测试的页面
 * 每个页面只断言：不白屏 + 有标题
 */

import { test, expect } from "@playwright/test";
import { login, TEST_USER, waitForLoad } from "./helpers";

test.describe("页面冒烟", () => {
  test("创建文档页 /documents/new 可加载", async ({ page }) => {
    await login(page);
    await page.goto("/documents/new");
    await waitForLoad(page);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
  });

  test("创建 Wiki 页 /wiki/new 可加载", async ({ page }) => {
    await login(page);
    await page.goto("/wiki/new");
    await waitForLoad(page);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
  });

  test("审核队列 /review 可加载", async ({ page }) => {
    await login(page);
    await page.goto("/review");
    await waitForLoad(page);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
  });

  test("空间视图 /space/:spaceId 可加载", async ({ page, request }) => {
    await login(page);
    await request.post("/api/auth/login", { data: TEST_USER });
    const res = await request.get("/api/spaces");
    const { spaces } = await res.json();
    if (spaces.length > 0) {
      await page.goto(`/space/${spaces[0].id}`);
      await waitForLoad(page);
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("文档详情 /documents/:id 可加载", async ({ page, request }) => {
    await login(page);
    await request.post("/api/auth/login", { data: TEST_USER });
    const res = await request.get("/api/knowledge/search?type=document&limit=1");
    const { objects } = await res.json();
    if (objects.length > 0) {
      await page.goto(`/documents/${objects[0].id}`);
      await waitForLoad(page);
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("Wiki 详情 /wiki/:id 可加载", async ({ page, request }) => {
    await login(page);
    await request.post("/api/auth/login", { data: TEST_USER });
    const res = await request.get("/api/knowledge/search?type=wiki&limit=1");
    const { objects } = await res.json();
    if (objects.length > 0) {
      await page.goto(`/wiki/${objects[0].id}`);
      await waitForLoad(page);
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("Wiki 编辑器 /knowledge/:id/edit 可加载", async ({ page, request }) => {
    await login(page);
    await request.post("/api/auth/login", { data: TEST_USER });
    const res = await request.get("/api/knowledge/search?type=wiki&limit=1");
    const { objects } = await res.json();
    if (objects.length > 0) {
      await page.goto(`/knowledge/${objects[0].id}/edit`);
      await waitForLoad(page);
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
