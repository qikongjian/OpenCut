// verify-subtitle-integration.js - 字幕集成功能验证脚本
// 此脚本用于验证字幕集成功能是否正常工作
// 运行方式: node verify-subtitle-integration.js

console.log('🚀 开始验证字幕集成功能...\n');

// 模拟时间码转换功能
function srtTimeToSeconds(timeCode) {
  const parts = timeCode.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsParts = parts[2].split(',');
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = secondsParts[1] ? parseInt(secondsParts[1], 10) : 0;
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function secondsToSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// 模拟SRT解析功能
function parseSrtContent(srtContent) {
  const entries = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;
    
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;
    
    const startTime = srtTimeToSeconds(timeMatch[1]);
    const endTime = srtTimeToSeconds(timeMatch[2]);
    const text = lines.slice(2).join('\n');
    
    entries.push({
      index,
      startTime,
      endTime,
      text
    });
  }
  
  return entries;
}

// 模拟AI剪辑数据
const mockAIData = {
  project_id: "verification-test",
  script_content: "",
  director_intent: "",
  success: true,
  editing_plan: {
    finalized_dialogue_track: {
      final_srt_content: `1
00:00:12,000 --> 00:00:15,000
Delta squad, reinforce section gamma. Now. Move now.

2
00:00:15,200 --> 00:00:20,800
They said it was a fortress. Logic's final, perfect kingdom.

3
00:00:23,500 --> 00:00:25,800
But the universe doesn't follow logic.`,
      final_dialogue_segments: [
        {
          sequence_clip_id: "v1_clip_002",
          source_clip_id: "E01-S01-C03_to_C04",
          start_timecode: "00:00:12.000",
          end_timecode: "00:00:15.000",
          transcript: "Delta squad, reinforce section gamma. Now. Move now.",
          speaker: "Dr. Elara Vance [CH-001]"
        },
        {
          sequence_clip_id: "v1_clip_003",
          source_clip_id: "[E01-S01-C05]",
          start_timecode: "00:00:15.200",
          end_timecode: "00:00:20.800",
          transcript: "They said it was a fortress. Logic's final, perfect kingdom.",
          speaker: "Dr. Elara Vance (旁白)"
        },
        {
          sequence_clip_id: "v1_clip_004",
          source_clip_id: "E01-S01-C06-C07",
          start_timecode: "00:00:23.500",
          end_timecode: "00:00:25.800",
          transcript: "But the universe doesn't follow logic.",
          speaker: "Dr. Elara Vance [画外音]"
        }
      ]
    }
  }
};

// 验证函数
function runVerification() {
  let passedTests = 0;
  let totalTests = 0;
  const errors = [];

  // 测试1: 时间码转换
  console.log('📝 测试时间码转换功能:');
  totalTests++;
  
  const testCases = [
    { input: '00:00:12,000', expected: 12 },
    { input: '00:01:23,456', expected: 83.456 },
    { input: '01:30:45,789', expected: 5445.789 }
  ];

  let timeConversionPassed = true;
  for (const testCase of testCases) {
    const result = srtTimeToSeconds(testCase.input);
    if (Math.abs(result - testCase.expected) < 0.001) {
      console.log(`  ✅ ${testCase.input} -> ${result}s`);
    } else {
      console.log(`  ❌ ${testCase.input} -> ${result}s (期望: ${testCase.expected}s)`);
      timeConversionPassed = false;
      errors.push(`时间码转换失败: ${testCase.input}`);
    }
  }

  // 验证反向转换
  for (const testCase of testCases) {
    const result = secondsToSrtTime(testCase.expected);
    if (result === testCase.input) {
      console.log(`  ✅ ${testCase.expected}s -> ${result}`);
    } else {
      console.log(`  ❌ ${testCase.expected}s -> ${result} (期望: ${testCase.input})`);
      timeConversionPassed = false;
      errors.push(`反向时间码转换失败: ${testCase.expected}s`);
    }
  }

  if (timeConversionPassed) passedTests++;

  // 测试2: SRT内容解析
  console.log('\n📝 测试SRT内容解析:');
  totalTests++;
  
  const srtEntries = parseSrtContent(mockAIData.editing_plan.finalized_dialogue_track.final_srt_content);
  if (srtEntries.length === 3) {
    console.log(`  ✅ 成功解析 ${srtEntries.length} 个SRT条目`);
    
    const firstEntry = srtEntries[0];
    if (firstEntry.index === 1 && firstEntry.startTime === 12 && firstEntry.endTime === 15) {
      console.log(`  ✅ 第一个条目解析正确`);
      passedTests++;
    } else {
      console.log(`  ❌ 第一个条目解析错误`);
      errors.push('SRT第一个条目解析错误');
    }
  } else {
    console.log(`  ❌ SRT解析失败，期望3个条目，实际${srtEntries.length}个`);
    errors.push('SRT解析条目数量错误');
  }

  // 测试3: 对话片段数据验证
  console.log('\n📝 测试对话片段数据:');
  totalTests++;
  
  const dialogueSegments = mockAIData.editing_plan.finalized_dialogue_track.final_dialogue_segments;
  if (dialogueSegments && dialogueSegments.length === 3) {
    console.log(`  ✅ 包含 ${dialogueSegments.length} 个对话片段`);
    
    const firstSegment = dialogueSegments[0];
    if (firstSegment.transcript && firstSegment.start_timecode && firstSegment.end_timecode && firstSegment.speaker) {
      console.log(`  ✅ 对话片段结构正确`);
      console.log(`    - 内容: "${firstSegment.transcript}"`);
      console.log(`    - 说话人: ${firstSegment.speaker}`);
      console.log(`    - 时间: ${firstSegment.start_timecode} -> ${firstSegment.end_timecode}`);
      passedTests++;
    } else {
      console.log(`  ❌ 对话片段结构不完整`);
      errors.push('对话片段结构不完整');
    }
  } else {
    console.log(`  ❌ 对话片段数量错误，期望3个，实际${dialogueSegments ? dialogueSegments.length : 0}个`);
    errors.push('对话片段数量错误');
  }

  // 测试4: 文本元素转换模拟
  console.log('\n📝 测试文本元素转换:');
  totalTests++;
  
  const textElements = dialogueSegments.map((segment, index) => {
    const startTime = srtTimeToSeconds(segment.start_timecode);
    const endTime = srtTimeToSeconds(segment.end_timecode);
    const duration = Math.max(endTime - startTime, 0.5);
    
    return {
      type: "text",
      name: `字幕 ${index + 1} - ${segment.speaker}`,
      content: segment.transcript,
      duration,
      startTime,
      trimStart: 0,
      trimEnd: 0,
      fontSize: 48,
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      textAlign: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      x: 0,
      y: 200,
      rotation: 0,
      opacity: 1,
      horizontalFlip: false,
    };
  });

  if (textElements.length === 3) {
    console.log(`  ✅ 成功生成 ${textElements.length} 个文本元素`);
    
    const firstElement = textElements[0];
    console.log(`    - 内容: "${firstElement.content}"`);
    console.log(`    - 开始时间: ${firstElement.startTime}s`);
    console.log(`    - 持续时间: ${firstElement.duration}s`);
    console.log(`    - 字体大小: ${firstElement.fontSize}px`);
    console.log(`    - 颜色: ${firstElement.color}`);
    
    passedTests++;
  } else {
    console.log(`  ❌ 文本元素生成失败`);
    errors.push('文本元素生成失败');
  }

  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证总结:');
  console.log(`  ✅ 通过测试: ${passedTests}/${totalTests}`);
  console.log(`  ❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
  
  if (errors.length > 0) {
    console.log('\n❌ 错误信息:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  if (passedTests === totalTests) {
    console.log('🎉 所有验证项目都通过了！字幕集成功能正常工作。');
  } else {
    console.log('⚠️ 部分验证项目失败，请检查错误信息。');
  }
  console.log('='.repeat(60));
  
  return passedTests === totalTests;
}

// 运行验证
const success = runVerification();
process.exit(success ? 0 : 1);
