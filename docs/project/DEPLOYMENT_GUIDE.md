# 🚀 SmartCut Frontend 部署快速指南

## 📁 部署文件结构

所有部署相关文件已整理到 `deployment/` 文件夹中：

```
deployment/
├── README.md                    # 详细部署说明
├── scripts/                     # 部署脚本
│   ├── setup-deployment.sh     # 环境设置脚本
│   ├── quick-deploy.sh         # 快速部署（推荐）
│   ├── deploy-tar.sh           # TAR包部署
│   └── deploy.sh               # 标准部署
├── config/                     # 配置文件
│   ├── .env.production.template # 环境变量模板
│   ├── docker-compose.prod.yml # Docker配置
│   └── nginx.conf              # Nginx配置
├── testing/                    # 测试脚本
│   └── check-server-env.sh     # 环境检查
└── docs/                       # 部署文档
    └── 部署说明.md             # 详细说明
```

## 🎯 一键部署

### 方法1: 使用主部署脚本（最简单）

从项目根目录运行：

```bash
./deploy-opencut.sh
```

这将显示交互式菜单，选择您需要的部署方式。

### 方法2: 直接运行脚本

1. **首次部署设置**：
```bash
cd deployment/scripts
./setup-deployment.sh
```

2. **执行快速部署**：
```bash
./quick-deploy.sh
```

## ⚙️ 配置步骤

### 1. 环境变量配置

```bash
# 复制模板文件
cp deployment/config/.env.production.template deployment/config/.env.production

# 编辑配置文件
nano deployment/config/.env.production
```

**重要配置项**：
- `BETTER_AUTH_SECRET`: 设置强密码
- `NEXT_PUBLIC_BETTER_AUTH_URL`: 改为您的域名
- 其他API密钥根据需要配置

### 2. 服务器信息

默认配置：
- **服务器**: 39.105.24.90
- **用户**: mf
- **端口**: 80 (HTTP), 443 (HTTPS)

## 📊 部署状态检查

部署完成后，检查服务状态：

```bash
# 检查容器状态
ssh mf@39.105.24.90 "docker ps"

# 查看应用日志
ssh mf@39.105.24.90 "docker logs opencut-container"

# 测试访问
curl -I http://39.105.24.90
```

## 🔧 常用管理命令

```bash
# 重启应用
ssh mf@39.105.24.90 "cd /home/mf/opencut && docker compose -f docker-compose.prod.yml restart"

# 查看日志
ssh mf@39.105.24.90 "docker logs opencut-container --tail 50"

# 停止服务
ssh mf@39.105.24.90 "cd /home/mf/opencut && docker compose -f docker-compose.prod.yml down"

# 启动服务
ssh mf@39.105.24.90 "cd /home/mf/opencut && docker compose -f docker-compose.prod.yml up -d"
```

## 🆘 故障排除

1. **查看详细文档**: `deployment/README.md`
2. **运行环境检查**: `deployment/testing/check-server-env.sh`
3. **查看部署日志**: `deployment/logs/deploy.log`

## 📞 支持

如遇问题：
1. 检查 `deployment/docs/` 中的详细文档
2. 运行测试脚本诊断问题
3. 查看容器日志定位错误

---

**提示**: 首次部署建议使用 `./deploy-opencut.sh` 脚本，它提供了完整的交互式部署体验。
