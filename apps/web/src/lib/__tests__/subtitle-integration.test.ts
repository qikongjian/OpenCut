// subtitle-integration.test.ts - 字幕集成功能测试
// 此文件包含字幕解析和集成功能的单元测试
// 文件路径: lib/__tests__/subtitle-integration.test.ts
// 最后更新: 2025/1/8

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  srtTimeToSeconds, 
  secondsToSrtTime, 
  parseSrtContent, 
  dialogueSegmentToTextElement,
  parseDialogueTrackToTextElements 
} from '../subtitle-parser';
import { 
  extractSubtitleDataFromAIEditing,
  validateSubtitleData 
} from '../ai-subtitle-integration';
import { generateAIEditingMockData } from '../ai-editing-mock-data';

describe('字幕解析功能测试', () => {
  describe('SRT时间码转换', () => {
    it('应该正确转换SRT时间码为秒数', () => {
      expect(srtTimeToSeconds('00:00:12,000')).toBe(12);
      expect(srtTimeToSeconds('00:01:23,456')).toBe(83.456);
      expect(srtTimeToSeconds('01:30:45,789')).toBe(5445.789);
    });

    it('应该正确转换秒数为SRT时间码', () => {
      expect(secondsToSrtTime(12)).toBe('00:00:12,000');
      expect(secondsToSrtTime(83.456)).toBe('00:01:23,456');
      expect(secondsToSrtTime(5445.789)).toBe('01:30:45,789');
    });

    it('应该处理边界情况', () => {
      expect(srtTimeToSeconds('00:00:00,000')).toBe(0);
      expect(secondsToSrtTime(0)).toBe('00:00:00,000');
    });
  });

  describe('SRT内容解析', () => {
    it('应该正确解析标准SRT格式', () => {
      const srtContent = `1
00:00:12,000 --> 00:00:15,000
Delta squad, reinforce section gamma. Now. Move now.

2
00:00:15,200 --> 00:00:20,800
They said it was a fortress. Logic's final, perfect kingdom.`;

      const entries = parseSrtContent(srtContent);
      
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        index: 1,
        startTime: 12,
        endTime: 15,
        text: 'Delta squad, reinforce section gamma. Now. Move now.'
      });
      expect(entries[1]).toEqual({
        index: 2,
        startTime: 15.2,
        endTime: 20.8,
        text: "They said it was a fortress. Logic's final, perfect kingdom."
      });
    });

    it('应该处理多行字幕文本', () => {
      const srtContent = `1
00:00:12,000 --> 00:00:15,000
Line 1
Line 2
Line 3`;

      const entries = parseSrtContent(srtContent);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].text).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('对话片段转换', () => {
    it('应该正确转换DialogueSegment为TextElement', () => {
      const segment = {
        sequence_clip_id: "v1_clip_002",
        source_clip_id: "E01-S01-C03_to_C04",
        start_timecode: "00:00:12.000",
        end_timecode: "00:00:15.000",
        transcript: "Delta squad, reinforce section gamma. Now. Move now.",
        speaker: "Dr. Elara Vance [CH-001]"
      };

      const textElement = dialogueSegmentToTextElement(segment, 0);

      expect(textElement.type).toBe('text');
      expect(textElement.content).toBe(segment.transcript);
      expect(textElement.startTime).toBe(12);
      expect(textElement.duration).toBe(3);
      expect(textElement.name).toBe('字幕 1 - Dr. Elara Vance [CH-001]');
      expect(textElement.fontSize).toBe(48);
      expect(textElement.color).toBe('#ffffff');
    });

    it('应该处理最小持续时间', () => {
      const segment = {
        sequence_clip_id: "v1_clip_002",
        source_clip_id: "E01-S01-C03_to_C04",
        start_timecode: "00:00:12.000",
        end_timecode: "00:00:12.100", // 只有0.1秒
        transcript: "Short text",
        speaker: "Speaker"
      };

      const textElement = dialogueSegmentToTextElement(segment, 0);
      expect(textElement.duration).toBe(0.5); // 应该被设置为最小值0.5秒
    });
  });
});

describe('AI字幕集成功能测试', () => {
  let mockAIData: any;

  beforeEach(() => {
    mockAIData = generateAIEditingMockData('test-project');
  });

  describe('字幕数据提取', () => {
    it('应该从AI剪辑数据中提取字幕数据', () => {
      const subtitleData = extractSubtitleDataFromAIEditing(mockAIData);
      
      expect(subtitleData).toBeTruthy();
      expect(subtitleData?.final_srt_content).toBeTruthy();
      expect(subtitleData?.final_dialogue_segments).toBeTruthy();
      expect(subtitleData?.final_dialogue_segments?.length).toBeGreaterThan(0);
    });

    it('应该处理没有字幕数据的情况', () => {
      const dataWithoutSubtitles = {
        ...mockAIData,
        editing_plan: {
          ...mockAIData.editing_plan,
          finalized_dialogue_track: undefined
        }
      };

      const subtitleData = extractSubtitleDataFromAIEditing(dataWithoutSubtitles);
      expect(subtitleData).toBeNull();
    });
  });

  describe('字幕数据验证', () => {
    it('应该验证有效的字幕数据', () => {
      const subtitleData = extractSubtitleDataFromAIEditing(mockAIData);
      const validation = validateSubtitleData(subtitleData!);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测无效的字幕数据', () => {
      const invalidSubtitleData = {
        final_srt_content: '',
        final_dialogue_segments: []
      };

      const validation = validateSubtitleData(invalidSubtitleData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('缺少字幕内容数据');
    });

    it('应该检测缺少文本内容的片段', () => {
      const invalidSubtitleData = {
        final_srt_content: 'valid srt content',
        final_dialogue_segments: [
          {
            sequence_clip_id: "v1_clip_002",
            source_clip_id: "E01-S01-C03_to_C04",
            start_timecode: "00:00:12.000",
            end_timecode: "00:00:15.000",
            transcript: "", // 空文本
            speaker: "Speaker"
          }
        ]
      };

      const validation = validateSubtitleData(invalidSubtitleData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('第 1 个字幕片段缺少文本内容');
    });
  });

  describe('字幕元素生成', () => {
    it('应该从对话轨道生成文本元素', () => {
      const subtitleData = extractSubtitleDataFromAIEditing(mockAIData);
      const textElements = parseDialogueTrackToTextElements(subtitleData!);
      
      expect(textElements.length).toBeGreaterThan(0);
      
      // 检查第一个元素
      const firstElement = textElements[0];
      expect(firstElement.type).toBe('text');
      expect(firstElement.content).toBeTruthy();
      expect(firstElement.startTime).toBeGreaterThanOrEqual(0);
      expect(firstElement.duration).toBeGreaterThan(0);
      expect(firstElement.fontSize).toBe(48);
      expect(firstElement.color).toBe('#ffffff');
    });

    it('应该优先使用dialogue_segments而不是SRT内容', () => {
      const subtitleData = extractSubtitleDataFromAIEditing(mockAIData);
      const textElements = parseDialogueTrackToTextElements(subtitleData!);
      
      // 应该生成与dialogue_segments数量相同的元素
      expect(textElements.length).toBe(subtitleData!.final_dialogue_segments!.length);
    });
  });
});

describe('集成测试', () => {
  it('应该完整处理AI剪辑数据到文本元素的转换流程', () => {
    // 1. 生成mock数据
    const aiData = generateAIEditingMockData('integration-test');
    
    // 2. 提取字幕数据
    const subtitleData = extractSubtitleDataFromAIEditing(aiData);
    expect(subtitleData).toBeTruthy();
    
    // 3. 验证字幕数据
    const validation = validateSubtitleData(subtitleData!);
    expect(validation.isValid).toBe(true);
    
    // 4. 生成文本元素
    const textElements = parseDialogueTrackToTextElements(subtitleData!);
    expect(textElements.length).toBeGreaterThan(0);
    
    // 5. 验证生成的文本元素
    textElements.forEach((element, index) => {
      expect(element.type).toBe('text');
      expect(element.content).toBeTruthy();
      expect(element.startTime).toBeGreaterThanOrEqual(0);
      expect(element.duration).toBeGreaterThan(0);
      expect(element.name).toContain('字幕');
      
      console.log(`✅ Text element ${index + 1}: "${element.content}" at ${element.startTime}s for ${element.duration}s`);
    });
    
    console.log(`🎉 Successfully processed ${textElements.length} subtitle elements from AI editing data`);
  });
});
