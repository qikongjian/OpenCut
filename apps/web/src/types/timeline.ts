// timeline.ts - TypeScript 类型定义
// 此文件包含 typescript 类型定义 的相关代码
// 文件路径: types/timeline.ts
// 最后更新: 2025/7/23

// 导入媒体类型定义
import { MediaType } from "@/stores/media-store";
// 导入 UUID 生成工具函数
import { generateUUID } from "@/lib/utils";

// 轨道类型定义
export type TrackType = "media" | "text" | "audio" | "transition";

// 转场类型定义
export type TransitionType = "fade" | "slide" | "zoom" | "wipe" | "dissolve" | "flash";

// 转场方向定义
export type TransitionDirection = "left" | "right" | "up" | "down" | "in" | "out";

// 蒙板类型定义
export type MaskType = "rectangle" | "circle" | "gradient" | "custom";

// 蒙板形状定义
export type MaskShape = "rectangle" | "circle" | "ellipse" | "polygon";

// 蒙板混合模式定义
export type MaskBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light";

// 基础时间线元素属性接口
interface BaseTimelineElement {
  id: string; // 元素唯一标识符
  name: string; // 元素显示名称
  duration: number; // 元素持续时间（秒）
  startTime: number; // 元素在时间线上的开始时间（秒）
  trimStart: number; // 元素内容的开始裁剪时间（秒）
  trimEnd: number; // 元素内容的结束裁剪时间（秒）
}

// 媒体元素接口 - 包含媒体文件的副本
export interface MediaElement extends BaseTimelineElement {
  type: "media"; // 元素类型标识
  mediaId: string; // 关联的媒体文件ID（用于向后兼容）
  // 媒体文件副本，确保时间轴元素独立于媒体库
  mediaFile?: File; // 媒体文件副本
  mediaUrl?: string; // 媒体文件URL副本
  thumbnailUrl?: string; // 缩略图URL副本
  mediaType?: MediaType; // 媒体类型
  mediaWidth?: number; // 媒体宽度
  mediaHeight?: number; // 媒体高度
  mediaFps?: number; // 视频帧率
  horizontalFlip: boolean; // 水平翻转
  // 蒙板配置
  masks?: MaskConfig[]; // 应用到此元素的蒙板列表
}

// 文本元素接口 - 包含嵌入的文本数据
export interface TextElement extends BaseTimelineElement {
  type: "text"; // 元素类型标识
  content: string; // 文本内容
  fontSize: number; // 字体大小
  fontFamily: string; // 字体族
  color: string; // 文本颜色
  backgroundColor: string; // 背景颜色
  textAlign: "left" | "center" | "right"; // 文本对齐方式
  fontWeight: "normal" | "bold"; // 字体粗细
  fontStyle: "normal" | "italic"; // 字体样式
  textDecoration: "none" | "underline" | "line-through"; // 文本装饰
  x: number; // 相对于画布中心的X坐标
  y: number; // 相对于画布中心的Y坐标
  rotation: number; // 旋转角度（度）
  opacity: number; // 透明度（0-1）
  horizontalFlip: boolean; // 水平翻转
  // 蒙板配置
  masks?: MaskConfig[]; // 应用到此元素的蒙板列表
}

// 蒙板配置接口
export interface MaskConfig {
  id: string; // 蒙板唯一标识符
  type: MaskType; // 蒙板类型
  shape: MaskShape; // 蒙板形状
  // 位置和尺寸
  x: number; // X坐标 (相对于画布中心，-1到1)
  y: number; // Y坐标 (相对于画布中心，-1到1)
  width: number; // 宽度 (0-1，相对于画布宽度)
  height: number; // 高度 (0-1，相对于画布高度)
  // 变换属性
  rotation: number; // 旋转角度 (度)
  scaleX: number; // X轴缩放 (0-2)
  scaleY: number; // Y轴缩放 (0-2)
  // 蒙板效果
  opacity: number; // 透明度 (0-1)
  feather: number; // 羽化程度 (0-100像素)
  invert: boolean; // 是否反转蒙板
  blendMode: MaskBlendMode; // 混合模式
  // 动画关键帧 (未来扩展)
  keyframes?: MaskKeyframe[];
}

// 蒙板关键帧接口 (未来扩展)
export interface MaskKeyframe {
  time: number; // 时间点 (秒)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  feather: number;
}

// 转场元素接口 - 连接两个媒体元素
export interface TransitionElement extends BaseTimelineElement {
  type: "transition"; // 元素类型标识
  transitionType: TransitionType; // 转场类型
  direction: TransitionDirection; // 转场方向
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out"; // 缓动函数
  // 转场连接的两个元素
  fromElementId: string; // 起始元素ID
  toElementId: string; // 目标元素ID
  fromTrackId: string; // 起始轨道ID
  toTrackId: string; // 目标轨道ID
  // 转场参数
  intensity: number; // 转场强度 (0-1)
  blur: number; // 模糊程度 (0-1)
  // 预览相关
  previewUrl?: string; // 转场预览URL
}

// 时间线元素联合类型
export type TimelineElement = MediaElement | TextElement | TransitionElement;

// AI剪辑计划相关类型定义
export interface AIClipPlan {
  sequence_clip_id: string;
  source_clip_id: string;
  video_url: string;
  corresponding_script_scene_id: string;
  clip_type: "video_and_audio" | "video" | "audio";
  sequence_start_timecode: string;
  source_in_timecode: string;
  source_out_timecode: string;
  clip_duration_in_sequence: string;
  transition_from_previous: {
    transition_type: string;
    transition_duration_ms: number;
    audio_sync_offset_ms: number;
    reason_for_transition: string;
  };
  clip_placement_reasons: {
    core_intent_and_audience_effect: string;
    emotion_priority: string;
    story_priority: string;
    rhythm_priority: string;
    eyeline_priority: string;
    space_priority: string;
    lens_language_application: string;
  };
  continuity_correction_suggestion: {
    error_exists: boolean;
    error_type?: string;
    occurrence_location?: string;
    error_description?: string;
    is_intentional_artistic_choice?: boolean;
    artistic_purpose_explanation?: string;
    correction_suggestions?: string[];
    reason_for_correction?: string;
  };
  sound_design_suggestions: Array<{
    sound_type: string;
    description: string;
    timing_in_clip: string;
    intensity_suggestion: string;
  }>;
  visual_enhancement_suggestions: Array<{
    enhancement_type: string;
    description: string;
    reason: string;
  }>;
}

export interface AIEditingPlan {
  version_name: string;
  version_summary: string;
  timeline_clips: AIClipPlan[];
}

// 字幕对话片段接口
export interface DialogueSegment {
  sequence_clip_id: string;
  source_clip_id: string;
  start_timecode: string;
  end_timecode: string;
  transcript: string;
  speaker: string;
}

// 最终对话轨道接口
export interface FinalizedDialogueTrack {
  final_srt_content: string;
  final_dialogue_segments: DialogueSegment[];
}

export interface AIEditingData {
  project_id: string;
  script_content: string;
  director_intent: string;
  success: boolean;
  editing_plan: {
    finalized_dialogue_track?: FinalizedDialogueTrack;
    material_classification_results: {
      discarded_footage_list: Array<{
        clip_id: string;
        video_url: string;
        reason: string;
      }>;
      alternative_footage_list: Array<{
        clip_id: string;
        video_url: string;
        shortcoming: string;
        potential_use_cases: string;
      }>;
    };
    editing_sequence_plans: AIEditingPlan[];
    production_suggestions: Array<{
      suggestion_type: string;
      description: string;
      reason: string;
      estimated_duration: string;
      suggested_content_elements: string;
    }>;
  };
}

// 创建类型（不包含id，用于添加到轨道）
export type CreateMediaElement = Omit<MediaElement, "id">;
// 类型定义 - 创建类型别名或联合类型
export type CreateTextElement = Omit<TextElement, "id">;
// 类型定义 - 创建转场元素类型
export type CreateTransitionElement = Omit<TransitionElement, "id">;
// 类型定义 - 创建类型别名或联合类型
export type CreateTimelineElement = CreateMediaElement | CreateTextElement | CreateTransitionElement;

// 时间线元素组件属性接口
export interface TimelineElementProps {
  element: TimelineElement; // 要渲染的元素
  track: TimelineTrack; // 所属轨道
  zoomLevel: number; // 当前缩放级别
  isSelected: boolean; // 是否被选中
  onElementMouseDown: (e: React.MouseEvent, element: TimelineElement) => void; // 鼠标按下事件
  onElementClick: (e: React.MouseEvent, element: TimelineElement) => void; // 点击事件
}

// 调整大小状态接口
export interface ResizeState {
  elementId: string; // 正在调整的元素ID
  side: "left" | "right"; // 调整的边（左或右）
  startX: number; // 开始调整时的鼠标X坐标
  initialTrimStart: number; // 初始开始裁剪时间
  initialTrimEnd: number; // 初始结束裁剪时间
}

// 拖拽数据类型定义 - 用于类型安全的拖拽操作
export interface MediaItemDragData {
  id: string; // 媒体项ID
  type: MediaType; // 媒体类型
  name: string; // 媒体名称
  duration?: number; // 媒体时长
  width?: number; // 媒体宽度
  height?: number; // 媒体高度
  fps?: number; // 帧率
  url?: string; // 媒体URL
  file?: File; // 媒体文件
  thumbnailUrl?: string; // 缩略图URL
  size?: number; // 文件大小
}

// 接口定义 - 定义对象的结构和属性类型
export interface TextItemDragData {
  id: string; // 文本项ID
  type: "text"; // 类型标识
  name: string; // 文本名称
  content: string; // 文本内容
}

// 拖拽数据联合类型
export type DragData = MediaItemDragData | TextItemDragData;

// 时间线轨道接口
export interface TimelineTrack {
  id: string; // 轨道唯一标识符
  name: string; // 轨道名称
  type: TrackType; // 轨道类型
  elements: TimelineElement[]; // 轨道上的元素列表
  muted?: boolean; // 是否静音
  isMain?: boolean; // 是否为主轨道
}

/**
 * 按顺序对轨道进行排序
 * 文本轨道在最顶部，音频轨道在最底部，主轨道在中间
 * @param tracks - 要排序的轨道数组
 * @returns 排序后的轨道数组
 */
// sortTracksByOrder 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function sortTracksByOrder(tracks: TimelineTrack[]): TimelineTrack[] {
  return [...tracks].sort((a, b) => {
    // 文本轨道始终在最顶部
    if (a.type === "text" && b.type !== "text") return -1;
    if (b.type === "text" && a.type !== "text") return 1;

    // 音频轨道始终在最底部
    if (a.type === "audio" && b.type !== "audio") return 1;
    if (b.type === "audio" && a.type !== "audio") return -1;

    // 主轨道在音频轨道之上，文本轨道之下
    if (a.isMain && !b.isMain && b.type !== "audio" && b.type !== "text")
      return 1;
    if (b.isMain && !a.isMain && a.type !== "audio" && a.type !== "text")
      return -1;

    // 同一类别内，保持创建顺序
    return 0;
  });
}

// getMainTrack 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function getMainTrack(tracks: TimelineTrack[]): TimelineTrack | null {
  return tracks.find((track) => track.isMain) || null;
}

// ensureMainTrack 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function ensureMainTrack(tracks: TimelineTrack[]): TimelineTrack[] {
// 常量定义 - 模块内部使用的固定值
  const hasMainTrack = tracks.some((track) => track.isMain);

  if (!hasMainTrack) {
    // Create main track if it doesn't exist
    const mainTrack: TimelineTrack = {
      id: generateUUID(),
      name: "Main Track",
      type: "media",
      elements: [],
      muted: false,
      isMain: true,
    };
    return [mainTrack, ...tracks];
  }

  return tracks;
}

// Timeline validation utilities
export function canElementGoOnTrack(
  elementType: "text" | "media" | "transition",
  trackType: TrackType
): boolean {
  if (elementType === "text") {
    return trackType === "text";
  } else if (elementType === "media") {
    return trackType === "media" || trackType === "audio";
  } else if (elementType === "transition") {
    return trackType === "transition";
  }
  return false;
}

// validateElementTrackCompatibility 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function validateElementTrackCompatibility(
  element: { type: "text" | "media" | "transition" },
  track: { type: TrackType }
): { isValid: boolean; errorMessage?: string } {
// 常量定义 - 模块内部使用的固定值
  const isValid = canElementGoOnTrack(element.type, track.type);

  if (!isValid) {
// 常量定义 - 模块内部使用的固定值
    let errorMessage = "";
    if (element.type === "text") {
      errorMessage = "Text elements can only be placed on text tracks";
    } else if (element.type === "media") {
      errorMessage = "Media elements can only be placed on media or audio tracks";
    } else if (element.type === "transition") {
      errorMessage = "Transition elements can only be placed on transition tracks";
    }

    return { isValid: false, errorMessage };
  }

  return { isValid: true };
}
