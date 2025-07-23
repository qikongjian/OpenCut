// use-timeline-snapping.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-timeline-snapping.ts
// 最后更新: 2025/7/23

// use-timeline-snapping.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useCallback } from "react";
// 导入项目模块
import { TimelineTrack } from "@/types/timeline";
// 导入项目模块
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

// 接口定义 - 定义对象的结构和属性类型
export interface SnapPoint {
  time: number;
  type: "element-start" | "element-end" | "playhead";
  elementId?: string;
  trackId?: string;
}

// 接口定义 - 定义对象的结构和属性类型
export interface SnapResult {
  snappedTime: number;
  snapPoint: SnapPoint | null;
  snapDistance: number;
}

// 接口定义 - 定义对象的结构和属性类型
export interface UseTimelineSnappingOptions {
  snapThreshold?: number; // Distance in pixels to trigger snapping
  enableElementSnapping?: boolean;
  enablePlayheadSnapping?: boolean;
}

// useTimelineSnapping 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useTimelineSnapping({
  snapThreshold = 10,
  enableElementSnapping = true,
  enablePlayheadSnapping = true,
}: UseTimelineSnappingOptions = {}) {
// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const findSnapPoints = useCallback(
    (
      tracks: TimelineTrack[],
      currentTime: number,
      playheadTime: number,
      zoomLevel: number,
      excludeElementId?: string
    ): SnapPoint[] => {
// 常量定义 - 模块内部使用的固定值
      const snapPoints: SnapPoint[] = [];

      // Add element snap points
      if (enableElementSnapping) {
        tracks.forEach((track) => {
          track.elements.forEach((element) => {
            // Skip the element being dragged
            if (element.id === excludeElementId) return;

// 常量定义 - 模块内部使用的固定值
            const elementStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
            const elementEnd =
              element.startTime +
              (element.duration - element.trimStart - element.trimEnd);

            snapPoints.push(
              {
                time: elementStart,
                type: "element-start",
                elementId: element.id,
                trackId: track.id,
              },
              {
                time: elementEnd,
                type: "element-end",
                elementId: element.id,
                trackId: track.id,
              }
            );
          });
        });
      }

      // Add playhead snap point
      if (enablePlayheadSnapping) {
        snapPoints.push({
          time: playheadTime,
          type: "playhead",
        });
      }

      return snapPoints;
    },
    [enableElementSnapping, enablePlayheadSnapping]
  );

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const snapToNearestPoint = useCallback(
    (
      targetTime: number,
      snapPoints: SnapPoint[],
      zoomLevel: number
    ): SnapResult => {
// 常量定义 - 模块内部使用的固定值
      const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
// 常量定义 - 模块内部使用的固定值
      const thresholdInSeconds = snapThreshold / pixelsPerSecond;

      let closestSnapPoint: SnapPoint | null = null;
      let closestDistance = Infinity;

      snapPoints.forEach((snapPoint) => {
// 常量定义 - 模块内部使用的固定值
        const distance = Math.abs(targetTime - snapPoint.time);
        if (distance < thresholdInSeconds && distance < closestDistance) {
          closestDistance = distance;
          closestSnapPoint = snapPoint;
        }
      });

      return {
        snappedTime: closestSnapPoint
          ? (closestSnapPoint as SnapPoint).time
          : targetTime,
        snapPoint: closestSnapPoint,
        snapDistance: closestDistance,
      };
    },
    [snapThreshold]
  );

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const snapElementPosition = useCallback(
    (
      targetTime: number,
      tracks: TimelineTrack[],
      playheadTime: number,
      zoomLevel: number,
      excludeElementId?: string
    ): SnapResult => {
// 常量定义 - 模块内部使用的固定值
      const snapPoints = findSnapPoints(
        tracks,
        targetTime,
        playheadTime,
        zoomLevel,
        excludeElementId
      );

      return snapToNearestPoint(targetTime, snapPoints, zoomLevel);
    },
    [findSnapPoints, snapToNearestPoint]
  );

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const snapElementEdge = useCallback(
    (
      targetTime: number,
      elementDuration: number,
      tracks: TimelineTrack[],
      playheadTime: number,
      zoomLevel: number,
      excludeElementId?: string,
      snapToStart = true // true for start edge, false for end edge
    ): SnapResult => {
// 常量定义 - 模块内部使用的固定值
      const snapPoints = findSnapPoints(
        tracks,
        targetTime,
        playheadTime,
        zoomLevel,
        excludeElementId
      );

      // For end edge snapping, we need to account for element duration
      const effectiveTargetTime = snapToStart
        ? targetTime
        : targetTime + elementDuration;
// 常量定义 - 模块内部使用的固定值
      const snapResult = snapToNearestPoint(
        effectiveTargetTime,
        snapPoints,
        zoomLevel
      );

      // Adjust the snapped time back for end edge
      if (!snapToStart && snapResult.snapPoint) {
        snapResult.snappedTime = snapResult.snappedTime - elementDuration;
      }

      return snapResult;
    },
    [findSnapPoints, snapToNearestPoint]
  );

  return {
    snapElementPosition,
    snapElementEdge,
    findSnapPoints,
    snapToNearestPoint,
  };
}
