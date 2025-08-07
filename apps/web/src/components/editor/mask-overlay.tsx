// mask-overlay.tsx - 蒙板覆盖层组件
// 此文件包含蒙板可视化和编辑界面的相关代码
// 文件路径: components/editor/mask-overlay.tsx
// 最后更新: 2025/1/8

"use client";

import { useState, useRef, useEffect } from "react";
import { MaskConfig } from "@/types/timeline";
import { MaskCoordinateUtils, MaskRenderer } from "@/lib/mask-utils";
import { cn } from "@/lib/utils";

interface MaskOverlayProps {
  masks: MaskConfig[];
  canvasWidth: number;
  canvasHeight: number;
  onMaskUpdate?: (maskId: string, updates: Partial<MaskConfig>) => void;
  editMode?: boolean;
  className?: string;
}

// 蒙板手柄组件
interface MaskHandleProps {
  x: number;
  y: number;
  type: 'corner' | 'edge' | 'center' | 'rotation';
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
}

function MaskHandle({ x, y, type, cursor, onMouseDown }: MaskHandleProps) {
  return (
    <div
      className={cn(
        "absolute w-2 h-2 border border-primary bg-background rounded-sm transform -translate-x-1/2 -translate-y-1/2 hover:bg-primary/20 transition-colors",
        type === 'rotation' && "w-3 h-3 rounded-full bg-primary/80"
      )}
      style={{
        left: x,
        top: y,
        cursor,
      }}
      onMouseDown={onMouseDown}
    />
  );
}

// 单个蒙板可视化组件
interface MaskVisualizerProps {
  mask: MaskConfig;
  canvasWidth: number;
  canvasHeight: number;
  isSelected?: boolean;
  editMode?: boolean;
  onUpdate?: (updates: Partial<MaskConfig>) => void;
  onSelect?: () => void;
}

function MaskVisualizer({
  mask,
  canvasWidth,
  canvasHeight,
  isSelected = false,
  editMode = false,
  onUpdate,
  onSelect
}: MaskVisualizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialMask, setInitialMask] = useState<MaskConfig | null>(null);

  // 🔧 修复：使用统一的边界框计算方法
  const bounds = MaskCoordinateUtils.getMaskBounds(mask, canvasWidth, canvasHeight);
  const { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight } = bounds;

  // 中心点坐标（用于圆形蒙版和旋转）
  const centerPixelX = pixelX + pixelWidth / 2;
  const centerPixelY = pixelY + pixelHeight / 2;

  // 处理蒙板拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !onUpdate) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialMask(mask);
    onSelect?.();
  };

  // 处理缩放手柄拖拽
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!editMode || !onUpdate) return;

    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialMask(mask);
    onSelect?.();
  };

  // 🔧 新增：双击重置蒙版大小
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!editMode || !onUpdate) return;

    e.preventDefault();
    e.stopPropagation();

    // 重置到默认大小
    onUpdate({
      width: 0.5,
      height: 0.5,
      x: 0,
      y: 0,
      rotation: 0
    });
  };

  // 处理拖拽和缩放
  useEffect(() => {
    if ((!isDragging && !isResizing) || !initialMask || !onUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        // 🔧 修复：拖拽移动 - 精确的坐标转换
        const deltaRelativeX = (deltaX / canvasWidth) * 2;
        const deltaRelativeY = (deltaY / canvasHeight) * 2;

        const newCoords = MaskCoordinateUtils.clampRelativeCoordinates(
          initialMask.x + deltaRelativeX,
          initialMask.y + deltaRelativeY
        );

        onUpdate(newCoords);
      } else if (isResizing) {
        // 🔧 修复：缩放调整 - 确保中心点和尺寸同步
        const deltaRelativeX = (deltaX / canvasWidth) * 2;
        const deltaRelativeY = (deltaY / canvasHeight) * 2;

        let newWidth = initialMask.width;
        let newHeight = initialMask.height;
        let newX = initialMask.x;
        let newY = initialMask.y;

        // 🔧 新增：检查是否按住Shift键进行等比例缩放
        const isProportional = e.shiftKey;

        switch (resizeHandle) {
          case 'se': // 右下角 - 向右下扩展
            newWidth = initialMask.width + deltaRelativeX;
            newHeight = isProportional
              ? initialMask.height + deltaRelativeX * (initialMask.height / initialMask.width)
              : initialMask.height + deltaRelativeY;
            // 中心点向右下移动一半距离
            newX = initialMask.x + deltaRelativeX / 2;
            newY = initialMask.y + (isProportional
              ? deltaRelativeX * (initialMask.height / initialMask.width) / 2
              : deltaRelativeY / 2);
            break;
          case 'sw': // 左下角 - 向左下扩展
            newWidth = initialMask.width - deltaRelativeX;
            newHeight = isProportional
              ? initialMask.height - deltaRelativeX * (initialMask.height / initialMask.width)
              : initialMask.height + deltaRelativeY;
            // 中心点向左下移动
            newX = initialMask.x - deltaRelativeX / 2;
            newY = initialMask.y + (isProportional
              ? -deltaRelativeX * (initialMask.height / initialMask.width) / 2
              : deltaRelativeY / 2);
            break;
          case 'ne': // 右上角 - 向右上扩展
            newWidth = initialMask.width + deltaRelativeX;
            newHeight = isProportional
              ? initialMask.height + deltaRelativeX * (initialMask.height / initialMask.width)
              : initialMask.height - deltaRelativeY;
            // 中心点向右上移动
            newX = initialMask.x + deltaRelativeX / 2;
            newY = initialMask.y + (isProportional
              ? deltaRelativeX * (initialMask.height / initialMask.width) / 2
              : -deltaRelativeY / 2);
            break;
          case 'nw': // 左上角 - 向左上扩展
            newWidth = initialMask.width - deltaRelativeX;
            newHeight = isProportional
              ? initialMask.height - deltaRelativeX * (initialMask.height / initialMask.width)
              : initialMask.height - deltaRelativeY;
            // 中心点向左上移动
            newX = initialMask.x - deltaRelativeX / 2;
            newY = initialMask.y + (isProportional
              ? -deltaRelativeX * (initialMask.height / initialMask.width) / 2
              : -deltaRelativeY / 2);
            break;
        }

        // 应用尺寸和坐标限制
        const clampedSize = MaskCoordinateUtils.clampRelativeSize(newWidth, newHeight);
        const clampedCoords = MaskCoordinateUtils.clampRelativeCoordinates(newX, newY);

        onUpdate({
          x: clampedCoords.x,
          y: clampedCoords.y,
          width: clampedSize.width,
          height: clampedSize.height,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle('');
      setInitialMask(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, dragStart, initialMask, canvasWidth, canvasHeight, onUpdate]);

  // 🔧 修复：生成精确对齐的蒙版路径
  const maskPath = (() => {
    switch (mask.shape) {
      case 'rectangle':
        // 矩形：使用左上角坐标和尺寸
        return `M ${pixelX} ${pixelY} L ${pixelX + pixelWidth} ${pixelY} L ${pixelX + pixelWidth} ${pixelY + pixelHeight} L ${pixelX} ${pixelY + pixelHeight} Z`;

      case 'circle':
        // 圆形：使用中心点坐标和半径
        const centerX = centerPixelX; // 直接使用中心点坐标
        const centerY = centerPixelY;
        const radius = Math.min(pixelWidth, pixelHeight) / 2;
        return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY} Z`;

      default:
        return '';
    }
  })();

  return (
    <g>
      {/* 蒙板路径 */}
      <path
        d={maskPath}
        fill="none"
        stroke={isSelected ? "#3b82f6" : "#6b7280"}
        strokeWidth={isSelected ? 2 : 1}
        strokeDasharray={editMode ? "4 4" : "none"}
        opacity={mask.opacity}
        className={cn(
          "transition-all",
          editMode && "cursor-move hover:stroke-primary"
        )}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* 蒙板填充（半透明显示） */}
      {editMode && (
        <path
          d={maskPath}
          fill={isSelected ? "#3b82f6" : "#6b7280"}
          opacity={0.1}
          onMouseDown={handleMouseDown}
        />
      )}
      
      {/* 编辑手柄 */}
      {editMode && isSelected && onUpdate && (
        <>
          {/* 四个角的手柄 */}
          <MaskHandle
            x={pixelX}
            y={pixelY}
            type="corner"
            cursor="nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <MaskHandle
            x={pixelX + pixelWidth}
            y={pixelY}
            type="corner"
            cursor="ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <MaskHandle
            x={pixelX + pixelWidth}
            y={pixelY + pixelHeight}
            type="corner"
            cursor="se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
          <MaskHandle
            x={pixelX}
            y={pixelY + pixelHeight}
            type="corner"
            cursor="sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />

          {/* 中心点 */}
          <MaskHandle
            x={pixelX + pixelWidth / 2}
            y={pixelY + pixelHeight / 2}
            type="center"
            cursor="move"
            onMouseDown={handleMouseDown}
          />

          {/* 旋转手柄 */}
          <MaskHandle
            x={pixelX + pixelWidth / 2}
            y={pixelY - 20}
            type="rotation"
            cursor="grab"
            onMouseDown={(e) => {
              // TODO: 实现旋转功能
              e.stopPropagation();
            }}
          />
        </>
      )}
    </g>
  );
}

// 主要的蒙板覆盖层组件
export function MaskOverlay({ 
  masks, 
  canvasWidth, 
  canvasHeight, 
  onMaskUpdate,
  editMode = false,
  className 
}: MaskOverlayProps) {
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);

  if (masks.length === 0) {
    return null;
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className={cn(
          "absolute inset-0",
          editMode && "pointer-events-auto"
        )}
        style={{ pointerEvents: editMode ? 'auto' : 'none' }}
      >
        {masks.map((mask) => (
          <MaskVisualizer
            key={mask.id}
            mask={mask}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            isSelected={selectedMaskId === mask.id}
            editMode={editMode}
            onUpdate={onMaskUpdate ? (updates) => onMaskUpdate(mask.id, updates) : undefined}
            onSelect={() => setSelectedMaskId(mask.id)}
          />
        ))}
      </svg>
      
      {/* 编辑模式提示 */}
      {editMode && masks.length > 0 && (
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground">
          蒙板编辑模式 - 拖拽移动蒙板
        </div>
      )}
    </div>
  );
}
