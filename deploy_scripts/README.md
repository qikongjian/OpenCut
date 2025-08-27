# OpenCut 部署脚本说明

## 概述
本目录包含 OpenCut 项目的部署脚本，用于自动化部署流程。脚本使用国内镜像源来解决网络问题，确保部署的稳定性。

## 脚本文件

### 1. compile.sh
**用途**: 编译和打包项目
**功能**:
- 检查 Git 分支状态
- 使用 bun 安装依赖并构建项目
- 包含完整的 workspace 依赖结构
- 创建部署包并上传到 Nexus 仓库

**使用方法**:
```bash
./compile.sh
```

**注意事项**:
- 必须在 `main_1` 分支上运行
- 需要配置 Nexus 仓库访问权限
- 自动包含 `@opencut/auth` 和 `@opencut/db` 依赖包

### 2. opencut_frontend_deploy.sh
**用途**: 部署前端应用到服务器
**功能**:
- 智能检查本地是否已有构建包，避免重复下载
- 从 Nexus 下载构建包（仅在需要时）
- 使用国内镜像源创建 Docker 容器
- 启动应用并健康检查
- 自动清理临时文件

**使用方法**:
```bash
chmod +x opencut_frontend_deploy.sh

# 正常部署（如果本地已有包则跳过下载）
./opencut_frontend_deploy.sh

# 强制重新下载包
./opencut_frontend_deploy.sh --force
# 或者
./opencut_frontend_deploy.sh -f
```

## 部署流程

### 1. 编译阶段
```bash
# 在开发机器上
./compile.sh
```

### 2. 部署阶段
```bash
# 在服务器上
./opencut_frontend_deploy.sh
```

### 智能下载功能
部署脚本具有智能下载检查功能：
- **自动检测**: 检查本地是否已存在相同名称的构建包
- **文件验证**: 验证现有文件大小是否合理（至少 10MB）
- **交互式选择**: 让用户选择是否下载或使用现有包
- **强制下载**: 使用 `--force` 或 `-f` 参数强制重新下载
- **时间节省**: 避免重复下载，显著减少部署时间

**使用场景**:
- 首次部署：自动下载构建包
- 重复部署：用户可选择跳过下载或重新下载
- 包损坏：自动检测并重新下载
- 强制更新：手动指定重新下载最新版本

**交互式选择示例**:
```bash
$ ./opencut_frontend_deploy.sh

Tar file OpenCut-main_1.tar.gz already exists (size: 148MB)

请选择操作:
1) 使用现有包文件 (跳过下载)
2) 重新下载包文件

请输入选择 (1 或 2): 1
使用现有包文件，跳过下载...
跳过下载，使用现有包文件: OpenCut-main_1.tar.gz
```

## 环境配置

### 环境变量文件
部署脚本会自动创建环境变量文件：`/home/mf/apps/frontend/envs/.opencut-frontend.env`

**默认配置**:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**自定义配置**:
根据实际环境修改环境变量文件中的配置。

## 目录结构
```
deploy_scripts/
├── compile.sh                    # 编译脚本
├── opencut_frontend_deploy.sh   # 部署脚本
└── README.md                    # 说明文档
```

## 依赖要求

### 服务器要求
- Docker
- curl
- tar
- bash

### 网络要求
- 能够访问 Nexus 仓库
- 能够访问 Docker Hub

## 网络优化

### 国内镜像源
部署脚本使用以下国内镜像源来优化网络性能：
- **Alpine 包管理器**: `mirrors.tuna.tsinghua.edu.cn`
- **NPM 注册表**: `registry.npmmirror.com`

这确保了在国内网络环境下的稳定部署。

## 故障排除

### 常见问题

1. **编译失败**
   - 检查是否在正确的分支上
   - 确认 bun 已安装
   - 检查网络连接

2. **部署失败**
   - 检查 Docker 服务状态
   - 查看容器日志：`docker logs <container_name>`
   - 确认端口未被占用

3. **应用无法访问**
   - 检查容器状态：`docker ps`
   - 验证端口映射：`docker port <container_name>`
   - 检查防火墙设置

### 日志查看
```bash
# 查看容器日志
docker logs opencut-frontend-container-main_1

# 查看容器状态
docker inspect opencut-frontend-container-main_1
```

## 维护

### 清理脚本
```bash
# 清理未使用的 Docker 镜像
docker image prune -a -f

# 清理停止的容器
docker container prune -f
```

### 更新部署
1. 运行编译脚本生成新的构建包
2. 运行部署脚本更新应用
3. 验证应用正常运行

## 联系信息
如有问题，请联系开发团队或查看项目文档。
