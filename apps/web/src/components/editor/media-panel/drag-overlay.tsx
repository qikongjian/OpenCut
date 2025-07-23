// drag-overlay.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/media-panel/drag-overlay.tsx
// 最后更新: 2025/7/23

// drag-overlay.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入 React 核心库
import { Upload, Plus, Image } from "lucide-react";
// 导入项目模块
import { Button } from "@/components/ui/button";

// MediaDragOverlayProps 接口定义
interface MediaDragOverlayProps {
  isVisible: boolean;
  isProcessing?: boolean;
  progress?: number;
  onClick?: () => void;
  isEmptyState?: boolean;
}

// MediaDragOverlay 函数
// 导出组件 - 可复用的 UI 组件
export function MediaDragOverlay({
  isVisible,
  isProcessing = false,
  progress = 0,
  onClick,
  isEmptyState = false,
}: MediaDragOverlayProps) {
  if (!isVisible) return null;

// handleClick 函数
  const handleClick = (e: React.MouseEvent) => {
    if (isProcessing || !onClick) return;
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 h-full text-center rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-all duration-200 p-8"
      onClick={handleClick}
    >
      <div className="flex items-center justify-center">
        <Upload className="h-10 w-10 text-foreground" />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground max-w-sm">
          {isProcessing
            ? `Processing your files (${progress}%)`
            : "Drag and drop videos, photos, and audio files here"}
        </p>
      </div>

      {isProcessing && (
        <div className="w-full max-w-xs">
          <div className="w-full bg-muted/50 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
