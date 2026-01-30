# 部署资料包说明

本文档说明部署资料包的内容和使用方法。

---

## 资料包内容

### 1. 核心文档

| 文件名 | 说明 |
|--------|------|
| **DEPLOYMENT.md** | 完整的部署文档，包含详细的部署步骤、配置说明和故障排除 |
| **QUICK_START.md** | 快速部署指南，10 分钟快速上手 |
| **ENV_CONFIG.md** | 环境变量配置说明 |
| **README.md** | 项目说明文档 |
| **DEPLOYMENT_PACKAGE.md** | 本文档，部署资料包说明 |

### 2. 部署配置文件

| 文件名 | 说明 |
|--------|------|
| **Dockerfile** | Docker 镜像构建文件 |
| **docker-compose.yml** | Docker Compose 编排文件，包含应用、MySQL、MinIO 服务 |
| **nginx.conf** | Nginx 反向代理配置文件 |

### 3. 数据库相关

| 文件/目录 | 说明 |
|-----------|------|
| **init-database.sql** | 数据库初始化 SQL 脚本 |
| **drizzle/** | 数据库 Schema 和迁移文件 |
| **drizzle/schema.ts** | 数据库表结构定义 |
| **drizzle.config.ts** | Drizzle ORM 配置 |

### 4. 应用代码

| 目录 | 说明 |
|------|------|
| **client/** | 前端代码（React + TypeScript + Tailwind CSS） |
| **server/** | 后端代码（Node.js + Express + tRPC） |
| **shared/** | 前后端共享代码 |

### 5. 配置文件

| 文件名 | 说明 |
|--------|------|
| **package.json** | 项目依赖和脚本配置 |
| **pnpm-lock.yaml** | 依赖锁定文件 |
| **vite.config.ts** | Vite 构建配置 |
| **tsconfig.json** | TypeScript 配置 |
| **tailwind.config.js** | Tailwind CSS 配置 |

---

## 使用方法

### 方案一：Docker 部署（推荐）

**适用场景：** 生产环境、快速部署

**步骤：**

1. 解压资料包到服务器
   ```bash
   tar -xzf annual-lottery-deployment.tar.gz
   cd annual-lottery
   ```

2. 配置环境变量
   ```bash
   # 参考 ENV_CONFIG.md 创建 .env 文件
   nano .env
   ```

3. 启动服务
   ```bash
   docker-compose up -d
   ```

4. 初始化数据库
   ```bash
   docker-compose exec app pnpm db:push
   ```

5. 访问应用：`http://服务器IP:3000`

**详细步骤请参考：** [QUICK_START.md](./QUICK_START.md)

### 方案二：传统部署

**适用场景：** 已有 Node.js 环境、需要深度定制

**步骤：**

1. 解压资料包
   ```bash
   tar -xzf annual-lottery-deployment.tar.gz
   cd annual-lottery
   ```

2. 安装依赖
   ```bash
   pnpm install
   ```

3. 配置环境变量
   ```bash
   nano .env
   ```

4. 初始化数据库
   ```bash
   # 先手动创建数据库
   mysql -u root -p < init-database.sql
   
   # 运行迁移
   pnpm db:push
   ```

5. 构建应用
   ```bash
   pnpm build
   ```

6. 启动应用
   ```bash
   # 使用 PM2
   pm2 start dist/index.js --name annual-lottery
   
   # 或直接运行
   NODE_ENV=production node dist/index.js
   ```

**详细步骤请参考：** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 系统要求

### 硬件要求

**最低配置：**
- CPU: 2 核
- 内存: 4GB RAM
- 硬盘: 20GB

**推荐配置：**
- CPU: 4 核或以上
- 内存: 8GB RAM 或以上
- 硬盘: 50GB SSD

### 软件要求

**Docker 部署：**
- Docker 24.x 或以上
- Docker Compose 2.x 或以上

**传统部署：**
- Node.js 22.x 或以上
- pnpm 9.x 或以上
- MySQL 8.0 或 PostgreSQL 14 以上

### 端口要求

以下端口需要未被占用：

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | 应用服务 | 主应用端口 |
| 3306 | MySQL | 数据库端口（Docker 部署） |
| 9000 | MinIO | 对象存储端口（Docker 部署） |
| 9001 | MinIO Console | MinIO 管理控制台（Docker 部署） |
| 80 | Nginx | HTTP 端口（可选） |
| 443 | Nginx | HTTPS 端口（可选） |

---

## 部署前检查清单

在开始部署前，请确认以下事项：

- [ ] 服务器满足系统要求
- [ ] 已安装 Docker 和 Docker Compose（Docker 部署）
- [ ] 已安装 Node.js 和 pnpm（传统部署）
- [ ] 所需端口未被占用
- [ ] 已准备数据库（传统部署）
- [ ] 已准备 S3 存储或 MinIO
- [ ] 已生成 JWT_SECRET
- [ ] 已阅读部署文档

---

## 快速参考

### 常用命令

**Docker 部署：**
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 备份数据库
docker-compose exec mysql mysqldump -u lottery_user -p annual_lottery > backup.sql
```

**传统部署：**
```bash
# 启动应用
pm2 start dist/index.js --name annual-lottery

# 停止应用
pm2 stop annual-lottery

# 查看日志
pm2 logs annual-lottery

# 重启应用
pm2 restart annual-lottery

# 备份数据库
mysqldump -u lottery_user -p annual_lottery > backup.sql
```

### 环境变量模板

```bash
# 必需配置
DATABASE_URL=mysql://lottery_user:password@localhost:3306/annual_lottery
JWT_SECRET=your-random-secret-key-min-32-chars
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=annual-lottery

# 可选配置
NODE_ENV=production
PORT=3000
OWNER_OPEN_ID=admin
OWNER_NAME=管理员
```

### 故障排除快速指南

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | 修改 docker-compose.yml 中的端口映射 |
| 数据库连接失败 | 检查 DATABASE_URL 配置和数据库服务状态 |
| 图片上传失败 | 检查 S3/MinIO 配置和服务状态 |
| 应用启动失败 | 查看日志 `docker-compose logs app` |
| 构建失败 | 清理缓存 `rm -rf node_modules dist && pnpm install` |

---

## 技术支持

### 文档资源

- **完整部署文档：** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **快速部署指南：** [QUICK_START.md](./QUICK_START.md)
- **环境变量配置：** [ENV_CONFIG.md](./ENV_CONFIG.md)
- **项目说明：** [README.md](./README.md)

### 获取帮助

如遇到问题，请按以下顺序排查：

1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的"常见问题"章节
2. 查看应用日志 `docker-compose logs -f app`
3. 检查环境变量配置是否正确
4. 检查数据库和 S3 服务是否正常
5. 联系技术支持团队

---

## 资料包版本信息

| 项目 | 信息 |
|------|------|
| **项目名称** | 年会抽奖系统 |
| **版本号** | v1.0.0 |
| **打包时间** | 2026-01-30 |
| **资料包大小** | 约 28MB |
| **适用环境** | Linux / macOS / Windows Server |
| **Node.js 版本** | 22.x |
| **数据库** | MySQL 8.0+ / PostgreSQL 14+ |

---

## 更新日志

### v1.0.0 (2026-01-30)

**核心功能：**
- ✅ 奖品管理（CRUD、批量导入、图片上传）
- ✅ 参与者管理（CRUD、批量导入、CSV 导入）
- ✅ 抽奖逻辑（10 秒倒计时、动画效果）
- ✅ 中奖记录（持久化存储、获奖名单公示）
- ✅ 数据持久化（云端数据库、跨设备访问）

**部署支持：**
- ✅ Docker 一键部署
- ✅ 传统部署支持
- ✅ 完整部署文档
- ✅ 数据库初始化脚本
- ✅ Nginx 反向代理配置

**技术栈：**
- 前端：React 19 + TypeScript + Tailwind CSS 4
- 后端：Node.js 22 + Express 4 + tRPC 11
- 数据库：MySQL 8.0 / PostgreSQL 14+
- 存储：AWS S3 / MinIO

---

**祝您部署顺利！如有问题，请参考相关文档或联系技术支持。**
