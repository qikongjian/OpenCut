// snap-indicator.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/snap-indicator.tsx
// 最后更新: 2025/7/23

// snap-indicator.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { SnapPoint } from "@/hooks/use-timeline-snapping";
// 导入项目模块
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
// 导入项目模块
import type { TimelineTrack } from "@/types/timeline";

// SnapIndicatorProps 接口定义
interface SnapIndicatorProps {
  snapPoint: SnapPoint | null;
  zoomLevel: number;
  isVisible: boolean;
  tracks: TimelineTrack[];
  timelineRef: React.RefObject<HTMLDivElement>;
  trackLabelsRef?: React.RefObject<HTMLDivElement>;
}

// SnapIndicator 函数
// 导出组件 - 可复用的 UI 组件
export function SnapIndicator({
  snapPoint,
  zoomLevel,
  isVisible,
  tracks,
  timelineRef,
  trackLabelsRef,
}: SnapIndicatorProps) {
  if (!isVisible || !snapPoint) {
    return null;
  }

// 常量定义 - 模块内部使用的固定值
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
    snapPoint.time * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

  return (
    <div
      className="absolute pointer-events-none z-[90]"
      style={{
        left: `${leftPosition}px`,
        top: 0,
        height: `${totalHeight}px`,
        width: "2px",
      }}
    >
      <div className={`w-0.5 h-full bg-primary/40 opacity-80`} />
    </div>
  );
}
