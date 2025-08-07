# OpenCut 开发环境搭建指南

本指南将帮助您快速搭建 OpenCut 项目的开发环境，包括所有必要的工具和配置。

## 📋 系统要求

### 基础要求
- **Node.js**: v18.0.0 或更高版本
- **Bun**: 最新稳定版本 (推荐包管理器)
- **Git**: 用于版本控制
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 可选要求
- **Docker**: 用于本地数据库服务 (推荐)
- **Docker Compose**: 容器编排
- **VS Code**: 推荐的开发编辑器

## 🛠️ 安装步骤

### 1. 安装 Node.js
```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 或直接从官网下载
# https://nodejs.org/
```

### 2. 安装 Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证安装
bun --version
```

### 3. 安装 Docker (可选但推荐)
```bash
# macOS
brew install docker docker-compose

# Ubuntu
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Windows
# 下载 Docker Desktop: https://www.docker.com/products/docker-desktop
```

## 🚀 项目设置

### 1. 克隆项目
```bash
# 克隆仓库
git clone https://github.com/OpenCut-app/OpenCut.git
cd OpenCut

# 或者 fork 后克隆您的 fork
git clone https://github.com/YOUR_USERNAME/OpenCut.git
cd OpenCut
```

### 2. 安装依赖
```bash
# 在项目根目录安装所有依赖
bun install

# 这会安装所有 workspace 的依赖
```

### 3. 环境配置
```bash
# 进入 web 应用目录
cd apps/web

# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local  # 或使用您喜欢的编辑器
```

### 4. 环境变量配置
在 `.env.local` 中配置以下变量：

```bash
# 数据库配置 (如果使用 Docker)
DATABASE_URL="postgresql://opencut:opencutthegoat@localhost:5432/opencut"

# 认证密钥 (生成一个安全的密钥)
BETTER_AUTH_SECRET="your-generated-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Redis 配置 (如果使用 Docker)
UPSTASH_REDIS_REST_URL="http://localhost:8079"
UPSTASH_REDIS_REST_TOKEN="example_token"

# CMS 配置
MARBLE_WORKSPACE_KEY="cm6ytuq9x0000i803v0isidst"
NEXT_PUBLIC_MARBLE_API_URL="https://api.marblecms.com"

# 开发环境
NODE_ENV="development"
```

### 5. 生成认证密钥
```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 在线生成
# https://generate-secret.vercel.app/32
```

## 🐳 Docker 设置 (推荐)

### 1. 启动服务
```bash
# 在项目根目录启动数据库和 Redis
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 2. 数据库迁移
```bash
# 在 apps/web 目录下运行迁移
cd apps/web
bun run db:migrate
```

## 🏃‍♂️ 启动开发服务器

### 1. 启动所有服务
```bash
# 在项目根目录
bun dev

# 或者只启动 web 应用
cd apps/web
bun dev
```

### 2. 访问应用
- **Web 应用**: http://localhost:3000
- **API 文档**: http://localhost:3000/api
- **数据库管理**: http://localhost:5432 (如果安装了 pgAdmin)

## 🔧 开发工具配置

### VS Code 扩展推荐
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "biomejs.biome",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code 设置
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## 📝 常用命令

### 开发命令
```bash
# 启动开发服务器
bun dev

# 构建项目
bun build

# 类型检查
bun check-types

# 代码检查
bun lint

# 修复代码格式
bun lint:fix

# 格式化代码
bun format
```

### 数据库命令
```bash
# 运行迁移
bun run db:migrate

# 重置数据库
bun run db:reset

# 生成数据库客户端
bun run db:generate
```

### Docker 命令
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重建服务
docker-compose up -d --build
```

## 🐛 常见问题

### 1. 端口冲突
如果 3000 端口被占用：
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用不同端口
PORT=3001 bun dev
```

### 2. 依赖安装失败
```bash
# 清理缓存
bun pm cache rm

# 删除 node_modules 重新安装
rm -rf node_modules
bun install
```

### 3. 数据库连接失败
```bash
# 检查 Docker 服务状态
docker-compose ps

# 重启数据库服务
docker-compose restart postgres

# 检查环境变量
echo $DATABASE_URL
```

## 📚 下一步

- 阅读 [技术架构文档](../technical/architecture.md)
- 查看 [贡献指南](./contributing.md)
- 了解 [功能概览](../features/overview.md)
- 参与 [项目规划](../planning/roadmap.md)

---

**需要帮助?** 
- 创建 [GitHub Issue](https://github.com/OpenCut-app/OpenCut/issues)
- 加入我们的 [Discord 社区](https://discord.gg/opencut)
- 查看 [FAQ 文档](./faq.md)
