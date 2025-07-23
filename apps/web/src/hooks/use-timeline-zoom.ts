// use-timeline-zoom.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-timeline-zoom.ts
// 最后更新: 2025/7/23

// use-timeline-zoom.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useState, useCallback, useEffect, RefObject } from "react";

// UseTimelineZoomProps 接口定义
interface UseTimelineZoomProps {
  containerRef: RefObject<HTMLDivElement>;
  isInTimeline?: boolean;
}

// UseTimelineZoomReturn 接口定义
interface UseTimelineZoomReturn {
  zoomLevel: number;
  setZoomLevel: (zoomLevel: number | ((prev: number) => number)) => void;
  handleWheel: (e: React.WheelEvent) => void;
}

// useTimelineZoom 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useTimelineZoom({
  containerRef,
  isInTimeline = false,
}: UseTimelineZoomProps): UseTimelineZoomReturn {
// 状态管理 - 创建和管理组件内部状态
  const [zoomLevel, setZoomLevel] = useState(1);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Only zoom if user is using pinch gesture (ctrlKey or metaKey is true)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
// 常量定义 - 模块内部使用的固定值
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoomLevel((prev) => Math.max(0.1, Math.min(10, prev + delta)));
    }
    // For horizontal scrolling (when shift is held or horizontal wheel movement),
    // let the event bubble up to allow ScrollArea to handle it
    else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Don't prevent default - let ScrollArea handle horizontal scrolling
      return;
    }
    // Otherwise, allow normal scrolling
  }, []);

  // Prevent browser zooming in/out when in timeline
  // 副作用 Hook - 处理副作用

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// preventZoom 函数
    const preventZoom = (e: WheelEvent) => {
      if (
        isInTimeline &&
        (e.ctrlKey || e.metaKey) &&
        containerRef.current?.contains(e.target as Node)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", preventZoom, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventZoom);
    };
  }, [isInTimeline, containerRef]);

  return {
    zoomLevel,
    setZoomLevel,
    handleWheel,
  };
}
