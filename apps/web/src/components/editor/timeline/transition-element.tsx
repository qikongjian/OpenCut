// transition-element.tsx - 转场元素渲染组件
// 此文件包含 转场元素渲染组件 的相关代码
// 文件路径: components/editor/timeline/transition-element.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { TransitionElement } from "@/types/timeline";
import { 
  FadeIn, 
  FadeOut, 
  MoveHorizontal, 
  MoveVertical,
  Zap,
  Sparkles
} from "lucide-react";

interface TransitionElementProps {
  element: TransitionElement;
  isSelected: boolean;
  zoomLevel: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

// 获取转场图标
function getTransitionIcon(type: string, direction: string) {
  switch (type) {
    case "fade":
      return direction === "in" ? <FadeIn className="h-4 w-4" /> : <FadeOut className="h-4 w-4" />;
    case "slide":
      return <MoveHorizontal className="h-4 w-4" />;
    case "zoom":
      return <Zap className="h-4 w-4" />;
    case "dissolve":
      return <Sparkles className="h-4 w-4" />;
    default:
      return <FadeIn className="h-4 w-4" />;
  }
}

// 获取转场颜色
function getTransitionColor(type: string) {
  switch (type) {
    case "fade":
      return "bg-blue-500";
    case "slide":
      return "bg-green-500";
    case "zoom":
      return "bg-purple-500";
    case "dissolve":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}

// 获取转场方向文本
function getDirectionText(direction: string) {
  switch (direction) {
    case "left":
      return "左";
    case "right":
      return "右";
    case "up":
      return "上";
    case "down":
      return "下";
    case "in":
      return "入";
    case "out":
      return "出";
    default:
      return "";
  }
}

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
  const directionText = getDirectionText(element.direction);

  return (
    <div
      className={`absolute h-full rounded border-2 border-dashed ${colorClass} ${
        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
      } cursor-pointer transition-all hover:opacity-80`}
      style={style}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={`${element.name} (${element.duration}s)`}
    >
      <div className="flex items-center justify-center h-full p-1">
        <div className="flex flex-col items-center gap-1 text-white">
          {icon}
          <div className="text-xs font-medium text-center">
            {element.transitionType}
            {directionText && ` ${directionText}`}
          </div>
          <div className="text-xs opacity-75">
            {element.duration.toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  );
} 