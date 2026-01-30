# 年会抽奖系统 - 私有化部署文档

本文档提供年会抽奖系统的完整私有化部署指南，包括环境要求、数据库配置、部署步骤和常见问题解决方案。

---

## 目录

1. [系统架构](#系统架构)
2. [环境要求](#环境要求)
3. [部署方案](#部署方案)
4. [配置说明](#配置说明)
5. [数据库初始化](#数据库初始化)
6. [启动和运行](#启动和运行)
7. [常见问题](#常见问题)
8. [维护和备份](#维护和备份)

---

## 系统架构

年会抽奖系统采用前后端分离架构，技术栈如下：

**前端技术栈：**
- React 19 + TypeScript
- Tailwind CSS 4（赛博朋克主题）
- Framer Motion（动画效果）
- tRPC Client（类型安全的 API 调用）
- Vite（构建工具）

**后端技术栈：**
- Node.js 22 + Express 4
- tRPC 11（类型安全的 RPC 框架）
- Drizzle ORM（数据库 ORM）
- MySQL/PostgreSQL（数据库）
- AWS S3（文件存储）

**核心功能：**
- 奖品管理（CRUD、批量导入、图片上传）
- 参与者管理（CRUD、批量导入、CSV 导入）
- 抽奖逻辑（密码学安全随机算法、10 秒倒计时、动画效果）
- 中奖记录（持久化存储、获奖名单公示）
- 数据持久化（云端数据库、跨设备访问）

---

## 环境要求

### 硬件要求

**最低配置：**
- CPU: 2 核
- 内存: 4GB RAM
- 硬盘: 20GB 可用空间
- 网络: 100Mbps

**推荐配置：**
- CPU: 4 核或以上
- 内存: 8GB RAM 或以上
- 硬盘: 50GB SSD
- 网络: 1Gbps

### 软件要求

**必需软件：**
- Node.js 22.x 或以上
- pnpm 9.x 或以上
- MySQL 8.0 或 PostgreSQL 14 以上
- Git（用于代码管理）

**可选软件：**
- Docker 24.x 和 Docker Compose 2.x（推荐使用 Docker 部署）
- Nginx（用于反向代理和 HTTPS）
- PM2（用于进程管理）

### 操作系统

支持以下操作系统：
- Ubuntu 20.04 LTS 或以上
- CentOS 7/8 或 Rocky Linux 8
- macOS 12 或以上
- Windows Server 2019 或以上（需要 WSL2）

---

## 部署方案

提供三种部署方案，根据实际情况选择：

### 方案一：Docker 部署（推荐）

**优点：**
- 环境隔离，避免依赖冲突
- 一键部署，简单快捷
- 易于迁移和扩展
- 包含数据库和应用

**适用场景：**
- 生产环境部署
- 多环境部署（开发、测试、生产）
- 快速部署和迁移

**部署步骤：** 见 [Docker 部署](#docker-部署详细步骤)

### 方案二：传统部署（手动安装）

**优点：**
- 完全控制部署过程
- 可以自定义配置
- 适合已有基础设施

**适用场景：**
- 已有 Node.js 和数据库环境
- 需要深度定制
- 学习和开发环境

**部署步骤：** 见 [传统部署](#传统部署详细步骤)

### 方案三：云服务部署

**优点：**
- 高可用性和可扩展性
- 自动备份和监控
- 无需维护基础设施

**适用场景：**
- 大型活动或高并发场景
- 需要高可用性保障
- 预算充足

**支持的云平台：**
- 阿里云（ECS + RDS + OSS）
- 腾讯云（CVM + TencentDB + COS）
- AWS（EC2 + RDS + S3）

---

## 配置说明

### 环境变量配置

系统使用环境变量进行配置，需要创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=mysql://username:password@localhost:3306/annual_lottery

# JWT 密钥（用于会话管理，请使用随机字符串）
JWT_SECRET=your-random-secret-key-here-min-32-chars

# S3 存储配置（用于图片上传）
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# 应用配置
NODE_ENV=production
PORT=3000

# OAuth 配置（可选，用于用户登录）
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_APP_ID=your-app-id
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com

# 管理员配置
OWNER_OPEN_ID=admin
OWNER_NAME=管理员
```

### 数据库连接字符串格式

**MySQL:**
```
mysql://用户名:密码@主机:端口/数据库名
# 示例
mysql://root:password123@localhost:3306/annual_lottery
```

**PostgreSQL:**
```
postgresql://用户名:密码@主机:端口/数据库名
# 示例
postgresql://postgres:password123@localhost:5432/annual_lottery
```

### S3 存储配置说明

系统使用 S3 兼容存储来保存奖品图片，支持：
- AWS S3
- 阿里云 OSS
- 腾讯云 COS
- MinIO（自建对象存储）

**如果使用 MinIO（推荐自建方案）：**
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=annual-lottery
AWS_ENDPOINT=http://localhost:9000  # MinIO 地址
```

---

## 数据库初始化

### 创建数据库

**MySQL:**
```sql
CREATE DATABASE annual_lottery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lottery_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON annual_lottery.* TO 'lottery_user'@'%';
FLUSH PRIVILEGES;
```

**PostgreSQL:**
```sql
CREATE DATABASE annual_lottery;
CREATE USER lottery_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE annual_lottery TO lottery_user;
```

### 运行数据库迁移

系统使用 Drizzle ORM 管理数据库结构，运行以下命令初始化数据库表：

```bash
# 安装依赖
pnpm install

# 生成并运行数据库迁移
pnpm db:push
```

### 数据库表结构

系统会自动创建以下表：

**1. prizes（奖品表）**
- id: 主键
- name: 奖品名称
- totalCount: 总数量
- remainingCount: 剩余数量
- imageUrl: 图片 URL
- createdAt: 创建时间

**2. participants（参与者表）**
- id: 主键
- name: 参与者姓名
- createdAt: 创建时间

**3. winners（中奖记录表）**
- id: 主键
- prizeId: 奖品 ID（外键）
- prizeName: 奖品名称
- participantId: 参与者 ID（外键）
- participantName: 参与者姓名
- createdAt: 中奖时间

**4. user（用户表）**
- id: 主键
- openId: OAuth ID
- name: 用户名
- role: 角色（admin/user）
- createdAt: 创建时间

---

## Docker 部署详细步骤

### 1. 准备 Docker 环境

```bash
# 安装 Docker（Ubuntu）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2. 准备项目文件

```bash
# 克隆或复制项目代码到服务器
cd /opt
git clone <your-repo-url> annual-lottery
cd annual-lottery

# 或者使用 scp 上传代码包
scp -r annual-lottery.tar.gz user@server:/opt/
tar -xzf annual-lottery.tar.gz
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 4. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

### 5. 初始化数据库

```bash
# 进入应用容器
docker-compose exec app sh

# 运行数据库迁移
pnpm db:push

# 退出容器
exit
```

### 6. 访问应用

打开浏览器访问：`http://服务器IP:3000`

---

## 传统部署详细步骤

### 1. 安装 Node.js 和 pnpm

```bash
# 安装 Node.js 22（使用 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# 安装 pnpm
npm install -g pnpm

# 验证安装
node --version
pnpm --version
```

### 2. 安装数据库

**MySQL:**
```bash
# Ubuntu
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

**PostgreSQL:**
```bash
# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. 部署应用

```bash
# 克隆代码
cd /opt
git clone <your-repo-url> annual-lottery
cd annual-lottery

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
nano .env

# 初始化数据库
pnpm db:push

# 构建应用
pnpm build
```

### 4. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name annual-lottery

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs annual-lottery
```

### 5. 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/annual-lottery
```

Nginx 配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/annual-lottery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 启动和运行

### 开发模式

```bash
# 启动开发服务器（支持热重载）
pnpm dev

# 访问地址
http://localhost:3000
```

### 生产模式

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
NODE_ENV=production node dist/index.js

# 或使用 PM2
pm2 start dist/index.js --name annual-lottery -i max
```

### 服务管理命令

**Docker 方式：**
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f app

# 更新代码后重新构建
docker-compose build
docker-compose up -d
```

**PM2 方式：**
```bash
# 启动
pm2 start annual-lottery

# 停止
pm2 stop annual-lottery

# 重启
pm2 restart annual-lottery

# 查看日志
pm2 logs annual-lottery

# 查看状态
pm2 status
```

---

## 常见问题

### 1. 数据库连接失败

**问题：** `Error: connect ECONNREFUSED`

**解决方案：**
- 检查数据库服务是否启动：`sudo systemctl status mysql`
- 检查 DATABASE_URL 是否正确
- 检查防火墙是否开放数据库端口
- 检查数据库用户权限

### 2. 端口被占用

**问题：** `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案：**
```bash
# 查找占用端口的进程
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>

# 或者修改 .env 中的 PORT 配置
```

### 3. 图片上传失败

**问题：** 上传奖品图片时报错

**解决方案：**
- 检查 S3 配置是否正确（ACCESS_KEY、SECRET_KEY、BUCKET）
- 检查 S3 存储桶权限设置
- 检查网络连接是否正常
- 如果使用 MinIO，确保 MinIO 服务已启动

### 4. 构建失败

**问题：** `pnpm build` 报错

**解决方案：**
```bash
# 清理缓存
rm -rf node_modules dist
pnpm store prune

# 重新安装依赖
pnpm install

# 重新构建
pnpm build
```

### 5. 数据库迁移失败

**问题：** `pnpm db:push` 报错

**解决方案：**
- 检查数据库连接是否正常
- 检查数据库用户是否有足够权限
- 查看详细错误信息并根据提示修复
- 如果是权限问题，重新授予权限：
  ```sql
  GRANT ALL PRIVILEGES ON annual_lottery.* TO 'lottery_user'@'%';
  FLUSH PRIVILEGES;
  ```

---

## 维护和备份

### 数据库备份

**MySQL 备份：**
```bash
# 备份数据库
mysqldump -u lottery_user -p annual_lottery > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u lottery_user -p annual_lottery < backup_20260130_120000.sql
```

**PostgreSQL 备份：**
```bash
# 备份数据库
pg_dump -U lottery_user annual_lottery > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
psql -U lottery_user annual_lottery < backup_20260130_120000.sql
```

### 自动备份脚本

创建备份脚本 `/opt/backup.sh`：
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u lottery_user -p'your_password' annual_lottery > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

设置定时任务：
```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点自动备份
0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1
```

### 日志管理

**查看应用日志：**
```bash
# PM2 日志
pm2 logs annual-lottery

# Docker 日志
docker-compose logs -f app

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**日志轮转配置：**
创建 `/etc/logrotate.d/annual-lottery`：
```
/var/log/annual-lottery/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 性能监控

**使用 PM2 监控：**
```bash
# 查看实时监控
pm2 monit

# 查看详细信息
pm2 show annual-lottery

# 查看资源使用
pm2 list
```

**系统资源监控：**
```bash
# 查看 CPU 和内存使用
htop

# 查看磁盘使用
df -h

# 查看网络连接
netstat -tunlp | grep 3000
```

### 更新和升级

**更新应用代码：**
```bash
# 拉取最新代码
cd /opt/annual-lottery
git pull origin main

# 安装新依赖
pnpm install

# 运行数据库迁移（如果有）
pnpm db:push

# 重新构建
pnpm build

# 重启应用
pm2 restart annual-lottery

# 或 Docker 方式
docker-compose build
docker-compose up -d
```

---

## 安全建议

1. **使用强密码**：数据库密码、JWT_SECRET 使用强随机密码
2. **启用 HTTPS**：使用 Let's Encrypt 免费 SSL 证书
3. **配置防火墙**：只开放必要端口（80、443）
4. **定期备份**：设置自动备份任务
5. **更新依赖**：定期更新 Node.js 和依赖包
6. **限制访问**：使用 IP 白名单或 VPN 限制管理后台访问
7. **监控日志**：定期检查日志文件，及时发现异常

---

## 技术支持

如有问题或需要帮助，请联系：
- 项目文档：查看项目根目录的 README.md
- 问题反馈：提交 GitHub Issue
- 技术支持：联系开发团队

---

## 附录

### A. 环境变量完整列表

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| DATABASE_URL | 是 | 数据库连接字符串 | mysql://user:pass@localhost:3306/db |
| JWT_SECRET | 是 | JWT 密钥（最少 32 字符） | random-secret-key-min-32-chars |
| AWS_ACCESS_KEY_ID | 是 | S3 访问密钥 | AKIAIOSFODNN7EXAMPLE |
| AWS_SECRET_ACCESS_KEY | 是 | S3 密钥 | wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY |
| AWS_REGION | 是 | S3 区域 | us-east-1 |
| AWS_S3_BUCKET | 是 | S3 存储桶名称 | annual-lottery |
| AWS_ENDPOINT | 否 | S3 端点（MinIO 使用） | http://localhost:9000 |
| NODE_ENV | 否 | 运行环境 | production |
| PORT | 否 | 应用端口 | 3000 |
| OAUTH_SERVER_URL | 否 | OAuth 服务器地址 | https://oauth.example.com |
| VITE_APP_ID | 否 | OAuth 应用 ID | app-id-123 |
| VITE_OAUTH_PORTAL_URL | 否 | OAuth 登录页面 | https://login.example.com |
| OWNER_OPEN_ID | 否 | 管理员 ID | admin |
| OWNER_NAME | 否 | 管理员名称 | 管理员 |

### B. 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | 应用服务 | 主应用端口 |
| 3306 | MySQL | MySQL 数据库端口 |
| 5432 | PostgreSQL | PostgreSQL 数据库端口 |
| 9000 | MinIO | MinIO 对象存储端口 |
| 9001 | MinIO Console | MinIO 管理控制台端口 |
| 80 | Nginx | HTTP 端口 |
| 443 | Nginx | HTTPS 端口 |

### C. 目录结构说明

```
annual-lottery/
├── client/                 # 前端代码
│   ├── public/            # 静态资源
│   └── src/               # 源代码
│       ├── components/    # 组件
│       ├── pages/         # 页面
│       ├── hooks/         # 自定义 Hooks
│       └── lib/           # 工具库
├── server/                # 后端代码
│   ├── _core/            # 核心功能
│   ├── routers.ts        # API 路由
│   ├── db.ts             # 数据库操作
│   └── storage.ts        # 存储操作
├── drizzle/              # 数据库相关
│   ├── schema.ts         # 数据库表结构
│   └── migrations/       # 迁移文件
├── shared/               # 共享代码
├── dist/                 # 构建输出（生产环境）
├── .env                  # 环境变量配置
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
├── drizzle.config.ts     # Drizzle 配置
├── docker-compose.yml    # Docker Compose 配置
├── Dockerfile            # Docker 镜像配置
├── DEPLOYMENT.md         # 本文档
└── README.md             # 项目说明
```

---

**文档版本：** v1.0  
**最后更新：** 2026-01-30  
**适用版本：** annual-lottery v1.0.0
