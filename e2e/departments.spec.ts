/**
 * 组织架构 E2E 测试 — 对应操作手册 C1-C3
 * 测试：部门/空间创建时的路径逻辑
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

test.describe("组织架构创建", () => {
  test("C1: 创建部门后 nextcloudPath 自动生成", async ({ request }) => {
    await request.post("/api/auth/login", { data: ADMIN });

    // 创建测试部门
    const testName = `测试部门_${Date.now()}`;
    const createRes = await request.post("/api/departments", {
      data: { name: testName },
    });
    expect(createRes.status()).toBe(200);
    const { department } = await createRes.json();
    expect(department).toHaveProperty("nextcloudPath");

    // 清理
    await request.delete(`/api/departments/${department.id}`);
  });

  test("C3: 创建空间后 nextcloudPath 包含部门路径", async ({ request }) => {
    await request.post("/api/auth/login", { data: ADMIN });

    // 先创建部门
    const deptRes = await request.post("/api/departments", {
      data: { name: `路径测试部门_${Date.now()}` },
    });
    const { department } = await deptRes.json();

    // 再创建空间
    const spaceRes = await request.post("/api/spaces", {
      data: {
        name: "路径测试空间",
        departmentId: department.id,
      },
    });
    expect(spaceRes.status()).toBe(200);
    const { space } = await spaceRes.json();
    expect(space).toHaveProperty("nextcloudPath");
    // 路径应包含部门名
    expect(space.nextcloudPath).toContain(department.name);

    // 清理
    await request.delete(`/api/spaces/${space.id}`);
    await request.delete(`/api/departments/${department.id}`);
  });
});
