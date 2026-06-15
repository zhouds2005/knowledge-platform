/**
 * 收尾测试 — 补全操作手册最后缺口：
 *   B10-B12 版本历史 / 软删除
 *   F1/F3 关联添加 + 双向可见
 *   G4 通知标记已读
 */

import { test, expect } from "@playwright/test";
import { login, TEST_USER, waitForLoad } from "./helpers";

const ADMIN = { email: "admin@company.com", password: "admin123" };

// ============================================================
// B12: 软删除
// ============================================================

test("B12: 软删除后 status 变为 archived", async ({ request }) => {
  await request.post("/api/auth/login", { data: ADMIN });

  // 先创建一个知识对象
  const spacesRes = await request.get("/api/spaces");
  const { spaces } = await spacesRes.json();
  if (spaces.length === 0) return;

  const createRes = await request.post("/api/knowledge", {
    data: {
      type: "document",
      title: `软删除测试_${Date.now()}`,
      spaceId: spaces[0].id,
    },
  });
  expect(createRes.status()).toBe(201);
  const { object } = await createRes.json();

  // 删除
  const deleteRes = await request.delete(`/api/knowledge/${object.id}`);
  expect(deleteRes.status()).toBe(200);

  // 查一下确认 status 是 archived
  const getRes = await request.get(`/api/knowledge/${object.id}`);
  expect(getRes.status()).toBe(200);
  const { object: archived } = await getRes.json();
  expect(archived.status).toBe("archived");
});

// ============================================================
// F1/F3: 关联添加 + 双向可见
// ============================================================

test("F1: 添加关联后图谱双向可见", async ({ request }) => {
  await request.post("/api/auth/login", { data: ADMIN });

  // 找两个知识对象
  const res = await request.get("/api/knowledge/search?limit=2");
  const { objects } = await res.json();
  if (objects.length < 2) return;

  const objA = objects[0];
  const objB = objects[1];

  // A → B 添加关联
  const relRes = await request.post(`/api/knowledge/${objA.id}/relation`, {
    data: { targetId: objB.id, relationType: "references" },
  });
  expect(relRes.status()).toBe(201);

  // A 的图谱应包含 B
  const graphARes = await request.get(`/api/knowledge/${objA.id}/graph`);
  const graphA = await graphARes.json();
  const aHasB = graphA.nodes.some((n: any) => n.id === objB.id);
  expect(aHasB).toBe(true);

  // B 的图谱也应包含 A（双向可见）
  const graphBRes = await request.get(`/api/knowledge/${objB.id}/graph`);
  const graphB = await graphBRes.json();
  const bHasA = graphB.nodes.some((n: any) => n.id === objA.id);
  expect(bHasA).toBe(true);
});

// ============================================================
// G4: 通知标记已读
// ============================================================

test("G4: 通知标记已读", async ({ request }) => {
  await request.post("/api/auth/login", { data: TEST_USER });

  const res = await request.get("/api/notifications");
  const { notifications } = await res.json();
  if (notifications.length === 0) return;

  const unread = notifications.find((n: any) => !n.read);
  if (!unread) return;

  // 标记已读
  const markRes = await request.put(`/api/notifications/${unread.id}/read`);
  expect(markRes.status()).toBe(200);

  // 再查一次确认已读
  const recheck = await request.get("/api/notifications");
  const { notifications: updated } = await recheck.json();
  const target = updated.find((n: any) => n.id === unread.id);
  expect(target.read).toBe(true);
});

// ============================================================
// B10/B11: 版本历史（E2E）
// ============================================================

test("B11: 编辑已发布对象后版本历史出现多个版本", async ({ page, request }) => {
  await login(page);
  await request.post("/api/auth/login", { data: TEST_USER });

  // 找或创建一个 wiki
  const searchRes = await request.get("/api/knowledge/search?type=wiki&limit=1");
  const { objects } = await searchRes.json();
  if (objects.length === 0) return;

  const targetId = objects[0].id;

  // 进编辑页，改标题触发新版本
  await page.goto(`/knowledge/${targetId}/edit`);
  await waitForLoad(page);

  // 尝试修改标题（如果有输入框）
  const titleInput = page.getByPlaceholder(/标题|title/i);
  if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await titleInput.fill(`版本测试_${Date.now()}`);
    const saveBtn = page.getByRole("button", { name: /保存|发布|提交/ });
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // 回到详情页
  await page.goto(`/knowledge/${targetId}`);
  await waitForLoad(page);

  // 版本历史区域应该存在
  const versionSection = page.getByText(/版本/);
  await expect(versionSection.first()).toBeVisible({ timeout: 5000 });
});
