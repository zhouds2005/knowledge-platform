import { test, expect } from "@playwright/test";

// 网盘测试依赖 Nextcloud，CI 环境里没有，自动跳过
test.describe("Drive", () => {
  test.skip(!!process.env.CI, "CI 环境无 Nextcloud，跳过网盘 E2E");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "test@test.com");
    await page.fill("input[type=password]", "test123");
    await page.click("button[type=submit]");
    await expect(page).toHaveURL("/", { timeout: 8000 });
  });

  test("should show department tree", async ({ page }) => {
    await page.goto("/drive");
    await expect(page.locator("text=部门网盘")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=技术研发部")).toBeVisible();
  });

  test("should expand department and show spaces", async ({ page }) => {
    await page.goto("/drive");
    await page.locator("text=技术研发部").click();
    await expect(page.locator("text=技术研发知识库")).toBeVisible();
  });

  test("should select space and show file list", async ({ page }) => {
    await page.goto("/drive");
    await page.locator("text=综合管理部").click();
    await page.locator("text=综合管理知识库").click();
    await expect(page.locator("h2:has-text('综合管理知识库')")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=该空间尚未设置网盘路径")).not.toBeVisible({ timeout: 3000 });
  });
});
