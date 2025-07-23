// use-drag-drop.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-drag-drop.ts
// 最后更新: 2025/7/23

// use-drag-drop.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useState, useRef } from "react";

// UseDragDropOptions 接口定义
interface UseDragDropOptions {
  onDrop?: (files: FileList) => void;
}

// to 函数
// Helper function to check if drag contains files from external sources (not internal app drags)
const containsFiles = (dataTransfer: DataTransfer): boolean => {
  // Check if this is an internal app drag (media item)
  if (dataTransfer.types.includes("application/x-media-item")) {
    return false;
  }

  // Only show overlay for external file drags
  return dataTransfer.types.includes("Files");
};

// useDragDrop 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useDragDrop(options: UseDragDropOptions = {}) {
// 状态管理 - 创建和管理组件内部状态
  const [isDragOver, setIsDragOver] = useState(false);
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const dragCounterRef = useRef(0);

// handleDragEnter 函数
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();

    // Only handle external file drags, not internal app element drags
    if (!containsFiles(e.dataTransfer)) {
      return;
    }

    dragCounterRef.current += 1;
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

// handleDragOver 函数
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Only handle file drags
    if (!containsFiles(e.dataTransfer)) {
      return;
    }
  };

// handleDragLeave 函数
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();

    // Only handle file drags
    if (!containsFiles(e.dataTransfer)) {
      return;
    }

    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

// handleDrop 函数
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    // Only handle file drops
    if (
      options.onDrop &&
      e.dataTransfer.files &&
      containsFiles(e.dataTransfer)
    ) {
      options.onDrop(e.dataTransfer.files);
    }
  };

// 常量定义 - 模块内部使用的固定值
  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return {
    isDragOver,
    dragProps,
  };
}
