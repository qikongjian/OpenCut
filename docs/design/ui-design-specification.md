# OpenCut 视频编辑器 UI 设计规范

## 📋 设计概述

**文档类型**: UI设计规范文档
**创建时间**: 2025年1月14日
**UI设计师**: AI Assistant
**设计版本**: v2.0
**适用功能**: AI剪辑计划展示 + 音频替换功能

### 设计理念
基于现代化的视频编辑工作流，打造直观、高效、专业的用户界面。设计遵循"功能优先、美观其次"的原则，确保复杂功能的简单化表达。

## 🎨 视觉设计系统

### 色彩系统

#### 主色调定义
```css
/* 品牌主色 */
--primary-blue: #2563EB;        /* 主要操作按钮 */
--primary-blue-hover: #1D4ED8;  /* 悬停状态 */
--primary-blue-light: #DBEAFE;  /* 浅色背景 */

/* AI功能色彩 */
--ai-green: #10B981;            /* AI相关功能 */
--ai-green-hover: #059669;      /* AI按钮悬停 */
--ai-green-light: #D1FAE5;      /* AI功能背景 */
--ai-green-glow: rgba(16, 185, 129, 0.2); /* AI发光效果 */

/* 音频功能色彩 */
--audio-purple: #8B5CF6;        /* 音频相关功能 */
--audio-purple-hover: #7C3AED;  /* 音频按钮悬停 */
--audio-purple-light: #EDE9FE;  /* 音频功能背景 */
--audio-purple-glow: rgba(139, 92, 246, 0.2); /* 音频发光效果 */

/* 执行操作色彩 */
--action-orange: #F59E0B;       /* 执行按钮 */
--action-orange-hover: #D97706; /* 执行按钮悬停 */
--action-orange-light: #FEF3C7; /* 执行状态背景 */

/* 系统色彩 */
--success-green: #10B981;       /* 成功状态 */
--warning-amber: #F59E0B;       /* 警告状态 */
--error-red: #EF4444;          /* 错误状态 */
--info-blue: #3B82F6;          /* 信息提示 */
```

#### 中性色系
```css
/* 背景色系 */
--bg-primary: #FFFFFF;          /* 主背景 */
--bg-secondary: #F8FAFC;        /* 次要背景 */
--bg-panel: #F1F5F9;           /* 面板背景 */
--bg-card: #FFFFFF;            /* 卡片背景 */
--bg-hover: #F1F5F9;           /* 悬停背景 */

/* 边框色系 */
--border-light: #E2E8F0;        /* 浅色边框 */
--border-medium: #CBD5E1;       /* 中等边框 */
--border-dark: #94A3B8;         /* 深色边框 */

/* 文字色系 */
--text-primary: #0F172A;        /* 主要文字 */
--text-secondary: #475569;      /* 次要文字 */
--text-muted: #64748B;          /* 弱化文字 */
--text-disabled: #94A3B8;       /* 禁用文字 */
```

### 字体系统

#### 字体族定义
```css
/* 主字体 */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
/* 等宽字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
/* 中文字体 */
--font-chinese: 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

#### 字体大小层级
```css
/* 标题层级 */
--text-4xl: 2.25rem;    /* 36px - 主标题 */
--text-3xl: 1.875rem;   /* 30px - 二级标题 */
--text-2xl: 1.5rem;     /* 24px - 三级标题 */
--text-xl: 1.25rem;     /* 20px - 四级标题 */
--text-lg: 1.125rem;    /* 18px - 大号正文 */

/* 正文层级 */
--text-base: 1rem;      /* 16px - 标准正文 */
--text-sm: 0.875rem;    /* 14px - 小号正文 */
--text-xs: 0.75rem;     /* 12px - 辅助文字 */
--text-2xs: 0.625rem;   /* 10px - 极小文字 */
```

### 间距系统

#### 标准间距
```css
/* 基础间距单位 */
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
```

### 圆角系统
```css
--radius-sm: 0.25rem;   /* 4px - 小圆角 */
--radius-md: 0.375rem;  /* 6px - 中等圆角 */
--radius-lg: 0.5rem;    /* 8px - 大圆角 */
--radius-xl: 0.75rem;   /* 12px - 超大圆角 */
--radius-full: 9999px;  /* 完全圆角 */
```

### 阴影系统
```css
/* 卡片阴影 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* 特殊阴影 */
--shadow-ai: 0 0 20px var(--ai-green-glow);      /* AI功能发光 */
--shadow-audio: 0 0 20px var(--audio-purple-glow); /* 音频功能发光 */
--shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.1); /* 焦点阴影 */
```

## 🎯 AI剪辑计划展示界面设计

### 整体布局架构
```
┌─ AI剪辑面板 (320px宽) ─────────────────────────────┐
│ ┌─ 头部区域 (56px高) ─────────────────────────────┐ │
│ │ 🤖 AI智能剪辑    [3片段]    [⚡ 一键剪辑]      │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─ 概览区域 (120px高) ────────────────────────────┐ │
│ │ 📊 剪辑概览                                     │ │
│ │ 总时长: 23.0秒 | 3个片段 | 工业科幻风格         │ │
│ │ 情感曲线: 压抑 → 紧张 → 爆发                   │ │
│ │ ┌─ 时间轴预览 ─────────────────────────────────┐ │ │
│ │ │ [████████] [███████████] [████████████]   │ │ │
│ │ │    8.0s        7.0s          8.0s        │ │ │
│ │ │   建立氛围     引入冲突      情感爆发      │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─ 详情区域 (可滚动) ─────────────────────────────┐ │
│ │ 📝 片段详情 (点击时间轴查看)                    │ │
│ │ ┌─ 当前选中: 片段1 ─────────────────────────────┐ │ │
│ │ │ 🎯 意图: 营造压抑的工业氛围                 │ │ │
│ │ │ 🎨 视觉: 极远景，冷色调，高对比度           │ │ │
│ │ │ 🎵 音效: 工业噪音，机械声                   │ │ │
│ │ │ ⚠️  注意: 需要调整亮度                      │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─ 底部操作区域 (64px高) ─────────────────────────┐ │
│ │ [清空计划] [导出计划]      ✅ AI分析完成        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 头部区域设计
```css
.ai-editing-header {
  height: 56px;
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--ai-green-light) 0%, var(--bg-panel) 100%);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.ai-icon {
  width: 20px;
  height: 20px;
  color: var(--ai-green);
  animation: pulse 2s infinite;
}

.clip-count-badge {
  background: var(--ai-green-light);
  color: var(--ai-green);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}

.execute-button {
  background: linear-gradient(135deg, var(--action-orange) 0%, var(--action-orange-hover) 100%);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.execute-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### 时间轴预览区域设计
```css
.timeline-preview-container {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin: var(--space-3) 0;
}

.timeline-overview {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.timeline-stats {
  display: flex;
  gap: var(--space-6);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.emotion-curve {
  font-style: italic;
  color: var(--ai-green);
  font-weight: 500;
}

.timeline-visualization {
  display: flex;
  gap: var(--space-2);
  height: 48px;
  margin-bottom: var(--space-3);
}

.timeline-clip {
  flex: 1;
  background: linear-gradient(135deg, var(--ai-green-light) 0%, var(--ai-green) 100%);
  border-radius: var(--radius-md);
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.timeline-clip:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-ai);
  border-color: var(--ai-green);
}

.timeline-clip.selected {
  border-color: var(--primary-blue);
  box-shadow: var(--shadow-focus);
}

.clip-duration {
  position: absolute;
  bottom: var(--space-1);
  left: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.clip-title {
  position: absolute;
  top: var(--space-1);
  left: var(--space-2);
  right: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clip-transition {
  position: absolute;
  bottom: var(--space-1);
  right: var(--space-2);
  font-size: var(--text-2xs);
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
```

### 片段详情区域设计
```css
.clip-details-container {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-top: var(--space-3);
}

.clip-details-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.clip-details-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.detail-section {
  margin-bottom: var(--space-4);
}

.detail-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.detail-content {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: var(--space-6);
}

.warning-section {
  background: var(--action-orange-light);
  border: 1px solid var(--warning-amber);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-top: var(--space-3);
}

.warning-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--warning-amber);
  margin-bottom: var(--space-1);
}

.warning-content {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
```

## 🎵 音频替换功能界面设计

### 右键上下文菜单设计
```css
.context-menu {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  box-shadow: var(--shadow-xl);
  min-width: 200px;
  z-index: 1000;
}

.context-menu-section {
  padding: var(--space-1) 0;
}

.context-menu-section:not(:last-child) {
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--space-1);
  padding-bottom: var(--space-2);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.context-menu-item:hover {
  background: var(--bg-hover);
  color: var(--primary-blue);
}

.context-menu-item.audio-item:hover {
  background: var(--audio-purple-light);
  color: var(--audio-purple);
}

.context-menu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.context-menu-label {
  flex: 1;
  font-weight: 500;
}

.context-menu-shortcut {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
}
```

### 音频替换面板设计
```css
.audio-replacement-panel {
  width: 480px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, var(--audio-purple-light) 0%, var(--bg-panel) 100%);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.panel-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.video-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.panel-content {
  padding: var(--space-6);
}

.section {
  margin-bottom: var(--space-6);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.audio-selector {
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.audio-selector:hover {
  border-color: var(--audio-purple);
  background: var(--audio-purple-light);
}

.audio-selector.has-file {
  border-style: solid;
  border-color: var(--audio-purple);
  background: var(--audio-purple-light);
}

.selector-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.selector-tab {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
  text-align: center;
}

.selector-tab.active {
  background: var(--audio-purple);
  color: white;
  border-color: var(--audio-purple);
}

.selected-audio-info {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-top: var(--space-3);
}

.audio-file-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.audio-file-details {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.audio-controls {
  display: flex;
  gap: var(--space-2);
}

.control-button {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
}

.control-button:hover {
  background: var(--bg-hover);
  border-color: var(--primary-blue);
}
```

### 替换设置区域设计
```css
.replacement-settings {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.setting-group {
  margin-bottom: var(--space-4);
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.radio-group {
  display: flex;
  gap: var(--space-4);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.radio-input {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-medium);
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.radio-input.checked {
  border-color: var(--audio-purple);
  background: var(--audio-purple-light);
}

.radio-input.checked::after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--audio-purple);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.volume-control {
  margin-top: var(--space-3);
}

.volume-slider-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.volume-label {
  min-width: 60px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.volume-slider {
  flex: 1;
  height: 6px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  position: relative;
  cursor: pointer;
}

.volume-slider-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--audio-purple-light) 0%, var(--audio-purple) 100%);
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.volume-value {
  min-width: 40px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input.checked {
  background: var(--audio-purple);
  border-color: var(--audio-purple);
}

.checkbox-input.checked::after {
  content: '✓';
  color: white;
  font-size: var(--text-xs);
  font-weight: bold;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

### 预览效果区域设计
```css
.preview-section {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.waveform-container {
  height: 120px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  position: relative;
  overflow: hidden;
}

.waveform-track {
  height: 24px;
  margin-bottom: var(--space-2);
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.waveform-track.original {
  background: linear-gradient(90deg, var(--border-light) 0%, var(--text-muted) 50%, var(--border-light) 100%);
}

.waveform-track.replacement {
  background: linear-gradient(90deg, var(--audio-purple-light) 0%, var(--audio-purple) 50%, var(--audio-purple-light) 100%);
}

.waveform-track.mixed {
  background: linear-gradient(90deg, var(--primary-blue-light) 0%, var(--primary-blue) 50%, var(--primary-blue-light) 100%);
}

.waveform-label {
  position: absolute;
  left: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-xs);
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.preview-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.preview-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
  font-weight: 500;
}

.preview-button:hover {
  background: var(--primary-blue-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.preview-button.stop {
  background: var(--error-red);
}

.preview-button.stop:hover {
  background: #DC2626;
}
```

### 底部操作区域设计
```css
.panel-footer {
  background: var(--bg-secondary);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-actions {
  display: flex;
  gap: var(--space-3);
}

.action-button {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-light);
}

.action-button.secondary {
  background: var(--bg-card);
  color: var(--text-secondary);
}

.action-button.secondary:hover {
  background: var(--bg-hover);
  border-color: var(--primary-blue);
  color: var(--primary-blue);
}

.action-button.primary {
  background: linear-gradient(135deg, var(--audio-purple) 0%, var(--audio-purple-hover) 100%);
  color: white;
  border-color: var(--audio-purple);
}

.action-button.primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-audio);
}

.action-button.template {
  background: var(--success-green);
  color: white;
  border-color: var(--success-green);
}

.action-button.template:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

## 🎨 动画与交互设计

### 微交互动画
```css
/* AI功能脉搏动画 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 加载动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 悬停提升动画 */
@keyframes lift {
  from { transform: translateY(0); }
  to { transform: translateY(-2px); }
}

/* 发光效果动画 */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px var(--ai-green-glow); }
  50% { box-shadow: 0 0 20px var(--ai-green-glow); }
}

/* 进度条动画 */
@keyframes progress {
  0% { width: 0%; }
  100% { width: var(--progress-width); }
}
```

### 状态转换
```css
.state-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

.scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## 📱 响应式设计

### 断点系统
```css
/* 移动设备 */
@media (max-width: 768px) {
  .ai-editing-panel {
    width: 100%;
    height: 100vh;
  }

  .audio-replacement-panel {
    width: 100%;
    max-width: none;
  }

  .timeline-visualization {
    flex-direction: column;
    height: auto;
    gap: var(--space-1);
  }

  .timeline-clip {
    height: 32px;
  }
}

/* 平板设备 */
@media (max-width: 1024px) {
  .ai-editing-panel {
    width: 280px;
  }

  .audio-replacement-panel {
    width: 400px;
  }
}
```

## 🔧 实现指导

### 组件结构建议
```typescript
// AI剪辑计划展示组件
interface AIEditingPlanDisplayProps {
  editingPlan: AIEditingPlan;
  onExecute: () => void;
  onClipSelect: (clipIndex: number) => void;
  selectedClipIndex?: number;
}

// 音频替换面板组件
interface AudioReplacementPanelProps {
  videoElement: MediaElement;
  onReplace: (audioFile: File, options: ReplacementOptions) => void;
  onCancel: () => void;
  isVisible: boolean;
}

// 时间轴预览组件
interface TimelinePreviewProps {
  clips: TimelineClip[];
  selectedIndex?: number;
  onClipClick: (index: number) => void;
}
```

### 关键技术点
1. **CSS变量系统**: 使用CSS自定义属性实现主题切换
2. **组件状态管理**: 使用React状态管理交互状态
3. **动画性能**: 使用transform和opacity实现高性能动画
4. **无障碍设计**: 添加适当的ARIA标签和键盘导航支持

这份UI设计规范为OpenCut的AI剪辑计划展示和音频替换功能提供了完整的视觉设计指导，确保用户界面既美观又实用。
```
```
```