# OpenCut 项目详细技术文档

## 项目概述

OpenCut 是一个基于 Next.js 的开源视频编辑器，采用 Monorepo 架构，支持 Web、桌面和移动端。项目使用 TypeScript、React、Zustand 状态管理，并集成了 FFmpeg 进行视频处理。

## 项目架构

### 1. 根目录配置文件

#### `package.json`
- **作用**: 项目根配置文件，定义 Monorepo 工作空间
- **关键配置**:
  - `workspaces`: 定义工作空间为 `apps/*` 和 `packages/*`
  - `scripts`: 提供统一的开发、构建、代码检查命令
  - `dependencies`: 包含 Next.js 和 wavesurfer.js 等核心依赖

#### `turbo.json`
- **作用**: Turbo 构建系统配置，优化 Monorepo 构建性能
- **关键配置**:
  - `build`: 定义构建依赖关系和输出目录
  - `dev`: 持久化开发服务器配置
  - `lint/format`: 代码质量检查任务

#### `docker-compose.yaml`
- **作用**: 本地开发环境容器化配置
- **服务**:
  - PostgreSQL 数据库
  - Redis 缓存服务
  - 支持本地开发环境快速启动

#### `biome.json`
- **作用**: Biome 代码格式化和检查工具配置
- **功能**: 替代 ESLint + Prettier，提供统一的代码风格

### 2. 应用层 (`apps/`)

#### `apps/web/` - 主 Web 应用

**核心配置文件**:

- **`package.json`**: Web 应用依赖管理
  - 核心依赖: Next.js 15, React 18, Zustand, FFmpeg
  - UI 库: Radix UI, Tailwind CSS, Framer Motion
  - 工具库: Drizzle ORM, Better Auth, Upstash Redis

- **`next.config.ts`**: Next.js 配置
- **`tailwind.config.ts`**: Tailwind CSS 样式配置
- **`drizzle.config.ts`**: 数据库 ORM 配置
- **`tsconfig.json`**: TypeScript 编译配置

**源代码结构**:

#### `src/app/` - Next.js App Router 页面
- **`layout.tsx`**: 根布局组件，包含全局样式和布局结构
- **`page.tsx`**: 首页组件
- **`globals.css`**: 全局样式定义
- **`metadata.ts`**: 应用元数据配置

**页面路由**:
- **`(auth)/`**: 认证相关页面（登录/注册）
- **`editor/[project_id]/`**: 视频编辑器页面
- **`projects/`**: 项目管理页面
- **`blog/`**: 博客页面
- **`api/`**: API 路由

#### `src/components/` - UI 组件库

**核心组件**:
- **`editor/`**: 视频编辑器专用组件
  - `timeline/`: 时间轴组件
  - `media-panel/`: 媒体面板组件
  - `properties-panel/`: 属性面板组件
  - `preview-panel.tsx`: 预览面板组件
  - `audio-waveform.tsx`: 音频波形组件
  - `selection-box.tsx`: 选择框组件

- **`ui/`**: 通用 UI 组件（基于 Radix UI）
  - 表单组件: `button.tsx`, `input.tsx`, `select.tsx`
  - 布局组件: `card.tsx`, `dialog.tsx`, `sheet.tsx`
  - 交互组件: `dropdown-menu.tsx`, `context-menu.tsx`
  - 媒体组件: `video-player.tsx`, `audio-player.tsx`

- **`landing/`**: 落地页组件
- **`editor-header.tsx`**: 编辑器头部组件
- **`editor-provider.tsx`**: 编辑器上下文提供者
- **`storage-provider.tsx`**: 存储提供者组件

#### `src/stores/` - 状态管理 (Zustand)

**核心状态存储**:
- **`editor-store.ts`**: 编辑器全局状态
  - 画布尺寸配置
  - 初始化状态管理
  - 画布预设管理

- **`timeline-store.ts`**: 时间轴状态管理
  - 轨道管理
  - 元素操作
  - 时间轴缩放和滚动

- **`media-store.ts`**: 媒体文件管理
  - 媒体文件存储
  - 文件类型处理
  - 媒体元数据管理

- **`project-store.ts`**: 项目管理
  - 项目创建/保存/加载
  - 项目元数据管理

- **`playback-store.ts`**: 播放控制
  - 播放状态管理
  - 播放头位置
  - 播放速度控制

- **`keybindings-store.ts`**: 快捷键管理
  - 快捷键配置
  - 快捷键冲突检测

- **`panel-store.ts`**: 面板状态管理
  - 面板显示/隐藏
  - 面板布局配置

#### `src/hooks/` - 自定义 React Hooks

**编辑器专用 Hooks**:
- **`use-timeline-*.ts`**: 时间轴相关 Hooks
  - `use-timeline-playhead.ts`: 播放头控制
  - `use-timeline-zoom.ts`: 时间轴缩放
  - `use-timeline-snapping.ts`: 时间轴吸附
  - `use-timeline-element-resize.ts`: 元素调整大小

- **`use-editor-actions.ts`**: 编辑器操作管理
- **`use-selection-box.ts`**: 选择框交互
- **`use-playback-controls.ts`**: 播放控制
- **`use-keybindings.ts`**: 快捷键处理
- **`use-drag-drop.ts`**: 拖拽功能
- **`use-aspect-ratio.ts`**: 宽高比计算

**认证 Hooks**:
- **`auth/useLogin.ts`**: 登录逻辑
- **`auth/useSignUp.ts`**: 注册逻辑

#### `src/lib/` - 工具库

**核心工具**:
- **`ffmpeg-utils.ts`**: FFmpeg 视频处理工具
- **`media-processing.ts`**: 媒体文件处理
- **`timeline.ts`**: 时间轴计算工具
- **`time.ts`**: 时间格式化工具
- **`utils.ts`**: 通用工具函数

**存储相关**:
- **`storage/`**: 本地存储适配器
  - `indexeddb-adapter.ts`: IndexedDB 存储
  - `opfs-adapter.ts`: Origin Private File System 存储
  - `storage-service.ts`: 存储服务统一接口

**API 工具**:
- **`blog-query.ts`**: 博客数据查询
- **`fetch-github-stars.ts`**: GitHub 星标获取
- **`rate-limit.ts`**: API 限流工具
- **`waitlist.ts`**: 等待列表管理

#### `src/types/` - TypeScript 类型定义

**核心类型**:
- **`timeline.ts`**: 时间轴相关类型
  - `TimelineElement`: 时间轴元素
  - `TimelineTrack`: 时间轴轨道
  - `TrackType`: 轨道类型

- **`editor.ts`**: 编辑器类型
- **`project.ts`**: 项目类型
- **`playback.ts`**: 播放控制类型
- **`keybinding.ts`**: 快捷键类型
- **`post.ts`**: 博客文章类型

#### `src/constants/` - 常量定义

- **`actions.ts`**: 编辑器操作常量
- **`font-constants.ts`**: 字体相关常量
- **`timeline-constants.ts`**: 时间轴常量

#### `src/data/` - 静态数据

- **`colors.ts`**: 颜色配置数据

### 3. 包层 (`packages/`)

#### `packages/db/` - 数据库包

**核心文件**:
- **`src/schema.ts`**: 数据库模式定义
  - `users`: 用户表
  - `sessions`: 会话表
  - `accounts`: 账户表
  - `verifications`: 验证表
  - `waitlist`: 等待列表表

- **`src/index.ts`**: 数据库连接和导出
- **`src/keys.ts`**: 环境变量键定义
- **`drizzle.config.ts`**: Drizzle ORM 配置

#### `packages/auth/` - 认证包

**核心文件**:
- **`src/server.ts`**: 服务端认证配置
- **`src/client.ts`**: 客户端认证配置
- **`src/keys.ts`**: 认证环境变量键
- **`src/index.ts`**: 统一导出

## 技术栈详解

### 前端技术栈
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **状态管理**: Zustand
- **UI 库**: Radix UI + Tailwind CSS
- **动画**: Framer Motion
- **视频处理**: FFmpeg (WebAssembly)
- **音频处理**: WaveSurfer.js

### 后端技术栈
- **数据库**: PostgreSQL + Drizzle ORM
- **缓存**: Redis (Upstash)
- **认证**: Better Auth
- **API**: Next.js API Routes

### 开发工具
- **包管理**: Bun
- **构建工具**: Turbo
- **代码质量**: Biome
- **容器化**: Docker + Docker Compose

## 核心功能模块

### 1. 视频编辑器核心
- **时间轴编辑**: 多轨道时间轴编辑
- **媒体管理**: 支持视频、音频、图片导入
- **文本编辑**: 动态文本添加和样式
- **实时预览**: 基于 Canvas 的实时预览
- **导出功能**: FFmpeg 视频导出

### 2. 项目管理
- **项目创建**: 支持多种画布尺寸
- **项目保存**: 本地存储 + 云端同步
- **项目分享**: 项目链接分享

### 3. 用户系统
- **用户认证**: 邮箱/密码 + OAuth
- **用户管理**: 个人资料管理
- **权限控制**: 基于角色的访问控制

### 4. 性能优化
- **代码分割**: Next.js 自动代码分割
- **懒加载**: 组件和资源懒加载
- **缓存策略**: Redis 缓存 + 浏览器缓存
- **WebAssembly**: FFmpeg 高性能视频处理

## 部署架构

### 开发环境
- **本地开发**: Docker Compose 启动数据库和 Redis
- **热重载**: Next.js 开发服务器
- **类型检查**: TypeScript 实时类型检查

### 生产环境
- **部署平台**: Vercel
- **数据库**: PostgreSQL (Vercel Postgres)
- **缓存**: Redis (Upstash)
- **CDN**: Vercel Edge Network
- **监控**: Vercel Analytics

## 开发指南

### 环境设置
1. 安装依赖: `bun install`
2. 配置环境变量: 复制 `.env.example` 到 `.env.local`
3. 启动数据库: `docker-compose up -d`
4. 运行迁移: `bun run db:migrate`
5. 启动开发服务器: `bun dev`

### 代码规范
- **TypeScript**: 严格类型检查
- **代码格式化**: Biome 自动格式化
- **提交规范**: 遵循 Conventional Commits
- **测试**: 单元测试和集成测试

### 贡献指南
- **功能开发**: 基于 feature 分支
- **Bug 修复**: 基于 bugfix 分支
- **代码审查**: 所有 PR 需要审查
- **文档更新**: 同步更新相关文档

## 文件结构详解

```
OpenCut/
├── apps/
│   └── web/                    # 主 Web 应用
│       ├── src/
│       │   ├── app/            # Next.js App Router 页面
│       │   ├── components/     # UI 组件库
│       │   ├── stores/         # Zustand 状态管理
│       │   ├── hooks/          # 自定义 React Hooks
│       │   ├── lib/            # 工具库
│       │   ├── types/          # TypeScript 类型定义
│       │   ├── constants/      # 常量定义
│       │   └── data/           # 静态数据
│       ├── public/             # 静态资源
│       ├── migrations/         # 数据库迁移文件
│       └── package.json        # Web 应用依赖
├── packages/
│   ├── auth/                   # 认证包
│   └── db/                     # 数据库包
├── package.json                # 根项目配置
├── turbo.json                  # Turbo 构建配置
├── docker-compose.yaml         # Docker 开发环境
└── biome.json                  # 代码质量配置
```

## 关键文件说明

### 状态管理文件
- **`editor-store.ts`**: 管理编辑器全局状态，包括画布尺寸、初始化状态等
- **`timeline-store.ts`**: 管理时间轴相关状态，包括轨道、元素、缩放等
- **`media-store.ts`**: 管理媒体文件状态，包括文件存储、类型处理等
- **`project-store.ts`**: 管理项目状态，包括创建、保存、加载等
- **`playback-store.ts`**: 管理播放控制状态，包括播放状态、播放头位置等

### 核心组件文件
- **`preview-panel.tsx`**: 视频预览面板，基于 Canvas 实现实时预览
- **`timeline/index.tsx`**: 时间轴主组件，实现多轨道编辑
- **`media-panel/index.tsx`**: 媒体面板，管理媒体文件导入和预览
- **`properties-panel/index.tsx`**: 属性面板，编辑选中元素的属性

### 工具库文件
- **`ffmpeg-utils.ts`**: FFmpeg WebAssembly 集成，处理视频转码和导出
- **`media-processing.ts`**: 媒体文件处理工具，包括格式检测、元数据提取等
- **`storage-service.ts`**: 存储服务统一接口，支持多种存储后端

### 类型定义文件
- **`timeline.ts`**: 定义时间轴相关的所有类型，包括元素、轨道、操作等
- **`editor.ts`**: 定义编辑器相关的类型，包括画布、项目等
- **`keybinding.ts`**: 定义快捷键相关的类型和配置

## 开发注意事项

### 性能优化
1. **状态管理**: 使用 Zustand 进行细粒度状态管理
2. **组件优化**: 合理使用 React.memo 和 useMemo
3. **资源加载**: 实现媒体文件的懒加载和预加载
4. **内存管理**: 及时清理不需要的媒体文件和缓存

### 兼容性考虑
1. **浏览器支持**: 支持现代浏览器的 WebAssembly
2. **移动端适配**: 响应式设计和触摸交互
3. **文件格式**: 支持常见的视频、音频、图片格式

### 安全性
1. **文件上传**: 验证文件类型和大小
2. **用户认证**: 使用 Better Auth 进行安全的用户认证
3. **数据保护**: 实现用户数据的加密和隐私保护

## 扩展开发

### 添加新功能
1. **新组件**: 在 `src/components/` 下创建新组件
2. **新状态**: 在 `src/stores/` 下创建新的状态存储
3. **新类型**: 在 `src/types/` 下定义新的类型
4. **新工具**: 在 `src/lib/` 下添加新的工具函数

### 自定义配置
1. **环境变量**: 在 `src/env.ts` 中添加新的环境变量
2. **数据库模式**: 在 `packages/db/src/schema.ts` 中添加新的表
3. **认证配置**: 在 `packages/auth/` 中配置新的认证方式

---

*本文档提供了 OpenCut 项目的完整技术架构和开发指南，涵盖了从项目结构到具体实现的各个方面。* 