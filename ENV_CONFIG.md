# 环境变量配置说明

本文档说明年会抽奖系统所需的环境变量配置。

---

## 必需配置

以下环境变量必须配置才能正常运行系统：

### 1. 数据库配置

```bash
DATABASE_URL=mysql://用户名:密码@主机:端口/数据库名
```

**示例：**
```bash
# MySQL
DATABASE_URL=mysql://lottery_user:lottery_password@localhost:3306/annual_lottery

# PostgreSQL
DATABASE_URL=postgresql://lottery_user:lottery_password@localhost:5432/annual_lottery
```

### 2. JWT 密钥

```bash
JWT_SECRET=your-random-secret-key-min-32-chars
```

**生成方法：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**注意：** 必须使用安全的随机字符串，最少 32 个字符。

### 3. S3 存储配置

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=annual-lottery
```

**MinIO 配置示例：**
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=annual-lottery
AWS_ENDPOINT=http://localhost:9000
```

---

## 可选配置

以下环境变量为可选配置：

### 应用配置

```bash
NODE_ENV=production          # 运行环境（development | production）
PORT=3000                    # 应用端口
```

### OAuth 配置（用于用户登录）

```bash
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_APP_ID=your-app-id
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
```

### 管理员配置

```bash
OWNER_OPEN_ID=admin
OWNER_NAME=管理员
```

---

## 配置方法

### 方法一：使用 .env 文件（推荐）

1. 在项目根目录创建 `.env` 文件
2. 按照上述格式填写配置
3. 启动应用时会自动加载

**示例 .env 文件：**
```bash
DATABASE_URL=mysql://lottery_user:password123@localhost:3306/annual_lottery
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=annual-lottery
AWS_ENDPOINT=http://localhost:9000
NODE_ENV=production
PORT=3000
```

### 方法二：使用系统环境变量

```bash
export DATABASE_URL="mysql://lottery_user:password123@localhost:3306/annual_lottery"
export JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
# ... 其他配置
```

### 方法三：Docker Compose 配置

在 `docker-compose.yml` 中的 `environment` 部分配置：

```yaml
services:
  app:
    environment:
      - DATABASE_URL=mysql://lottery_user:password@mysql:3306/annual_lottery
      - JWT_SECRET=your-secret-key
      # ... 其他配置
```

---

## 配置优先级

环境变量的优先级从高到低：

1. Docker Compose `environment` 配置
2. 系统环境变量（export）
3. `.env` 文件

---

## 安全建议

1. **不要将 .env 文件提交到版本控制系统**
   - 已在 `.gitignore` 中排除
   - 包含敏感信息，不应公开

2. **使用强密码**
   - JWT_SECRET 使用随机生成的强密码
   - 数据库密码使用复杂密码
   - S3 密钥妥善保管

3. **定期更新密钥**
   - 定期更换 JWT_SECRET
   - 定期更换数据库密码
   - 定期轮换 S3 密钥

4. **限制访问权限**
   - 数据库只允许必要的 IP 访问
   - S3 存储桶配置适当的访问策略
   - 使用防火墙限制端口访问

---

## 常见问题

### Q1: 如何生成安全的 JWT_SECRET？

```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 OpenSSL 生成
openssl rand -hex 32

# 使用 Python 生成
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Q2: 如何配置使用 MinIO？

1. 启动 MinIO 服务
2. 创建存储桶 `annual-lottery`
3. 配置环境变量：
   ```bash
   AWS_ACCESS_KEY_ID=minioadmin
   AWS_SECRET_ACCESS_KEY=minioadmin
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=annual-lottery
   AWS_ENDPOINT=http://localhost:9000
   ```

### Q3: 如何配置使用阿里云 OSS？

```bash
AWS_ACCESS_KEY_ID=your-aliyun-access-key
AWS_SECRET_ACCESS_KEY=your-aliyun-secret-key
AWS_REGION=oss-cn-hangzhou
AWS_S3_BUCKET=annual-lottery
AWS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
```

### Q4: 数据库连接失败怎么办？

1. 检查数据库服务是否启动
2. 检查 DATABASE_URL 格式是否正确
3. 检查数据库用户权限
4. 检查防火墙是否开放端口
5. 检查网络连接是否正常

---

## 配置检查清单

部署前请确认以下配置：

- [ ] DATABASE_URL 已配置且可连接
- [ ] JWT_SECRET 已设置为安全的随机字符串
- [ ] S3 存储配置已完成且可访问
- [ ] NODE_ENV 设置为 production
- [ ] PORT 端口未被占用
- [ ] .env 文件未提交到版本控制
- [ ] 所有密码使用强密码
- [ ] 数据库已创建并初始化
- [ ] S3 存储桶已创建

---

**最后更新：** 2026-01-30
