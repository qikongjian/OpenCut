# OpenCut 导出系统

OpenCut 的智能混合导出系统，支持前端和后端导出，自动选择最优策略。

## 🎯 核心特性

- **智能策略选择**: 根据设备性能、项目复杂度和用户偏好自动选择最优导出方案
- **混合架构**: 支持前端（FFmpeg.wasm）和后端（原生FFmpeg）导出
- **隐私保护**: 默认本地处理，可选云端加速
- **分段处理**: 避免内存溢出，支持大项目导出
- **实时进度**: 详细的进度反馈和错误处理
- **ASS字幕**: 完整的字幕支持，包括样式和特效

## 🏗️ 架构概览

```
导出系统架构
├── ExportManager (导出管理器)
│   ├── FrontendExporter (前端导出引擎)
│   │   ├── FFmpegManager (FFmpeg.wasm管理)
│   │   └── SegmentProcessor (分段处理器)
│   ├── BackendExporter (后端导出客户端)
│   │   ├── StreamAPI (流式API客户端)
│   │   └── ProgressTracker (进度跟踪)
│   └── StrategyEngine (策略决策引擎)
│       ├── DeviceDetection (设备检测)
│       ├── ProjectAnalyzer (项目分析)
│       └── PerformanceEstimator (性能估算)
├── IRGenerator (中间表示生成器)
├── ASSGenerator (ASS字幕生成器)
└── UI Components (用户界面组件)
    ├── ExportButton (导出按钮)
    ├── ExportDialog (导出对话框)
    └── ProgressDialog (进度对话框)
```

## 🚀 快速开始

### 1. 基础使用

```typescript
import { exportManager } from "@/lib/export";

// 智能导出（推荐）
const result = await exportManager.smartExport({
  privacy: 'balanced',
  quality: 'standard',
  allowCloudProcessing: true,
});

console.log('导出完成:', result.url);
```

### 2. 监听进度

```typescript
const result = await exportManager.smartExport(
  {
    privacy: 'balanced',
    quality: 'standard',
  },
  (progress) => {
    console.log(`进度: ${Math.round(progress.overall * 100)}%`);
    console.log(`阶段: ${progress.stage}`);
    console.log(`消息: ${progress.message}`);
  }
);
```

### 3. 手动选择导出方法

```typescript
// 前端导出
const frontendResult = await exportManager.manualExport({
  quality: 'standard',
  method: 'frontend',
  format: 'mp4',
  codec: 'h264',
  subtitleMode: 'hard',
});

// 后端导出
const backendResult = await exportManager.manualExport({
  quality: 'professional',
  method: 'backend',
  format: 'mp4',
  codec: 'h264',
  useGPU: true,
  subtitleMode: 'hard',
});
```

## 📊 策略决策

### 自动策略选择

系统会根据以下因素自动选择最优导出策略：

1. **设备性能**
   - CPU核心数
   - 可用内存
   - 浏览器能力（WebCodecs、OffscreenCanvas等）

2. **项目复杂度**
   - 视频片段数量
   - 特效复杂度
   - 文件大小
   - 总时长

3. **用户偏好**
   - 隐私级别（strict/balanced/performance）
   - 质量要求（preview/standard/professional）
   - 云端处理偏好

### 策略类型

| 策略 | 适用场景 | 优势 | 劣势 |
|------|----------|------|------|
| 前端导出 | 小项目、隐私优先 | 隐私保护、无网络依赖 | 性能受限、处理时间长 |
| 后端导出 | 大项目、性能优先 | 高性能、稳定可靠 | 需要网络、隐私考虑 |
| 混合导出 | 复杂项目 | 灵活性高、容错性强 | 实现复杂 |

## 🔧 配置选项

### 导出质量

```typescript
// 预览质量 - 快速导出，适合预览
quality: 'preview'  // CRF 28, 2Mbps视频, 128k音频

// 标准质量 - 平衡质量和大小
quality: 'standard' // CRF 23, 5Mbps视频, 192k音频

// 专业质量 - 最高质量
quality: 'professional' // CRF 18, 15Mbps视频, 320k音频
```

### 隐私级别

```typescript
// 严格隐私 - 仅本地处理
privacy: 'strict'

// 平衡模式 - 智能选择
privacy: 'balanced'

// 性能优先 - 优先云端处理
privacy: 'performance'
```

## 🎬 字幕支持

### ASS字幕格式

系统支持完整的ASS字幕格式，包括：

- 多种字体和样式
- 位置和对齐
- 颜色和透明度
- 描边和阴影
- 动画效果

```typescript
// 字幕模式
subtitleMode: 'hard'  // 硬编码到视频
subtitleMode: 'soft'  // 软字幕（可选择）
subtitleMode: 'none'  // 无字幕
```

## 📈 性能优化

### 前端优化

1. **分段处理**: 将长视频分割为小段处理，避免内存溢出
2. **代理媒体**: 使用低分辨率代理文件加速预览
3. **内存管理**: 智能垃圾回收和内存监控
4. **并发控制**: 限制同时处理的段数

### 后端优化

1. **GPU加速**: 支持NVENC/QuickSync硬件编码
2. **并行处理**: 多核CPU并行编码
3. **流式传输**: 边处理边传输，减少等待时间
4. **缓存优化**: 智能缓存常用资源

## 🔍 监控和调试

### 健康检查

```typescript
import { checkExportSystemHealth } from "@/lib/export";

const health = await checkExportSystemHealth();
console.log('系统状态:', health.overall);
console.log('组件状态:', health.components);
console.log('详细信息:', health.details);
```

### 性能基准测试

```typescript
import { runPerformanceBenchmark } from "@/lib/export";

const benchmark = await runPerformanceBenchmark();
console.log('CPU评分:', benchmark.cpuScore);
console.log('内存评分:', benchmark.memoryScore);
console.log('渲染评分:', benchmark.renderScore);
```

## 🧪 测试

运行测试套件：

```bash
npm test -- lib/export/__tests__/export-system.test.ts
```

测试覆盖：
- 设备检测
- 项目分析
- IR生成和验证
- ASS字幕生成
- 策略决策
- 导出管理器
- 边界情况处理

## 🚨 错误处理

### 常见错误

1. **内存不足**: 降低质量或使用后端导出
2. **网络问题**: 切换到前端导出
3. **文件过大**: 启用分段处理
4. **格式不支持**: 检查浏览器兼容性

### 错误恢复

系统支持自动错误恢复：
- 主策略失败时自动尝试备选方案
- 分段失败时重试单个段
- 网络中断时自动重连

## 📝 开发指南

### 添加新的导出格式

1. 在 `types/export.ts` 中添加格式定义
2. 在 `FFmpegCommandBuilder` 中添加格式支持
3. 更新策略引擎的格式选择逻辑
4. 添加相应的测试用例

### 扩展策略引擎

1. 在 `strategy-engine.ts` 中添加新的决策因子
2. 更新 `determineStrategy` 方法
3. 添加新的性能估算逻辑
4. 更新测试覆盖

## 🔗 相关文档

- [FFmpeg.wasm 文档](https://ffmpegwasm.netlify.app/)
- [ASS字幕格式规范](http://docs.aegisub.org/3.2/ASS_Tags/)
- [WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进导出系统！

## 📄 许可证

MIT License
