import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("should show login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("should login and see dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "test@test.com");
    await page.fill("input[type=password]", "test123");
    await page.click("button[type=submit]");

    await expect(page).toHaveURL("/", { timeout: 8000 });
    await expect(page.locator("text=测试用户")).toBeVisible();
  });
});
