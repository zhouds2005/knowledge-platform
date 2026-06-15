import { test as base, expect } from "@playwright/test";

/** Reusable test helpers — import these in any spec file. */

export const TEST_USER = { email: "test@test.com", password: "test123" };

/** Log in and wait for dashboard redirect. */
export async function login(page: Parameters<Parameters<typeof base>[2]>[0]["page"]) {
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_USER.email);
  await page.fill("input[type=password]", TEST_USER.password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 8000 });
}

/** Navigate via sidebar link by label text. */
export async function navTo(page: ReturnType<typeof base["info"]> extends never ? never : any, label: string) {
  await page.locator(`nav a:has-text("${label}")`).click();
}

/** Wait for loading spinners to disappear. */
export async function waitForLoad(page: any) {
  await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
}

export { expect };
