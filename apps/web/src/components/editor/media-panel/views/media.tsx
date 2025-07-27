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
import { Loader2, Plus, Upload, FolderOpen } from "lucide-react";
// 导入 React 核心库
import { useCallback, useEffect, useRef, useState } from "react";
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
// 导入模块
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// 导入 DropdownMenu 组件
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// 导入项目模块
import { DraggableMediaItem } from "@/components/ui/draggable-item";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入播放状态管理
import { usePlaybackStore } from "@/stores/playback-store";
// 导入项目模块
import { cn } from "@/lib/utils";


// MediaView 函数
export function MediaView() {
  // 获取媒体存储状态和操作方法
  const { mediaItems, addMediaItem, removeMediaItem, isLoading, isImporting, importProgress } = useMediaStore();
  // 获取当前活动项目
  const { activeProject } = useProjectStore();
  // 获取时间线状态
  const { tracks, addElementToTrack } = useTimelineStore();
  // 获取播放状态
  const { pause } = usePlaybackStore();

  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 本地状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [addedToTimeline, setAddedToTimeline] = useState<Set<string>>(new Set());


  // 处理文件函数 - 需要在 useDragDrop 之前定义
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

  // 拖拽功能
  const { dragProps, isDragOver } = useDragDrop({
    onDrop: processFiles,
  });

  // 检查媒体是否已添加到时间线 - 使用 useCallback 避免无限循环
  const isMediaAddedToTimeline = useCallback((mediaId: string): boolean => {
    return tracks.some(track => 
      track.elements.some(element => 
        element.type === 'media' && element.mediaId === mediaId
      )
    );
  }, [tracks]);

  // 监听媒体添加和删除事件
  useEffect(() => {
    const handleMediaAdded = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { mediaId } = customEvent.detail;
      setAddedToTimeline(prev => new Set([...prev, mediaId]));
    };

    const handleMediaRemoved = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { mediaId } = customEvent.detail;
      setAddedToTimeline(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    };

    window.addEventListener('media-added-to-timeline', handleMediaAdded);
    window.addEventListener('media-removed-from-timeline', handleMediaRemoved);
    return () => {
      window.removeEventListener('media-added-to-timeline', handleMediaAdded);
      window.removeEventListener('media-removed-from-timeline', handleMediaRemoved);
    };
  }, []);

  // 初始化已添加状态
  useEffect(() => {
    const addedItems = new Set<string>();
    mediaItems.forEach(item => {
      if (isMediaAddedToTimeline(item.id)) {
        addedItems.add(item.id);
      }
    });
    setAddedToTimeline(addedItems);
  }, [mediaItems, isMediaAddedToTimeline]);





  // 处理文件选择
  const handleFileSelect = () => fileInputRef.current?.click();

  // 处理文件变化
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(files);
    e.target.value = "";
  };

  // 处理媒体删除
  const handleMediaDelete = async (item: MediaItem) => {
    if (!activeProject) return;
    
    // 暂停播放
    pause();
    
    // 显示确认对话框
    if (confirm(`确定要删除 "${item.name}" 吗？`)) {
      await removeMediaItem(activeProject.id, item.id);
    }
  };

  // 处理媒体预览
  const handleMediaPreview = (item: MediaItem) => {
    // 可以在这里添加预览逻辑
    console.log('Preview media:', item);
  };

  // 格式化持续时间
  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 过滤媒体项目
  const filteredMediaItems = mediaItems.filter((item) => {
    const matchesFilter = mediaFilter === "all" || item.type === mediaFilter;
    return matchesFilter;
  });

  // 渲染预览
  const renderPreview = (item: MediaItem): React.ReactNode => {
    if (item.type === "video") {
      return (
        <div className="w-full h-full relative overflow-hidden">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="w-full h-full object-cover select-none"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex flex-col items-center justify-center text-gray-400">
            </div>
          )}
        </div>
      );
    }

    if (item.type === "image") {
      return (
        <div className="w-full h-full relative overflow-hidden">
          {item.url ? (
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover select-none"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex flex-col items-center justify-center text-gray-400">
            </div>
          )}
        </div>
      );
    }

    if (item.type === "audio") {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex flex-col items-center justify-center text-gray-400">
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gray-800/20 flex flex-col items-center justify-center text-gray-500">
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
        className={`media-panel h-full flex flex-col gap-1 transition-colors relative ${isDragOver ? "bg-accent/30" : ""}`}
        {...dragProps}
      >
        <div className="px-2 pt-2 pb-1">
          {/* Filter controls */}
          <div className="flex gap-1.5 mb-1.5">
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
            
            {/* 统一的导入按钮组 */}
            <div className="flex gap-1">
              {/* 导入下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isProcessing || isImporting}
                    className="flex-none bg-transparent min-w-[30px] whitespace-nowrap overflow-hidden px-2 justify-center items-center h-9"
                  >
                    {isProcessing || isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={handleFileSelect}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    选择文件
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      // 创建一个临时的input来选择文件夹
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.webkitdirectory = true;
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) processFiles(files);
                      };
                      input.click();
                    }}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    选择文件夹
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>



          {/* 只在有媒体文件时显示统计信息，无文件时显示导入提示 */}
          {mediaItems.length > 0 ? (
            <div className="text-xs text-gray-400 mb-1 px-2">
              共 {mediaItems.length} 个媒体文件
              {filteredMediaItems.length !== mediaItems.length && 
                ` (显示 ${filteredMediaItems.length} 个)`
              }
            </div>
          ) : (
            <div className="text-xs text-gray-400 mb-1 px-2">
              <div className="flex items-center gap-1.5">
                <Upload className="h-3 w-3 opacity-60" />
                <span>拖拽文件到此处，或点击 + 按钮导入</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pt-0 pb-2">
          {isDragOver || filteredMediaItems.length === 0 ? (
            <MediaDragOverlay
              isVisible={true}
              isProcessing={isProcessing || isImporting}
              progress={importProgress?.percentage || progress}
              onClick={handleFileSelect}
              isEmptyState={filteredMediaItems.length === 0 && !isDragOver}
            />
          ) : (
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              }}
            >
              {/* Render each media item as a draggable button */}
              {filteredMediaItems.map((item) => (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger>
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => handleMediaPreview(item)}
                    >
                      {/* 媒体卡片容器 */}
                      <div className="relative bg-gray-900/40 rounded-md overflow-hidden transition-colors duration-200 hover:bg-gray-900/60 border border-gray-700/20">
                        {/* 已添加标签 */}
                        {addedToTimeline.has(item.id) && (
                          <div className="absolute left-2 top-2 z-20 text-white text-xs">
                            已添加
                          </div>
                        )}

                        {/* 媒体预览区域 - 16:9比例 */}
                        <div className="bg-gray-800/50 relative">
                          <DraggableMediaItem
                            name={item.name}
                            preview={renderPreview(item)}
                            dragData={{
                              id: item.id,
                              type: item.type,
                              name: item.name,
                              duration: item.duration,
                              width: item.width,
                              height: item.height,
                              fps: item.fps
                            }}
                            onAddToTimeline={(currentTime) => {
                              const { addMediaAtTime } = useTimelineStore.getState();
                              const success = addMediaAtTime(item, currentTime);
                              if (success) {
                                // 手动触发状态更新（以防事件系统有延迟）
                                setAddedToTimeline(prev => new Set([...prev, item.id]));
                              }
                            }}
                            onClick={() => handleMediaPreview(item)}
                            className="w-full"
                            aspectRatio={16/9}
                            rounded={false}
                            showLabel={false}
                            showPlusOnDrag={false}
                          />
                          
                          {/* 时长显示 - 左下角 */}
                          {item.duration && (
                            <div className="absolute bottom-1 left-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono z-10">
                              {formatDuration(item.duration)}
                            </div>
                          )}
                        </div>

                        {/* 文件名 - 底部固定显示 */}
                        <div className="p-2 bg-gray-900/60">
                          <div className="text-white text-xs font-medium truncate">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleMediaPreview(item)}>
                      预览
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleMediaDelete(item)}>
                      删除
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
