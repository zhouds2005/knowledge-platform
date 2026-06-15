/**
 * 权限控制 E2E 测试 — 对应操作手册 E5-E6
 */

import { test, expect } from "@playwright/test";
import { waitForLoad } from "./helpers";

const ADMIN = { email: "admin@company.com", password: "admin123" };

async function loginAsAdmin(page: any) {
  await page.goto("/login");
  await page.fill("input[type=email]", ADMIN.email);
  await page.fill("input[type=password]", ADMIN.password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 8000 });
}

test.describe("权限：显式授权与撤销", () => {
  test("E5: 给用户添加 view 权限", async ({ page, request }) => {
    // 1. admin 登录浏览器
    await loginAsAdmin(page);

    // 2. API 登录拿到知识对象 ID
    await request.post("/api/auth/login", { data: ADMIN });
    const res = await request.get("/api/knowledge/search?limit=1");
    expect(res.status()).toBe(200);
    const { objects } = await res.json();
    expect(objects.length).toBeGreaterThan(0);
    const targetId = objects[0].id;

    // 3. 进入知识详情
    await page.goto(`/knowledge/${targetId}`);
    await waitForLoad(page);

    // 4. 打开权限编辑器
    await page.getByRole("button", { name: "权限" }).click();

    // 5. 等待用户下拉加载完成
    const userOptions = page.locator('select >> option[value]:not([value=""])');
    await expect(userOptions.first()).toBeAttached({ timeout: 5000 });
    expect(await userOptions.count()).toBeGreaterThan(0);

    // 6. 用 index=1 选第一个真实用户（index=0 是占位项），权限选 view
    const userSelect = page.locator("select").first();
    await userSelect.selectOption({ index: 1 });
    await page.locator("select").nth(1).selectOption("view");
    await page.getByRole("button", { name: "添加" }).click();

    // 7. 列表中出现了授权条目
    await expect(page.locator("ul li").first()).toBeVisible({ timeout: 3000 });

    // 8. 保存
    await page.getByRole("button", { name: "保存" }).click();
  });

  test("E6: 移除授权", async ({ page, request }) => {
    await loginAsAdmin(page);
    await request.post("/api/auth/login", { data: ADMIN });

    const res = await request.get("/api/knowledge/search?limit=1");
    const { objects } = await res.json();
    const targetId = objects[0].id;

    await page.goto(`/knowledge/${targetId}`);
    await waitForLoad(page);

    await page.getByRole("button", { name: "权限" }).click();

    const userOptions = page.locator('select >> option[value]:not([value=""])');
    await expect(userOptions.first()).toBeAttached({ timeout: 5000 });

    await page.locator("select").first().selectOption({ index: 1 });
    await page.locator("select").nth(1).selectOption("view");
    await page.getByRole("button", { name: "添加" }).click();

    // 点移除
    await page.locator("ul li button:has-text('移除')").first().click();
    await expect(page.locator("ul li")).toHaveCount(0, { timeout: 3000 });
  });
});
