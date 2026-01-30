# 快速部署指南

本指南帮助您在 10 分钟内快速部署年会抽奖系统。

---

## 前置要求

- Docker 和 Docker Compose 已安装
- 服务器有至少 4GB 内存
- 端口 3000、3306、9000、9001 未被占用

---

## 快速部署步骤

### 1. 获取代码

```bash
# 上传代码包到服务器
scp annual-lottery.tar.gz user@server:/opt/

# 或使用 git 克隆
git clone <your-repo-url> /opt/annual-lottery

# 进入项目目录
cd /opt/annual-lottery
```

### 2. 配置环境变量

```bash
# 生成 JWT 密钥
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=mysql://lottery_user:lottery_password@mysql:3306/annual_lottery
JWT_SECRET=$JWT_SECRET
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=annual-lottery
AWS_ENDPOINT=http://minio:9000
OWNER_OPEN_ID=admin
OWNER_NAME=管理员
EOF
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看启动日志
docker-compose logs -f
```

### 4. 初始化数据库

```bash
# 等待数据库启动（约 30 秒）
sleep 30

# 进入应用容器
docker-compose exec app sh

# 运行数据库迁移
pnpm db:push

# 退出容器
exit
```

### 5. 访问应用

打开浏览器访问：`http://服务器IP:3000`

---

## 验证部署

### 检查服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 应该看到以下服务都是 Up 状态：
# - annual-lottery-app
# - annual-lottery-mysql
# - annual-lottery-minio
```

### 检查应用日志

```bash
# 查看应用日志
docker-compose logs app

# 应该看到类似以下输出：
# Server is running on port 3000
```

### 检查数据库连接

```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -u lottery_user -plottery_password annual_lottery

# 查看表
SHOW TABLES;

# 应该看到以下表：
# - prizes
# - participants
# - winners
# - user

# 退出
exit
```

### 检查 MinIO

打开浏览器访问：`http://服务器IP:9001`

- 用户名：`minioadmin`
- 密码：`minioadmin`

应该能看到 `annual-lottery` 存储桶。

---

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f app

# 查看所有服务日志
docker-compose logs -f
```

### 数据库操作

```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -u lottery_user -plottery_password annual_lottery

# 备份数据库
docker-compose exec mysql mysqldump -u lottery_user -plottery_password annual_lottery > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u lottery_user -plottery_password annual_lottery < backup.sql
```

### 应用操作

```bash
# 进入应用容器
docker-compose exec app sh

# 查看应用日志
docker-compose logs -f app

# 重启应用
docker-compose restart app
```

---

## 故障排除

### 问题 1：端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :3000

# 修改 docker-compose.yml 中的端口映射
# 例如将 3000:3000 改为 8080:3000
```

### 问题 2：数据库连接失败

```bash
# 检查 MySQL 容器状态
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 重启 MySQL
docker-compose restart mysql
```

### 问题 3：图片上传失败

```bash
# 检查 MinIO 容器状态
docker-compose ps minio

# 查看 MinIO 日志
docker-compose logs minio

# 重启 MinIO
docker-compose restart minio

# 检查存储桶是否创建
docker-compose logs minio-init
```

### 问题 4：应用启动失败

```bash
# 查看应用日志
docker-compose logs app

# 检查环境变量配置
docker-compose exec app env | grep DATABASE_URL

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 生产环境建议

### 1. 修改默认密码

编辑 `docker-compose.yml`，修改以下密码：

```yaml
# MySQL root 密码
MYSQL_ROOT_PASSWORD: your-secure-root-password

# MySQL 用户密码
MYSQL_PASSWORD: your-secure-user-password

# MinIO 密码
MINIO_ROOT_PASSWORD: your-secure-minio-password
```

同时更新 `.env` 文件中的 `DATABASE_URL`。

### 2. 启用 HTTPS

```bash
# 安装 Certbot
sudo apt install certbot

# 获取 SSL 证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# 启用 Nginx 服务
docker-compose --profile with-nginx up -d
```

编辑 `nginx.conf`，取消 HTTPS 配置的注释。

### 3. 配置自动备份

创建备份脚本 `/opt/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose -f /opt/annual-lottery/docker-compose.yml exec -T mysql \
    mysqldump -u lottery_user -plottery_password annual_lottery \
    > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

设置定时任务：

```bash
chmod +x /opt/backup.sh
crontab -e

# 添加每天凌晨 2 点自动备份
0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1
```

### 4. 配置防火墙

```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 如果需要远程访问数据库（不推荐）
# sudo ufw allow 3306/tcp
```

### 5. 监控和告警

```bash
# 安装监控工具
docker run -d --name watchtower \
    -v /var/run/docker.sock:/var/run/docker.sock \
    containrrr/watchtower \
    --cleanup --interval 3600

# 查看容器资源使用
docker stats
```

---

## 更新应用

```bash
# 拉取最新代码
cd /opt/annual-lottery
git pull origin main

# 重新构建并启动
docker-compose build
docker-compose up -d

# 运行数据库迁移（如果有）
docker-compose exec app pnpm db:push
```

---

## 卸载

```bash
# 停止并删除所有容器
docker-compose down

# 删除数据卷（注意：会删除所有数据）
docker-compose down -v

# 删除项目目录
rm -rf /opt/annual-lottery
```

---

## 下一步

- 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细部署说明
- 阅读 [ENV_CONFIG.md](./ENV_CONFIG.md) 了解环境变量配置
- 阅读 [README.md](./README.md) 了解系统功能和使用方法

---

**部署成功后，请访问系统并开始使用！**

如有问题，请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的故障排除章节。
