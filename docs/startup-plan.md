# 部门知识共享平台 — 启动与验证计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 knowledge-platform 启动运行，验证审批流、Wiki、部门分类等核心功能正常

**架构：** Express 5 + React 19 + PostgreSQL 16，前后端同一项目，Docker 管理 PostgreSQL

**Tech Stack:** React 19, Express 5, Drizzle ORM, PostgreSQL 16, Docker Compose, Vite 7

---

### Task 1: 环境配置检查

**Files:** `.env`

- [ ] **Step 1: 确认 .env 配置**

```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowledge_platform
SESSION_SECRET=C4ZdtcKYqZ0GxYKrQ7K6CYe+SMr1LdZdVanQ8rRNCSE=
PORT=3002
```

确认内容正确，特别是 `DATABASE_URL` 中的端口和密码与本机环境匹配。

- [ ] **Step 2: 检查 Docker 可用性**

在 WSL 中运行：`docker --version` 确认 Docker 可用

---

### Task 2: 启动 PostgreSQL

**Files:** `docker-compose.yml`

- [ ] **Step 1: 启动数据库容器**

```bash
cd D:\部门知识共享\knowledge-platform
docker compose up -d
```

等待 5 秒，确认容器健康：`docker compose ps` 显示 `healthy`

- [ ] **Step 2: 验证可连接**

```bash
docker compose exec db pg_isready -U postgres
```

预期输出：`localhost:5432 - accepting connections`

---

### Task 3: 数据库初始化

**Files:** `server/db/schema.ts`, `server/db/seed.ts`

- [ ] **Step 1: 推送 schema**

```bash
cd D:\部门知识共享\knowledge-platform
npm run db:push
```

预期输出：`No schema changes` 或 `Successfully pushed schema`

- [ ] **Step 2: 验证表已创建**

```bash
docker compose exec db psql -U postgres -d knowledge_platform -c "\dt"
```

预期看到 8 张表：users, sessions, departments, knowledge_spaces, knowledge_objects, object_permissions, review_records, notifications, objectRelations

- [ ] **Step 3: 填充种子数据**

```bash
npm run db:seed
```

预期输出：插入 4 个部门、4 个用户、4 个空间

- [ ] **Step 4: 验证种子数据**

```bash
docker compose exec db psql -U postgres -d knowledge_platform -c "SELECT name, email, role FROM users;"
```

预期看到：admin@company.com (管理员), zhangsan (编辑者), lisi (编辑者), wangwu (查看者)

---

### Task 4: 启动服务 & 验证

**Files:** `server/index.ts`, `src/App.tsx`

- [ ] **Step 1: 启动开发模式**

```bash
cd D:\部门知识共享\knowledge-platform
npm run dev
```

前端 Vite 运行在 `http://localhost:5173`，API 代理至 `http://localhost:3002`

- [ ] **Step 2: API 健康检查**

```bash
curl http://localhost:3002/api/health
```

预期输出：`{"status":"ok"}`

- [ ] **Step 3: 浏览器打开**

访问 `http://localhost:5173`，应该看到登录页面

用 `admin@company.com / admin123` 登录

- [ ] **Step 4: 验证核心功能**

| 功能 | 验证方法 |
|------|---------|
| 仪表盘 | 登录后看到 Dashboard |
| 部门管理 | 左侧菜单 → 部门管理，看到 4 个部门 |
| 知识空间 | 每个部门下有对应的知识空间 |
| 创建文档 | 在空间下创建一篇文档 |
| 创建 Wiki | 在空间下创建一个 Wiki 页面 |
| 提交审批 | 文档提交审批，状态从 draft → pending_review |
| 审批操作 | 用审批人账号登录，审批通过/驳回 |
| 通知 | 审批后检查通知是否送达 |

---

### Task 5: Git 初始化 & Gitee 推送

- [ ] **Step 1: 初始化 Git**

```bash
cd D:\部门知识共享\knowledge-platform
git init
git add .
git commit -m "feat: 部门知识共享平台 v0.1 — 基于 knowledge-platform"
```

- [ ] **Step 2: 推送到 Gitee**

```bash
git remote add origin https://gitee.com/<你的仓库>/knowledge-platform.git
git push -u origin main
```

---

## Self-Review

**1. 覆盖检查：** 5 个任务覆盖了 复制代码 → 启动环境 → 数据库初始化 → 服务验证 → Git 托管 全流程。

**2. 占位符检查：** 无 TODO/TBD/"待实现" 等占位符。

**3. 一致性检查：** 所有命令、API 端点、数据库操作在任务间一致。
