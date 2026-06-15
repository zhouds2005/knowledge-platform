import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "test@test.com");
    await page.fill("input[type=password]", "test123");
    await page.click("button[type=submit]");
    await expect(page).toHaveURL("/", { timeout: 8000 });
  });

  test("should show four sections", async ({ page }) => {
    await expect(page.locator("text=我的草稿")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=待我审核")).toBeVisible();
    await expect(page.locator("text=我收藏的")).toBeVisible();
    await expect(page.locator("text=最近浏览")).toBeVisible();
  });
});
