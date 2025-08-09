# AI视频片段时长一致性测试

## 问题描述
- **症状**: AI视频片段拖到时间轴，时间轴显示18.3秒，导出视频却是24秒
- **根本原因**: AI剪辑片段的 `trimEnd` 计算错误，导致FFmpeg导出时使用了错误的时长

## 问题分析

### AI剪辑数据结构
```typescript
{
  sequence_clip_id: "v1_clip_003",
  source_in_timecode: "00:00:00.500",    // 0.5秒
  source_out_timecode: "00:00:08.100",   // 8.1秒  
  clip_duration_in_sequence: "7.6s"      // 7.6秒
}
```

### 修复前的错误逻辑
```typescript
const duration = durationToSeconds(clip.clip_duration_in_sequence); // 7.6
const trimStart = timecodeToSeconds(clip.source_in_timecode);        // 0.5  
const trimEnd = Math.max(0, timecodeToSeconds(clip.source_out_timecode)); // 8.1 ❌

// 时间轴计算: 7.6 - 0.5 - 8.1 = -1.0 ❌ (负数！)
// FFmpeg命令: -ss 0.5 -t 7.6 (但实际视频可能不够长)
```

### 修复后的正确逻辑
```typescript
const sourceIn = timecodeToSeconds(clip.source_in_timecode);         // 0.5
const sourceOut = timecodeToSeconds(clip.source_out_timecode);       // 8.1
const actualClipDuration = sourceOut - sourceIn;                    // 7.6
const originalVideoDuration = Math.max(sourceOut + 10, 30);         // 18.1 (足够大)
const duration = originalVideoDuration;                             // 18.1
const trimEnd = originalVideoDuration - sourceOut;                  // 10.0

// 时间轴计算: 18.1 - 0.5 - 10.0 = 7.6 ✅ (正确！)
// FFmpeg命令: -ss 0.5 -t 7.6 ✅ (使用实际时长)
```

## 修复内容

### 文件位置
`apps/web/src/stores/ai-editing-store.ts` - `executeEditingPlan` 函数

### 修复详情
1. **正确计算实际片段时长**: `actualClipDuration = sourceOut - sourceIn`
2. **设置足够大的原始时长**: `originalVideoDuration = Math.max(sourceOut + 10, 30)`
3. **正确计算trimEnd**: `trimEnd = originalVideoDuration - sourceOut`
4. **确保时间轴位置按实际时长前进**: `currentTimelinePosition += actualClipDuration`

## 测试验证

### 测试场景1: 标准AI剪辑片段
```typescript
// 输入数据
const testClip = {
  source_in_timecode: "00:00:00.500",
  source_out_timecode: "00:00:08.100", 
  clip_duration_in_sequence: "7.6s"
};

// 预期结果
const expected = {
  actualClipDuration: 7.6,
  originalVideoDuration: 18.1,
  trimStart: 0.5,
  trimEnd: 10.0,
  timelineCalculatedDuration: 7.6,
  ffmpegCommand: "-ss 0.5 -t 7.6"
};
```

### 测试场景2: 从零开始的AI片段
```typescript
// 输入数据
const testClip = {
  source_in_timecode: "00:00:00.000",
  source_out_timecode: "00:00:03.400",
  clip_duration_in_sequence: "3.4s"
};

// 预期结果
const expected = {
  actualClipDuration: 3.4,
  originalVideoDuration: 30.0,
  trimStart: 0.0,
  trimEnd: 26.6,
  timelineCalculatedDuration: 3.4,
  ffmpegCommand: "-ss 0.0 -t 3.4"
};
```

### 验证步骤
1. 打开AI剪辑面板
2. 执行一键剪辑功能
3. 观察控制台输出的AI片段时长计算日志
4. 检查时间轴显示的总时长
5. 执行导出操作
6. 验证导出视频时长与时间轴一致

## 预期结果
- ✅ 时间轴显示时长 = 导出视频时长
- ✅ AI剪辑片段的实际时长正确反映在时间轴和导出中
- ✅ 控制台日志显示正确的时长计算过程

## 调试信息
修复后的代码会输出详细的调试信息：
```javascript
console.log(`📊 AI剪辑片段时长计算:`, {
  clipId: clip.sequence_clip_id,
  sourceIn: sourceIn,
  sourceOut: sourceOut,
  actualClipDuration: actualClipDuration,
  originalVideoDuration: duration,
  trimStart: sourceIn,
  trimEnd: trimEnd,
  timelineCalculatedDuration: duration - sourceIn - trimEnd,
  expectedDuration: actualClipDuration
});
```

通过这些日志可以验证每个AI片段的时长计算是否正确。 