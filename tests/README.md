# 🧪 OpenCut 测试中心

本文件夹包含了 OpenCut 项目的所有测试文件、调试脚本和测试页面。

## 📁 测试结构

```
tests/
├── README.md                           # 本文件 - 测试索引
├── unit/                              # 单元测试
│   ├── lib/                           # 库函数测试
│   │   ├── subtitle-integration.test.ts
│   │   └── export-system.test.ts
│   └── stores/                        # 状态管理测试
│       └── keybindings-store.test.ts
├── integration/                       # 集成测试
│   ├── export/                        # 导出功能测试
│   │   ├── ai-clips-test/             # AI剪辑测试
│   │   └── test/                      # 通用导出测试
│   └── api/                          # API测试
│       └── test-ai-api/              # AI API测试
├── e2e/                              # 端到端测试
│   ├── pages/                        # 页面测试
│   │   ├── test-export/              # 导出页面测试
│   │   ├── test-ai-export/           # AI导出测试
│   │   ├── test-video-players/       # 视频播放器测试
│   │   ├── test-subtitles/           # 字幕测试
│   │   └── system-test/              # 系统测试
│   └── components/                   # 组件测试
│       ├── ffmpeg-test.tsx           # FFmpeg组件测试
│       └── simple-ffmpeg-test.tsx    # 简单FFmpeg测试
├── performance/                      # 性能测试
│   ├── export-optimization/          # 导出优化测试
│   ├── export-progress-test/         # 导出进度测试
│   └── seamless-playback/           # 无缝播放测试
├── debug/                           # 调试脚本
│   ├── debug-export.js              # 导出调试脚本
│   ├── debug-thumbnail-generation.js # 缩略图调试脚本
│   └── 导出性能优化验证脚本.js       # 性能优化验证
├── manual/                          # 手动测试
│   ├── simple-export-test/          # 简单导出测试
│   ├── test-add-video/              # 添加视频测试
│   ├── test-dynamic-import/         # 动态导入测试
│   └── test-api-media/              # API媒体测试
└── deployment/                      # 部署测试
    ├── test-deployment.sh           # 部署测试脚本
    ├── test-ai-api.js              # AI API测试脚本
    └── compile_test.sh             # 编译测试脚本
```

## 🧪 测试分类

### 🔬 单元测试 (Unit Tests)
- **库函数测试**: 核心功能模块的单元测试
- **状态管理测试**: Store和状态管理的测试
- **组件测试**: React组件的单元测试

### 🔗 集成测试 (Integration Tests)
- **导出功能测试**: 完整导出流程的集成测试
- **API测试**: 各种API接口的集成测试
- **服务集成**: 不同服务间的集成测试

### 🌐 端到端测试 (E2E Tests)
- **页面测试**: 完整用户流程的端到端测试
- **功能测试**: 核心功能的完整测试流程
- **用户体验测试**: 真实用户场景测试

### ⚡ 性能测试 (Performance Tests)
- **导出性能**: 视频导出性能测试
- **播放性能**: 视频播放性能测试
- **内存使用**: 内存和资源使用测试

### 🐛 调试脚本 (Debug Scripts)
- **导出调试**: 导出功能的调试工具
- **性能分析**: 性能问题的分析脚本
- **错误诊断**: 错误定位和诊断工具

### 👨‍💻 手动测试 (Manual Tests)
- **功能验证**: 需要人工验证的测试
- **用户界面测试**: UI/UX相关的手动测试
- **兼容性测试**: 浏览器和设备兼容性测试

### 🚀 部署测试 (Deployment Tests)
- **部署验证**: 部署流程的验证测试
- **环境测试**: 不同环境的测试脚本
- **配置测试**: 配置文件和环境变量测试

## 🏃‍♂️ 运行测试

### 单元测试
```bash
# 运行所有单元测试
npm test

# 运行特定测试文件
npm test -- subtitle-integration.test.ts

# 监听模式运行测试
npm test -- --watch
```

### 集成测试
```bash
# 运行集成测试
npm run test:integration

# 运行API测试
npm run test:api
```

### 端到端测试
```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问测试页面
# http://localhost:3000/test-export
# http://localhost:3000/test-ai-api
# http://localhost:3000/system-test
```

### 性能测试
```bash
# 运行性能测试
npm run test:performance

# 运行导出性能测试
node tests/debug/导出性能优化验证脚本.js
```

### 调试脚本
```bash
# 运行导出调试
node tests/debug/debug-export.js

# 运行缩略图调试
node tests/debug/debug-thumbnail-generation.js
```

### 部署测试
```bash
# 运行部署测试
cd tests/deployment
./test-deployment.sh

# 运行编译测试
./compile_test.sh
```

## 📊 测试覆盖率

- 目标覆盖率: 80%+
- 核心功能覆盖率: 90%+
- 关键路径覆盖率: 95%+

## 🔧 测试工具

- **Jest**: 单元测试框架
- **React Testing Library**: React组件测试
- **Playwright**: 端到端测试
- **Node.js**: 调试脚本运行环境

## 📝 测试规范

1. **命名规范**: 测试文件以 `.test.ts` 或 `.spec.ts` 结尾
2. **目录结构**: 按功能模块组织测试文件
3. **测试描述**: 使用清晰的测试描述和断言
4. **数据隔离**: 每个测试独立，不依赖其他测试
5. **清理资源**: 测试后清理临时文件和资源

## 🚨 注意事项

- 测试文件不应包含敏感信息
- 大文件和二进制文件应放在 `.gitignore` 中
- 定期清理过时的测试文件
- 保持测试文档的更新

---

**提示**: 运行测试前请确保已安装所有依赖并启动了必要的服务。
