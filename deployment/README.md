# SmartCut Frontend 部署文件夹

本文件夹包含了 SmartCut Frontend 项目的所有部署相关文件和脚本。

## 📁 文件夹结构

```
deployment/
├── README.md                    # 本文件 - 部署说明
├── scripts/                     # 部署脚本
│   ├── deploy.sh               # 主部署脚本
│   ├── deploy-tar.sh           # TAR包部署脚本
│   ├── quick-deploy.sh         # 快速部署脚本
│   ├── deploy-simple.sh        # 简单部署脚本
│   ├── deploy-frontend.sh      # 前端部署脚本
│   ├── deploy-frontend-only.sh # 仅前端部署脚本
│   ├── deploy-server.sh        # 服务器部署脚本
│   └── init-database.sh        # 数据库初始化脚本
├── config/                     # 配置文件
│   ├── docker-compose.prod.yml # 生产环境 Docker Compose
│   ├── nginx.conf              # Nginx 配置
│   ├── redis.conf              # Redis 配置
│   └── .env.production         # 生产环境变量
├── testing/                    # 测试脚本
│   ├── check-server-env.sh     # 服务器环境检查
│   ├── test-deployment.sh      # 部署测试脚本
│   ├── test-ai-api.js          # AI API 测试
│   └── compile_test.sh         # 编译测试
├── docs/                       # 文档
│   ├── 部署说明.md             # 详细部署说明
│   ├── 部署指南.md             # 部署指南
│   └── API集成完成总结.md      # API集成总结
└── logs/                       # 日志文件
    ├── deploy.log              # 部署日志
    ├── frontend-build-*.log    # 前端构建日志
    └── *.tar.gz               # 构建产物
```

## 🚀 快速开始

### 方法 1: 使用主部署脚本（推荐）

从项目根目录运行：

```bash
./deploy-opencut.sh
```

这将显示一个交互式菜单，让您选择部署方式。

### 方法 2: 直接运行部署脚本

#### 1. 设置部署环境

```bash
cd deployment/scripts
chmod +x setup-deployment.sh
./setup-deployment.sh
```

#### 2. 一键部署（推荐）

```bash
cd deployment/scripts
./quick-deploy.sh
```

#### 3. TAR 包部署

```bash
cd deployment/scripts
./deploy-tar.sh
```

#### 4. 标准部署

```bash
cd deployment/scripts
./deploy.sh
```

## 📋 部署前检查

1. **服务器环境检查**

```bash
cd deployment/testing
chmod +x check-server-env.sh
./check-server-env.sh
```

2. **编译测试**

```bash
cd deployment/testing
chmod +x compile_test.sh
./compile_test.sh
```

## 🔧 配置说明

### 环境变量配置

1. 复制模板文件：

```bash
cp deployment/config/.env.production.template deployment/config/.env.production
```

2. 编辑 `deployment/config/.env.production` 文件，修改以下关键配置：

- `DATABASE_URL`: 数据库连接字符串
- `BETTER_AUTH_SECRET`: 认证密钥（请使用强密码）
- `NEXT_PUBLIC_BETTER_AUTH_URL`: 认证服务 URL（改为您的域名）
- `AI_EDITING_PLAN_API_URL`: AI 剪辑 API 地址

### Docker Compose 配置

`config/docker-compose.prod.yml` 包含了完整的生产环境容器配置。

### Nginx 配置

`config/nginx.conf` 包含了反向代理和静态文件服务配置。

## 📊 服务管理

### 查看服务状态

```bash
ssh mf@39.105.24.90 "docker ps"
```

### 查看应用日志

```bash
ssh mf@39.105.24.90 "docker logs opencut-container"
```

### 重启服务

```bash
ssh mf@39.105.24.90 "cd /home/mf/opencut && docker compose -f docker-compose.prod.yml restart"
```

## 🔍 故障排除

1. **查看部署日志**: `logs/deploy.log`
2. **查看构建日志**: `logs/frontend-build-*.log`
3. **运行测试脚本**: `testing/test-deployment.sh`

## 📞 支持

如遇问题，请检查：

1. 部署日志文件
2. Docker 容器状态
3. 网络连接
4. 环境变量配置

---

**注意**: 首次部署前请仔细阅读 `docs/部署说明.md` 获取详细信息。
