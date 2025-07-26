# OpenCut 视频编辑器 - Cursor 开发任务文档

## 📋 项目概述

基于现有的 OpenCut 前端架构，实现14个核心视频编辑功能。项目采用 Next.js 15 + TypeScript + Zustand 架构，使用 FFmpeg.wasm 进行客户端视频处理。

## 🎯 任务分类与优先级

### Phase 1: 基础设施增强 (P0 - 必须完成)
### Phase 2: 核心编辑功能 (P1 - 重要功能)  
### Phase 3: 视觉效果功能 (P2 - 增强功能)
### Phase 4: 高级智能功能 (P3 - 创新功能)

---

## Phase 1: 基础设施增强

### 任务 1.1: 增强导入系统

**任务描述**: 扩展现有的 MediaStore，支持更多格式和批量导入功能

**技术要点**:
- 扩展 `src/stores/media-store.ts`
- 增强 `src/lib/media-processing.ts` 
- 支持拖拽批量导入

**Cursor 提示词**:
```
根据OpenCut现有架构，我需要增强导入系统。请帮我：

1. 扩展 src/stores/media-store.ts，添加以下功能：
   - 批量文件导入处理
   - 支持文件夹拖拽导入
   - 导入进度跟踪
   - 文件格式验证（支持 MP4/AVI/MOV/MKV/MP3/WAV/JPG/PNG/GIF等）

2. 增强 src/lib/media-processing.ts：
   - 添加 getBatchFileMetadata 函数处理批量元数据提取
   - 实现 validateFileFormat 函数验证文件格式
   - 优化 generateVideoThumbnail 支持批量缩略图生成

3. 创建 src/components/enhanced-media-import.tsx 组件：
   - 支持拖拽区域显示
   - 批量导入进度条
   - 导入错误处理和提示

请保持与现有 Zustand store 模式一致，使用 TypeScript 严格类型定义。
```

**验收标准**:
- [ ] 支持10+种文件格式导入
- [ ] 批量导入100个文件成功率 > 95%
- [ ] 拖拽导入响应时间 < 1秒
- [ ] 错误处理和用户提示完善

---

### 任务 1.2: 完善导出系统

**任务描述**: 基于现有 FFmpeg 集成，实现完整的视频导出功能

**技术要点**:
- 扩展 `src/lib/ffmpeg-utils.ts`
- 新增导出配置管理
- 实现导出进度跟踪

**Cursor 提示词**:
```
基于 OpenCut 现有的 FFmpeg.wasm 集成，我需要实现完整的导出系统：

1. 扩展 src/lib/ffmpeg-utils.ts：
   - 实现 exportVideo 函数，支持多种格式(MP4/WebM/AVI/MOV)
   - 添加 generateExportCommands 函数生成 FFmpeg 命令序列
   - 实现导出质量配置(480p/720p/1080p/4K)和帧率控制(24/30/60fps)
   - 添加导出进度回调机制

2. 创建 src/stores/export-store.ts：
   - 管理导出配置状态(分辨率、格式、质量等)
   - 跟踪导出进度和状态
   - 处理导出任务队列

3. 创建 src/components/export-dialog.tsx：
   - 导出设置面板(格式、质量、预设选择)
   - 实时进度显示
   - 导出预览功能

请确保与现有的 timeline-store 和 media-store 数据流集成，支持当前项目的时间线数据导出。
```

**验收标准**:
- [ ] 支持 MP4/WebM/AVI/MOV 格式导出
- [ ] 支持 480p-4K 分辨率选择
- [ ] 导出进度准确显示
- [ ] 1080p 视频导出时间 < 实际时长的2倍

---

### 任务 1.3: 增强撤销重做系统

**任务描述**: 扩展现有的 Timeline Store 历史记录功能，支持更复杂的操作撤销

**技术要点**:
- 扩展 `src/stores/timeline-store.ts` 的历史记录
- 支持操作分组和选择性撤销
- 添加历史记录预览

**Cursor 提示词**:
```
OpenCut 当前在 timeline-store.ts 中有基础的撤销/重做功能，我需要增强它：

1. 扩展 src/stores/timeline-store.ts 的历史记录系统：
   - 实现操作分组功能(例如批量操作作为一个历史记录)
   - 添加历史记录描述和预览缩略图
   - 支持选择性撤销(跳过某些操作)
   - 增加历史记录搜索和筛选

2. 创建 src/components/history-panel.tsx：
   - 历史记录列表显示
   - 操作预览和描述
   - 快速跳转到指定历史状态
   - 历史记录分支管理

3. 增强现有的 useActionHandler 系统：
   - 添加更多撤销/重做相关的动作
   - 支持快捷键操作(Ctrl+Z, Ctrl+Y)
   - 添加操作确认提示

请保持与现有的 timeline 数据结构兼容，确保所有编辑操作都能正确记录历史。
```

**验收标准**:
- [ ] 支持至少100步历史记录
- [ ] 撤销/重做响应时间 < 200ms
- [ ] 支持操作分组和批量撤销
- [ ] 历史记录预览功能正常

---

## Phase 2: 核心编辑功能

### 任务 2.1: 实现精确剪辑功能

**任务描述**: 基于现有时间线系统，实现帧级别精确剪辑

**技术要点**:
- 扩展 TimelineElement 的 trim 功能
- 实现时间码精确控制
- 添加剪辑预览

**Cursor 提示词**:
```
基于 OpenCut 现有的时间线系统，我需要实现精确的剪辑功能：

1. 扩展 src/stores/timeline-store.ts：
   - 增强 updateElementTrim 函数支持帧级别精度
   - 添加 splitElementAt 函数在指定时间点分割元素
   - 实现 mergeElements 函数合并相邻元素
   - 添加批量剪辑操作支持

2. 创建 src/components/editor/trim-controls.tsx：
   - 时间码输入框(支持帧数显示)
   - 精确剪辑控制按钮
   - 剪辑点预览和微调
   - 快捷键支持(I/O键设置入出点)

3. 增强 src/components/editor/timeline/timeline-element.tsx：
   - 添加trim手柄的拖拽精度控制
   - 实现元素分割的可视化指示器
   - 支持多选元素的批量剪辑

请确保剪辑操作与现有的播放控制和预览系统同步，维持时间精度。
```

**验收标准**:
- [ ] 支持帧级别精确剪辑
- [ ] 剪辑操作响应时间 < 500ms
- [ ] 时间码显示和输入准确
- [ ] 支持批量剪辑操作

---

### 任务 2.2: 实现插入和覆盖编辑模式

**任务描述**: 扩展时间线编辑功能，支持专业的插入和覆盖编辑模式

**技术要点**:
- 实现编辑模式切换
- 添加波纹编辑支持
- 处理元素冲突和自动调整

**Cursor 提示词**:
```
我需要为 OpenCut 添加专业的插入和覆盖编辑模式：

1. 扩展 src/stores/timeline-store.ts：
   - 添加 EditMode 枚举('insert', 'overwrite', 'replace')
   - 实现 insertElementAt 函数(插入模式推动后续元素)
   - 实现 overwriteElementAt 函数(覆盖模式处理重叠)
   - 添加 rippleEditingEnabled 状态控制波纹编辑

2. 创建 src/components/editor/edit-mode-toolbar.tsx：
   - 编辑模式切换按钮
   - 波纹编辑开关
   - 编辑模式指示器和说明
   - 相关快捷键提示

3. 增强时间线拖拽逻辑：
   - 根据编辑模式处理元素放置
   - 实时显示插入/覆盖预览
   - 处理元素冲突和自动对齐
   - 支持跨轨道的编辑操作

请确保编辑模式切换不影响现有的撤销/重做功能，并与选择和拖拽系统集成。
```

**验收标准**:
- [ ] 支持插入、覆盖、替换三种编辑模式
- [ ] 波纹编辑功能正常工作
- [ ] 编辑模式切换流畅
- [ ] 元素冲突处理准确

---

### 任务 2.3: 实现轨道内元素重排序

**任务描述**: 实现拖拽调整元素顺序，支持自动对齐和磁性吸附

**技术要点**:
- 实现拖拽重排序逻辑
- 添加网格对齐和磁性吸附
- 支持批量调整

**Cursor 提示词**:
```
为 OpenCut 实现轨道内元素重排序功能：

1. 扩展 src/stores/timeline-store.ts：
   - 添加 moveElementToPosition 函数调整元素在轨道内的位置
   - 实现 moveElementToTrack 函数支持跨轨道移动
   - 添加 snapSettings 配置(网格对齐、元素吸附、吸附容差)
   - 支持批量元素的同步移动

2. 增强 src/hooks/use-timeline-snapping.ts：
   - 实现元素间的磁性吸附逻辑
   - 添加网格对齐功能
   - 支持时间线标记点吸附
   - 提供吸附视觉反馈

3. 创建 src/components/editor/snap-controls.tsx：
   - 吸附功能开关按钮
   - 吸附设置面板(容差调整、吸附类型选择)
   - 吸附状态指示器

请确保重排序操作与现有的拖拽系统兼容，支持多选元素的批量操作。
```

**验收标准**:
- [ ] 支持拖拽调整元素顺序
- [ ] 磁性吸附功能正常
- [ ] 支持批量元素移动
- [ ] 调整操作可撤销

---

### 任务 2.4: 实现速度控制功能

**任务描述**: 添加视频加速减速功能，支持关键帧变速和速度曲线编辑

**技术要点**:
- 扩展 TimelineElement 支持速度属性
- 实现变速预览
- 添加速度曲线编辑器

**Cursor 提示词**:
```
为 OpenCut 实现视频加速减速功能：

1. 扩展时间线元素类型定义 src/types/timeline.ts：
   - 添加 SpeedControl 接口(包含速度曲线、音调保持选项)
   - 扩展 TimelineElement 添加 speedControl 属性
   - 定义 SpeedKeyframe 类型支持关键帧变速

2. 扩展 src/stores/timeline-store.ts：
   - 添加 updateElementSpeed 函数更新元素速度
   - 实现 addSpeedKeyframe 函数添加速度关键帧
   - 支持批量速度调整操作

3. 创建 src/components/editor/speed-control-panel.tsx：
   - 速度滑块控制(0.1x - 10x)
   - 预设速度按钮(0.25x, 0.5x, 2x, 4x等)
   - 音调保持开关
   - 速度曲线可视化编辑器

4. 增强预览系统支持变速播放：
   - 在 preview-panel.tsx 中处理变速元素渲染
   - 确保音频变速同步

请保持与现有播放控制系统的兼容性，确保变速后的时长计算准确。
```

**验收标准**:
- [ ] 支持 0.1x-10x 变速范围
- [ ] 关键帧变速功能正常
- [ ] 音频变速质量良好
- [ ] 速度曲线编辑流畅

---

## Phase 3: 视觉效果功能

### 任务 3.1: 实现镜像翻转功能

**任务描述**: 添加视频镜像翻转效果，支持水平、垂直和自定义角度翻转

**技术要点**:
- 扩展元素变换属性
- 实现 CSS/Canvas 镜像渲染
- 添加镜像动画效果

**Cursor 提示词**:
```
为 OpenCut 实现镜像翻转功能：

1. 扩展 src/types/timeline.ts：
   - 添加 Transform 接口(scaleX, scaleY, rotation, translateX, translateY)
   - 扩展 MediaElement 和 TextElement 添加 transform 属性
   - 定义 MirrorEffect 类型支持不同镜像模式

2. 创建 src/lib/transform-utils.ts：
   - 实现 applyMirror 函数处理镜像变换
   - 添加 generateTransformCSS 函数生成CSS transform
   - 支持镜像动画的缓动函数

3. 创建 src/components/editor/mirror-controls.tsx：
   - 水平镜像按钮
   - 垂直镜像按钮
   - 自定义角度旋转控制
   - 镜像动画效果选项

4. 增强 src/components/editor/preview-panel.tsx：
   - 在预览中应用镜像变换
   - 支持实时镜像效果预览

请确保镜像操作不影响原始媒体文件，仅在渲染和导出时应用变换。
```

**验收标准**:
- [ ] 支持水平、垂直、对角镜像
- [ ] 镜像效果实时预览
- [ ] 支持自定义角度旋转
- [ ] 镜像操作可撤销

---

### 任务 3.2: 实现转场效果系统

**任务描述**: 在时间线元素间添加转场效果，支持多种转场类型和自定义参数

**技术要点**:
- 设计转场数据结构
- 实现转场渲染逻辑
- 添加转场预览和参数调节

**Cursor 提示词**:
```
为 OpenCut 实现转场效果系统：

1. 创建转场类型定义 src/types/transition.ts：
   - 定义 Transition 接口(类型、时长、参数、缓动)
   - 支持转场类型: fade, slide, zoom, rotate, wipe, 3d
   - 添加 TransitionParameters 支持方向、缩放、旋转等参数

2. 扩展 src/stores/timeline-store.ts：
   - 添加转场管理功能
   - 实现 addTransition 函数在元素间添加转场
   - 支持转场参数的实时调整

3. 创建 src/components/editor/transition-library.tsx：
   - 转场效果预设库
   - 转场效果预览
   - 拖拽应用转场到时间线

4. 创建 src/lib/transition-renderer.ts：
   - 实现各种转场效果的渲染算法
   - 支持WebGL加速的3D转场
   - 转场进度计算和插值

5. 增强预览系统：
   - 在播放时渲染转场效果
   - 支持转场的实时参数调整预览

请确保转场渲染性能良好，支持实时预览而不卡顿。
```

**验收标准**:
- [ ] 支持6+种转场类型
- [ ] 转场效果流畅播放
- [ ] 转场参数实时调整
- [ ] 转场时长精确控制

---

### 任务 3.3: 实现蒙板遮罩系统

**任务描述**: 添加视频蒙板功能，支持形状蒙板、渐变蒙板和绿幕抠像

**技术要点**:
- 实现蒙板数据结构
- 使用 Canvas/WebGL 渲染蒙板
- 添加绿幕抠像算法

**Cursor 提示词**:
```
为 OpenCut 实现蒙板遮罩系统：

1. 创建蒙板类型定义 src/types/mask.ts：
   - 定义 Mask 接口(类型、形状、位置、大小、羽化)
   - 支持蒙板类型: shape, gradient, text, image, path
   - 添加 ChromaKey 接口支持绿幕抠像

2. 扩展时间线元素：
   - 为 MediaElement 添加 masks 数组属性
   - 支持多层蒙板组合
   - 添加蒙板动画关键帧

3. 创建 src/components/editor/mask-editor.tsx：
   - 蒙板工具面板(形状选择、参数调节)
   - 蒙板编辑器(拖拽调整位置和大小)
   - 绿幕抠像设置面板

4. 创建 src/lib/mask-renderer.ts：
   - 实现各种蒙板的渲染算法
   - 使用Canvas 2D或WebGL处理蒙板合成
   - 实现绿幕抠像算法(色键、容差、边缘软化)

5. 集成到预览系统：
   - 在预览中实时显示蒙板效果
   - 支持蒙板的交互式编辑

请确保蒙板渲染性能优化，支持实时预览和参数调整。
```

**验收标准**:
- [ ] 支持5+种蒙板类型
- [ ] 蒙板编辑操作流畅
- [ ] 绿幕抠像效果良好
- [ ] 蒙板动画播放正常

---

## Phase 4: 音频和字幕功能

### 任务 4.1: 完善音频处理系统

**任务描述**: 扩展现有音频轨道功能，支持多轨道混音、音频特效和可视化

**技术要点**:
- 扩展 Audio Track 功能
- 实现音频特效处理
- 添加音频波形可视化

**Cursor 提示词**:
```
扩展 OpenCut 的音频处理系统：

1. 增强 src/stores/timeline-store.ts 的音频轨道管理：
   - 扩展 TimelineTrack 支持音频特效数组
   - 添加多轨道音频混音逻辑
   - 实现音频轨道的独立音量和静音控制

2. 创建 src/lib/audio-effects.ts：
   - 实现音频特效: echo, reverb, equalizer, noise_reduction
   - 使用 Web Audio API 处理音频效果
   - 支持特效参数的实时调整

3. 增强 src/components/editor/audio-waveform.tsx：
   - 显示多轨道音频波形
   - 支持波形的缩放和导航
   - 添加音频剪辑点的可视化编辑

4. 创建 src/components/editor/audio-mixer.tsx：
   - 多轨道音量控制面板
   - 音频特效设置面板
   - 实时音频电平指示器

5. 集成音频处理到导出系统：
   - 在 ffmpeg-utils.ts 中添加音频特效的导出支持
   - 确保音频和视频同步

请确保音频处理不影响播放性能，支持实时预览。
```

**验收标准**:
- [ ] 支持多轨道音频混音
- [ ] 音频特效实时预览
- [ ] 音频波形显示准确
- [ ] 音频导出质量良好

---

### 任务 4.2: 增强字幕系统

**任务描述**: 扩展现有 TextElement，实现完整的字幕编辑功能

**技术要点**:
- 扩展字幕样式系统
- 实现字幕时间轴编辑
- 添加字幕模板和动画

**Cursor 提示词**:
```
基于 OpenCut 现有的 TextElement，增强字幕系统：

1. 扩展 src/types/timeline.ts 中的 TextElement：
   - 添加更多字幕样式属性(边框、阴影、描边)
   - 支持字幕动画效果(淡入淡出、飞入飞出、打字机效果)
   - 添加字幕模板系统

2. 创建 src/components/editor/subtitle-editor.tsx：
   - 字幕时间轴编辑器
   - 字幕文本编辑面板
   - 字幕样式设置面板(字体、颜色、位置、动画)

3. 实现字幕导入导出功能：
   - 创建 src/lib/subtitle-parser.ts 支持SRT/ASS格式
   - 在导出系统中添加字幕烧录功能

4. 创建字幕模板系统：
   - src/data/subtitle-templates.ts 预设字幕样式
   - 支持自定义模板保存和加载

5. 增强预览系统：
   - 在预览中实时显示字幕效果
   - 支持字幕位置的拖拽调整

请确保字幕系统与现有的文本轨道完全集成，支持多语言字幕。
```

**验收标准**:
- [ ] 字幕时间同步准确
- [ ] 支持SRT/ASS格式导入导出
- [ ] 字幕样式丰富完整
- [ ] 中英文字体正常显示

---

## Phase 5: 高级智能功能

### 任务 5.1: 实现智能文本功能

**任务描述**: 集成AI功能，实现语音识别转字幕和智能文本分析

**技术要点**:
- 集成语音识别API
- 实现自动字幕生成
- 添加文本分析功能

**Cursor 提示词**:
```
为 OpenCut 实现智能文本功能：

1. 创建 src/lib/speech-recognition.ts：
   - 集成Web Speech API或第三方语音识别服务
   - 实现音频文件的语音转文字功能
   - 支持多语言识别和说话人区分

2. 创建 src/stores/ai-store.ts：
   - 管理AI功能的状态和配置
   - 跟踪语音识别进度和结果
   - 处理AI服务的API调用

3. 实现自动字幕生成：
   - 创建 src/lib/auto-subtitle.ts
   - 自动生成字幕时间轴和文本
   - 支持字幕准确度评估和手动校正

4. 创建 src/components/editor/ai-assistant.tsx：
   - 语音识别控制面板
   - 自动字幕生成界面
   - 智能文本分析结果显示

5. 实现智能分析功能：
   - 关键词提取和场景分割
   - 内容摘要生成
   - 情感分析和标签生成

请考虑隐私保护，支持本地处理和云端处理的选择。
```

**验收标准**:
- [ ] 语音识别准确率 > 90%
- [ ] 自动字幕时间轴准确
- [ ] 支持多语言识别
- [ ] 智能分析结果实用

---

## 🛠️ 开发环境配置

### 必要工具安装
```bash
# 安装依赖
bun install

# 启动开发服务器  
bun dev

# 代码格式化
bun run format

# 类型检查
bun run type-check
```

### Cursor 开发配置建议

**Cursor 设置**:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  }
}
```

## 📊 进度跟踪

| 阶段 | 任务 | 状态 | 预估工时 | 优先级 |
|------|------|------|----------|--------|
| Phase 1 | 增强导入系统 | 📋 待开始 | 3天 | P0 |
| Phase 1 | 完善导出系统 | 📋 待开始 | 4天 | P0 |
| Phase 1 | 增强撤销重做系统 | 📋 待开始 | 2天 | P0 |
| Phase 2 | 实现精确剪辑功能 | 📋 待开始 | 3天 | P1 |
| Phase 2 | 插入和覆盖编辑模式 | 📋 待开始 | 4天 | P1 |
| Phase 2 | 轨道内元素重排序 | 📋 待开始 | 2天 | P1 |
| Phase 2 | 速度控制功能 | 📋 待开始 | 3天 | P1 |
| Phase 3 | 镜像翻转功能 | 📋 待开始 | 2天 | P2 |
| Phase 3 | 转场效果系统 | 📋 待开始 | 5天 | P2 |
| Phase 3 | 蒙板遮罩系统 | 📋 待开始 | 4天 | P2 |
| Phase 4 | 完善音频处理系统 | 📋 待开始 | 4天 | P1 |
| Phase 4 | 增强字幕系统 | 📋 待开始 | 3天 | P1 |
| Phase 5 | 智能文本功能 | 📋 待开始 | 6天 | P3 |

**总预估工时**: 45个工作日
**建议团队规模**: 2-3名前端开发工程师

## 🎯 开发建议

### 最佳实践
1. **严格遵循TypeScript类型定义**：确保所有新功能都有完整的类型声明
2. **保持现有架构一致性**：新功能应与现有的Zustand store模式保持一致
3. **渐进式开发**：建议按阶段顺序开发，确保基础功能稳定后再添加高级功能
4. **充分测试**：每个功能完成后进行充分的单元测试和集成测试

### 风险提示
- **性能问题**：视频处理和实时预览可能带来性能挑战，需要优化
- **浏览器兼容性**：某些高级功能（如WebGL、Web Audio API）需要考虑兼容性
- **内存管理**：大文件处理需要注意内存使用，避免内存泄漏

## 📝 使用说明

### 如何使用这个任务文档

1. **选择任务**: 根据项目优先级，从 Phase 1 开始选择要实现的功能
2. **复制提示词**: 直接复制对应任务的 Cursor 提示词到 AI 助手中
3. **执行开发**: 按照提示词的指导进行开发，确保遵循现有架构模式
4. **验收测试**: 完成开发后，按照验收标准进行功能测试
5. **更新状态**: 完成任务后更新进度跟踪表中的状态

### 注意事项

- 每个Cursor提示词都经过精心设计，包含了具体的技术实现细节
- 提示词中包含了与现有架构的集成要求，确保新功能与现有系统兼容
- 建议严格按照阶段顺序开发，避免跳跃式开发导致的依赖问题
- 每完成一个任务都要进行充分测试，确保功能稳定可靠

这个任务文档为您的开发团队提供了完整的开发路径。每个Cursor提示词都可以直接使用，帮助AI理解具体的开发需求并生成相应的代码。建议从Phase 1开始逐步实施，确保每个阶段的功能都稳定可靠后再进入下一阶段。 