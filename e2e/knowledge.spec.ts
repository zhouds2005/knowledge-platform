import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Document Create", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should show create form", async ({ page }) => {
    await page.goto("/documents/new");
    await expect(page.locator("h1:has-text('创建文档')")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("select")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("should create a document and redirect to detail", async ({ page }) => {
    await page.goto("/documents/new");

    await page.fill("input[required]", "E2E 测试文档");
    await page.fill("textarea", "这是 Playwright 自动创建的测试文档内容。");
    await page.fill("input[placeholder='合同, 2025, 技术']", "e2e, 测试");

    // Select first space from dropdown
    await page.locator("select").selectOption({ index: 1 });

    await page.locator("button[type=submit]").click();

    // Should redirect to knowledge detail page (URL contains /knowledge/)
    await expect(page).toHaveURL(/\/knowledge\//, { timeout: 10000 });
    await expect(page.locator("h1:has-text('E2E 测试文档')")).toBeVisible({ timeout: 5000 });
  });
});
