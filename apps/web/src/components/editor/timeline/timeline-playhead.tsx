// timeline-playhead.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/timeline/timeline-playhead.tsx
// 最后更新: 2025/7/23

// timeline-playhead.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useRef } from "react";
// 导入项目模块
import { TimelineTrack } from "@/types/timeline";
// 导入模块
import {
  TIMELINE_CONSTANTS,
  getTotalTracksHeight,
} from "@/constants/timeline-constants";
// 导入项目模块
import { useTimelinePlayhead } from "@/hooks/use-timeline-playhead";

// TimelinePlayheadProps 接口定义
interface TimelinePlayheadProps {
  currentTime: number;
  duration: number;
  zoomLevel: number;
  tracks: TimelineTrack[];
  seek: (time: number) => void;
  rulerRef: React.RefObject<HTMLDivElement>;
  rulerScrollRef: React.RefObject<HTMLDivElement>;
  tracksScrollRef: React.RefObject<HTMLDivElement>;
  trackLabelsRef?: React.RefObject<HTMLDivElement>;
  timelineRef: React.RefObject<HTMLDivElement>;
  playheadRef?: React.RefObject<HTMLDivElement>;
  isSnappingToPlayhead?: boolean;
}

// TimelinePlayhead 函数
// 导出组件 - 可复用的 UI 组件
export function TimelinePlayhead({
  currentTime,
  duration,
  zoomLevel,
  tracks,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  trackLabelsRef,
  timelineRef,
  playheadRef: externalPlayheadRef,
  isSnappingToPlayhead = false,
}: TimelinePlayheadProps) {
// 常量定义 - 模块内部使用的固定值
  const internalPlayheadRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const playheadRef = externalPlayheadRef || internalPlayheadRef;
// 常量定义 - 模块内部使用的固定值
  const { playheadPosition, handlePlayheadMouseDown } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
  });

  // Use timeline container height minus a few pixels for breathing room
  const timelineContainerHeight = timelineRef.current?.offsetHeight || 400;
// 常量定义 - 模块内部使用的固定值
  const totalHeight = timelineContainerHeight - 8; // 8px padding from edges

  // Get dynamic track labels width, fallback to 0 if no tracks or no ref
  const trackLabelsWidth =
    tracks.length > 0 && trackLabelsRef?.current
      ? trackLabelsRef.current.offsetWidth
      : 0;
// 常量定义 - 模块内部使用的固定值
  const leftPosition =
    trackLabelsWidth +
    playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

  return (
    <div
      ref={playheadRef}
      className="absolute pointer-events-auto z-[150]"
      style={{
        left: `${leftPosition}px`,
        top: 0,
        height: `${totalHeight}px`,
        width: "2px", // Slightly wider for better click target
      }}
      onMouseDown={handlePlayheadMouseDown}
    >
      {/* The playhead line spanning full height */}
      <div
        className={`absolute left-0 w-0.5 cursor-col-resize h-full ${isSnappingToPlayhead ? "bg-primary" : "bg-foreground"}`}
      />

      {/* Playhead dot indicator at the top (in ruler area) */}
      <div
        className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 shadow-sm ${isSnappingToPlayhead ? "bg-primary border-primary" : "bg-foreground border-foreground"}`}
      />
    </div>
  );
}

// Also export a hook for getting ruler handlers
// 导出组件 - 可复用的 UI 组件

// 自定义 Hook - 这是一个自定义的 React Hook
export function useTimelinePlayheadRuler({
  currentTime,
  duration,
  zoomLevel,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  playheadRef,
}: Omit<TimelinePlayheadProps, "tracks" | "trackLabelsRef" | "timelineRef">) {
// 常量定义 - 模块内部使用的固定值
  const { handleRulerMouseDown, isDraggingRuler } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
  });

  return { handleRulerMouseDown, isDraggingRuler };
}

export { TimelinePlayhead as default };
