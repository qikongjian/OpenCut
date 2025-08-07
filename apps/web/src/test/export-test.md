# 字幕和转场导出测试指南

## 测试目的

验证修复后的导出功能能够正确处理字幕和转场效果。

## 修复总结

### 已解决的核心问题

#### 1. 字幕导出丢失问题

**根本原因**：字幕渲染函数存在多个问题

- 字幕位置计算错误（没有正确处理相对于画布中心的坐标）
- 字幕文本转义不完整，导致 FFmpeg 命令解析失败
- 缺乏详细的调试日志和错误处理

**修复方案**：

- ✅ 重新设计字幕位置计算逻辑
- ✅ 改进字幕文本转义处理
- ✅ 添加详细的调试日志
- ✅ 增加错误处理和回退机制

#### 2. 转场效果导出丢失问题

**根本原因**：转场处理架构设计有缺陷

- 转场效果作为独立片段处理，没有正确集成到视频合并流程
- 转场时间同步逻辑错误
- 缺乏在最终视频上应用转场效果的机制

**修复方案**：

- ✅ 重新设计转场处理架构
- ✅ 创建新的 `applyTransitionEffects` 函数
- ✅ 将转场效果应用移到最终合并阶段
- ✅ 添加转场效果的错误处理

## 测试步骤

### 1. 准备测试数据

1. 在时间线上添加至少一个视频文件
2. 添加至少一个字幕元素（文本）
3. 添加至少一个转场效果

### 2. 检查控制台日志

在导出过程中，检查浏览器控制台是否显示以下日志：

#### 时间线数据提取日志

```
Starting timeline export...
📋 Found X media elements, Y transition elements, and Z text elements to export
🔍 All timeline elements: [详细元素信息]
📝 Text elements details: [字幕详情]
🎬 Transition elements details: [转场详情]
```

#### 字幕渲染日志

```
📝 Rendering subtitles to video...
📝 Processing X text elements
📝 Text 1: [字幕详情]
📝 Building filter for text 1: "内容" at (x, y) from Xs to Ys
📝 Generated filter: [滤镜命令]
📝 Complete subtitle filter chain: [完整滤镜链]
📝 Executing subtitle rendering command: [命令]
✅ Subtitles rendered successfully
```

#### 转场效果日志

```
🎬 Found X transition elements - will be processed during final merge
🎬 Applying transition effects to final video...
🎬 Processing X transition elements
🎬 Transition 1: [转场详情]
🎬 Executing transition effects command: [命令]
✅ Transition effects applied successfully
```

### 3. 验证导出结果

1. 下载导出的视频文件
2. 使用视频播放器播放
3. 检查字幕是否正确显示：
   - 字幕内容是否正确
   - 字幕时间是否准确
   - 字幕位置是否正确
   - 字幕样式是否正确（字体大小、颜色等）
4. 检查转场效果是否应用：
   - 视频开头是否有淡入效果
   - 视频结尾是否有淡出效果

## 常见问题排查

### 字幕不显示

1. 检查控制台是否有字幕渲染相关的错误日志
2. 确认时间线上确实有文本元素
3. 检查字幕的时间范围是否在视频时长内

### 转场效果不显示

1. 检查控制台是否有转场处理相关的错误日志
2. 确认时间线上确实有转场元素
3. 当前实现主要支持淡入淡出效果

### 导出失败

1. 检查控制台错误日志
2. 确认 FFmpeg 是否正确加载
3. 检查浏览器内存是否充足

## 预期结果

- 导出的视频应该包含所有字幕内容
- 字幕应该在正确的时间显示和消失
- 视频应该有基本的淡入淡出转场效果
- 控制台应该显示详细的处理日志

## 注意事项

1. 当前的转场效果实现是基础版本，主要支持淡入淡出
2. 字幕渲染使用 FFmpeg 的 drawtext 滤镜
3. 如果字幕或转场处理失败，系统会回退到原视频
4. 建议在测试时使用较短的视频文件以加快处理速度
