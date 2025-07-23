// selection-box.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/selection-box.tsx
// 最后更新: 2025/7/23

// selection-box.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useEffect, useRef } from "react";

// SelectionBoxProps 接口定义
interface SelectionBoxProps {
  startPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLElement>;
  isActive: boolean;
}

// SelectionBox 函数
// 导出组件 - 可复用的 UI 组件
export function SelectionBox({
  startPos,
  currentPos,
  containerRef,
  isActive,
}: SelectionBoxProps) {
// 常量定义 - 模块内部使用的固定值
  const selectionBoxRef = useRef<HTMLDivElement>(null);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    if (!isActive || !startPos || !currentPos || !containerRef.current) return;

// 常量定义 - 模块内部使用的固定值
    const container = containerRef.current;
// 常量定义 - 模块内部使用的固定值
    const containerRect = container.getBoundingClientRect();

    // Calculate relative positions within the container
    const startX = startPos.x - containerRect.left;
// 常量定义 - 模块内部使用的固定值
    const startY = startPos.y - containerRect.top;
// 常量定义 - 模块内部使用的固定值
    const currentX = currentPos.x - containerRect.left;
// 常量定义 - 模块内部使用的固定值
    const currentY = currentPos.y - containerRect.top;

    // Calculate the selection rectangle bounds
    const left = Math.min(startX, currentX);
// 常量定义 - 模块内部使用的固定值
    const top = Math.min(startY, currentY);
// 常量定义 - 模块内部使用的固定值
    const width = Math.abs(currentX - startX);
// 常量定义 - 模块内部使用的固定值
    const height = Math.abs(currentY - startY);

    // Update the selection box position and size
    if (selectionBoxRef.current) {
      selectionBoxRef.current.style.left = `${left}px`;
      selectionBoxRef.current.style.top = `${top}px`;
      selectionBoxRef.current.style.width = `${width}px`;
      selectionBoxRef.current.style.height = `${height}px`;
    }
  }, [startPos, currentPos, isActive, containerRef]);

  if (!isActive || !startPos || !currentPos) return null;

  return (
    <div
      ref={selectionBoxRef}
      className="absolute pointer-events-none z-50"
      style={{
        backgroundColor: "hsl(var(--foreground) / 0.1)",
      }}
    />
  );
}
