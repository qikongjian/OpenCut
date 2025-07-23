// header-base.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/header-base.tsx
// 最后更新: 2025/7/23

// header-base.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { cn } from "@/lib/utils";
// 导入 React 核心库
import { ReactNode } from "react";

// HeaderBaseProps 接口定义
interface HeaderBaseProps {
  leftContent?: ReactNode;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
  children?: ReactNode;
}

// HeaderBase 函数
// 导出组件 - 可复用的 UI 组件
export function HeaderBase({
  leftContent,
  centerContent,
  rightContent,
  className,
  children,
}: HeaderBaseProps) {
  // If children is provided, render it directly without the grid layout
  if (children) {
    return (
      <header className={cn("px-6 h-16 flex items-center", className)}>
        {children}
      </header>
    );
  }

  return (
    <header
      className={cn("px-6 h-14 flex justify-between items-center", className)}
    >
      {leftContent && <div className="flex items-center">{leftContent}</div>}
      {centerContent && (
        <div className="flex items-center">{centerContent}</div>
      )}
      {rightContent && <div className="flex items-center">{rightContent}</div>}
    </header>
  );
}
