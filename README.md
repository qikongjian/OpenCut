# 🎬 SmartCut Frontend

A modern video editing and cutting platform with AI smart editing, real-time preview, and efficient export capabilities.

## ✨ Key Features

- 🎥 **Video Editing**: Intuitive timeline editor
- 🤖 **AI Smart Editing**: AI-based automatic editing and optimization
- 🎵 **Audio Processing**: Audio editing and synchronization
- 📝 **Subtitle Support**: Automatic subtitle generation and editing
- ⚡ **Real-time Preview**: Smooth real-time video preview
- 🚀 **Quick Export**: Efficient video export and compression

## 🚀 Quick Start

### Development Environment

```bash
# Clone the project
git clone <repository-url>
cd SmartCut-Frontend

# Install dependencies
bun install

# Start development server
bun dev
```

### Production Deployment

```bash
# One-click deployment
./deploy-smartcut.sh
```

For detailed deployment instructions, see [Deployment Guide](docs/project/DEPLOYMENT_GUIDE.md).

## 📁 Project Structure

```
SmartCut-Frontend/
├── 📚 docs/                    # Documentation center
│   ├── project/                # Project documentation
│   ├── development/            # Development documentation
│   ├── api/                    # API documentation
│   └── ...
├── 🧪 tests/                   # Testing center
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
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
- 🛠️ [开发文档](docs/development/) - 开发指南和 API 文档
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
- **AI 服务**: 自定义 AI 剪辑 API
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

**快速链接**: [部署指南](docs/project/DEPLOYMENT_GUIDE.md) | [开发文档](docs/development/) | [API 文档](docs/api/) | [测试指南](tests/README.md)
