// timeline-element.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/timeline/timeline-element.tsx
// 最后更新: 2025/7/23

// timeline-element.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useState, useRef, useEffect } from "react";
// 导入本地模块
import { Button } from "../../ui/button";
// 导入模块
import {
  MoreVertical,
  Scissors,
  Trash2,
  SplitSquareHorizontal,
  Music,
  ChevronRight,
  ChevronLeft,
  Type,
  Copy,
  RefreshCw,
  Bot,
} from "lucide-react";
// 导入项目模块
import { useMediaStore } from "@/stores/media-store";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";
// 导入本地模块
import AudioWaveform from "../audio-waveform";
// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入项目模块
import { TimelineElementProps, TrackType, MediaElement } from "@/types/timeline";
// 导入项目模块
import { useTimelineElementResize } from "@/hooks/use-timeline-element-resize";
// 导入模块
import {
  getTrackElementClasses,
  TIMELINE_CONSTANTS,
  getTrackHeight,
} from "@/constants/timeline-constants";
// 导入模块
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../../ui/dropdown-menu";
// 导入模块
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../ui/context-menu";
import { TransitionElementComponent } from "./transition-element";

// 视频缩略图平铺组件
const VideoThumbnailTiles = ({ videoUrl, tileWidth, tileHeight }: {
  videoUrl: string;
  tileWidth: number;
  tileHeight: number;
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log(`🎬 VideoThumbnailTiles 开始处理:`, { videoUrl, tileWidth, tileHeight });

    if (!videoUrl) {
      console.warn('❌ videoUrl为空');
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.warn('❌ video元素不存在');
      return;
    }

    const generateThumbnail = () => {
      console.log('🎨 开始生成缩略图...');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('❌ 无法创建canvas上下文');
        return;
      }

      canvas.width = tileWidth;
      canvas.height = tileHeight;

      console.log(`📐 Canvas尺寸: ${canvas.width}x${canvas.height}`);
      console.log(`📺 Video尺寸: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`⏰ Video当前时间: ${video.currentTime}`);

      // 绘制视频帧
      try {
        ctx.drawImage(video, 0, 0, tileWidth, tileHeight);
      } catch (error) {
        console.error('❌ Canvas drawImage失败 (可能是CORS问题):', error);
        // 回退：直接使用视频URL
        setThumbnailUrl(videoUrl);
        return;
      }

      // 转换为blob URL
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setThumbnailUrl(url);
            console.log(`✅ 生成视频缩略图成功:`, url);
          } else {
            console.error('❌ 无法生成blob');
            // 回退：直接使用视频URL
            setThumbnailUrl(videoUrl);
          }
        }, 'image/jpeg', 0.7);
      } catch (error) {
        console.error('❌ Canvas toBlob失败 (可能是CORS问题):', error);
        // 回退：直接使用视频URL
        setThumbnailUrl(videoUrl);
      }
    };

    const handleLoadedData = () => {
      console.log('📺 视频数据加载完成');
      video.currentTime = 0.1; // 跳到0.1秒
    };

    const handleSeeked = () => {
      console.log('⏰ 视频跳转完成，当前时间:', video.currentTime);
      generateThumbnail();
    };

    const handleError = (e: any) => {
      console.error(`❌ 视频加载失败:`, videoUrl, e);
    };

    const handleLoadStart = () => {
      console.log('🔄 开始加载视频:', videoUrl);
    };

    const handleCanPlay = () => {
      console.log('▶️ 视频可以播放');
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    video.src = videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoUrl, tileWidth, tileHeight]);

  return (
    <>
      {/* 隐藏的视频元素用于生成缩略图 */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        muted
        playsInline
        preload="metadata"
      />

      {/* 缩略图背景 */}
      {thumbnailUrl ? (
        <div
          className="absolute top-3 bottom-3 left-0 right-0"
          style={{
            backgroundImage: `url(${thumbnailUrl})`,
            backgroundRepeat: "repeat-x",
            backgroundSize: `${tileWidth}px ${tileHeight}px`,
            backgroundPosition: "left center",
            pointerEvents: "none",
          }}
          aria-label="Video thumbnail tiles"
        />
      ) : (
        // 回退方案：显示视频文件名和类型图标
        <div className="absolute top-3 bottom-3 left-0 right-0 flex items-center justify-center bg-gray-700/50">
          <div className="text-xs text-white/70 text-center px-2">
            <div className="mb-1">🎬</div>
            <div className="truncate">{videoUrl.split('/').pop()?.split('.')[0] || 'Video'}</div>
          </div>
        </div>
      )}
    </>
  );
};

// TimelineElement 函数
// 导出组件 - 可复用的 UI 组件
export function TimelineElement({
  element,
  track,
  zoomLevel,
  isSelected,
  onElementMouseDown,
  onElementClick,
}: TimelineElementProps) {
// 常量定义 - 模块内部使用的固定值
  const { mediaItems } = useMediaStore();
// 常量定义 - 模块内部使用的固定值
  const {
    updateElementTrim,
    updateElementDuration,
    removeElementFromTrack,
    removeElementFromTrackWithRipple,
    dragState,
    splitElement,
    splitAndKeepLeft,
    splitAndKeepRight,
    separateAudio,
    addElementToTrack,
    replaceElementMedia,
    rippleEditingEnabled,
  } = useTimelineStore();
// 常量定义 - 模块内部使用的固定值
  const { currentTime } = usePlaybackStore();

// 状态管理 - 创建和管理组件内部状态
  const [elementMenuOpen, setElementMenuOpen] = useState(false);

// 常量定义 - 模块内部使用的固定值
  const {
    resizing,
    isResizing,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  } = useTimelineElementResize({
    element,
    track,
    zoomLevel,
    onUpdateTrim: updateElementTrim,
    onUpdateDuration: updateElementDuration,
  });

// 常量定义 - 模块内部使用的固定值
  const effectiveDuration =
    element.duration - element.trimStart - element.trimEnd;
// 常量定义 - 模块内部使用的固定值
  const elementWidth = Math.max(
    TIMELINE_CONSTANTS.ELEMENT_MIN_WIDTH,
    effectiveDuration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel
  );

  // Use real-time position during drag, otherwise use stored position
  const isBeingDragged = dragState.elementId === element.id;
// 常量定义 - 模块内部使用的固定值
  const elementStartTime =
    isBeingDragged && dragState.isDragging
      ? dragState.currentTime
      : element.startTime;

  // Element should always be positioned at startTime - trimStart only affects content, not position
  const elementLeft = elementStartTime * 50 * zoomLevel;

// handleElementSplitContext 函数
  const handleElementSplitContext = () => {
// 常量定义 - 模块内部使用的固定值
    const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
    const effectiveEnd =
      element.startTime +
      (element.duration - element.trimStart - element.trimEnd);

    if (currentTime > effectiveStart && currentTime < effectiveEnd) {
// 常量定义 - 模块内部使用的固定值
      const secondElementId = splitElement(track.id, element.id, currentTime);
      if (!secondElementId) {
        toast.error("Failed to split element");
      }
    } else {
      toast.error("Playhead must be within element to split");
    }
  };

// handleElementDuplicateContext 函数
  const handleElementDuplicateContext = () => {
// 常量定义 - 模块内部使用的固定值
    const { id, ...elementWithoutId } = element;
    addElementToTrack(track.id, {
      ...elementWithoutId,
      name: element.name + " (copy)",
      startTime:
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd) +
        0.1,
    });
  };

// handleElementDeleteContext 函数
  const handleElementDeleteContext = () => {
    if (rippleEditingEnabled) {
      removeElementFromTrackWithRipple(track.id, element.id);
    } else {
      removeElementFromTrack(track.id, element.id);
    }
  };

// handleReplaceClip 函数
  const handleReplaceClip = () => {
    if (element.type !== "media") {
      toast.error("Replace is only available for media clips");
      return;
    }

    // Create a file input to select replacement media
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*,audio/*,image/*";
    input.onchange = async (e) => {
// file 函数
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
// 常量定义 - 模块内部使用的固定值
        const success = await replaceElementMedia(track.id, element.id, file);
        if (success) {
          toast.success("Clip replaced successfully");
        } else {
          toast.error("Failed to replace clip");
        }
      } catch (error) {
        toast.error("Failed to replace clip");
        console.log(
          JSON.stringify({ error: "Failed to replace clip", details: error })
        );
      }
    };
    input.click();
  };

// renderElementContent 函数
  const renderElementContent = () => {
    if (element.type === "text") {
      return (
        <div className="w-full h-full flex items-center justify-start pl-2">
          <span className="text-xs text-foreground/80 truncate">
            {element.content}
          </span>
        </div>
      );
    }

    if (element.type === "transition") {
      return <TransitionElementComponent
        element={element}
        isSelected={isSelected}
        zoomLevel={zoomLevel}
        onMouseDown={onElementMouseDown}
        onClick={onElementClick}
      />;
    }

    // Render media element ->
    // 优先使用媒体文件副本，如果不存在则回退到媒体库中的文件
    const mediaItem = mediaItems.find((item) => item.id === element.mediaId);
    const elementMedia = element as MediaElement;
    
    // 使用媒体文件副本或回退到媒体库中的文件
    const mediaUrl = elementMedia.mediaUrl || mediaItem?.url;
    const thumbnailUrl = elementMedia.thumbnailUrl || mediaItem?.thumbnailUrl;
    const mediaType = elementMedia.mediaType || mediaItem?.type;
    const mediaWidth = elementMedia.mediaWidth || mediaItem?.width;
    const mediaHeight = elementMedia.mediaHeight || mediaItem?.height;
    
    if (!mediaUrl && !thumbnailUrl && !mediaItem) {
      return (
        <span className="text-xs text-foreground/80 truncate">
          {element.name} (媒体文件已删除)
        </span>
      );
    }

    const TILE_ASPECT_RATIO = 16 / 9;

    if (mediaType === "image") {
      // Calculate tile size based on 16:9 aspect ratio
      const trackHeight = getTrackHeight(track.type);
      const tileHeight = trackHeight - 8; // Account for padding
      const tileWidth = tileHeight * TILE_ASPECT_RATIO;

      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-[#004D52] py-3 w-full h-full relative">
            {/* Background with tiled images */}
            <div
              className="absolute top-3 bottom-3 left-0 right-0"
              style={{
                backgroundImage: mediaUrl
                  ? `url(${mediaUrl})`
                  : "none",
                backgroundRepeat: "repeat-x",
                backgroundSize: `${tileWidth}px ${tileHeight}px`,
                backgroundPosition: "left center",
                pointerEvents: "none",
              }}
              aria-label={`Tiled background of ${element.name}`}
            />
            {/* Overlay with vertical borders */}
            <div
              className="absolute top-3 bottom-3 left-0 right-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  to right,
                  transparent 0px,
                  transparent ${tileWidth - 1}px,
                  rgba(255, 255, 255, 0.6) ${tileWidth - 1}px,
                  rgba(255, 255, 255, 0.6) ${tileWidth}px
                )`,
                backgroundPosition: "left center",
              }}
            />
          </div>
        </div>
      );
    }

    const VIDEO_TILE_PADDING = 16;
    const OVERLAY_SPACE_MULTIPLIER = 1.5;

    if (mediaType === "video") {
      const trackHeight = getTrackHeight(track.type);
      const tileHeight = trackHeight - 8; // Match image padding
      const tileWidth = tileHeight * TILE_ASPECT_RATIO;

      // 判断是否为远程URL（AI剪辑）
      const isRemoteUrl = mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'));
      // 判断是否为blob URL（本地文件）
      const isBlobUrl = mediaUrl && mediaUrl.startsWith('blob:');

      // 调试信息
      console.log(`🎬 时间轴元素 ${element.name}:`, {
        mediaType,
        thumbnailUrl,
        mediaUrl,
        isRemoteUrl,
        isBlobUrl,
        tileWidth,
        tileHeight,
        elementMedia: {
          mediaUrl: elementMedia.mediaUrl,
          thumbnailUrl: elementMedia.thumbnailUrl,
          mediaType: elementMedia.mediaType
        },
        mediaItem: mediaItem ? {
          url: mediaItem.url,
          thumbnailUrl: mediaItem.thumbnailUrl,
          type: mediaItem.type
        } : null
      });

      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-[#004D52] py-3 w-full h-full relative">
            {/* 根据不同情况选择显示策略 */}
            {isRemoteUrl ? (
              // 远程URL（AI剪辑）：直接显示视频元素
              <div className="absolute top-3 bottom-3 left-0 right-0 overflow-hidden">
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover opacity-60"
                  muted
                  playsInline
                  preload="metadata"
                  style={{
                    filter: 'brightness(0.8)',
                  }}
                  onLoadedData={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.currentTime = 0.1;
                    console.log('🎬 远程视频加载成功:', mediaUrl);
                  }}
                  onError={(e) => {
                    console.error('❌ 远程视频加载失败:', mediaUrl);
                  }}
                />
              </div>
            ) : thumbnailUrl && (thumbnailUrl.startsWith('data:') || thumbnailUrl.startsWith('blob:')) ? (
              // 本地文件且有有效缩略图：使用缩略图平铺
              <div
                className="absolute top-3 bottom-3 left-0 right-0"
                style={{
                  backgroundImage: `url(${thumbnailUrl})`,
                  backgroundRepeat: "repeat-x",
                  backgroundSize: `${tileWidth}px ${tileHeight}px`,
                  backgroundPosition: "left center",
                  pointerEvents: "none",
                }}
                aria-label="Video thumbnail tiles"
              />
            ) : (
              // 本地文件但无有效缩略图：尝试生成缩略图或显示视频
              isBlobUrl ? (
                <VideoThumbnailTiles
                  videoUrl={mediaUrl}
                  tileWidth={tileWidth}
                  tileHeight={tileHeight}
                />
              ) : (
                // 回退方案：显示文件名
                <div className="absolute top-3 bottom-3 left-0 right-0 flex items-center justify-center bg-gray-700/50">
                  <div className="text-xs text-white/70 text-center px-2">
                    <div className="mb-1">🎬</div>
                    <div className="truncate">{element.name}</div>
                  </div>
                </div>
              )
            )}

            {/* Overlay with vertical borders */}
            <div
              className="absolute top-3 bottom-3 left-0 right-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  to right,
                  transparent 0px,
                  transparent ${tileWidth - 1}px,
                  rgba(255, 255, 255, 0.6) ${tileWidth - 1}px,
                  rgba(255, 255, 255, 0.6) ${tileWidth}px
                )`,
                backgroundPosition: "left center",
              }}
            />
            {/* AI剪辑标识 */}
            {(element.name.includes("AI剪辑") || element.name.includes("v1_clip")) && (
              <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded z-10">
                AI
              </div>
            )}
          </div>
        </div>
      );
    }

    // Render audio element ->
    if (mediaType === "audio") {
      return (
        <div className="w-full h-full flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <AudioWaveform
              audioUrl={mediaUrl || ""}
              height={24}
              className="w-full"
            />
          </div>
        </div>
      );
    }

    // 检查是否为AI剪辑生成的元素
    const isAIGenerated = element.name.includes("AI剪辑") || element.name.includes("v1_clip");

    return (
      <div className="flex items-center gap-1 text-xs text-foreground/80 truncate">
        {isAIGenerated && (
          <Bot className="w-3 h-3 text-green-500 flex-shrink-0" />
        )}
        <span className="truncate">{element.name}</span>
      </div>
    );
  };

// handleElementMouseDown 自定义钩子
  const handleElementMouseDown = (e: React.MouseEvent) => {
    if (onElementMouseDown) {
      onElementMouseDown(e, element);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`absolute top-0 h-full select-none timeline-element ${
            isBeingDragged ? "z-50" : "z-10"
          }`}
          style={{
            left: `${elementLeft}px`,
            width: `${elementWidth}px`,
          }}
          data-element-id={element.id}
          data-track-id={track.id}
          onMouseMove={resizing ? handleResizeMove : undefined}
          onMouseUp={resizing ? handleResizeEnd : undefined}
          onMouseLeave={resizing ? handleResizeEnd : undefined}
        >
          <div
            className={`relative h-full rounded-[0.15rem] cursor-pointer overflow-hidden ${getTrackElementClasses(
              track.type
            )} ${isSelected ? "border-b-[0.5px] border-t-[0.5px] border-foreground" : ""} ${
              isBeingDragged ? "z-50" : "z-10"
            } ${
              element.name.includes("AI剪辑") || element.name.includes("v1_clip")
                ? "border-l-2 border-l-green-500"
                : ""
            }`}
            onClick={(e) => onElementClick && onElementClick(e, element)}
            onMouseDown={handleElementMouseDown}
            onContextMenu={(e) =>
              onElementMouseDown && onElementMouseDown(e, element)
            }
          >
            <div className="absolute inset-0 flex items-center h-full">
              {renderElementContent()}
            </div>

            {isSelected && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-w-resize bg-foreground z-50"
                  onMouseDown={(e) => handleResizeStart(e, element.id, "left")}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-e-resize bg-foreground z-50"
                  onMouseDown={(e) => handleResizeStart(e, element.id, "right")}
                />
              </>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleElementSplitContext}>
          <Scissors className="h-4 w-4 mr-2" />
          Split at playhead
        </ContextMenuItem>
        <ContextMenuItem onClick={handleElementDuplicateContext}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate {element.type === "text" ? "text" : "clip"}
        </ContextMenuItem>
        {element.type === "media" && (
          <ContextMenuItem onClick={handleReplaceClip}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Replace clip
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={handleElementDeleteContext}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete {element.type === "text" ? "text" : "clip"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
