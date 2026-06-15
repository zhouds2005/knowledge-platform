import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should search and show results", async ({ page }) => {
    // Search for 'jpg' which matches existing drive_file objects
    const searchInput = page.locator("input[placeholder]").first();
    await searchInput.fill("jpg");
    await searchInput.press("Enter");

    // Should show results header
    await expect(page.locator("text=搜索结果")).toBeVisible({ timeout: 5000 });
    // Should have at least one result card
    await expect(page.locator("text=网盘").first()).toBeVisible();
  });

  test("should show empty for nonsense query", async ({ page }) => {
    const searchInput = page.locator("input[placeholder]").first();
    await searchInput.fill("xyznonexistent12345");
    await searchInput.press("Enter");

    await expect(page.locator("text=没有找到相关内容")).toBeVisible({ timeout: 5000 });
  });
});
