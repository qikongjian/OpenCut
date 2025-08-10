// subtitle-parser.ts - 字幕数据解析工具
// 此文件包含解析finalized_dialogue_track数据并转换为TextElement的功能
// 文件路径: lib/subtitle-parser.ts
// 最后更新: 2025/1/8

import { TextElement, CreateTextElement } from "@/types/timeline";
import { DialogueSegment, FinalizedDialogueTrack } from "@/types/timeline";

/**
 * SRT时间码转换为秒数
 * @param timeCode SRT格式时间码 (如: "00:01:23,456")
 * @returns 秒数
 */
export function srtTimeToSeconds(timeCode: string): number {
  const parts = timeCode.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsParts = parts[2].split(',');
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = secondsParts[1] ? parseInt(secondsParts[1], 10) : 0;
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * 秒数转换为SRT时间码格式
 * @param seconds 秒数
 * @returns SRT格式时间码
 */
export function secondsToSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * 解析SRT格式字幕内容
 * @param srtContent SRT格式字幕内容
 * @returns 解析后的字幕条目数组
 */
export interface SrtEntry {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export function parseSrtContent(srtContent: string): SrtEntry[] {
  const entries: SrtEntry[] = [];
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

/**
 * 将DialogueSegment转换为TextElement
 * @param segment 对话片段
 * @param index 索引（用于生成名称）
 * @returns CreateTextElement对象
 */
export function dialogueSegmentToTextElement(segment: DialogueSegment, index: number): CreateTextElement {
  const startTime = srtTimeToSeconds(segment.start_timecode);
  const endTime = srtTimeToSeconds(segment.end_timecode);
  const duration = endTime - startTime;
  
  return {
    type: "text",
    name: `字幕 ${index + 1} - ${segment.speaker}`,
    content: segment.transcript,
    duration: Math.max(duration, 0.5), // 最小持续时间0.5秒
    startTime,
    trimStart: 0,
    trimEnd: 0,
    fontSize: 48,
    fontFamily: "Arial",
    color: "#ffffff",
    backgroundColor: "transparent", // 透明背景
    textAlign: "center",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    x: 0, // 居中
    y: 400, // 更靠下的位置
    rotation: 0,
    opacity: 1,
    horizontalFlip: false,
  };
}

/**
 * 将SRT条目转换为TextElement
 * @param entry SRT条目
 * @returns CreateTextElement对象
 */
export function srtEntryToTextElement(entry: SrtEntry): CreateTextElement {
  const duration = entry.endTime - entry.startTime;
  
  return {
    type: "text",
    name: `字幕 ${entry.index}`,
    content: entry.text,
    duration: Math.max(duration, 0.5), // 最小持续时间0.5秒
    startTime: entry.startTime,
    trimStart: 0,
    trimEnd: 0,
    fontSize: 48,
    fontFamily: "Arial",
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // 半透明黑色背景
    textAlign: "center",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    x: 0, // 居中
    y: 200, // 底部偏上位置
    rotation: 0,
    opacity: 1,
    horizontalFlip: false,
  };
}

/**
 * 解析finalized_dialogue_track并转换为TextElement数组
 * @param dialogueTrack 最终对话轨道数据
 * @returns CreateTextElement数组
 */
export function parseDialogueTrackToTextElements(dialogueTrack: FinalizedDialogueTrack): CreateTextElement[] {
  const textElements: CreateTextElement[] = [];
  
  // 优先使用final_dialogue_segments，如果没有则解析final_srt_content
  if (dialogueTrack.final_dialogue_segments && dialogueTrack.final_dialogue_segments.length > 0) {
    // 使用对话片段数据
    dialogueTrack.final_dialogue_segments.forEach((segment, index) => {
      const textElement = dialogueSegmentToTextElement(segment, index);
      textElements.push(textElement);
    });
  } else if (dialogueTrack.final_srt_content) {
    // 解析SRT内容
    const srtEntries = parseSrtContent(dialogueTrack.final_srt_content);
    srtEntries.forEach((entry) => {
      const textElement = srtEntryToTextElement(entry);
      textElements.push(textElement);
    });
  }
  
  return textElements;
}

/**
 * 根据sequence_clip_id匹配对应的视频片段
 * @param textElements 文本元素数组
 * @param videoClips 视频片段数组（包含sequence_clip_id）
 * @returns 匹配后的文本元素数组
 */
export function matchTextElementsToVideoClips(
  textElements: CreateTextElement[], 
  videoClips: Array<{ sequence_clip_id: string; sequence_start_timecode: string; clip_duration_in_sequence: string }>
): CreateTextElement[] {
  return textElements.map(textElement => {
    // 这里可以根据需要实现更复杂的匹配逻辑
    // 目前保持原有的时间码不变
    return textElement;
  });
}
