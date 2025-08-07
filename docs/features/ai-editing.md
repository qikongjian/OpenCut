# AI智能剪辑功能

## 📋 功能概述

AI智能剪辑是OpenCut视频编辑器的核心创新功能，通过AI视频分析技术自动生成专业的剪辑方案，并支持一键应用到项目时间轴。该功能大幅提升视频编辑效率，降低专业门槛，让用户能够快速获得高质量的剪辑结果。

## 🎯 核心价值

- **AI驱动的智能剪辑**: 将AI视频分析结果转化为可执行的剪辑计划
- **一键自动化**: 大幅提升视频编辑效率，降低专业门槛
- **可视化展示**: 让用户直观理解AI的剪辑逻辑和决策
- **专业剪辑理论**: 基于情感、节奏、镜头语言等专业理论

## 🏗️ 技术架构

### 数据流架构
```
AI分析结果 → 剪辑计划数据 → 状态管理 → UI展示 → 时间轴应用
```

### 核心组件
- **AI剪辑Store** (`stores/ai-editing-store.ts`): 状态管理和业务逻辑
- **AI剪辑面板** (`components/editor/ai-editing-panel.tsx`): 用户界面
- **时间轴集成**: 可视化标识和元素管理
- **Mock数据生成器** (`lib/ai-editing-mock-data.ts`): 测试数据支持

## 📊 数据结构

### AI剪辑计划 (AIClipPlan)
```typescript
interface AIClipPlan {
  sequence_clip_id: string;           // 序列片段ID
  source_clip_id: string;             // 源片段ID
  video_url: string;                  // 视频URL
  corresponding_script_scene_id: string; // 对应剧本场景ID
  clip_type: "video_and_audio" | "video" | "audio"; // 片段类型
  sequence_start_timecode: string;    // 序列开始时间码
  source_in_timecode: string;         // 源入点时间码
  source_out_timecode: string;        // 源出点时间码
  clip_duration_in_sequence: string;  // 序列中的片段时长
  
  // 转场信息
  transition_from_previous: {
    transition_type: string;          // 转场类型
    transition_duration_ms: number;   // 转场时长(毫秒)
    audio_sync_offset_ms: number;     // 音频同步偏移
    reason_for_transition: string;    // 转场理由
  };
  
  // 剪辑理由分析
  clip_placement_reasons: {
    core_intent_and_audience_effect: string; // 核心意图和观众效果
    emotion_priority: string;         // 情感优先级
    story_priority: string;           // 故事优先级
    rhythm_priority: string;          // 节奏优先级
    eyeline_priority: string;         // 视线优先级
    space_priority: string;           // 空间优先级
    lens_language_application: string; // 镜头语言应用
  };
  
  // 连续性修正建议
  continuity_correction_suggestion: {
    error_exists: boolean;            // 是否存在错误
    error_type?: string;              // 错误类型
    occurrence_location?: string;     // 发生位置
    error_description?: string;       // 错误描述
    is_intentional_artistic_choice?: boolean; // 是否为艺术选择
    artistic_purpose_explanation?: string; // 艺术目的说明
    correction_suggestions?: string[]; // 修正建议
    reason_for_correction?: string;   // 修正理由
  };
  
  // 音效设计建议
  sound_design_suggestions: Array<{
    sound_type: string;               // 音效类型
    description: string;              // 描述
    timing_in_clip: string;           // 在片段中的时机
    intensity_suggestion: string;     // 强度建议
  }>;
  
  // 视觉增强建议
  visual_enhancement_suggestions: Array<{
    enhancement_type: string;         // 增强类型
    description: string;              // 描述
    reason: string;                   // 理由
  }>;
}
```

## 🎨 用户界面设计

### 界面布局
AI剪辑功能集成在媒体面板中，作为独立的标签页：

```
媒体面板
├── 媒体库
├── 音频
├── 文本
├── 贴纸
├── 特效
├── 转场
├── 字幕
├── 滤镜
├── 调整
└── AI剪辑 ← 新增功能
```

### 核心界面元素

#### 1. 空状态界面
- AI机器人图标
- 功能介绍文案
- "生成AI剪辑计划"按钮
- 媒体文件状态提示

#### 2. 剪辑计划展示
- 计划版本信息
- 一键剪辑按钮
- 执行进度显示
- 片段列表

#### 3. 片段卡片
- 片段序号和时长
- 场景信息和类型标签
- 转场效果标识
- 剪辑理由摘要
- 预览和错误提示

#### 4. 底部操作区
- 清空计划按钮
- 状态指示器
- 使用说明

### 视觉设计规范

#### 颜色系统
- **AI功能主色**: 绿色 (#4CAF50) - 体现智能和创新
- **执行按钮**: 橙色 (#FF9800) - 突出重要操作
- **时间轴标识**: 蓝色 (#2196F3) - 保持专业感
- **错误提示**: 琥珀色 (#FFC107) - 温和的警告

#### 图标设计
- **AI剪辑**: 🤖 Bot图标
- **一键剪辑**: ⚡ 闪电图标
- **片段标记**: 🎬 胶片图标
- **预览**: 👁️ 眼睛图标

## ⚙️ 功能实现

### 1. 状态管理 (Zustand)

```typescript
interface AIEditingState {
  // 数据状态
  aiEditingData: AIEditingData | null;
  currentEditingPlan: AIEditingPlan | null;
  
  // 执行状态
  isExecutingPlan: boolean;
  executionProgress: number;
  currentProcessingClip: string | null;
  
  // 预览状态
  previewClipIndex: number | null;
  isPreviewMode: boolean;
  
  // 核心方法
  loadAIEditingData: (data: AIEditingData) => void;
  executeEditingPlan: () => Promise<void>;
  previewClip: (clipIndex: number) => void;
  generateMockData: (projectId: string) => AIEditingData;
}
```

### 2. 智能媒体匹配

系统会自动匹配AI剪辑计划中的视频URL与项目中的媒体文件：

1. **精确匹配**: 通过URL或文件名精确匹配
2. **智能替代**: 未找到对应文件时使用现有媒体文件
3. **友好提示**: 提醒用户导入相关媒体文件

### 3. 时间轴集成

#### 可视化标识
- **绿色左边框**: AI生成的片段有绿色左边框标识
- **Bot图标**: 片段名称前显示Bot图标
- **特殊命名**: 使用"AI剪辑-"前缀命名

#### 元素创建
```typescript
const mediaElement: Omit<MediaElement, "id"> = {
  type: "media",
  name: `AI剪辑-${clip.sequence_clip_id}`,
  mediaId: mediaItem.id,
  duration: duration,
  startTime: startTime,
  trimStart: sourceIn,
  trimEnd: Math.max(0, (mediaItem.duration || duration) - sourceOut),
};
```

## 🔄 用户操作流程

### 基本使用流程
1. **进入AI剪辑面板**: 在媒体面板点击"AI剪辑"标签
2. **生成剪辑计划**: 点击"生成AI剪辑计划"按钮
3. **查看剪辑方案**: 浏览AI生成的详细剪辑计划
4. **执行一键剪辑**: 点击"一键剪辑"按钮应用到时间轴
5. **查看结果**: 在时间轴中查看AI生成的片段
6. **手动调整**: 根据需要进一步调整剪辑结果

### 高级操作
- **片段预览**: 点击片段卡片的预览按钮
- **计划切换**: 在多个剪辑版本间切换
- **清空重置**: 清空当前剪辑计划重新开始

## 📈 性能优化

### 执行优化
- **异步处理**: 不阻塞用户界面
- **分步执行**: 逐个处理片段，实时反馈进度
- **错误恢复**: 单个片段失败不影响整体执行

### 内存管理
- **状态清理**: 及时清理不需要的状态数据
- **组件优化**: 使用React.memo优化渲染性能
- **数据缓存**: 合理缓存剪辑计划数据

## 🧪 测试数据

### Mock数据来源
基于真实的AI视频分析结果(`剪辑计划.md`)生成测试数据，包含：

- **3个完整的剪辑片段**
- **详细的剪辑理由分析**
- **专业的转场效果设计**
- **音效和视觉增强建议**

### 数据特点
- **真实性**: 基于实际AI分析结果
- **完整性**: 包含所有必要的剪辑信息
- **专业性**: 体现专业剪辑理论和技巧

## 🔮 扩展规划

### 短期扩展
- **多版本支持**: 支持切换不同的剪辑方案
- **自定义调整**: 允许用户微调AI建议
- **导出分享**: 导出剪辑计划供他人使用

### 长期规划
- **实时AI分析**: 集成真实的AI视频分析服务
- **学习优化**: 根据用户反馈优化AI建议
- **协作功能**: 支持团队协作和计划分享

## 📝 使用说明

### 前置条件
1. 创建或打开一个项目
2. 建议先导入一些视频文件到媒体库

### 操作步骤
1. 切换到媒体面板的"AI剪辑"标签
2. 点击"生成AI剪辑计划"按钮
3. 查看生成的剪辑方案详情
4. 点击"一键剪辑"按钮执行
5. 在时间轴中查看AI生成的片段（带绿色标识）

### 注意事项
- AI剪辑会清空现有时间轴内容
- 建议在新项目中测试AI剪辑功能
- 可以在AI剪辑基础上进行手动调整

## 🐛 故障排除

### 常见问题
1. **没有媒体文件**: 系统会提示导入媒体文件
2. **执行失败**: 检查项目状态和媒体文件
3. **片段显示异常**: 刷新页面或重新生成计划

### 技术支持
- 查看浏览器控制台错误信息
- 检查网络连接状态
- 确认项目和媒体文件状态正常

---

*本文档记录了OpenCut AI智能剪辑功能的完整实现，包括技术架构、用户界面、操作流程等各个方面。*
