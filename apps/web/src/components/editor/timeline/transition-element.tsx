// transition-element.tsx - 转场元素渲染组件
// 此文件包含 转场元素渲染组件 的相关代码
// 文件路径: components/editor/timeline/transition-element.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { TransitionElement as TransitionElementType, TimelineTrack } from "@/types/timeline";
import { getTransitionIcon, getTransitionColor, getTransitionName } from "@/lib/transition-utils";
// 转场图标不需要复杂的拖拽缩放功能，移除相关导入
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

interface TransitionElementProps {
  element: TransitionElementType;
  track: TimelineTrack;
  isSelected: boolean;
  zoomLevel: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

// 转场元素组件 - 显示为两个视频之间的连接元素
export function TransitionElementComponent({
  element,
  track,
  isSelected,
  zoomLevel,
  onMouseDown,
  onClick,
}: TransitionElementProps) {
  // 转场图标不需要复杂的拖拽缩放功能

  // 转场图标固定大小，不需要计算宽度

  const icon = getTransitionIcon(element.transitionType, element.direction);
  const colorClass = getTransitionColor(element.transitionType);
  const transitionName = getTransitionName(element.transitionType, element.direction);

  const handleElementMouseDown = (e: React.MouseEvent) => {
    onMouseDown(e);
  };

  return (
    <div
      className="absolute cursor-pointer transition-all hover:scale-110 z-30"
      style={{
        left: `${element.startTime * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel + 5}px`, // 稍微向右偏移
        top: '2px', // 距离顶部2px，更贴近图片效果
        width: '18px', // 更小更精致
        height: '18px', // 圆形
      }}
      onMouseDown={handleElementMouseDown}
      onClick={onClick}
      title={`${transitionName} (${element.duration.toFixed(1)}s)\n连接: ${element.fromElementId} → ${element.toElementId}`}
    >
      {/* 转场图标 - 一比一复刻图片效果 */}
      <div className={`relative w-full h-full rounded-full overflow-hidden transition-all ${
        isSelected
          ? "ring-2 ring-primary ring-offset-1 shadow-lg scale-110"
          : "shadow-lg hover:shadow-xl"
      }`}>
        {/* 白色圆形背景 - 完全模仿图片中的效果 */}
        <div className="absolute inset-0 bg-white border border-gray-300/50"></div>

        {/* 转场图标 - 深灰色图标，更专业 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 text-gray-600 flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* 选中状态的主色调边框 */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-primary rounded-full bg-primary/5"></div>
        )}

        {/* 轻微的内阴影效果，增加立体感 */}
        <div className="absolute inset-0 rounded-full shadow-inner"></div>
      </div>

      {/* 悬停时显示的信息提示 - 使用系统颜色 */}
      {isSelected && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-popover border border-border text-popover-foreground text-xs rounded-md whitespace-nowrap z-40 shadow-md">
          {transitionName} ({element.duration.toFixed(1)}s)
        </div>
      )}
    </div>
  );
}
