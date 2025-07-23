// timeline-constants.ts - 常量定义和配置
// 此文件包含 常量定义和配置 的相关代码
// 文件路径: constants/timeline-constants.ts
// 最后更新: 2025/7/23

// timeline-constants.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import type { TrackType } from "@/types/timeline";

// Track color definitions
// 导出常量对象 - 包含多个相关常量的对象
export const TRACK_COLORS: Record<
  TrackType,
  { solid: string; background: string; border: string }
> = {
  media: {
    solid: "bg-blue-500",
    background: "bg-blue-500/20",
    border: "border-white/80",
  },
  text: {
    solid: "bg-[#9C4937]",
    background: "bg-[#9C4937]",
    border: "border-white/80",
  },
  audio: {
    solid: "bg-green-500",
    background: "bg-green-500/20",
    border: "border-white/80",
  },
} as const;

// Utility functions
export function getTrackColors(type: TrackType) {
  return TRACK_COLORS[type];
}

// getTrackElementClasses 函数
export function getTrackElementClasses(type: TrackType) {
  // 常量定义 - 模块内部使用的固定值
  const colors = getTrackColors(type);
  return `${colors.background} ${colors.border}`;
}

// Track height definitions
// 导出常量对象 - 包含多个相关常量的对象
export const TRACK_HEIGHTS: Record<TrackType, number> = {
  media: 65,
  text: 25,
  audio: 50,
} as const;

// for 函数
// Utility function for track heights
export function getTrackHeight(type: TrackType): number {
  return TRACK_HEIGHTS[type];
}

// Calculate cumulative height up to (but not including) a track index
export function getCumulativeHeightBefore(
  tracks: Array<{ type: TrackType }>,
  trackIndex: number
): number {
  // 常量定义 - 模块内部使用的固定值
  const GAP = 4; // 4px gap between tracks (equivalent to Tailwind's gap-1)
  return tracks
    .slice(0, trackIndex)
    .reduce((sum, track) => sum + getTrackHeight(track.type) + GAP, 0);
}

// Calculate total height of all tracks
export function getTotalTracksHeight(
  tracks: Array<{ type: TrackType }>
): number {
  // 常量定义 - 模块内部使用的固定值
  const GAP = 4; // 4px gap between tracks (equivalent to Tailwind's gap-1)
  // 常量定义 - 模块内部使用的固定值
  const tracksHeight = tracks.reduce(
    (sum, track) => sum + getTrackHeight(track.type),
    0
  );
  // 常量定义 - 模块内部使用的固定值
  const gapsHeight = Math.max(0, tracks.length - 1) * GAP; // n-1 gaps for n tracks
  return tracksHeight + gapsHeight;
}

// Other timeline constants
// 导出常量对象 - 包含多个相关常量的对象
export const TIMELINE_CONSTANTS = {
  ELEMENT_MIN_WIDTH: 80,
  PIXELS_PER_SECOND: 50,
  TRACK_HEIGHT: 60, // Default fallback
  DEFAULT_TEXT_DURATION: 5,
  DEFAULT_IMAGE_DURATION: 5,
  ZOOM_LEVELS: [0.25, 0.5, 1, 1.5, 2, 3, 4],
} as const;

// FPS presets for project settings
// 导出常量对象 - 包含多个相关常量的对象
export const FPS_PRESETS = [
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps" },
  { value: "30", label: "30 fps" },
  { value: "60", label: "60 fps" },
  { value: "120", label: "120 fps" },
] as const;

// Frame snapping utilities
export function timeToFrame(time: number, fps: number): number {
  return Math.round(time * fps);
}

// frameToTime 函数
export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

// snapTimeToFrame 函数
export function snapTimeToFrame(time: number, fps: number): number {
  if (fps <= 0) return time; // Fallback for invalid FPS
  // 常量定义 - 模块内部使用的固定值
  const frame = timeToFrame(time, fps);
  return frameToTime(frame, fps);
}

// getFrameDuration 函数
export function getFrameDuration(fps: number): number {
  return 1 / fps;
}
