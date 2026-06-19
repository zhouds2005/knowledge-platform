# 部门文件共享平台

基于 React + Express + PostgreSQL 的统一知识对象管理系统，整合文档管理、Wiki 协同、Nextcloud 网盘。

## 技术栈

- 前端: React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui
- 后端: Express 5 + Drizzle ORM + PostgreSQL
- 认证: Session Cookie

## 快速开始

### 1. 环境准备

```bash
# 启动 PostgreSQL（或使用 Docker）
docker compose up -d

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env
# 编辑 .env 修改 DATABASE_URL、SESSION_SECRET 等
```

### 2. 数据库初始化

```bash
# 推送 schema 到数据库
npm run db:push

# 可选：执行全文搜索 migration
psql $DATABASE_URL -f server/db/migrations/0001_add_search_vector.sql

# 可选：填充种子数据
npm run db:seed
```

### 3. 开发模式

```bash
npm run dev        # 启动前端 Vite dev server + API 代理
npm run server     # 单独启动 API server
```

### 4. 生产部署

```bash
# 构建前端 + 后端
npm run build:all

# 启动生产服务
NODE_ENV=production npm start
```

前端静态文件输出到 `dist/public/`，后端打包为 `dist/index.js`。
生产环境需配置反向代理（nginx）将 `/api/*` 转发到后端端口，其余请求 serve 静态文件。

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接 | — |
| `SESSION_SECRET` | Session 签名密钥 | — |
| `NEXTCLOUD_URL` | Nextcloud 实例地址 | — |
| `NEXTCLOUD_USER` | Nextcloud 管理员 | — |
| `NEXTCLOUD_PASS` | Nextcloud 密码 | — |
| `PORT` | API 服务端口 | 3002 |

## 项目结构

```
knowledge-platform/
├── server/           # Express API
│   ├── db/           # Drizzle schema + migrations + seed
│   ├── lib/          # 业务逻辑（权限、搜索、通知等）
│   ├── middleware/    # 认证 + RBAC 中间件
│   └── routers/      # API 路由
├── src/              # React 前端
│   ├── components/   # 通用组件
│   ├── pages/        # 页面组件
│   ├── hooks/        # 自定义 hooks
│   └── providers/    # React Context（认证）
└── docs/             # 设计文档
```
