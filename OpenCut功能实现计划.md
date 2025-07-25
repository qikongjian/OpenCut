# OpenCut 视频编辑器功能实现计划

## 项目概述

本文档详细描述了 OpenCut 视频编辑器中基于 `optimize.text` 文件需求的功能实现计划。该计划涵盖了左侧媒体面板的多选功能、视频预览播放、拖拽状态显示等核心功能的实现方案。

## 功能需求分析

### 左侧媒体面板添加视频功能
1. **多选添加视频** - 一次可以添加多个视频
2. **重复视频检测** - 添加重复视频时不往里添加

### 左侧媒体面板视频缩列图功能
1. **点击预览播放** - 点击缩列图可在中央预览面板自动播放
2. **播放控制** - 中央预览面板底部的视频播放按钮可点击暂停和播放
3. **拖拽状态显示** - 缩列图拖到底部时间轴记录缩图已添加状态显示

## 详细实现计划

### 第一阶段：媒体面板多选功能增强

#### 1.1 修改媒体面板多选逻辑
**文件**: `apps/web/src/components/editor/media-panel/views/media.tsx`

**实现内容**:
- 添加多选状态管理
- 实现文件选择器的多选支持
- 添加批量处理逻辑

```typescript
// 新增状态
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

// 修改文件选择处理
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    processFiles(files);
  }
  e.target.value = "";
};
```

#### 1.2 实现重复视频检测
**文件**: `apps/web/src/stores/media-store.ts`

**实现内容**:
- 添加重复检测逻辑
- 基于文件名、大小、哈希值进行检测
- 提供用户反馈

```typescript
// 新增重复检测方法
const isDuplicateMedia = (newItem: MediaItem, existingItems: MediaItem[]) => {
  return existingItems.some(item => 
    item.name === newItem.name && 
    item.size === newItem.size
  );
};

// 修改 addMediaItem 方法
addMediaItem: async (projectId, item) => {
  const existingItems = get().mediaItems;
  
  if (isDuplicateMedia(item, existingItems)) {
    toast.warning(`视频 "${item.name}" 已存在，跳过添加`);
    return false;
  }
  
  // 继续原有添加逻辑...
}
```

### 第二阶段：缩列图预览播放功能

#### 2.1 实现缩列图点击预览
**文件**: `apps/web/src/components/editor/media-panel/views/media.tsx`

**实现内容**:
- 为每个媒体项添加点击事件
- 实现预览播放逻辑
- 与预览面板集成

```typescript
// 新增预览播放方法
const handleMediaPreview = (mediaItem: MediaItem) => {
  if (mediaItem.type === 'video') {
    // 设置预览状态
    usePlaybackStore.getState().setPreviewMode(true);
    usePlaybackStore.getState().setPreviewMedia(mediaItem);
    usePlaybackStore.getState().play();
  }
};

// 修改媒体项渲染，添加点击事件
<div 
  className="media-item"
  onClick={() => handleMediaPreview(item)}
  onDoubleClick={() => handleAddToTimeline(item)}
>
  {/* 媒体项内容 */}
</div>
```

#### 2.2 增强预览面板播放控制
**文件**: `apps/web/src/components/editor/preview-panel.tsx`

**实现内容**:
- 添加预览模式状态
- 实现预览媒体播放
- 增强播放控制按钮功能

```typescript
// 新增预览模式支持
const { previewMode, previewMedia, setPreviewMode } = usePlaybackStore();

// 修改播放控制逻辑
const handlePlayPause = () => {
  if (previewMode && previewMedia) {
    // 预览模式播放控制
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  } else {
    // 正常时间轴播放控制
    toggle();
  }
};
```

### 第三阶段：拖拽状态显示功能

#### 3.1 实现拖拽状态跟踪
**文件**: `apps/web/src/stores/timeline-store.ts`

**实现内容**:
- 添加拖拽状态管理
- 跟踪已添加到时间轴的媒体项
- 提供状态查询接口

```typescript
// 新增拖拽状态管理
interface DragState {
  isDragging: boolean;
  draggedMediaId: string | null;
  targetTrackId: string | null;
  dropPosition: { x: number; y: number } | null;
}

// 新增已添加媒体跟踪
const addedMediaItems = new Set<string>();

// 修改 addElementToTrack 方法
addElementToTrack: (trackId, elementData) => {
  // 原有逻辑...
  
  if (elementData.type === 'media' && elementData.mediaId) {
    addedMediaItems.add(elementData.mediaId);
  }
  
  // 触发状态更新事件
  window.dispatchEvent(new CustomEvent('media-added-to-timeline', {
    detail: { mediaId: elementData.mediaId }
  }));
}
```

#### 3.2 更新媒体面板显示状态
**文件**: `apps/web/src/components/editor/media-panel/views/media.tsx`

**实现内容**:
- 监听媒体添加状态变化
- 更新缩列图显示状态
- 提供视觉反馈

```typescript
// 新增状态跟踪
const [addedToTimeline, setAddedToTimeline] = useState<Set<string>>(new Set());

// 监听媒体添加事件
useEffect(() => {
  const handleMediaAdded = (e: CustomEvent) => {
    const { mediaId } = e.detail;
    setAddedToTimeline(prev => new Set([...prev, mediaId]));
  };

  window.addEventListener('media-added-to-timeline', handleMediaAdded);
  return () => {
    window.removeEventListener('media-added-to-timeline', handleMediaAdded);
  };
}, []);

// 修改媒体项渲染，添加状态指示
<div className={`media-item ${addedToTimeline.has(item.id) ? 'added' : ''}`}>
  {addedToTimeline.has(item.id) && (
    <div className="added-indicator">
      <Check className="h-4 w-4" />
    </div>
  )}
  {/* 媒体项内容 */}
</div>
```

### 第四阶段：播放控制增强

#### 4.1 增强播放状态管理
**文件**: `apps/web/src/stores/playback-store.ts`

**实现内容**:
- 添加预览模式支持
- 实现预览媒体播放控制
- 增强播放状态同步

```typescript
// 新增预览模式状态
interface PlaybackStore {
  // 原有状态...
  previewMode: boolean;
  previewMedia: MediaItem | null;
  
  // 新增方法
  setPreviewMode: (mode: boolean) => void;
  setPreviewMedia: (media: MediaItem | null) => void;
  playPreview: () => void;
  pausePreview: () => void;
}

// 实现预览播放控制
setPreviewMode: (mode) => set({ previewMode: mode }),
setPreviewMedia: (media) => set({ previewMedia: media }),
playPreview: () => {
  const { previewMedia } = get();
  if (previewMedia) {
    set({ isPlaying: true });
    // 触发预览播放事件
    window.dispatchEvent(new CustomEvent('preview-play', {
      detail: { media: previewMedia }
    }));
  }
},
```

#### 4.2 更新视频播放器组件
**文件**: `apps/web/src/components/ui/video-player.tsx`

**实现内容**:
- 支持预览模式播放
- 增强播放控制响应
- 优化播放状态同步

```typescript
// 新增预览模式支持
useEffect(() => {
  const handlePreviewPlay = (e: CustomEvent) => {
    const { media } = e.detail;
    if (media.id === mediaId) {
      videoRef.current?.play();
    }
  };

  window.addEventListener('preview-play', handlePreviewPlay);
  return () => {
    window.removeEventListener('preview-play', handlePreviewPlay);
  };
}, [mediaId]);
```

### 第五阶段：UI/UX 优化

#### 5.1 添加视觉反馈
**文件**: `apps/web/src/components/editor/media-panel/views/media.tsx`

**实现内容**:
- 添加拖拽状态指示器
- 优化多选界面
- 增强用户交互反馈

```typescript
// 新增拖拽状态指示
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedItem: null as MediaItem | null
});

// 添加拖拽开始处理
const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
  setDragState({ isDragging: true, draggedItem: item });
  // 原有拖拽逻辑...
};

// 添加拖拽结束处理
const handleDragEnd = () => {
  setDragState({ isDragging: false, draggedItem: null });
};
```

#### 5.2 优化样式和动画
**文件**: `apps/web/src/components/editor/media-panel/views/media.tsx`

**实现内容**:
- 添加状态变化动画
- 优化视觉层次
- 增强交互体验

```css
/* 新增样式 */
.media-item {
  transition: all 0.2s ease;
  position: relative;
}

.media-item.added {
  border: 2px solid #00D4AA;
  opacity: 0.8;
}

.media-item.dragging {
  transform: scale(0.95);
  opacity: 0.7;
}

.added-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #00D4AA;
  border-radius: 50%;
  padding: 2px;
  color: white;
}
```

## 实施时间表

### 第1周：基础功能实现
- [ ] 完成多选文件上传功能
- [ ] 实现重复视频检测
- [ ] 基础UI组件更新
- [ ] 单元测试编写

### 第2周：预览播放功能
- [ ] 实现缩列图点击预览
- [ ] 完成预览面板播放控制
- [ ] 播放状态管理优化
- [ ] 集成测试

### 第3周：拖拽状态功能
- [ ] 实现拖拽状态跟踪
- [ ] 完成状态显示更新
- [ ] 视觉反馈优化
- [ ] 性能测试

### 第4周：测试和优化
- [ ] 功能测试和调试
- [ ] 性能优化
- [ ] 用户体验改进
- [ ] 文档更新

## 技术要点

### 状态管理
- 使用 Zustand 进行状态管理
- 实现跨组件状态同步
- 优化状态更新性能

### 事件系统
- 使用 CustomEvent 进行组件间通信
- 实现松耦合的事件处理
- 确保事件清理和内存管理

### 性能优化
- 使用 React.memo 优化组件渲染
- 实现虚拟滚动处理大量媒体项
- 优化文件处理和预览性能

### 用户体验
- 提供清晰的视觉反馈
- 实现流畅的动画效果
- 优化交互响应速度

## 风险评估

### 技术风险
1. **性能问题**: 大量媒体文件可能导致性能下降
   - **缓解措施**: 实现虚拟滚动和懒加载
   
2. **内存泄漏**: 预览播放可能导致内存占用过高
   - **缓解措施**: 及时清理预览资源和事件监听器

3. **浏览器兼容性**: 某些新特性可能不支持旧浏览器
   - **缓解措施**: 添加 polyfill 和降级处理

### 功能风险
1. **用户体验**: 新功能可能影响现有工作流程
   - **缓解措施**: 提供功能开关和用户引导

2. **数据一致性**: 多选操作可能导致数据状态不一致
   - **缓解措施**: 实现事务性操作和回滚机制

## 成功标准

### 功能完整性
- [ ] 支持多选文件上传
- [ ] 准确检测重复视频
- [ ] 缩列图点击预览正常工作
- [ ] 播放控制响应及时
- [ ] 拖拽状态显示准确

### 性能指标
- [ ] 文件上传响应时间 < 2秒
- [ ] 预览播放延迟 < 500ms
- [ ] 内存使用增长 < 50MB
- [ ] 界面响应时间 < 100ms

### 用户体验
- [ ] 操作流程直观易懂
- [ ] 视觉反馈清晰明确
- [ ] 错误提示友好准确
- [ ] 功能发现性良好

## 后续计划

### 功能扩展
- 支持更多媒体格式
- 添加批量编辑功能
- 实现智能分类和标签
- 增强搜索和筛选功能

### 性能优化
- 实现更高效的缓存策略
- 优化大文件处理
- 添加后台处理队列
- 实现增量更新

### 用户体验
- 添加键盘快捷键支持
- 实现自定义主题
- 提供更多个性化选项
- 增强无障碍访问支持

---

**文档版本**: 1.0  
**创建日期**: 2025年1月  
**最后更新**: 2025年1月  
**负责人**: 开发团队  
**审核状态**: 待审核 