import { test, expect } from "@playwright/test";
import { login, TEST_USER } from "./helpers";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const links = [
    { label: "首页", url: "/" },
    { label: "文档", url: "/documents/new" },
    { label: "Wiki", url: "/wiki/new" },
    { label: "网盘", url: "/drive" },
    { label: "审核", url: "/review" },
  ];

  for (const { label, url } of links) {
    test(`should navigate to ${label}`, async ({ page }) => {
      await page.locator(`nav a:has-text("${label}")`).click();
      await expect(page).toHaveURL(url, { timeout: 5000 });
    });
  }
});
