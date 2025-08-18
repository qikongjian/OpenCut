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
  console.log(`📝 开始向轨道 ${trackId} 添加 ${textElements.length} 个文本元素`);

  const { checkElementOverlap, addElementToTrack } = useTimelineStore.getState();
  let addedCount = 0;

  textElements.forEach((textElement, index) => {
    try {
      console.log(`📝 处理文本元素 ${index + 1}/${textElements.length}:`);
      console.log(`   内容: "${textElement.content?.substring(0, 50)}..."`);
      console.log(`   开始时间: ${textElement.startTime}s`);
      console.log(`   持续时间: ${textElement.duration}s`);
      console.log(`   类型: ${textElement.type}`);

      // 🎯 修复：对于AI字幕，不检查重叠，因为时间轴可能已被清空
      // 字幕轨道通常是独立的，不需要严格的重叠检查
      console.log(`📝 添加字幕元素 ${index + 1}，跳过重叠检查`);
      console.log(`   字幕内容: "${textElement.content?.substring(0, 30)}..."`);
      console.log(`   开始时间: ${textElement.startTime}s，持续时间: ${textElement.duration}s`);

      // 确保文本元素有必需的属性
      const completeTextElement = {
        ...textElement,
        id: textElement.id || `subtitle-${Date.now()}-${index}`,
        name: textElement.name || `字幕 ${index + 1}`,
        trimStart: textElement.trimStart || 0,
        trimEnd: textElement.trimEnd || 0,
      };

      addElementToTrack(trackId, completeTextElement);
      addedCount++;
      console.log(`✅ 成功添加文本元素 ${index + 1}: "${textElement.content?.substring(0, 30)}..."`);
    } catch (error) {
      console.error(`❌ 添加文本元素 ${index + 1} 失败:`, error);
      console.error(`   元素数据:`, textElement);
    }
  });

  console.log(`📝 完成添加文本元素，成功: ${addedCount}/${textElements.length}`);
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
    console.log(`📝 开始创建字幕轨道: "${trackName}"，包含 ${textElements.length} 个元素`);

    const timelineStore = useTimelineStore.getState();
    const { insertTrackAt, removeTrack } = timelineStore;

    // 创建新的文本轨道
    const trackId = insertTrackAt("text", 0);
    console.log(`📝 创建了文本轨道，ID: ${trackId}`);

    // 更新轨道名称 - 使用最新的tracks状态
    const updatedTracks = useTimelineStore.getState().tracks;
    const track = updatedTracks.find(t => t.id === trackId);
    if (track) {
      track.name = trackName;
      console.log(`📝 轨道名称已更新为: "${trackName}"`);
    } else {
      console.warn(`⚠️ 找不到轨道 ${trackId} 来更新名称`);
    }

    // 添加文本元素到轨道
    console.log(`📝 开始添加 ${textElements.length} 个文本元素到轨道`);
    const addedCount = addTextElementsToTrack(trackId, textElements);

    if (addedCount > 0) {
      console.log(`✅ 成功创建字幕轨道 "${trackName}"，添加了 ${addedCount} 个元素`);

      // 验证轨道是否真的包含元素
      const finalTracks = useTimelineStore.getState().tracks;
      const finalTrack = finalTracks.find(t => t.id === trackId);
      if (finalTrack) {
        console.log(`🔍 验证: 轨道 "${finalTrack.name}" 包含 ${finalTrack.elements.length} 个元素`);
      }

      return trackId;
    } else {
      console.warn(`⚠️ 没有成功添加任何元素，删除空轨道 ${trackId}`);
      // 如果没有添加任何元素，删除空轨道
      removeTrack(trackId);
      return null;
    }

  } catch (error) {
    console.error('❌ 创建字幕轨道时发生错误:', error);
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
    y: 0, // 使用样式的alignment而不是绝对位置
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
