// ai-subtitle-integration.ts - AI剪辑字幕集成功能
// 此文件包含将AI剪辑数据中的字幕集成到时间线的功能
// 文件路径: lib/ai-subtitle-integration.ts
// 最后更新: 2025/1/8

import { AIEditingData, FinalizedDialogueTrack, CreateTextElement } from "@/types/timeline";
import { parseDialogueTrackToTextElements, matchTextElementsToVideoClips } from "./subtitle-parser";
import { useTimelineStore } from "@/stores/timeline-store";
import { toast } from "sonner";

/**
 * 从AI剪辑数据中提取字幕数据
 * @param aiEditingData AI剪辑数据
 * @returns 字幕数据或null
 */
export function extractSubtitleDataFromAIEditing(aiEditingData: AIEditingData): FinalizedDialogueTrack | null {
  return aiEditingData.editing_plan.finalized_dialogue_track || null;
}

/**
 * 将AI剪辑数据中的字幕添加到时间线
 * @param aiEditingData AI剪辑数据
 * @returns 是否成功添加字幕
 */
export function addAISubtitlesToTimeline(aiEditingData: AIEditingData): boolean {
  try {
    const subtitleData = extractSubtitleDataFromAIEditing(aiEditingData);
    
    if (!subtitleData) {
      console.log('📝 No subtitle data found in AI editing data');
      return false;
    }

    // 解析字幕数据为TextElement数组
    const textElements = parseDialogueTrackToTextElements(subtitleData);
    
    if (textElements.length === 0) {
      console.log('📝 No text elements generated from subtitle data');
      return false;
    }

    console.log(`📝 Generated ${textElements.length} text elements from AI subtitle data`);

    // 获取时间线store实例
    const { insertTrackAt, addElementToTrack } = useTimelineStore.getState();
    
    // 创建新的文本轨道
    const textTrackId = insertTrackAt("text", 0);

    // 将所有文本元素添加到轨道
    let addedCount = 0;
    textElements.forEach((textElement, index) => {
      try {
        addElementToTrack(textTrackId, textElement);
        addedCount++;
        console.log(`📝 Added text element ${index + 1}: "${textElement.content}" at ${textElement.startTime}s`);
      } catch (error) {
        console.error(`❌ Failed to add text element ${index + 1}:`, error);
      }
    });

    if (addedCount > 0) {
      toast.success(`成功添加 ${addedCount} 个字幕到时间线`);
      return true;
    } else {
      toast.error('添加字幕失败');
      return false;
    }

  } catch (error) {
    console.error('❌ Error adding AI subtitles to timeline:', error);
    toast.error('添加AI字幕时发生错误');
    return false;
  }
}

/**
 * 批量添加字幕元素到指定轨道
 * @param trackId 轨道ID
 * @param textElements 文本元素数组
 * @returns 成功添加的数量
 */
export function addTextElementsToTrack(trackId: string, textElements: CreateTextElement[]): number {
  const { checkElementOverlap, addElementToTrack } = useTimelineStore.getState();
  let addedCount = 0;

  textElements.forEach((textElement, index) => {
    try {
      // 检查是否与现有元素重叠
      const hasOverlap = checkElementOverlap(
        trackId,
        textElement.startTime,
        textElement.duration
      );

      if (hasOverlap) {
        console.warn(`⚠️ Text element ${index + 1} overlaps with existing elements, skipping`);
        return;
      }

      addElementToTrack(trackId, textElement);
      addedCount++;
      console.log(`📝 Added text element ${index + 1}: "${textElement.content}"`);
    } catch (error) {
      console.error(`❌ Failed to add text element ${index + 1}:`, error);
    }
  });

  return addedCount;
}

/**
 * 创建字幕轨道并添加字幕
 * @param textElements 文本元素数组
 * @param trackName 轨道名称
 * @returns 创建的轨道ID或null
 */
export function createSubtitleTrackWithElements(
  textElements: CreateTextElement[],
  trackName: string = "AI字幕"
): string | null {
  try {
    const { insertTrackAt, tracks, deleteTrack } = useTimelineStore.getState();

    // 创建新的文本轨道
    const trackId = insertTrackAt("text", 0);

    // 更新轨道名称
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      track.name = trackName;
    }

    // 添加文本元素到轨道
    const addedCount = addTextElementsToTrack(trackId, textElements);

    if (addedCount > 0) {
      console.log(`📝 Created subtitle track "${trackName}" with ${addedCount} elements`);
      return trackId;
    } else {
      // 如果没有添加任何元素，删除空轨道
      deleteTrack(trackId);
      return null;
    }

  } catch (error) {
    console.error('❌ Error creating subtitle track:', error);
    return null;
  }
}

/**
 * 从AI剪辑数据中提取并应用字幕样式
 * @param textElements 文本元素数组
 * @param aiEditingData AI剪辑数据
 * @returns 应用样式后的文本元素数组
 */
export function applyAISubtitleStyles(
  textElements: CreateTextElement[], 
  aiEditingData: AIEditingData
): CreateTextElement[] {
  // 这里可以根据AI剪辑数据中的样式信息来调整字幕样式
  // 目前使用默认样式，未来可以扩展
  
  return textElements.map(element => ({
    ...element,
    // 可以根据AI数据调整样式
    fontSize: 48,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    textAlign: "center" as const,
    y: 200, // 底部位置
  }));
}

/**
 * 智能字幕时间调整
 * 根据视频片段的实际时间调整字幕时间
 * @param textElements 文本元素数组
 * @param videoClips 视频片段信息
 * @returns 调整后的文本元素数组
 */
export function adjustSubtitleTiming(
  textElements: CreateTextElement[],
  videoClips: Array<{
    sequence_clip_id: string;
    sequence_start_timecode: string;
    clip_duration_in_sequence: string;
  }>
): CreateTextElement[] {
  // 这里可以实现更复杂的时间调整逻辑
  // 目前保持原有时间不变
  return textElements;
}

/**
 * 验证字幕数据的完整性
 * @param subtitleData 字幕数据
 * @returns 验证结果
 */
export function validateSubtitleData(subtitleData: FinalizedDialogueTrack): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!subtitleData.final_srt_content && (!subtitleData.final_dialogue_segments || subtitleData.final_dialogue_segments.length === 0)) {
    errors.push('缺少字幕内容数据');
  }

  if (subtitleData.final_dialogue_segments) {
    subtitleData.final_dialogue_segments.forEach((segment, index) => {
      if (!segment.transcript || segment.transcript.trim() === '') {
        errors.push(`第 ${index + 1} 个字幕片段缺少文本内容`);
      }
      if (!segment.start_timecode || !segment.end_timecode) {
        errors.push(`第 ${index + 1} 个字幕片段缺少时间码`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
