/**
 * 管理功能 E2E 测试 — 对应操作手册 H1-H6
 */

import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@company.com", password: "admin123" };

async function loginAsAdmin(page: any) {
  await page.goto("/login");
  await page.fill("input[type=email]", ADMIN.email);
  await page.fill("input[type=password]", ADMIN.password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 8000 });
}

test.describe("管理后台", () => {
  test("H1: 用户列表有数据", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/users");
    // 页面标题
    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible({ timeout: 5000 });
    // 能看到 admin 邮箱
    await expect(page.getByText("admin@company.com")).toBeVisible({ timeout: 5000 });
  });

  test("H2: 添加用户按钮存在", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/users");
    // 「添加用户」按钮
    await expect(page.getByRole("button", { name: "添加用户" })).toBeVisible({ timeout: 5000 });
  });

  test("H5: 部门管理页面可加载", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/departments");
    await expect(page.getByRole("heading", { name: /部门.*空间管理/ })).toBeVisible({ timeout: 5000 });
  });

  test("H6: 空间管理页面可加载", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/spaces");
    await expect(page.getByRole("heading", { name: "空间管理" })).toBeVisible({ timeout: 5000 });
  });
});
