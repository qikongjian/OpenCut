# 🎬 SmartCut Frontend - 现代化Web视频编辑器

<div align="center">
  <img src="apps/web/public/logo.png" alt="SmartCut Frontend Logo" width="120" />
  
  ### 🎬 A free, open-source video editor for web, desktop, and mobile

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

  [🚀 Live Demo](https://opencut.app) • [📖 Documentation](./docs) • [🐛 Report Bug](https://github.com/SmartCut Frontend-app/SmartCut Frontend/issues) • [💡 Request Feature](https://github.com/SmartCut Frontend-app/SmartCut Frontend/issues)
</div>

---

## 📖 项目文档导航

### 🏗️ 项目架构文档
- [📁 项目代码目录结构分析](./PROJECT_CODE_STRUCTURE.md) - 完整的项目结构和代码组织分析
- [🎬 Editor页面布局分析](./EDITOR_LAYOUT_ANALYSIS.md) - 编辑器页面布局和组件架构详解

### 🚀 功能特性文档
- [🤖 AI剪辑功能说明](./AI%E5%89%AA%E8%BE%91%E5%88%B7%E6%96%B0%E6%92%AD%E6%94%BE%E4%BF%AE%E5%A4%8D%E6%B5%8B%E8%AF%95%E6%8C%87%E5%8D%97.md) - AI剪辑功能详细说明
- [📝 AI字幕集成功能说明](./AI%E5%AD%97%E5%B9%95%E9%9B%86%E6%88%90%E5%8A%9F%E8%83%BD%E8%AF%B4%E6%98%8E.md) - AI字幕集成功能详解
- [⚡ 一键剪辑功能设置指南](./AI_EDITING_SETUP_README.md) - 一键剪辑功能设置和使用指南

### 👥 团队角色文档
- [🚀 资深前端开发工程师](./roles/资深前端开发工程师-SmartCut Frontend.md) - 基于SmartCut Frontend项目的前端开发角色定义
- [📋 高级产品经理](./roles/高级产品经理.md) - 产品管理角色定义
- [🎨 高级UI&UX设计师](./roles/高级UI&UX设计师.md) - 设计角色定义
- [🧪 高级测试工程师](./roles/高级测试工程师.md) - 测试角色定义
- [📚 共享规则](./roles/共享规则.md) - 团队协作规则

### 📚 完整文档目录
- [📚 Complete Documentation](./docs) - 所有项目文档
- [🚀 Quick Start Guide](./docs/development/setup.md) - 快速开始指南
- [🎬 Feature Overview](./docs/features/overview.md) - 功能概览
- [🏗️ Technical Architecture](./docs/technical/architecture.md) - 技术架构
- [📋 Development Planning](./docs/planning/roadmap.md) - 开发规划

---

## ✨ 为什么选择 SmartCut Frontend?

- **🔒 Privacy First**: Your videos never leave your device - 100% client-side processing
- **💰 Completely Free**: No subscriptions, watermarks, or feature paywalls
- **🎯 User-Friendly**: Intuitive interface inspired by popular editors like CapCut
- **🌐 Cross-Platform**: Works seamlessly on web, desktop, and mobile devices
- **⚡ High Performance**: Built with modern web technologies for smooth editing experience

## 🎥 核心功能特性

### 🤖 AI-Powered Editing ✅
- 🧠 **Smart Analysis**: AI-driven video content analysis
- ⚡ **One-Click Editing**: Automatic professional editing plans
- 🎯 **Intelligent Suggestions**: Based on film theory and best practices
- 📊 **Visual Planning**: Clear visualization of editing decisions
- 🚀 **Ready to Use**: Fully implemented and testable

### 🎬 Core Editing Features
- 🎞️ **Timeline-based editing** with multi-track support
- ⚡ **Real-time preview** with smooth playback
- ✂️ **Precision cutting** and trimming tools
- 🔄 **Drag & drop** interface for easy editing
- 🎨 **Visual effects** and transitions
- 📝 **AI subtitle integration** for automatic captions

### 📱 Media Support
- 📹 **Multiple formats**: MP4, AVI, MOV, WebM, and more
- 🎵 **Audio editing**: Background music, sound effects, voiceovers
- 🖼️ **Image support**: JPG, PNG, GIF integration
- 📱 **Mobile optimized** for touch devices

## 🛠️ 技术栈

- **Frontend**: Next.js 15, React 18, TypeScript 5.8
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Build Tool**: Turbopack
- **Package Manager**: Bun
- **Video Processing**: FFmpeg.wasm
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Better Auth

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/SmartCut Frontend-app/SmartCut Frontend.git
cd SmartCut Frontend
```

### 2. 安装依赖
```bash
bun install
```

### 3. 启动开发服务器
```bash
cd apps/web
npm run dev
```

### 4. 打开浏览器
访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
SmartCut Frontend/
├── apps/web/                     # Web应用 (主要应用)
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   ├── components/          # React组件
│   │   ├── stores/              # 状态管理
│   │   ├── hooks/               # 自定义Hooks
│   │   ├── lib/                 # 工具库
│   │   └── types/               # 类型定义
│   └── public/                  # 静态资源
├── packages/                     # 包目录
│   ├── auth/                    # 认证包
│   └── db/                      # 数据库包
├── docs/                        # 项目文档
├── roles/                       # 团队角色定义
└── 配置文件
```

## 🎯 开发指南

### 代码质量
```bash
npm run lint          # 代码检查
npm run format        # 代码格式化
npm run check-types   # TypeScript类型检查
```

### 测试
```bash
npm run test          # 运行测试
npm run test:watch    # 监听模式测试
```

### 构建
```bash
npm run build         # 构建项目
npm run start         # 启动生产服务器
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看我们的 [Contributing Guide](./CONTRIBUTING.md) 了解如何参与项目开发。

### 贡献方式
- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🎨 改进用户界面

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 许可证。

## 🔗 相关链接

- [🌐 官方网站](https://opencut.app)
- [📖 完整文档](./docs)
- [🐛 问题反馈](https://github.com/SmartCut Frontend-app/SmartCut Frontend/issues)
- [💬 讨论区](https://github.com/SmartCut Frontend-app/SmartCut Frontend/discussions)
- [📧 联系我们](mailto:hello@opencut.app)

## 🙏 致谢

感谢所有为SmartCut Frontend项目做出贡献的开发者和设计师！

---

<div align="center">
  <p>Made with ❤️ by the SmartCut Frontend Team</p>
  <p>Star ⭐ this repository if you find it helpful!</p>
</div>
