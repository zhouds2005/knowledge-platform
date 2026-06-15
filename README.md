# 部门文件共享平台

基于 React + Express + PostgreSQL 的部门级文件共享与知识管理平台，集成 Nextcloud 网盘。

## 功能模块

- **文档管理** — 创建、浏览、搜索知识文档
- **Wiki 协同** — 多人协作编辑 Wiki 页面，支持版本历史
- **Nextcloud 网盘** — 部门文件夹自动创建、文件上传/浏览/下载
- **文档级 RBAC** — 四角色（admin / editor / reviewer / viewer），对象级权限控制
- **空间审核流** — 提交 → 审核 → 发布 → 归档，完整的生命周期管理
- **知识门户** — 首页仪表盘，统一搜索，最近更新聚合
- **知识图谱** — 对象关联关系可视化

## 技术栈

- **前端**：React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query
- **后端**：Express + TypeScript + Drizzle ORM
- **数据库**：PostgreSQL（`knowledge_platform`）
- **网盘**：Nextcloud WebDAV API

## 快速开始

### 1. 环境配置

```bash
cp .env.example .env
# 编辑 .env 填写数据库连接、Nextcloud 凭据
```

### 2. 初始化数据库

```bash
npx drizzle-kit push
npx tsx server/db/seed.ts
```

### 3. 启动开发服务器

```bash
# 后端（端口 3002）
npx tsx server/index.ts

# 前端（端口 5173，代理到 3002）
npx vite
```

## 项目结构

```
knowledge-platform/
├── server/
│   ├── index.ts              # Express 入口
│   ├── db/schema.ts           # Drizzle 数据库模型
│   ├── middleware/
│   │   ├── auth.ts            # 认证中间件
│   │   └── rbac.ts            # 权限判定中间件
│   ├── routers/
│   │   ├── auth.ts            # 登录/注册
│   │   ├── users.ts           # 用户管理
│   │   ├── departments.ts     # 部门 CRUD + Nextcloud 文件夹
│   │   ├── spaces.ts          # 知识空间管理
│   │   ├── knowledge.ts       # 知识对象 CRUD + 搜索
│   │   ├── review.ts          # 审核提交/通过/驳回
│   │   ├── permissions.ts     # 对象权限
│   │   ├── nextcloud.ts       # 网盘代理
│   │   ├── graph.ts           # 关联图谱
│   │   └── notifications.ts   # 通知
│   └── lib/
│       ├── password.ts        # 密码哈希
│       ├── permissions.ts     # RBAC 判定函数
│       ├── review.ts          # 审核状态机
│       ├── search.ts          # 全文搜索
│       ├── notify.ts          # 通知生成
│       └── nextcloud.ts       # Nextcloud WebDAV 客户端
├── src/
│   ├── pages/                 # 页面组件
│   ├── components/            # 可复用组件
│   ├── hooks/                 # 自定义 hooks
│   └── providers/             # Context providers
└── docs/                      # 设计文档
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `SESSION_SECRET` | Session 加密密钥 |
| `NEXTCLOUD_URL` | Nextcloud 实例 URL |
| `NEXTCLOUD_USER` | Nextcloud 用户名 |
| `NEXTCLOUD_PASS` | Nextcloud 密码 |
