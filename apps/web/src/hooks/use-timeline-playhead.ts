// use-timeline-playhead.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-timeline-playhead.ts
// 最后更新: 2025/7/23

// use-timeline-playhead.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import { snapTimeToFrame } from "@/constants/timeline-constants";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入 React 核心库
import { useState, useEffect, useCallback } from "react";

// UseTimelinePlayheadProps 接口定义
interface UseTimelinePlayheadProps {
  currentTime: number;
  duration: number;
  zoomLevel: number;
  seek: (time: number) => void;
  rulerRef: React.RefObject<HTMLDivElement>;
  rulerScrollRef: React.RefObject<HTMLDivElement>;
  tracksScrollRef: React.RefObject<HTMLDivElement>;
  playheadRef?: React.RefObject<HTMLDivElement>;
}

// useTimelinePlayhead 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useTimelinePlayhead({
  currentTime,
  duration,
  zoomLevel,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  playheadRef,
}: UseTimelinePlayheadProps) {
  // Playhead scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
// 常量定义 - 模块内部使用的固定值
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  // Ruler drag detection state
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [hasDraggedRuler, setHasDraggedRuler] = useState(false);

// 常量定义 - 模块内部使用的固定值
  const playheadPosition =
    isScrubbing && scrubTime !== null ? scrubTime : currentTime;

  // --- Playhead Scrubbing Handlers ---
  const handlePlayheadMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent ruler drag from triggering
      setIsScrubbing(true);
      handleScrub(e);
    },
    [duration, zoomLevel]
  );

  // Ruler mouse down handler
  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;

      // Don't interfere if clicking on the playhead itself
      if (playheadRef?.current?.contains(e.target as Node)) return;

      e.preventDefault();
      setIsDraggingRuler(true);
      setHasDraggedRuler(false);

      // Start scrubbing immediately
      setIsScrubbing(true);
      handleScrub(e);
    },
    [duration, zoomLevel]
  );

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const handleScrub = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
// 常量定义 - 模块内部使用的固定值
      const ruler = rulerRef.current;
      if (!ruler) return;
// 常量定义 - 模块内部使用的固定值
      const rect = ruler.getBoundingClientRect();
// 常量定义 - 模块内部使用的固定值
      const x = e.clientX - rect.left;
// 常量定义 - 模块内部使用的固定值
      const rawTime = Math.max(0, Math.min(duration, x / (50 * zoomLevel)));
      // Use frame snapping for playhead scrubbing
      const projectStore = useProjectStore.getState();
// 常量定义 - 模块内部使用的固定值
      const projectFps = projectStore.activeProject?.fps || 30;
// 常量定义 - 模块内部使用的固定值
      const time = snapTimeToFrame(rawTime, projectFps);
      setScrubTime(time);
      seek(time); // update video preview in real time
    },
    [duration, zoomLevel, seek, rulerRef]
  );

  // Mouse move/up event handlers
  // 副作用 Hook - 处理副作用

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    if (!isScrubbing) return;
// onMouseMove 自定义钩子
    const onMouseMove = (e: MouseEvent) => {
      handleScrub(e);
      // Mark that we've dragged if ruler drag is active
      if (isDraggingRuler) {
        setHasDraggedRuler(true);
      }
    };
// onMouseUp 自定义钩子
    const onMouseUp = (e: MouseEvent) => {
      setIsScrubbing(false);
      if (scrubTime !== null) seek(scrubTime); // finalize seek
      setScrubTime(null);

      // Handle ruler click vs drag
      if (isDraggingRuler) {
        setIsDraggingRuler(false);
        // If we didn't drag, treat it as a click-to-seek
        if (!hasDraggedRuler) {
          handleScrub(e);
        }
        setHasDraggedRuler(false);
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    isScrubbing,
    scrubTime,
    seek,
    handleScrub,
    isDraggingRuler,
    hasDraggedRuler,
  ]);

  // --- Playhead auto-scroll effect ---
  // 副作用 Hook - 处理副作用

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const rulerViewport = rulerScrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
// 常量定义 - 模块内部使用的固定值
    const tracksViewport = tracksScrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!rulerViewport || !tracksViewport) return;
// 常量定义 - 模块内部使用的固定值
    const playheadPx = playheadPosition * 50 * zoomLevel; // TIMELINE_CONSTANTS.PIXELS_PER_SECOND = 50
// 常量定义 - 模块内部使用的固定值
    const viewportWidth = rulerViewport.clientWidth;
// 常量定义 - 模块内部使用的固定值
    const scrollMin = 0;
// 常量定义 - 模块内部使用的固定值
    const scrollMax = rulerViewport.scrollWidth - viewportWidth;
    // Center the playhead if it's not visible (100px buffer)
    const desiredScroll = Math.max(
      scrollMin,
      Math.min(scrollMax, playheadPx - viewportWidth / 2)
    );
    if (
      playheadPx < rulerViewport.scrollLeft + 100 ||
      playheadPx > rulerViewport.scrollLeft + viewportWidth - 100
    ) {
      rulerViewport.scrollLeft = tracksViewport.scrollLeft = desiredScroll;
    }
  }, [playheadPosition, duration, zoomLevel, rulerScrollRef, tracksScrollRef]);

  return {
    playheadPosition,
    handlePlayheadMouseDown,
    handleRulerMouseDown,
    isDraggingRuler,
  };
}
