// 🎬 字幕拖拽覆盖层组件
// 专门处理字幕在预览面板中的拖拽移动功能

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { TextElement } from '@/types/timeline';
import { useTimelineStore } from '@/stores/timeline-store';
import { cn } from '@/lib/utils';
import { FONT_CLASS_MAP } from '@/lib/font-config';

interface SubtitleOverlayProps {
  textElements: Array<{
    element: TextElement;
    trackId: string;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  previewDimensions: { width: number; height: number };
  selectedElements: Array<{ elementId: string; trackId: string }>;
  editMode?: boolean;
}

// 单个字幕拖拽组件
interface DraggableSubtitleProps {
  element: TextElement;
  trackId: string;
  canvasWidth: number;
  canvasHeight: number;
  previewDimensions: { width: number; height: number };
  isSelected: boolean;
  onUpdate: (updates: Partial<TextElement>) => void;
  onSelect: () => void;
}

function DraggableSubtitle({
  element,
  trackId,
  canvasWidth,
  canvasHeight,
  previewDimensions,
  isSelected,
  onUpdate,
  onSelect
}: DraggableSubtitleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  // 计算字幕的实际位置
  const scaleRatio = previewDimensions.width / canvasWidth;
  const left = 50 + (element.x / canvasWidth) * 100;
  const top = 50 + (element.y / canvasHeight) * 100;

  // 字体类名
  const fontClassName = FONT_CLASS_MAP[element.fontFamily as keyof typeof FONT_CLASS_MAP] || "";

  // 处理鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPosition({ x: element.x, y: element.y });
    onSelect();
  };

  // 处理拖拽
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // 将像素偏移转换为画布坐标偏移
      const canvasOffsetX = (deltaX / scaleRatio / previewDimensions.width) * canvasWidth;
      const canvasOffsetY = (deltaY / scaleRatio / previewDimensions.height) * canvasHeight;

      const newX = initialPosition.x + canvasOffsetX;
      const newY = initialPosition.y + canvasOffsetY;

      // 限制在画布范围内
      const clampedX = Math.max(-canvasWidth / 2, Math.min(canvasWidth / 2, newX));
      const clampedY = Math.max(-canvasHeight / 2, Math.min(canvasHeight / 2, newY));

      onUpdate({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialPosition, canvasWidth, canvasHeight, previewDimensions, scaleRatio, onUpdate]);

  return (
    <div
      className={cn(
        "absolute cursor-move transition-all duration-200",
        isSelected && "ring-2 ring-blue-500 ring-opacity-50",
        isDragging && "cursor-grabbing scale-105 shadow-lg"
      )}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${scaleRatio}) ${element.horizontalFlip ? 'scaleX(-1)' : ''}`,
        opacity: element.opacity,
        zIndex: isSelected ? 50 : 40,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 字幕内容 */}
      <div
        className={cn(
          fontClassName,
          "select-none pointer-events-none",
          isSelected && "outline outline-2 outline-blue-400 outline-offset-2"
        )}
        style={{
          fontSize: `${element.fontSize}px`,
          color: element.color,
          backgroundColor: element.backgroundColor,
          textAlign: element.textAlign,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textDecoration: element.textDecoration,
          padding: "4px 8px",
          borderRadius: "2px",
          whiteSpace: "nowrap",
          // Fallback for system fonts that don't have classes
          ...(fontClassName === "" && { fontFamily: element.fontFamily }),
        }}
      >
        {element.content}
      </div>

      {/* 选中状态的控制点 */}
      {isSelected && (
        <>
          {/* 中心控制点 */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          />
          
          {/* 四个角的控制点 */}
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
            style={{
              left: '-4px',
              top: '-4px',
              pointerEvents: 'none'
            }}
          />
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
            style={{
              right: '-4px',
              top: '-4px',
              pointerEvents: 'none'
            }}
          />
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
            style={{
              right: '-4px',
              bottom: '-4px',
              pointerEvents: 'none'
            }}
          />
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
            style={{
              left: '-4px',
              bottom: '-4px',
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* 拖拽提示 */}
      {isDragging && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          X: {Math.round(element.x)}, Y: {Math.round(element.y)}
        </div>
      )}
    </div>
  );
}

// 主要的字幕覆盖层组件
export function SubtitleOverlay({
  textElements,
  canvasWidth,
  canvasHeight,
  previewDimensions,
  selectedElements,
  editMode = true
}: SubtitleOverlayProps) {
  const { updateTextElement } = useTimelineStore();

  if (!editMode || textElements.length === 0) {
    return null;
  }

  const handleSubtitleUpdate = (trackId: string, elementId: string, updates: Partial<TextElement>) => {
    updateTextElement(trackId, elementId, updates);
  };

  const handleSubtitleSelect = (trackId: string, elementId: string) => {
    // 这里可以触发选中状态更新
    // 暂时通过 useTimelineStore 的选中逻辑处理
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {textElements.map(({ element, trackId }) => {
        const isSelected = selectedElements.some(
          sel => sel.elementId === element.id && sel.trackId === trackId
        );

        return (
          <div key={`${trackId}-${element.id}`} className="pointer-events-auto">
            <DraggableSubtitle
              element={element}
              trackId={trackId}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              previewDimensions={previewDimensions}
              isSelected={isSelected}
              onUpdate={(updates) => handleSubtitleUpdate(trackId, element.id, updates)}
              onSelect={() => handleSubtitleSelect(trackId, element.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
