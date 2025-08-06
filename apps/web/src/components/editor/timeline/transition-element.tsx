// transition-element.tsx - 转场元素渲染组件
// 此文件包含 转场元素渲染组件 的相关代码
// 文件路径: components/editor/timeline/transition-element.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { TransitionElement as TransitionElementType } from "@/types/timeline";
import { getTransitionIcon, getTransitionColor, getTransitionName } from "@/lib/transition-utils";

interface TransitionElementProps {
  element: TransitionElementType;
  isSelected: boolean;
  zoomLevel: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

// 转场元素组件 - 显示为两个视频之间的连接元素
export function TransitionElementComponent({
  element,
  isSelected,
  zoomLevel,
  onMouseDown,
  onClick,
}: TransitionElementProps) {
  const style = {
    left: `${element.startTime * zoomLevel}px`,
    width: `${(element.duration - element.trimStart - element.trimEnd) * zoomLevel}px`,
  };

  const icon = getTransitionIcon(element.transitionType, element.direction);
  const colorClass = getTransitionColor(element.transitionType);
  const transitionName = getTransitionName(element.transitionType, element.direction);

  return (
    <div
      className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg border-2 border-dashed ${colorClass} ${
        isSelected ? "ring-2 ring-primary ring-offset-1" : ""
      } cursor-pointer transition-all hover:scale-105 hover:shadow-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm`}
      style={style}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={`${transitionName} (${element.duration}s)`}
    >
      <div className="flex items-center justify-center h-full px-2">
        <div className="flex items-center gap-1 text-white">
          <div className="w-4 h-4 flex items-center justify-center">
          {icon}
          </div>
          <div className="text-xs font-medium whitespace-nowrap">
            {transitionName}
          </div>
        </div>
      </div>
      
      {/* 转场指示线 */}
      <div className="absolute top-full left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60"></div>
    </div>
  );
} 