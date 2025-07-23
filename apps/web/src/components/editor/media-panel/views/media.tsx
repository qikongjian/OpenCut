// media.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/media-panel/views/media.tsx
// 最后更新: 2025/7/23

// media.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { useDragDrop } from "@/hooks/use-drag-drop";
// 导入项目模块
import { processMediaFiles } from "@/lib/media-processing";
// 导入项目模块
import { useMediaStore, type MediaItem } from "@/stores/media-store";
// 导入 React 核心库
import { Image, Loader2, Music, Plus, Video } from "lucide-react";
// 导入 React 核心库
import { useEffect, useRef, useState } from "react";
// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入项目模块
import { MediaDragOverlay } from "@/components/editor/media-panel/drag-overlay";
// 导入模块
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
// 导入项目模块
import { Input } from "@/components/ui/input";
// 导入模块
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// 导入项目模块
import { DraggableMediaItem } from "@/components/ui/draggable-item";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";

// MediaView 函数
// 导出组件 - 可复用的 UI 组件
export function MediaView() {
// 常量定义 - 模块内部使用的固定值
  const { mediaItems, addMediaItem, removeMediaItem } = useMediaStore();
// 常量定义 - 模块内部使用的固定值
  const { activeProject } = useProjectStore();
// 常量定义 - 模块内部使用的固定值
  const fileInputRef = useRef<HTMLInputElement>(null);
// 状态管理 - 创建和管理组件内部状态
  const [isProcessing, setIsProcessing] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [progress, setProgress] = useState(0);
// 状态管理 - 创建和管理组件内部状态
  const [searchQuery, setSearchQuery] = useState("");
// 状态管理 - 创建和管理组件内部状态
  const [mediaFilter, setMediaFilter] = useState("all");

// 常量定义 - 模块内部使用的固定值
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    if (!activeProject) {
      toast.error("No active project");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    try {
      // Process files (extract metadata, generate thumbnails, etc.)
      const processedItems = await processMediaFiles(files, (p) =>
        setProgress(p)
      );
      // Add each processed media item to the store
      for (const item of processedItems) {
        await addMediaItem(activeProject.id, item);
      }
    } catch (error) {
      // Show error toast if processing fails
      console.error("Error processing files:", error);
      toast.error("Failed to process files");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

// 常量定义 - 模块内部使用的固定值
  const { isDragOver, dragProps } = useDragDrop({
    // When files are dropped, process them
    onDrop: processFiles,
  });

// handleFileSelect 函数
  const handleFileSelect = () => fileInputRef.current?.click(); // Open file picker

// handleFileChange 函数
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When files are selected via file picker, process them
    if (e.target.files) processFiles(e.target.files);
    e.target.value = ""; // Reset input
  };

// 常量定义 - 模块内部使用的固定值
  const handleRemove = async (e: React.MouseEvent, id: string) => {
    // Remove a media item from the store
    e.stopPropagation();

    if (!activeProject) {
      toast.error("No active project");
      return;
    }

    // Media store now handles cascade deletion automatically
    await removeMediaItem(activeProject.id, id);
  };

// formatDuration 函数
  const formatDuration = (duration: number) => {
    // Format seconds as mm:ss
    const min = Math.floor(duration / 60);
// 常量定义 - 模块内部使用的固定值
    const sec = Math.floor(duration % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

// 状态管理 - 创建和管理组件内部状态
  const [filteredMediaItems, setFilteredMediaItems] = useState(mediaItems);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const filtered = mediaItems.filter((item) => {
      if (mediaFilter && mediaFilter !== "all" && item.type !== mediaFilter) {
        return false;
      }

      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    setFilteredMediaItems(filtered);
  }, [mediaItems, mediaFilter, searchQuery]);

// renderPreview 函数
  const renderPreview = (item: MediaItem) => {
    // Render a preview for each media type (image, video, audio, unknown)
    if (item.type === "image") {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={item.url}
            alt={item.name}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
          />
        </div>
      );
    }

    if (item.type === "video") {
      if (item.thumbnailUrl) {
        return (
          <div className="relative w-full h-full">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
              <Video className="h-6 w-6 text-white drop-shadow-md" />
            </div>
            {item.duration && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {formatDuration(item.duration)}
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground rounded">
          <Video className="h-6 w-6 mb-1" />
          <span className="text-xs">Video</span>
          {item.duration && (
            <span className="text-xs opacity-70">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
      );
    }

    if (item.type === "audio") {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex flex-col items-center justify-center text-muted-foreground rounded border border-green-500/20">
          <Music className="h-6 w-6 mb-1" />
          <span className="text-xs">Audio</span>
          {item.duration && (
            <span className="text-xs opacity-70">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground rounded">
        <Image className="h-6 w-6" />
        <span className="text-xs mt-1">Unknown</span>
      </div>
    );
  };

  return (
    <>
      {/* Hidden file input for uploading media */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={`h-full flex flex-col gap-1 transition-colors relative ${isDragOver ? "bg-accent/30" : ""}`}
        {...dragProps}
      >
        <div className="p-3 pb-2">
          {/* Search and filter controls */}
          <div className="flex gap-2">
            <Select value={mediaFilter} onValueChange={setMediaFilter}>
              <SelectTrigger className="w-[80px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Search media..."
              className="min-w-[60px] flex-1 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={handleFileSelect}
              disabled={isProcessing}
              className="flex-none bg-transparent min-w-[30px] whitespace-nowrap overflow-hidden px-2 justify-center items-center h-9"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0">
          {isDragOver || filteredMediaItems.length === 0 ? (
            <MediaDragOverlay
              isVisible={true}
              isProcessing={isProcessing}
              progress={progress}
              onClick={handleFileSelect}
              isEmptyState={filteredMediaItems.length === 0 && !isDragOver}
            />
          ) : (
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fill, 160px)",
              }}
            >
              {/* Render each media item as a draggable button */}
              {filteredMediaItems.map((item) => (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger>
                    <DraggableMediaItem
                      name={item.name}
                      preview={renderPreview(item)}
                      dragData={{
                        id: item.id,
                        type: item.type,
                        name: item.name,
                      }}
                      showPlusOnDrag={false}
                      onAddToTimeline={(currentTime) =>
                        useTimelineStore
                          .getState()
                          .addMediaAtTime(item, currentTime)
                      }
                      rounded={false}
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>Export clips</ContextMenuItem>
                    <ContextMenuItem
                      variant="destructive"
                      onClick={(e) => handleRemove(e, item.id)}
                    >
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
