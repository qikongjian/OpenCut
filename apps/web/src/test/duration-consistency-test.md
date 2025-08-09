# 时间轴和导出视频时长一致性测试

## 问题描述
- **症状**: 时间轴显示18.3秒，导出视频却是24秒
- **根本原因**: FFmpeg导出时使用了错误的时长参数

## 修复内容

### 1. 修复位置
- `apps/web/src/lib/ffmpeg/operations/timeline-export.ts` - `trimSegmentOptimized`函数
- `apps/web/src/lib/ffmpeg/operations/fast-export.ts` - `processSegmentUltraFast`函数  
- `apps/web/src/lib/ffmpeg-utils.ts` - 音频处理部分

### 2. 修复详情
**修复前**:
```bash
# FFmpeg裁剪命令使用原始时长
-t ${element.duration}
```

**修复后**:
```bash
# FFmpeg裁剪命令使用实际时长（考虑裁剪）
-t ${element.duration - element.trimStart - element.trimEnd}
```

## 测试验证

### 测试场景1: 单个视频片段裁剪
1. 导入一个30秒的视频
2. 设置 trimStart = 5秒, trimEnd = 6秒
3. 预期时间轴显示: 19秒 (30-5-6=19)
4. 预期导出时长: 19秒

### 测试场景2: 多个片段组合
1. 片段A: 20秒视频，trimStart=2, trimEnd=3 → 实际15秒
2. 片段B: 15秒视频，trimStart=1, trimEnd=2 → 实际12秒
3. 预期时间轴显示: 27秒 (15+12=27)
4. 预期导出时长: 27秒

### 测试场景3: 包含音频轨道
1. 视频轨道: 25秒（裁剪后20秒）
2. 音频轨道: 30秒（裁剪后18秒）
3. 预期时间轴显示: 20秒（以视频轨道为准）
4. 预期导出时长: 20秒

## 验证步骤

### 自动化验证
```typescript
// 验证时长计算一致性
function verifyDurationConsistency(timelineData: TimelineData) {
  const timelineDuration = getTotalDuration(); // 时间轴计算
  
  // 模拟导出时长计算
  const exportElements = timelineData.tracks.flatMap(track => 
    track.elements.filter(el => el.type === "media")
  ).map(element => ({
    ...element,
    actualDuration: element.duration - element.trimStart - element.trimEnd
  }));
  
  const exportDuration = Math.max(...exportElements.map(el => 
    el.startTime + el.actualDuration
  ));
  
  console.assert(
    Math.abs(timelineDuration - exportDuration) < 0.1, 
    `时长不一致: 时间轴=${timelineDuration}s, 导出=${exportDuration}s`
  );
}
```

### 手动验证
1. 打开编辑器，导入测试视频
2. 进行裁剪操作（设置trimStart和trimEnd）
3. 观察时间轴显示的总时长
4. 执行导出操作
5. 检查导出视频的实际时长
6. 验证两者是否一致（误差<0.5秒）

## 预期结果
- ✅ 时间轴显示时长 = 导出视频时长
- ✅ 裁剪操作正确反映在导出结果中
- ✅ 音频和视频轨道时长计算一致

## 注意事项
- 由于视频编码精度，可能存在±0.1秒的微小误差，这是正常的
- 确保测试不同的视频格式（MP4, WebM等）
- 测试不同的导出质量设置 