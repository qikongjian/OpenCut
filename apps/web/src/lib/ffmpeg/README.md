# FFmpeg 模块重构说明

## 📁 **模块结构**

```
src/lib/ffmpeg/
├── index.ts                    # 主入口，统一导出所有功能
├── types/
│   └── ffmpeg-types.ts        # 类型定义
├── core/
│   ├── init.ts               # FFmpeg初始化和测试
│   └── config.ts             # 编码设置和配置
├── utils/
│   └── export-utils.ts       # 导出工具函数（缓存、取消等）
├── operations/
│   ├── basic-video-ops.ts    # 基础视频操作（导出、裁剪、转换等）
│   ├── timeline-export.ts    # 时间轴导出核心功能
│   └── audio-ops.ts          # 音频处理操作
└── effects/
    └── video-effects.ts      # 视频特效（转场、镜像、蒙板、字幕）
```

## 🎯 **重构优势**

### 1. **模块化设计**
- **单一职责**：每个模块只负责特定功能
- **易于维护**：问题定位和修改更加精准
- **团队协作**：减少代码冲突，提高开发效率

### 2. **性能优化**
- **按需加载**：只导入需要的功能模块
- **代码分割**：减少初始包大小
- **缓存友好**：模块化有利于浏览器缓存

### 3. **开发体验**
- **类型安全**：统一的类型定义
- **智能提示**：更好的IDE支持
- **测试友好**：单元测试更容易编写

## 📋 **模块功能说明**

### **core/init.ts**
- FFmpeg实例初始化
- 性能优化配置
- 错误处理和重试机制
- 功能测试

### **core/config.ts**
- 智能编码设置选择
- 性能配置预设
- 缓存键生成
- 格式特定优化

### **operations/basic-video-ops.ts**
- `exportVideo()` - 视频导出
- `trimVideo()` - 视频裁剪
- `convertToWebM()` - 格式转换
- `generateThumbnail()` - 缩略图生成
- `getVideoInfo()` - 视频信息获取
- `extractAudio()` - 音频提取

### **operations/timeline-export.ts**
- `exportTimeline()` - 时间轴导出主函数
- 智能模式选择（超快/标准）
- 视频片段处理和合并
- 进度管理和取消控制

### **operations/audio-ops.ts**
- `processAudioTracks()` - 音频轨道处理
- 音频混合和同步
- 音量调节和延迟

### **effects/video-effects.ts**
- `applyTransitionEffects()` - 转场效果
- `applyMirrorEffects()` - 镜像效果
- `applyMaskEffects()` - 蒙板效果
- `renderSubtitlesToVideo()` - 字幕渲染

### **utils/export-utils.ts**
- 缓存管理（导出/缩略图）
- 导出状态控制
- 取消机制
- 工具函数

## 🚀 **使用方式**

### **基础导入**
```typescript
import { exportTimeline, exportVideo } from '@/lib/ffmpeg';
```

### **按需导入**
```typescript
import { initFFmpeg } from '@/lib/ffmpeg/core/init';
import { applyTransitionEffects } from '@/lib/ffmpeg/effects/video-effects';
```

### **类型导入**
```typescript
import type { TimelineData, ExportConfig } from '@/lib/ffmpeg/types/ffmpeg-types';
```

## 🔧 **迁移指南**

### **旧的导入方式**
```typescript
import { exportTimeline } from '@/lib/ffmpeg-utils';
```

### **新的导入方式**
```typescript
import { exportTimeline } from '@/lib/ffmpeg';
```

## 📊 **性能对比**

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| 文件大小 | 2400+ 行 | 平均 200-400 行/模块 | ✅ 可读性提升 |
| 加载时间 | 全量加载 | 按需加载 | ✅ 性能提升 |
| 维护性 | 困难 | 简单 | ✅ 开发效率提升 |
| 测试覆盖 | 困难 | 容易 | ✅ 质量提升 |

## 🎨 **最佳实践**

1. **统一导入**：优先使用主入口 `@/lib/ffmpeg`
2. **类型安全**：使用 TypeScript 类型定义
3. **错误处理**：每个模块都有完善的错误处理
4. **性能优化**：利用缓存和智能模式选择
5. **代码复用**：通用工具函数统一管理

## 🔮 **未来扩展**

- **WebWorker 支持**：后台处理大文件
- **GPU 加速**：WebGL 渲染优化
- **插件系统**：自定义特效扩展
- **云端处理**：服务端 FFmpeg 集成 