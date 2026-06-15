/**
 * 测试：首页草稿 → 文档详情 → 提交审核 → 状态变为"审核中"
 *
 * 流程：
 *   1. 登录 test@test.com
 *   2. 创建一篇新文档（在"市场销售知识库"——这个空间有默认审核人）
 *   3. 页面自动跳转到详情页，状态显示"草稿"
 *   4. 点击「提交审核」按钮
 *   5. 状态变为「审核中」，出现「撤回」按钮
 */
import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("首页草稿提交审核", async ({ page }) => {
  // ── 1. 登录 ──
  await login(page);

  // ── 2. 打开文档创建页 ──
  await page.goto("/documents/new");
  await expect(page.locator("h1:has-text('创建文档')")).toBeVisible();

  // ── 3. 填写文档信息 ──
  // 标题（第一个 required input）
  await page.fill("input[required]", "审核流程测试文档");
  // 内容
  await page.fill("textarea", "这篇文档用来验证提交审核的流程是否正常。");

  // 选择"市场销售知识库"（这个空间有默认审核人，submitForReview 不会报错）
  await page.locator("select").selectOption({ label: "市场销售知识库" });

  // ── 4. 点击「创建文档」 ──
  await page.locator("button[type=submit]").click();

  // ── 5. 等待跳转到详情页 ──
  await expect(page).toHaveURL(/\/knowledge\//, { timeout: 10000 });
  await expect(page.locator("h1:has-text('审核流程测试文档')")).toBeVisible();

  // 状态标签应该显示"草稿"
  await expect(page.locator("text=草稿")).toBeVisible();

  // ── 6. 点击「提交审核」 ──
  await page.locator("button:has-text('提交审核')").click();

  // ── 7. 验证：状态变成"审核中"，出现"撤回"按钮 ──
  // 状态标签变成"审核中"
  await expect(page.locator("text=审核中")).toBeVisible({ timeout: 5000 });
  // 因为是文档所有者，可以看到"撤回"按钮
  await expect(page.locator("button:has-text('撤回')")).toBeVisible();

  // ── 8. 清理：撤回审核，恢复草稿状态 ──
  await page.locator("button:has-text('撤回')").click();
  await expect(page.locator("text=草稿")).toBeVisible({ timeout: 5000 });
});
