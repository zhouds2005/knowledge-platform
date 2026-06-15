import { test, expect } from "@playwright/test";

test.describe("Favorite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "test@test.com");
    await page.fill("input[type=password]", "test123");
    await page.click("button[type=submit]");
    await expect(page).toHaveURL("/", { timeout: 8000 });
  });

  test("should toggle favorite on knowledge detail", async ({ page }) => {
    await page.goto("/knowledge/88dcb05d-afb2-441a-8392-d2b4f1586c0b");
    // Page loads with knowledge title as main h1
    await expect(page.locator("h1.text-2xl")).toBeVisible({ timeout: 5000 });

    // Click favorite
    const favBtn = page.locator("button:has-text('收藏')").first();
    await expect(favBtn).toBeVisible();
    await favBtn.click();
    await expect(page.locator("text=已收藏")).toBeVisible({ timeout: 5000 });

    // Click unfavorite
    await page.locator("button:has-text('已收藏')").first().click();
    await expect(page.locator("button:has-text('收藏')").first()).toBeVisible({ timeout: 5000 });
  });
});
