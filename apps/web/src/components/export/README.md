# 导出系统组件使用说明

## 📋 概述

这是 OpenCut 视频编辑器的导出系统页面排版组件，完全基于提供的界面设计图片实现。包含三个主要弹窗组件和两个辅助组件。

## 🎯 组件列表

### 主要组件

1. **ExportDialog** - 主导出弹窗
2. **ExportSettings** - 导出设置弹窗  
3. **ExportProgress** - 导出进度弹窗

### 辅助组件

4. **ExportOptionCard** - 导出选项卡片
5. **SocialPlatformCard** - 社交媒体平台卡片



## 🚀 使用方法

### 基本使用

```tsx
import { 
  ExportDialog, 
  ExportSettings, 
  ExportProgress 
} from '@/components/export'

function MyComponent() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false)
  const [exportProgressOpen, setExportProgressOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setExportDialogOpen(true)}>
        导出视频
      </Button>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExportSettingsOpen={() => {
          setExportDialogOpen(false)
          setExportSettingsOpen(true)
        }}
      />

      <ExportSettings
        open={exportSettingsOpen}
        onOpenChange={setExportSettingsOpen}
        onBack={() => {
          setExportSettingsOpen(false)
          setExportDialogOpen(true)
        }}
        onExportProgressOpen={() => {
          setExportSettingsOpen(false)
          setExportProgressOpen(true)
        }}
      />

      <ExportProgress
        open={exportProgressOpen}
        onOpenChange={setExportProgressOpen}
        progress={75.5}
        status="儲存中..."
        onCancel={() => setExportProgressOpen(false)}
      />
    </>
  )
}
```

### 集成使用

导出系统已集成到主编辑器的右上角导出按钮中，点击即可使用完整的导出功能。

## 📱 界面特性

### 1. 主导出弹窗 (ExportDialog)

- **标题**: "匯出"
- **四个主要选项**:
  - 分享以供審閱 (带评论图标)
  - 作為簡報分享 (带播放图标)
  - 分享到社群平台 (社交媒体网格)
  - 下載 (带下载图标)

**社交媒体平台**:
- TikTok
- TikTok Ads Manager
- YouTube
- YouTube Shorts
- Facebook 粉絲專頁
- Instagram Reels
- 排程 (带"免費"标签)

### 2. 导出设置弹窗 (ExportSettings)

- **标题**: "匯出設定" (带返回按钮)
- **设置项**:
  - 影片封面预览
  - 名稱输入框 (默认时间戳)
  - 解析度选择 (480p/720p/1080p/4K)
  - 品質选择 (低畫質/建議畫質/高畫質)
  - 畫面速率选择 (24fps/30fps/60fps)
  - 格式选择 (MP4/WebM/AVI/MOV)
- **青色导出按钮**: "匯出"

### 3. 导出进度弹窗 (ExportProgress)

- **标题**: "下載" (带关闭按钮)
- **进度显示**: 大型百分比显示
- **状态文字**: 可自定义状态信息
- **描述文字**: "實存影片請稍等片刻請稍等"
- **取消按钮**: "取消匯出"

## 🎨 设计特点

### 深色主题
- 使用现有的设计系统颜色变量
- 保持与主应用的视觉一致性

### 繁体中文界面
- 所有文字都使用繁体中文
- 符合目标用户的语言习惯

### 响应式设计
- 支持移动端显示
- 弹窗最大宽度 `max-w-md`
- 社交媒体网格自适应布局

### 交互反馈
- 悬停效果和点击状态
- 焦点环和键盘导航支持
- 平滑的过渡动画

## 🔧 技术实现

### 依赖组件
- Dialog (Radix UI)
- Button
- Input
- Label  
- Select
- Lucide React 图标

### 状态管理
- 使用 React useState 管理弹窗状态
- 支持受控和非受控模式
- 提供完整的回调接口

### 类型安全
- 完整的 TypeScript 类型定义
- 严格的 props 接口
- 良好的代码提示支持

## 📋 待办事项 (阶段 1.2.2)

以下功能将在功能实现阶段添加：

- [ ] 实际的导出逻辑集成
- [ ] FFmpeg.wasm 集成
- [ ] 社交媒体平台 API 集成
- [ ] 真实的进度跟踪
- [ ] 错误处理和重试机制
- [ ] 导出配置持久化
- [ ] 批量导出支持

## 🧪 测试建议

1. **界面测试**:
   - 检查所有弹窗正确显示
   - 验证表单字段输入正常
   - 测试社交媒体网格布局
   - 确认移动端响应式显示

2. **交互测试**:
   - 测试弹窗间的导航流程
   - 验证返回按钮功能
   - 检查取消和关闭操作
   - 测试键盘导航

3. **视觉测试**:
   - 确认深色主题一致性
   - 检查繁体中文显示正确
   - 验证图标和颜色正确
   - 测试动画效果流畅

这个页面排版阶段为后续的功能实现提供了完整的UI基础。 