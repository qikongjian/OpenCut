// timeline.ts - TypeScript 类型定义
// 此文件包含 typescript 类型定义 的相关代码
// 文件路径: types/timeline.ts
// 最后更新: 2025/7/23

// 导入媒体类型定义
import { MediaType } from "@/stores/media-store";
// 导入 UUID 生成工具函数
import { generateUUID } from "@/lib/utils";

// 轨道类型定义
export type TrackType = "media" | "text" | "audio";

// 基础时间线元素属性接口
interface BaseTimelineElement {
  id: string; // 元素唯一标识符
  name: string; // 元素显示名称
  duration: number; // 元素持续时间（秒）
  startTime: number; // 元素在时间线上的开始时间（秒）
  trimStart: number; // 元素内容的开始裁剪时间（秒）
  trimEnd: number; // 元素内容的结束裁剪时间（秒）
}

// 媒体元素接口 - 引用媒体存储中的文件
export interface MediaElement extends BaseTimelineElement {
  type: "media"; // 元素类型标识
  mediaId: string; // 关联的媒体文件ID
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
}

// 时间线元素联合类型
export type TimelineElement = MediaElement | TextElement;

// 创建类型（不包含id，用于添加到轨道）
export type CreateMediaElement = Omit<MediaElement, "id">;
// 类型定义 - 创建类型别名或联合类型
export type CreateTextElement = Omit<TextElement, "id">;
// 类型定义 - 创建类型别名或联合类型
export type CreateTimelineElement = CreateMediaElement | CreateTextElement;

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
  elementType: "text" | "media",
  trackType: TrackType
): boolean {
  if (elementType === "text") {
    return trackType === "text";
  } else if (elementType === "media") {
    return trackType === "media" || trackType === "audio";
  }
  return false;
}

// validateElementTrackCompatibility 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function validateElementTrackCompatibility(
  element: { type: "text" | "media" },
  track: { type: TrackType }
): { isValid: boolean; errorMessage?: string } {
// 常量定义 - 模块内部使用的固定值
  const isValid = canElementGoOnTrack(element.type, track.type);

  if (!isValid) {
// 常量定义 - 模块内部使用的固定值
    const errorMessage =
      element.type === "text"
        ? "Text elements can only be placed on text tracks"
        : "Media elements can only be placed on media or audio tracks";

    return { isValid: false, errorMessage };
  }

  return { isValid: true };
}
