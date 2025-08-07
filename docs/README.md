# OpenCut 项目文档

欢迎来到 OpenCut 项目文档中心！这里包含了项目的所有技术文档、开发指南和功能规划。

## 📚 文档导航

### 🚀 快速开始
- [项目概述](../README.md) - 项目介绍和快速开始指南
- [开发环境搭建](./development/setup.md) - 详细的开发环境配置
- [贡献指南](./development/contributing.md) - 如何参与项目开发

### 🛠️ 开发文档
- [技术架构](./technical/architecture.md) - 项目整体技术架构
- [API 文档](./technical/api.md) - 后端 API 接口文档
- [组件库](./technical/components.md) - 前端组件使用指南
- [状态管理](./technical/state-management.md) - Zustand 状态管理方案

### 🎬 功能文档
- [功能概览](./features/overview.md) - 所有功能的总览
- [视频编辑](./features/video-editing.md) - 核心视频编辑功能
- [媒体管理](./features/media-management.md) - 媒体文件管理功能
- [导入导出](./features/import-export.md) - 文件导入导出功能

### 📋 项目规划
- [开发路线图](./planning/roadmap.md) - 项目发展规划
- [功能需求](./planning/requirements.md) - 详细功能需求分析
- [任务清单](./planning/tasks.md) - 当前开发任务

## 🔧 开发工具

### 技术栈
- **前端**: Next.js 15, React 18, TypeScript
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **构建工具**: Turbo (Monorepo)
- **包管理**: Bun
- **数据库**: PostgreSQL
- **缓存**: Redis

### 开发命令
```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 构建项目
bun build

# 代码检查
bun lint

# 格式化代码
bun format
```

## 📖 文档维护

### 文档更新原则
1. **及时更新**: 代码变更时同步更新相关文档
2. **清晰简洁**: 使用简洁明了的语言描述
3. **结构化**: 保持良好的文档结构和导航
4. **示例丰富**: 提供充足的代码示例和截图

### 文档贡献
如果您发现文档有误或需要补充，请：
1. 创建 Issue 描述问题
2. 提交 PR 修复文档
3. 在 PR 中详细说明修改内容

---

**最后更新**: 2025-01-07
**维护者**: OpenCut 开发团队
