# Ubuntu 24.04 部署指南

## 前置条件

- Ubuntu 24.04 服务器，已装 Docker
- Node.js 22（未装则第 3 步自动装）
- 本机到服务器的网络可达（内网 IP 或主机名）

## 第一步：上传并解压

```bash
# 把 knowledge-platform-deploy.zip 传到服务器
scp knowledge-platform-deploy.zip user@服务器IP:/opt/

# SSH 登进去
ssh user@服务器IP
cd /opt
unzip knowledge-platform-deploy.zip -d knowledge-platform
cd knowledge-platform
```

## 第二步：安装依赖

```bash
# Node.js 22（如果还没装）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# 项目依赖
npm install

# pm2 进程守护
npm install -g pm2

# Playwright 浏览器（E2E 测试用）
npx playwright install chromium --with-deps
```

## 第三步：配置环境变量

```bash
cp .env.example .env
nano .env
```

改一行：`SESSION_SECRET` 改成随机字符串，其他保持默认。

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowledge_platform
SESSION_SECRET=改这里为随机字符串
NEXTCLOUD_URL=https://nextcloud.example.com
NEXTCLOUD_USER=admin
NEXTCLOUD_PASS=password
```

## 第四步：初始化数据库

```bash
# 启动 PostgreSQL
docker compose up -d db

# 建表
npx drizzle-kit push

# 灌种子数据（用户、部门、空间）
npx tsx server/db/seed.ts
```

## 第五步：部署

```bash
bash scripts/deploy.sh
```

看到"部署完成"就是成功了。

## 第六步：验证

```bash
# 检查进程
pm2 status
# knowledge-api 和 knowledge-web 都应该是 online

# 检查后端
curl http://localhost:3002/api/health
# 应该返回 {"status":"ok","service":"knowledge-platform"}

# 浏览器打开
# http://服务器IP:5173
# 用 test@test.com / test123 登录
```

## 第七步：开机自启

```bash
pm2 startup
pm2 save
```

## 后续更新部署

代码改了之后，重新执行：

```bash
cd /opt/knowledge-platform
# 把新代码传进来（覆盖文件）
bash scripts/deploy.sh
```

## 出问题

```bash
bash scripts/rollback.sh   # 回滚到上一版本
bash scripts/backup.sh     # 手动备份数据库
pm2 logs                   # 看实时日志
pm2 logs --lines 50        # 看最近 50 行
```

## 定时备份

```bash
crontab -e
# 加一行，每天凌晨 2 点备份：
0 2 * * * cd /opt/knowledge-platform && bash scripts/backup.sh
```
