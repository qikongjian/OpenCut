// use-timeline-element-resize.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-timeline-element-resize.ts
// 最后更新: 2025/7/23

// use-timeline-element-resize.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useState, useEffect } from "react";
// 导入项目模块
import { ResizeState, TimelineElement, TimelineTrack } from "@/types/timeline";
// 导入项目模块
import { useMediaStore } from "@/stores/media-store";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

// UseTimelineElementResizeProps 接口定义
interface UseTimelineElementResizeProps {
  element: TimelineElement;
  track: TimelineTrack;
  zoomLevel: number;
  onUpdateTrim: (
    trackId: string,
    elementId: string,
    trimStart: number,
    trimEnd: number
  ) => void;
  onUpdateDuration: (
    trackId: string,
    elementId: string,
    duration: number
  ) => void;
}

// useTimelineElementResize 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useTimelineElementResize({
  element,
  track,
  zoomLevel,
  onUpdateTrim,
  onUpdateDuration,
}: UseTimelineElementResizeProps) {
// 常量定义 - 模块内部使用的固定值
  const [resizing, setResizing] = useState<ResizeState | null>(null);
// 常量定义 - 模块内部使用的固定值
  const { mediaItems } = useMediaStore();
// 常量定义 - 模块内部使用的固定值
  const {
    updateElementStartTime,
    updateElementTrim,
    updateElementDuration,
    pushHistory,
  } = useTimelineStore();

  // Set up document-level mouse listeners during resize (like proper drag behavior)
  // 副作用 Hook - 处理副作用
  useEffect(() => {
    if (!resizing) return;

// handleDocumentMouseMove 自定义钩子
    const handleDocumentMouseMove = (e: MouseEvent) => {
      updateTrimFromMouseMove({ clientX: e.clientX });
    };

// handleDocumentMouseUp 自定义钩子
    const handleDocumentMouseUp = () => {
      handleResizeEnd();
    };

    // Add document-level listeners for proper drag behavior
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [resizing]); // Re-run when resizing state changes

// handleResizeStart 函数
  const handleResizeStart = (
    e: React.MouseEvent,
    elementId: string,
    side: "left" | "right"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Push history once at the start of the resize operation
    pushHistory();

    setResizing({
      elementId,
      side,
      startX: e.clientX,
      initialTrimStart: element.trimStart,
      initialTrimEnd: element.trimEnd,
    });
  };

// canExtendElementDuration 函数
  const canExtendElementDuration = () => {
    // Text elements can always be extended
    if (element.type === "text") {
      return true;
    }

    // Transition elements can always be extended (adjustable duration)
    if (element.type === "transition") {
      return true;
    }

    // Media elements - check the media type
    if (element.type === "media") {
// 常量定义 - 模块内部使用的固定值
      const mediaItem = mediaItems.find((item) => item.id === element.mediaId);
      if (!mediaItem) return false;

      // Images can be extended (static content)
      if (mediaItem.type === "image") {
        return true;
      }

      // Videos and audio cannot be extended beyond their natural duration
      // (no additional content exists)
      return false;
    }

    return false;
  };

// updateTrimFromMouseMove 自定义钩子
  const updateTrimFromMouseMove = (e: { clientX: number }) => {
    if (!resizing) return;

// 常量定义 - 模块内部使用的固定值
    const deltaX = e.clientX - resizing.startX;
    // Reasonable sensitivity for resize operations - similar to timeline scale
    const deltaTime = deltaX / (50 * zoomLevel);

    // 转场元素的特殊处理
    if (element.type === "transition") {
      if (resizing.side === "left") {
        // 左侧缩放：调整开始时间和时长
        const newDuration = element.duration - deltaTime;
        const minDuration = TIMELINE_CONSTANTS.MIN_TRANSITION_DURATION;
        const maxDuration = TIMELINE_CONSTANTS.MAX_TRANSITION_DURATION;
        
        const clampedDuration = Math.max(minDuration, Math.min(maxDuration, newDuration));
        const actualDelta = element.duration - clampedDuration;
        
        updateElementDuration(track.id, element.id, clampedDuration, false);
        updateElementStartTime(track.id, element.id, element.startTime + actualDelta, false);
      } else {
        // 右侧缩放：只调整时长
        const newDuration = element.duration + deltaTime;
        const minDuration = TIMELINE_CONSTANTS.MIN_TRANSITION_DURATION;
        const maxDuration = TIMELINE_CONSTANTS.MAX_TRANSITION_DURATION;
        
        const clampedDuration = Math.max(minDuration, Math.min(maxDuration, newDuration));
        updateElementDuration(track.id, element.id, clampedDuration, false);
      }
      return;
    }

    if (resizing.side === "left") {
      // Left resize - different behavior for media vs text/image elements
      const maxAllowed = element.duration - resizing.initialTrimEnd - 0.1;
// 常量定义 - 模块内部使用的固定值
      const calculated = resizing.initialTrimStart + deltaTime;

      if (calculated >= 0) {
        // Normal trimming within available content
        const newTrimStart = Math.min(maxAllowed, calculated);
// 常量定义 - 模块内部使用的固定值
        const trimDelta = newTrimStart - resizing.initialTrimStart;
// 常量定义 - 模块内部使用的固定值
        const newStartTime = element.startTime + trimDelta;

        updateElementTrim(
          track.id,
          element.id,
          newTrimStart,
          resizing.initialTrimEnd,
          false
        );
        updateElementStartTime(track.id, element.id, newStartTime, false);
      } else {
        // Trying to extend beyond trimStart = 0
        if (canExtendElementDuration()) {
          // Text/Image: extend element to the left by moving startTime and increasing duration
          const extensionAmount = Math.abs(calculated);
// 常量定义 - 模块内部使用的固定值
          const newStartTime = element.startTime - extensionAmount;
// 常量定义 - 模块内部使用的固定值
          const newDuration = element.duration + extensionAmount;

          // Keep trimStart at 0 and extend the element
          updateElementTrim(
            track.id,
            element.id,
            0,
            resizing.initialTrimEnd,
            false
          );
          updateElementDuration(track.id, element.id, newDuration, false);
          updateElementStartTime(track.id, element.id, newStartTime, false);
        } else {
          // Video/Audio: can't extend beyond original content - limit to trimStart = 0
          const newTrimStart = 0;
// 常量定义 - 模块内部使用的固定值
          const trimDelta = newTrimStart - resizing.initialTrimStart;
// 常量定义 - 模块内部使用的固定值
          const newStartTime = element.startTime + trimDelta;

          updateElementTrim(
            track.id,
            element.id,
            newTrimStart,
            resizing.initialTrimEnd,
            false
          );
          updateElementStartTime(track.id, element.id, newStartTime, false);
        }
      }
    } else {
      // Right resize - can extend duration for supported element types
      const calculated = resizing.initialTrimEnd - deltaTime;

      if (calculated < 0) {
        // We're trying to extend beyond original duration
        if (canExtendElementDuration()) {
          // Extend the duration instead of reducing trimEnd further
          const extensionNeeded = Math.abs(calculated);
// 常量定义 - 模块内部使用的固定值
          const newDuration = element.duration + extensionNeeded;
// 常量定义 - 模块内部使用的固定值
          const newTrimEnd = 0; // Reset trimEnd to 0 since we're extending

          // Update duration first, then trim
          updateElementDuration(track.id, element.id, newDuration, false);
          updateElementTrim(
            track.id,
            element.id,
            resizing.initialTrimStart,
            newTrimEnd,
            false
          );
        } else {
          // Can't extend - just set trimEnd to 0 (maximum possible extension)
          updateElementTrim(
            track.id,
            element.id,
            resizing.initialTrimStart,
            0,
            false
          );
        }
      } else {
        // Normal trimming within original duration
        const maxTrimEnd = element.duration - resizing.initialTrimStart - 0.1; // Leave at least 0.1s visible
// 常量定义 - 模块内部使用的固定值
        const newTrimEnd = Math.max(0, Math.min(maxTrimEnd, calculated));

        updateElementTrim(
          track.id,
          element.id,
          resizing.initialTrimStart,
          newTrimEnd,
          false
        );
      }
    }
  };

// handleResizeEnd 函数
  const handleResizeEnd = () => {
    setResizing(null);
  };

  return {
    resizing,
    isResizing: resizing !== null,
    handleResizeStart,
    // Return empty handlers since we use document listeners now
    handleResizeMove: () => {}, // Not used anymore
    handleResizeEnd: () => {}, // Not used anymore
  };
}
