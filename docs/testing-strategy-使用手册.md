# testing-strategy 技能 — 使用手册

## 一句话概括

拿到一个功能需求或代码改动之后，用这个技能自动判断该写哪些测试，直接给出可运行的测试代码。

## 怎么触发

在 Codex 里说下面任意一句话就行（中英文都可以）：

- "这个新接口怎么测"
- "帮我分析这个功能的测试方案"
- "补一下这个页面的测试"
- "改了路由，加个测试"
- "用 testing-strategy 分析测试覆盖"

触发后它会自动：识别改动类型 → 判断测试层级 → 输出模板代码。

## 三层测试体系（大白话版）

| 层 | 一句话 | 测什么 | 用什么工具 | 多快 |
|---|--------|--------|-----------|------|
| 单元测试 | 函数对不对 | 输入 A → 输出 B，有没有 bug | vitest | 毫秒 |
| API 测试 | 接口通不通 | 调一下，看返回是不是 200 | Playwright request | 毫秒 |
| E2E 测试 | 页面能不能用 | 模拟人点来点去，流程顺不顺 | Playwright browser | 秒级 |

**不是每个功能三层都要写。** 一个纯展示页只测 E2E 冒烟，一个内部工具函数只测单元。

## 五种典型场景

### 场景 1：新增了一个后端路由

```
你：我加了一个 GET /api/knowledge/stats 接口，怎么测

skill 输出：
  → 判断：API 测试
  → 生成代码：
    test("GET /api/knowledge/stats → 200", async ({ request }) => {
      await loginAsAdmin(request);
      const res = await request.get("/api/knowledge/stats");
      expect(res.status()).toBe(200);
      expect((await res.json()).stats).toBeDefined();
    });
  → 运行：npx playwright test e2e/api-knowledge.spec.ts
```

### 场景 2：改了权限判断逻辑

```
你：我改了 canEdit 函数，加了 owner 判断，帮我加测试

skill 输出：
  → 判断：单元测试
  → 生成代码：
    describe("canEdit", () => {
      it("admin 能编辑", () => {
        expect(canEdit({ role: "admin" }, { ownerId: "X" })).toBe(true);
      });
      it("owner 能编辑自己的", () => {
        expect(canEdit({ role: "editor", id: "A" }, { ownerId: "A" })).toBe(true);
      });
      it("非 owner 不能编辑别人的", () => {
        expect(canEdit({ role: "editor", id: "A" }, { ownerId: "B" })).toBe(false);
      });
    });
  → 运行：npx vitest run
```

### 场景 3：做了一个新页面

```
你：我做了一个通知中心页面 /notifications，怎么测

skill 输出：
  → 判断：E2E 冒烟测试（页面不白屏）
  → 生成代码：
    test("通知中心页面可加载", async ({ page }) => {
      await login(page);
      await page.goto("/notifications");
      await expect(page.getByRole("heading", { name: "通知中心" })).toBeVisible();
    });
  → 运行：npx playwright test e2e/notifications.spec.ts
```

### 场景 4：改了认证中间件

```
你：我把 requireAuth 中间件改了，现在未登录应该返回 401，帮我补测试

skill 输出：
  → 判断：API 测试（权限边界）
  → 生成代码：
    test("未登录访问受保护接口 → 401", async ({ request }) => {
      const res = await request.get("/api/knowledge/search");
      expect(res.status()).toBe(401);
    });
    test("登录后访问 → 200", async ({ request }) => {
      await loginAsAdmin(request);
      const res = await request.get("/api/knowledge/search?limit=1");
      expect(res.status()).toBe(200);
    });
```

### 场景 5：改完一堆东西后的全面检查

```
你：我改了路由、加了字段、还改了权限，帮我过一遍测试覆盖

skill 输出：
  → 分析改动清单
  → 逐项判断：
    - 新路由 /api/xxx → API 测试
    - 权限函数改动 → 单元测试
    - 页面加了权限按钮 → E2E 测试
  → 输出三个文件的测试代码
  → 给出批量运行命令
```

## 和 superpowers 系列配合

日常工作流的完整链路：

```
1. 接到需求
   │
   ├─ 需要先想清楚？ → brainstorming skill
   │
2. 知道要做什么了
   │
   ├─ 需要写计划？ → writing-plans skill
   │
3. 开始写代码前
   │
   ├─ 不知道测什么？ → testing-strategy skill（就是这个）
   │   输出：该写哪些测试 + 模板代码
   │
4. 写测试和代码
   │
   ├─ 先写测试再写代码？ → TDD skill
   │
5. 写完了
   │
   ├─ 跑测试确认 → 验证 skill
   ├─ 让别人过一遍 → 代码评审 skill
   │
6. 提交 / 合并
```

## 项目中的测试文件结构

```
knowledge-platform/
├── server/
│   ├── __tests__/           ← 单元测试 + 后端集成测试（vitest）
│   │   ├── permissions.test.ts
│   │   ├── password.test.ts
│   │   └── integration/
│   │       ├── favorites.test.ts
│   │       └── review-flow.test.ts
│   └── lib/
│       └── permissions.ts   ← 函数旁边也能放测试（xxx.test.ts）
│
├── e2e/                     ← API 测试 + E2E 测试（Playwright）
│   ├── helpers.ts           ← 公共登录函数，所有测试复用
│   ├── api-smoke.spec.ts    ← API 冒烟：所有 GET 端点一遍跑完
│   ├── login.spec.ts        ← E2E：登录流程
│   ├── knowledge.spec.ts    ← E2E：知识对象 CRUD
│   ├── permissions.spec.ts  ← E2E：授权/撤销
│   └── ...
│
├── vitest.config.ts         ← vitest 配置（指向 server/__tests__）
└── playwright.config.ts     ← Playwright 配置（baseURL + 浏览器）
```

## 日常命令

```bash
# 单元测试（后端逻辑）
npx vitest run

# API 测试（接口冒烟）
npx playwright test e2e/api-smoke.spec.ts

# E2E 测试（浏览器流程）
npx playwright test

# 全部测试
npx vitest run && npx playwright test
```

## 注意事项

1. **两层 request 要各自登录** — Playwright 的 `request` 和 `page` 是独立 cookie 上下文，用 `request` 调 API 前要单独 `request.post("/api/auth/login", ...)`
2. **测试账号统一管理** — 所有测试用同一套种子账号，别在测试里创建一次性用户
3. **带副作用的测试记得清理** — POST 创建了数据，在测试最后 `DELETE` 掉
4. **`<option>` 在收起状态下可能判定为 hidden** — 检查下拉选项用 `count()` 别用 `toBeVisible()`
5. **改完后端路由后记得重启服务器再跑测试** — `tsx server/index.ts` 不带 `--watch`，不会热重载
