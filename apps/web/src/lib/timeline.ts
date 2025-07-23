// timeline.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/timeline.ts
// 最后更新: 2025/7/23

// timeline.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import { TimelineElement } from "@/types/timeline";

// to 函数
// Helper function to check for element overlaps and prevent invalid timeline states
export const checkElementOverlaps = (elements: TimelineElement[]): boolean => {
  // Sort elements by start time
  const sortedElements = [...elements].sort(
    (a, b) => a.startTime - b.startTime
  );

  for (let i = 0; i < sortedElements.length - 1; i++) {
// 常量定义 - 模块内部使用的固定值
    const current = sortedElements[i];
// 常量定义 - 模块内部使用的固定值
    const next = sortedElements[i + 1];

// 常量定义 - 模块内部使用的固定值
    const currentEnd =
      current.startTime +
      (current.duration - current.trimStart - current.trimEnd);

    // Check if current element overlaps with next element
    if (currentEnd > next.startTime) return true; // Overlap detected
  }

  return false; // No overlaps
};

// to 函数
// Helper function to resolve overlaps by adjusting element positions
export const resolveElementOverlaps = (
  elements: TimelineElement[]
): TimelineElement[] => {
  // Sort elements by start time
  const sortedElements = [...elements].sort(
    (a, b) => a.startTime - b.startTime
  );
// 常量定义 - 模块内部使用的固定值
  const resolvedElements: TimelineElement[] = [];

  for (let i = 0; i < sortedElements.length; i++) {
// 常量定义 - 模块内部使用的固定值
    const current = { ...sortedElements[i] };

    if (resolvedElements.length > 0) {
// 常量定义 - 模块内部使用的固定值
      const previous = resolvedElements[resolvedElements.length - 1];
// 常量定义 - 模块内部使用的固定值
      const previousEnd =
        previous.startTime +
        (previous.duration - previous.trimStart - previous.trimEnd);

      // If current element would overlap with previous, push it after previous ends
      if (current.startTime < previousEnd) {
        current.startTime = previousEnd;
      }
    }

    resolvedElements.push(current);
  }

  return resolvedElements;
};
