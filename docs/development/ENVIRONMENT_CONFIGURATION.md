# SmartCut Frontend 环境配置文件说明

## 📋 概览

本文档详细说明了 SmartCut Frontend 项目中所有环境配置文件的用途、配置项和使用方法。

## 📁 环境配置文件结构

```
SmartCut Frontend/
├── .env.example                           # 根目录环境变量示例
├── .env.production                        # 根目录生产环境配置
├── apps/web/.env.example                  # Web应用环境变量示例
├── apps/web/.env.local                    # Web应用本地开发配置
├── deployment/config/.env.production      # 部署用生产环境配置
├── deployment/config/.env.production.template  # 生产环境配置模板
└── dist/.env.production                   # 构建输出的生产环境配置
```

## 🔧 配置文件详解

### 1. 根目录配置文件

#### `.env.example` - 根目录环境变量示例

**用途**: 项目根目录的环境变量示例文件，展示所有可用的配置选项
**位置**: `./env.example`

**主要配置项**:

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/opencut"

# 认证配置
BETTER_AUTH_SECRET="your-auth-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Redis 缓存配置
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Freesound API (音效搜索)
FREESOUND_CLIENT_ID="your-freesound-client-id"
FREESOUND_API_KEY="your-freesound-api-key"

# Cloudflare R2 存储
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="your-r2-bucket-name"

# Modal 转录服务
MODAL_TRANSCRIPTION_URL="your-modal-transcription-url"

# AI剪辑计划API
AI_EDITING_PLAN_API_URL="https://77.smartvideo.py.qikongjian.com"
NEXT_PUBLIC_AI_EDITING_PLAN_API_URL="https://77.smartvideo.py.qikongjian.com"

# 其他配置
ANALYZE="false"
NODE_ENV="development"
```

#### `.env.production` - 根目录生产环境配置

**用途**: 根目录的生产环境配置，用于生产部署
**位置**: `./.env.production`

**特点**:

- 使用 Docker 容器内部网络地址
- 配置了实际的服务器 IP (39.105.24.90)
- 包含 Docker Compose 相关的数据库凭据

### 2. Web 应用配置文件

#### `apps/web/.env.example` - Web 应用环境变量示例

**用途**: Web 应用的环境变量示例，专门针对 Next.js 应用
**位置**: `./apps/web/.env.example`

**主要配置项**:

```bash
# 数据库
DATABASE_URL="postgresql://opencut:opencutthegoat@localhost:5432/opencut"

# Better Auth 认证
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here

# 开发环境
NODE_ENV=development

# Redis
UPSTASH_REDIS_REST_URL=http://localhost:8079
UPSTASH_REDIS_REST_TOKEN=example_token

# Marble Blog CMS
MARBLE_WORKSPACE_KEY=cm6ytuq9x0000i803v0isidst
NEXT_PUBLIC_MARBLE_API_URL=https://api.marblecms.com

# Freesound API
FREESOUND_CLIENT_ID=...
FREESOUND_API_KEY=...

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=opencut-transcription

# Modal 转录端点
MODAL_TRANSCRIPTION_URL=https://your-username--opencut-transcription-transcribe-audio.modal.run...
```

#### `apps/web/.env.local` - Web 应用本地开发配置

**用途**: Web 应用的本地开发环境配置（不提交到 Git）
**位置**: `./apps/web/.env.local`
**注意**: 此文件包含敏感信息，已在 .gitignore 中排除

### 3. 部署配置文件

#### `deployment/config/.env.production` - 部署用生产环境配置

**用途**: 专门用于 Docker 部署的生产环境配置
**位置**: `./deployment/config/.env.production`

**特点**:

- 针对 Docker Compose 优化
- 使用容器内部网络地址
- 包含完整的生产环境配置

#### `deployment/config/.env.production.template` - 生产环境配置模板

**用途**: 生产环境配置的模板文件，用于快速创建新的生产环境配置
**位置**: `./deployment/config/.env.production.template`

**使用方法**:

```bash
cp deployment/config/.env.production.template deployment/config/.env.production
# 然后编辑 .env.production 文件，填入实际的配置值
```

### 4. 构建输出配置

#### `dist/.env.production` - 构建输出的生产环境配置

**用途**: 构建过程中生成的生产环境配置副本
**位置**: `./dist/.env.production`
**注意**: 这是构建工具自动生成的文件

## 🔑 关键环境变量说明

### 必需配置项

| 变量名                        | 用途             | 示例值                                | 必需性  |
| ----------------------------- | ---------------- | ------------------------------------- | ------- |
| `DATABASE_URL`                | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` | ✅ 必需 |
| `BETTER_AUTH_SECRET`          | 认证密钥         | `your-secure-secret-key`              | ✅ 必需 |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | 认证服务 URL     | `http://localhost:3000`               | ✅ 必需 |
| `UPSTASH_REDIS_REST_URL`      | Redis 连接 URL   | `https://redis-url.upstash.io`        | ✅ 必需 |
| `UPSTASH_REDIS_REST_TOKEN`    | Redis 访问令牌   | `your-redis-token`                    | ✅ 必需 |

### 可选配置项

| 变量名                    | 用途                    | 示例值                       | 必需性  |
| ------------------------- | ----------------------- | ---------------------------- | ------- |
| `FREESOUND_CLIENT_ID`     | Freesound API 客户端 ID | `your-client-id`             | 🔶 可选 |
| `FREESOUND_API_KEY`       | Freesound API 密钥      | `your-api-key`               | 🔶 可选 |
| `CLOUDFLARE_ACCOUNT_ID`   | Cloudflare 账户 ID      | `your-account-id`            | 🔶 可选 |
| `R2_ACCESS_KEY_ID`        | R2 存储访问密钥 ID      | `your-access-key`            | 🔶 可选 |
| `R2_SECRET_ACCESS_KEY`    | R2 存储密钥             | `your-secret-key`            | 🔶 可选 |
| `R2_BUCKET_NAME`          | R2 存储桶名称           | `opencut-storage`            | 🔶 可选 |
| `MODAL_TRANSCRIPTION_URL` | Modal 转录服务 URL      | `https://modal-endpoint.run` | 🔶 可选 |
| `AI_EDITING_PLAN_API_URL` | AI 剪辑计划 API URL     | `https://api.example.com`    | 🔶 可选 |

## 🚀 环境配置最佳实践

### 1. 开发环境设置

```bash
# 1. 复制示例文件
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local

# 2. 编辑配置文件，填入实际值
# 编辑 .env.local 和 apps/web/.env.local
```

### 2. 生产环境设置

```bash
# 1. 使用生产环境模板
cp deployment/config/.env.production.template deployment/config/.env.production

# 2. 修改生产环境配置
# 编辑 deployment/config/.env.production
# 确保修改以下关键配置：
# - BETTER_AUTH_SECRET (使用强密码)
# - NEXT_PUBLIC_BETTER_AUTH_URL (使用实际域名)
# - 数据库密码
# - API密钥
```

### 3. 安全注意事项

- ❌ 不要将包含敏感信息的 `.env.local` 文件提交到 Git
- ✅ 使用强密码和随机密钥
- ✅ 定期轮换 API 密钥和密码
- ✅ 在生产环境中使用 HTTPS
- ✅ 限制数据库和 Redis 的网络访问

## 🔍 环境变量验证

项目使用 `@t3-oss/env-nextjs` 进行环境变量验证，配置文件位于 `apps/web/src/env.ts`。

### 验证规则

- 服务端变量在 `server` 对象中定义
- 客户端变量在 `client` 对象中定义，必须以 `NEXT_PUBLIC_` 开头
- 使用 Zod 进行类型验证

## 🛠️ 故障排除

### 常见问题

1. **环境变量未生效**

   - 检查文件名是否正确（`.env.local` vs `.env.example`）
   - 确保重启了开发服务器
   - 检查变量名是否有拼写错误

2. **数据库连接失败**

   - 验证 `DATABASE_URL` 格式是否正确
   - 确保数据库服务正在运行
   - 检查网络连接和防火墙设置

3. **认证问题**

   - 确保 `BETTER_AUTH_SECRET` 已设置且足够复杂
   - 检查 `NEXT_PUBLIC_BETTER_AUTH_URL` 是否与实际访问地址匹配

4. **Redis 连接问题**
   - 验证 Redis URL 和令牌是否正确
   - 检查 Redis 服务状态
   - 确认网络连接

## 🔄 环境配置工作流

### 开发流程

```mermaid
graph TD
    A[克隆项目] --> B[复制 .env.example]
    B --> C[创建 .env.local]
    C --> D[配置本地数据库]
    D --> E[启动开发服务器]
    E --> F[验证配置]
```

### 部署流程

```mermaid
graph TD
    A[准备生产配置] --> B[复制模板文件]
    B --> C[修改生产环境变量]
    C --> D[验证配置]
    D --> E[构建Docker镜像]
    E --> F[部署到服务器]
    F --> G[验证部署]
```

## 📋 配置检查清单

### 开发环境检查清单

- [ ] 复制了 `.env.example` 到 `.env.local`
- [ ] 复制了 `apps/web/.env.example` 到 `apps/web/.env.local`
- [ ] 配置了本地数据库连接
- [ ] 设置了认证密钥
- [ ] 配置了 Redis 连接
- [ ] 测试了应用启动

### 生产环境检查清单

- [ ] 使用了强密码和随机密钥
- [ ] 配置了正确的域名和 IP 地址
- [ ] 设置了数据库连接（Docker 网络）
- [ ] 配置了 Redis 连接
- [ ] 设置了文件存储（可选）
- [ ] 配置了外部 API 密钥（可选）
- [ ] 验证了所有必需的环境变量
- [ ] 测试了应用部署

## 🔧 环境变量管理工具

### 1. 环境变量验证脚本

创建一个验证脚本来检查环境变量配置：

```bash
#!/bin/bash
# scripts/validate-env.sh

echo "🔍 验证环境变量配置..."

# 检查必需的环境变量
required_vars=(
    "DATABASE_URL"
    "BETTER_AUTH_SECRET"
    "NEXT_PUBLIC_BETTER_AUTH_URL"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "✅ 所有必需的环境变量都已配置"
else
    echo "❌ 缺少以下环境变量:"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi
```

### 2. 环境变量生成器

```bash
#!/bin/bash
# scripts/generate-env.sh

echo "🔧 生成环境变量配置..."

# 生成随机密钥
generate_secret() {
    openssl rand -base64 32
}

# 创建 .env.local 文件
cat > .env.local << EOF
# 自动生成的环境变量配置
# 生成时间: $(date)

DATABASE_URL="postgresql://opencut:opencutthegoat@localhost:5432/opencut"
BETTER_AUTH_SECRET="$(generate_secret)"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
UPSTASH_REDIS_REST_URL="http://localhost:8079"
UPSTASH_REDIS_REST_TOKEN="$(generate_secret)"
NODE_ENV="development"
ANALYZE="false"
EOF

echo "✅ 环境变量配置已生成到 .env.local"
echo "⚠️  请根据需要修改配置值"
```

## 🌍 多环境配置策略

### 环境分类

1. **development** - 本地开发环境
2. **staging** - 预发布环境
3. **production** - 生产环境
4. **test** - 测试环境

### 配置文件命名约定

```
.env.local          # 本地开发（不提交）
.env.development    # 开发环境默认值
.env.staging        # 预发布环境
.env.production     # 生产环境
.env.test          # 测试环境
```

### 环境变量优先级

Next.js 环境变量加载优先级（从高到低）：

1. `.env.local`
2. `.env.{NODE_ENV}.local`
3. `.env.{NODE_ENV}`
4. `.env`

## 🔐 安全配置指南

### 密钥生成

```bash
# 生成强密码
openssl rand -base64 32

# 生成UUID
uuidgen

# 生成随机字符串
head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32
```

### 敏感信息处理

- 使用环境变量而不是硬编码
- 定期轮换密钥和密码
- 使用密钥管理服务（如 AWS Secrets Manager）
- 限制环境变量的访问权限

## 📊 配置监控

### 环境变量监控脚本

```bash
#!/bin/bash
# scripts/monitor-env.sh

echo "📊 环境变量状态监控"
echo "===================="

# 检查关键服务连接
echo "🔍 检查数据库连接..."
if pg_isready -h localhost -p 5432; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
fi

echo "🔍 检查Redis连接..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis连接正常"
else
    echo "❌ Redis连接失败"
fi

# 检查环境变量
echo "🔍 检查环境变量..."
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL 已设置"
else
    echo "❌ DATABASE_URL 未设置"
fi

if [ -n "$BETTER_AUTH_SECRET" ]; then
    echo "✅ BETTER_AUTH_SECRET 已设置"
else
    echo "❌ BETTER_AUTH_SECRET 未设置"
fi
```

## 📚 相关文档

- [部署说明](../../deployment/docs/部署说明.md)
- [开发环境设置](./DEVELOPMENT_SETUP.md)
- [Docker 部署指南](../../deployment/docs/部署指南.md)
- [API 配置说明](../api/API_CONFIGURATION.md)
- [安全配置指南](./SECURITY_CONFIGURATION.md)

## 🆘 获取帮助

如果在配置环境变量时遇到问题：

1. 检查本文档的故障排除部分
2. 查看项目的 GitHub Issues
3. 参考相关文档链接
4. 联系项目维护者

---

**最后更新**: 2025-08-23
**维护者**: SmartCut Frontend 开发团队
