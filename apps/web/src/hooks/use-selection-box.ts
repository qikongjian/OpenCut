// use-selection-box.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-selection-box.ts
// 最后更新: 2025/7/23

// use-selection-box.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useState, useEffect, useCallback } from "react";

// UseSelectionBoxProps 接口定义
interface UseSelectionBoxProps {
  containerRef: React.RefObject<HTMLElement>;
  playheadRef?: React.RefObject<HTMLElement>;
  onSelectionComplete: (
    elements: { trackId: string; elementId: string }[]
  ) => void;
  isEnabled?: boolean;
}

// SelectionBoxState 接口定义
interface SelectionBoxState {
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  isActive: boolean;
}

// useSelectionBox 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useSelectionBox({
  containerRef,
  playheadRef,
  onSelectionComplete,
  isEnabled = true,
}: UseSelectionBoxProps) {
// 常量定义 - 模块内部使用的固定值
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(
    null
  );
// 状态管理 - 创建和管理组件内部状态
  const [justFinishedSelecting, setJustFinishedSelecting] = useState(false);

  // Mouse down handler to start selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isEnabled) return;

      // Only start selection on empty space clicks
      if ((e.target as HTMLElement).closest(".timeline-element")) {
        return;
      }
      if (playheadRef?.current?.contains(e.target as Node)) {
        return;
      }
      if ((e.target as HTMLElement).closest("[data-track-labels]")) {
        return;
      }
      // Don't start selection when clicking in the ruler area - this interferes with playhead dragging
      if ((e.target as HTMLElement).closest("[data-ruler-area]")) {
        return;
      }

      setSelectionBox({
        startPos: { x: e.clientX, y: e.clientY },
        currentPos: { x: e.clientX, y: e.clientY },
        isActive: false, // Will become active when mouse moves
      });
    },
    [isEnabled, playheadRef]
  );

  // Function to select elements within the selection box
  const selectElementsInBox = useCallback(
    (startPos: { x: number; y: number }, endPos: { x: number; y: number }) => {
      if (!containerRef.current) return;

// 常量定义 - 模块内部使用的固定值
      const container = containerRef.current;
// 常量定义 - 模块内部使用的固定值
      const containerRect = container.getBoundingClientRect();

      // Calculate selection rectangle in container coordinates
      const startX = startPos.x - containerRect.left;
// 常量定义 - 模块内部使用的固定值
      const startY = startPos.y - containerRect.top;
// 常量定义 - 模块内部使用的固定值
      const endX = endPos.x - containerRect.left;
// 常量定义 - 模块内部使用的固定值
      const endY = endPos.y - containerRect.top;

// 常量定义 - 模块内部使用的固定值
      const selectionRect = {
        left: Math.min(startX, endX),
        top: Math.min(startY, endY),
        right: Math.max(startX, endX),
        bottom: Math.max(startY, endY),
      };

      // Find all timeline elements within the selection rectangle
      const timelineElements = container.querySelectorAll(".timeline-element");

// 常量定义 - 模块内部使用的固定值
      const selectedElements: { trackId: string; elementId: string }[] = [];

      timelineElements.forEach((element) => {
// 常量定义 - 模块内部使用的固定值
        const elementRect = element.getBoundingClientRect();
        // Use absolute coordinates for more accurate intersection detection
        const elementAbsolute = {
          left: elementRect.left,
          top: elementRect.top,
          right: elementRect.right,
          bottom: elementRect.bottom,
        };

// 常量定义 - 模块内部使用的固定值
        const selectionAbsolute = {
          left: startPos.x,
          top: startPos.y,
          right: endPos.x,
          bottom: endPos.y,
        };

        // Normalize selection rectangle (handle dragging in any direction)
        const normalizedSelection = {
          left: Math.min(selectionAbsolute.left, selectionAbsolute.right),
          top: Math.min(selectionAbsolute.top, selectionAbsolute.bottom),
          right: Math.max(selectionAbsolute.left, selectionAbsolute.right),
          bottom: Math.max(selectionAbsolute.top, selectionAbsolute.bottom),
        };

// 常量定义 - 模块内部使用的固定值
        const elementId = element.getAttribute("data-element-id");
// 常量定义 - 模块内部使用的固定值
        const trackId = element.getAttribute("data-track-id");

        // Check if element intersects with selection rectangle (any overlap)
        // Using absolute coordinates for more precise detection
        const intersects = !(
          elementAbsolute.right < normalizedSelection.left ||
          elementAbsolute.left > normalizedSelection.right ||
          elementAbsolute.bottom < normalizedSelection.top ||
          elementAbsolute.top > normalizedSelection.bottom
        );

        if (intersects && elementId && trackId) {
          selectedElements.push({ trackId, elementId });
        }
      });

      // Always call the callback - with elements or empty array to clear selection
      console.log(
        JSON.stringify({ selectElementsInBox: selectedElements.length })
      );
      onSelectionComplete(selectedElements);
    },
    [containerRef, onSelectionComplete]
  );

  // Effect to track selection box movement
  // 副作用 Hook - 处理副作用

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    if (!selectionBox) return;

// handleMouseMove 自定义钩子
    const handleMouseMove = (e: MouseEvent) => {
// 常量定义 - 模块内部使用的固定值
      const deltaX = Math.abs(e.clientX - selectionBox.startPos.x);
// 常量定义 - 模块内部使用的固定值
      const deltaY = Math.abs(e.clientY - selectionBox.startPos.y);

      // Start selection if mouse moved more than 5px
      const shouldActivate = deltaX > 5 || deltaY > 5;

// 常量定义 - 模块内部使用的固定值
      const newSelectionBox = {
        ...selectionBox,
        currentPos: { x: e.clientX, y: e.clientY },
        isActive: shouldActivate || selectionBox.isActive,
      };

      setSelectionBox(newSelectionBox);

      // Real-time visual feedback: update selection as we drag
      if (newSelectionBox.isActive) {
        selectElementsInBox(
          newSelectionBox.startPos,
          newSelectionBox.currentPos
        );
      }
    };

// handleMouseUp 自定义钩子
    const handleMouseUp = () => {
      console.log(
        JSON.stringify({ mouseUp: { wasActive: selectionBox?.isActive } })
      );

      // If we had an active selection, mark that we just finished selecting
      if (selectionBox?.isActive) {
        console.log(JSON.stringify({ settingJustFinishedSelecting: true }));
        setJustFinishedSelecting(true);
        // Clear the flag after a short delay to allow click events to check it
        setTimeout(() => {
          console.log(JSON.stringify({ clearingJustFinishedSelecting: true }));
          setJustFinishedSelecting(false);
        }, 50);
      }

      // Don't call selectElementsInBox again - real-time selection already handled it
      // Just clean up the selection box visual
      setSelectionBox(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectionBox, selectElementsInBox]);

  return {
    selectionBox,
    handleMouseDown,
    isSelecting: selectionBox?.isActive || false,
    justFinishedSelecting,
  };
}
