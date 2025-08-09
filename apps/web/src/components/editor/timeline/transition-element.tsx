// transition-element.tsx - 转场元素渲染组件
// 此文件包含 转场元素渲染组件 的相关代码
// 文件路径: components/editor/timeline/transition-element.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { TransitionElement as TransitionElementType, TimelineTrack } from "@/types/timeline";
import { getTransitionIcon, getTransitionColor, getTransitionName } from "@/lib/transition-utils";
import { useTimelineElementResize } from "@/hooks/use-timeline-element-resize";
import { useTimelineStore } from "@/stores/timeline-store";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

interface TransitionElementProps {
  element: TransitionElementType;
  track: TimelineTrack;
  isSelected: boolean;
  zoomLevel: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

// 转场元素组件 - 显示为两个视频之间的连接元素
export function TransitionElementComponent({
  element,
  track,
  isSelected,
  zoomLevel,
  onMouseDown,
  onClick,
}: TransitionElementProps) {
  const { updateElementTrim, updateElementDuration } = useTimelineStore();
  
  // 使用拖拉缩放功能
  const {
    resizing,
    isResizing,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  } = useTimelineElementResize({
    element,
    track,
    zoomLevel,
    onUpdateTrim: updateElementTrim,
    onUpdateDuration: updateElementDuration,
  });

  const effectiveDuration = element.duration - element.trimStart - element.trimEnd;
  const minWidth = TIMELINE_CONSTANTS.MIN_TRANSITION_DURATION * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const elementWidth = Math.max(minWidth, effectiveDuration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel);
  
  const style = {
    left: `${element.startTime * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel}px`,
    width: `${elementWidth}px`,
  };

  const icon = getTransitionIcon(element.transitionType, element.direction);
  const colorClass = getTransitionColor(element.transitionType);
  const transitionName = getTransitionName(element.transitionType, element.direction);

  const handleElementMouseDown = (e: React.MouseEvent) => {
    if (!resizing) {
      onMouseDown(e);
    }
  };

  return (
    <div
      className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg border-2 border-dashed ${colorClass} ${
        isSelected ? "ring-2 ring-primary ring-offset-1" : ""
      } cursor-pointer transition-all hover:scale-105 hover:shadow-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm`}
      style={style}
      onMouseDown={handleElementMouseDown}
      onClick={onClick}
      onMouseMove={resizing ? handleResizeMove : undefined}
      onMouseUp={resizing ? handleResizeEnd : undefined}
      onMouseLeave={resizing ? handleResizeEnd : undefined}
      title={`${transitionName} (${element.duration.toFixed(1)}s)`}
    >
      <div className="flex items-center justify-center h-full px-2">
        <div className="flex items-center gap-1 text-white">
          <div className="w-4 h-4 flex items-center justify-center">
          {icon}
          </div>
          {elementWidth > 60 && (
            <div className="text-xs font-medium whitespace-nowrap">
              {transitionName}
            </div>
          )}
        </div>
      </div>
      
      {/* 拖拉缩放手柄 - 只在选中时显示 */}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-w-resize bg-foreground z-50 opacity-80 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, element.id, "left")}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-e-resize bg-foreground z-50 opacity-80 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, element.id, "right")}
          />
        </>
      )}
      
      {/* 转场指示线 */}
      <div className="absolute top-full left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60"></div>
    </div>
  );
} 