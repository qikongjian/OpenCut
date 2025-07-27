// draggable-item.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/draggable-item.tsx
// 最后更新: 2025/7/23

// draggable-item.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { AspectRatio } from "@/components/ui/aspect-ratio";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入模块
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// 导入 React 核心库
import { ReactNode, useState, useRef, useEffect } from "react";
// 导入 React 核心库
import { createPortal } from "react-dom";
// 导入 React 核心库
import { Plus } from "lucide-react";
// 导入项目模块
import { cn } from "@/lib/utils";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";

// 接口定义 - 定义对象的结构和属性类型
export interface DraggableMediaItemProps {
  name: string;
  preview: ReactNode;
  dragData: Record<string, any>;
  onDragStart?: (e: React.DragEvent) => void;
  onAddToTimeline?: (currentTime: number) => void;
  onClick?: () => void;
  aspectRatio?: number;
  className?: string;
  showPlusOnDrag?: boolean;
  showLabel?: boolean;
  rounded?: boolean;
}

// DraggableMediaItem 函数
// 导出组件 - 可复用的 UI 组件
export function DraggableMediaItem({
  name,
  preview,
  dragData,
  onDragStart,
  onAddToTimeline,
  onClick,
  aspectRatio = 16 / 9,
  className = "",
  showPlusOnDrag = true,
  showLabel = true,
  rounded = true,
}: DraggableMediaItemProps) {
// 状态管理 - 创建和管理组件内部状态
  const [isDragging, setIsDragging] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
// 常量定义 - 模块内部使用的固定值
  const dragRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const currentTime = usePlaybackStore((state) => state.currentTime);

// handleAddToTimeline 函数
  const handleAddToTimeline = () => {
    onAddToTimeline?.(currentTime);
  };

// 常量定义 - 模块内部使用的固定值
  const emptyImg = new window.Image();
  emptyImg.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    if (!isDragging) return;

// handleDragOver 函数
    const handleDragOver = (e: DragEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener("dragover", handleDragOver);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
    };
  }, [isDragging]);

// handleDragStart 函数
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setDragImage(emptyImg, 0, 0);

    // Set drag data
    e.dataTransfer.setData(
      "application/x-media-item",
      JSON.stringify(dragData)
    );
    e.dataTransfer.effectAllowed = "copy";

    // Set initial position and show custom drag preview
    setDragPosition({ x: e.clientX, y: e.clientY });
    setIsDragging(true);

    onDragStart?.(e);
  };

// handleDragEnd 函数
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div ref={dragRef} className="relative group h-28">
        <div
          className={`flex flex-col gap-1 p-0 h-auto w-full relative cursor-default ${className}`}
        >
          <AspectRatio
            ratio={aspectRatio}
            className={cn(
              "bg-accent relative overflow-hidden cursor-pointer",
              rounded && "rounded-md",
              "[&::-webkit-drag-ghost]:opacity-0" // Webkit-specific ghost hiding
            )}
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMouseDown={(e) => {
              // 只处理左键点击，不阻止拖拽和右键菜单
              if (e.button === 0) {
                // 延迟执行点击事件，避免与拖拽冲突
                setTimeout(() => {
                  if (!e.defaultPrevented) {
                    onClick?.();
                  }
                }, 100);
              }
            }}
          >
            {preview}
            {!isDragging && (
              <PlusButton
                className="opacity-0 group-hover:opacity-100"
                onClick={handleAddToTimeline}
              />
            )}
          </AspectRatio>
          {showLabel && (
            <span
              className="text-[0.7rem] text-muted-foreground truncate w-full text-left"
              aria-label={name || 'Untitled'}
              title={name || 'Untitled'}
            >
              {name && name.length > 8
                ? `${name.slice(0, 16)}...${name.slice(-3)}`
                : name || 'Untitled'}
            </span>
          )}
        </div>
      </div>

      {/* Custom drag preview */}
      {isDragging &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[9999]"
            style={{
              left: dragPosition.x - 40, // Center the preview (half of 80px)
              top: dragPosition.y - 40, // Center the preview (half of 80px)
            }}
          >
            <div className="w-[80px]">
              <AspectRatio
                ratio={1}
                className="relative rounded-md overflow-hidden shadow-2xl ring ring-primary"
              >
                <div className="w-full h-full [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:rounded-none">
                  {preview}
                </div>
                {showPlusOnDrag && (
                  <PlusButton
                    onClick={handleAddToTimeline}
                    tooltipText="Add to timeline or drag to position"
                  />
                )}
              </AspectRatio>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// PlusButton 函数
function PlusButton({
  className,
  onClick,
  tooltipText,
}: {
  className?: string;
  onClick?: () => void;
  tooltipText?: string;
}) {
// button 函数
  const button = (
    <Button
      size="icon"
      className={cn("absolute bottom-2 right-2 size-4", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      title={tooltipText}
    >
      <Plus className="!size-3" />
    </Button>
  );

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
