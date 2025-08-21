# 🎬 OpenCut

一个现代化的视频编辑和剪辑平台，支持AI智能剪辑、实时预览和高效导出。

## ✨ 主要功能

- 🎥 **视频编辑**: 直观的时间轴编辑器
- 🤖 **AI智能剪辑**: 基于AI的自动剪辑和优化
- 🎵 **音频处理**: 音频编辑和同步
- 📝 **字幕支持**: 自动字幕生成和编辑
- ⚡ **实时预览**: 流畅的实时视频预览
- 🚀 **快速导出**: 高效的视频导出和压缩

## 🚀 快速开始

### 开发环境

```bash
# 克隆项目
git clone <repository-url>
cd OpenCut

# 安装依赖
bun install

# 启动开发服务器
bun dev
```

### 生产部署

```bash
# 一键部署
./deploy-opencut.sh
```

详细部署说明请查看 [部署指南](docs/project/DEPLOYMENT_GUIDE.md)。

## 📁 项目结构

```
OpenCut/
├── 📚 docs/                    # 文档中心
│   ├── project/                # 项目文档
│   ├── development/            # 开发文档
│   ├── api/                    # API文档
│   └── ...
├── 🧪 tests/                   # 测试中心
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   ├── e2e/                    # 端到端测试
│   └── ...
├── 🚀 deployment/              # 部署配置
│   ├── scripts/                # 部署脚本
│   ├── config/                 # 配置文件
│   └── ...
├── 📱 apps/                    # 应用程序
│   ├── web/                    # Web应用
│   └── transcription/          # 转录服务
└── 📦 packages/                # 共享包
    ├── auth/                   # 认证模块
    └── db/                     # 数据库模块
```

## 📖 文档

- 📋 [项目文档](docs/project/) - 项目概述和基本信息
- 🛠️ [开发文档](docs/development/) - 开发指南和API文档
- 🧪 [测试文档](tests/) - 测试指南和测试用例
- 🚀 [部署文档](deployment/) - 部署配置和脚本

## 🧪 测试

```bash
# 运行单元测试
bun test

# 运行集成测试
bun test:integration

# 运行所有测试
bun test:all
```

更多测试信息请查看 [测试文档](tests/README.md)。

## 🛠️ 技术栈

- **前端**: Next.js, React, TypeScript
- **后端**: Node.js, PostgreSQL, Redis
- **AI服务**: 自定义AI剪辑API
- **部署**: Docker, Nginx
- **测试**: Jest, Playwright

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](docs/github/CONTRIBUTING.md)。

## 📄 许可证

本项目采用 [LICENSE](LICENSE) 许可证。

## 🆘 支持

如需帮助，请查看：
- [支持文档](docs/github/SUPPORT.md)
- [常见问题](docs/project/)
- [GitHub Issues](../../issues)

---

**快速链接**: [部署指南](docs/project/DEPLOYMENT_GUIDE.md) | [开发文档](docs/development/) | [API文档](docs/api/) | [测试指南](tests/README.md)
