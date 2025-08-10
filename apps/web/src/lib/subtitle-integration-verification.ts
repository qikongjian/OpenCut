// subtitle-integration-verification.ts - 字幕集成功能验证
// 此文件包含字幕集成功能的验证脚本
// 文件路径: lib/subtitle-integration-verification.ts
// 最后更新: 2025/1/8

import { generateAIEditingMockData } from './ai-editing-mock-data';
import { 
  extractSubtitleDataFromAIEditing,
  validateSubtitleData
} from './ai-subtitle-integration';
import { 
  parseDialogueTrackToTextElements,
  srtTimeToSeconds,
  secondsToSrtTime,
  parseSrtContent
} from './subtitle-parser';

/**
 * 验证字幕集成功能
 */
export function verifySubtitleIntegration(): {
  success: boolean;
  results: string[];
  errors: string[];
} {
  const results: string[] = [];
  const errors: string[] = [];

  try {
    results.push('🚀 开始验证字幕集成功能...');

    // 1. 验证时间码转换功能
    results.push('\n📝 验证时间码转换功能:');
    
    const testCases = [
      { input: '00:00:12,000', expected: 12 },
      { input: '00:01:23,456', expected: 83.456 },
      { input: '01:30:45,789', expected: 5445.789 }
    ];

    for (const testCase of testCases) {
      const result = srtTimeToSeconds(testCase.input);
      if (Math.abs(result - testCase.expected) < 0.001) {
        results.push(`  ✅ ${testCase.input} -> ${result}s`);
      } else {
        errors.push(`  ❌ ${testCase.input} -> ${result}s (期望: ${testCase.expected}s)`);
      }
    }

    // 验证反向转换
    for (const testCase of testCases) {
      const result = secondsToSrtTime(testCase.expected);
      if (result === testCase.input) {
        results.push(`  ✅ ${testCase.expected}s -> ${result}`);
      } else {
        errors.push(`  ❌ ${testCase.expected}s -> ${result} (期望: ${testCase.input})`);
      }
    }

    // 2. 验证SRT内容解析
    results.push('\n📝 验证SRT内容解析:');
    
    const srtContent = `1
00:00:12,000 --> 00:00:15,000
Delta squad, reinforce section gamma. Now. Move now.

2
00:00:15,200 --> 00:00:20,800
They said it was a fortress. Logic's final, perfect kingdom.`;

    const srtEntries = parseSrtContent(srtContent);
    if (srtEntries.length === 2) {
      results.push(`  ✅ 成功解析 ${srtEntries.length} 个SRT条目`);
      
      const firstEntry = srtEntries[0];
      if (firstEntry.index === 1 && firstEntry.startTime === 12 && firstEntry.endTime === 15) {
        results.push(`  ✅ 第一个条目解析正确`);
      } else {
        errors.push(`  ❌ 第一个条目解析错误: ${JSON.stringify(firstEntry)}`);
      }
    } else {
      errors.push(`  ❌ SRT解析失败，期望2个条目，实际${srtEntries.length}个`);
    }

    // 3. 验证AI数据加载和提取
    results.push('\n📝 验证AI数据加载和提取:');
    
    const aiData = generateAIEditingMockData('verification-test');
    if (aiData) {
      results.push(`  ✅ 成功生成AI剪辑数据`);
      
      const subtitleData = extractSubtitleDataFromAIEditing(aiData);
      if (subtitleData) {
        results.push(`  ✅ 成功提取字幕数据`);
        
        // 验证字幕数据结构
        if (subtitleData.final_srt_content) {
          results.push(`  ✅ 包含SRT内容 (${subtitleData.final_srt_content.length} 字符)`);
        }
        
        if (subtitleData.final_dialogue_segments && subtitleData.final_dialogue_segments.length > 0) {
          results.push(`  ✅ 包含 ${subtitleData.final_dialogue_segments.length} 个对话片段`);
          
          // 验证第一个对话片段
          const firstSegment = subtitleData.final_dialogue_segments[0];
          if (firstSegment.transcript && firstSegment.start_timecode && firstSegment.end_timecode) {
            results.push(`  ✅ 对话片段结构正确`);
          } else {
            errors.push(`  ❌ 对话片段结构不完整: ${JSON.stringify(firstSegment)}`);
          }
        } else {
          errors.push(`  ❌ 没有找到对话片段`);
        }
        
        // 4. 验证字幕数据验证功能
        results.push('\n📝 验证字幕数据验证功能:');
        
        const validation = validateSubtitleData(subtitleData);
        if (validation.isValid) {
          results.push(`  ✅ 字幕数据验证通过`);
        } else {
          errors.push(`  ❌ 字幕数据验证失败: ${validation.errors.join(', ')}`);
        }
        
        // 5. 验证文本元素生成
        results.push('\n📝 验证文本元素生成:');
        
        const textElements = parseDialogueTrackToTextElements(subtitleData);
        if (textElements.length > 0) {
          results.push(`  ✅ 成功生成 ${textElements.length} 个文本元素`);
          
          // 验证第一个文本元素
          const firstElement = textElements[0];
          if (firstElement.type === 'text' && 
              firstElement.content && 
              typeof firstElement.startTime === 'number' && 
              typeof firstElement.duration === 'number') {
            results.push(`  ✅ 文本元素结构正确`);
            results.push(`    - 内容: "${firstElement.content.substring(0, 50)}..."`);
            results.push(`    - 开始时间: ${firstElement.startTime}s`);
            results.push(`    - 持续时间: ${firstElement.duration}s`);
            results.push(`    - 字体大小: ${firstElement.fontSize}px`);
            results.push(`    - 颜色: ${firstElement.color}`);
          } else {
            errors.push(`  ❌ 文本元素结构不正确: ${JSON.stringify(firstElement)}`);
          }
          
          // 验证所有元素的基本属性
          let validElements = 0;
          for (const element of textElements) {
            if (element.type === 'text' && 
                element.content && 
                typeof element.startTime === 'number' && 
                element.startTime >= 0 &&
                typeof element.duration === 'number' && 
                element.duration > 0) {
              validElements++;
            }
          }
          
          if (validElements === textElements.length) {
            results.push(`  ✅ 所有 ${textElements.length} 个文本元素都有效`);
          } else {
            errors.push(`  ❌ 只有 ${validElements}/${textElements.length} 个文本元素有效`);
          }
          
        } else {
          errors.push(`  ❌ 没有生成任何文本元素`);
        }
        
      } else {
        errors.push(`  ❌ 无法提取字幕数据`);
      }
    } else {
      errors.push(`  ❌ 无法生成AI剪辑数据`);
    }

    // 6. 总结
    results.push('\n📊 验证总结:');
    results.push(`  ✅ 成功项: ${results.filter(r => r.includes('✅')).length}`);
    results.push(`  ❌ 失败项: ${errors.length}`);
    
    const success = errors.length === 0;
    if (success) {
      results.push('\n🎉 所有验证项目都通过了！字幕集成功能正常工作。');
    } else {
      results.push('\n⚠️ 部分验证项目失败，请检查错误信息。');
    }

    return {
      success,
      results,
      errors
    };

  } catch (error) {
    errors.push(`💥 验证过程中发生异常: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      results,
      errors
    };
  }
}

/**
 * 运行验证并打印结果
 */
export function runSubtitleIntegrationVerification() {
  const verification = verifySubtitleIntegration();
  
  console.log('='.repeat(60));
  console.log('字幕集成功能验证报告');
  console.log('='.repeat(60));
  
  verification.results.forEach(result => console.log(result));
  
  if (verification.errors.length > 0) {
    console.log('\n❌ 错误信息:');
    verification.errors.forEach(error => console.log(error));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(verification.success ? '✅ 验证通过' : '❌ 验证失败');
  console.log('='.repeat(60));
  
  return verification;
}

// 如果直接运行此文件，执行验证
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Node.js 环境
  runSubtitleIntegrationVerification();
}
