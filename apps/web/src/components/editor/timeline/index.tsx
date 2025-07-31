// index.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/timeline/index.tsx
// 最后更新: 2025/7/23

// index.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入滚动区域组件，用于时间线的滚动容器
import { ScrollArea } from "../../ui/scroll-area";
// 导入按钮组件，用于工具栏操作
import { Button } from "../../ui/button";
// 导入各种图标，用于工具栏和轨道标识
import {
  Scissors, // 剪刀图标 - 分割功能
  ArrowLeftToLine, // 左对齐图标 - 对齐功能
  ArrowRightToLine, // 右对齐图标 - 对齐功能
  Trash2, // 垃圾桶图标 - 删除功能
  Snowflake, // 雪花图标 - 冻结功能
  Copy, // 复制图标 - 复制功能
  SplitSquareHorizontal, // 分割图标 - 分割功能
  Pause, // 暂停图标 - 播放控制
  Play, // 播放图标 - 播放控制
  Video, // 视频图标 - 视频轨道标识
  Music, // 音乐图标 - 音频轨道标识
  TypeIcon, // 文本图标 - 文本轨道标识
  Magnet, // 磁铁图标 - 吸附功能
  Link, // 链接图标 - 链接功能
  ZoomIn, // 放大图标 - 缩放功能
  ZoomOut, // 缩小图标 - 缩放功能
} from "lucide-react";
// 导入工具提示组件，用于显示操作提示
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../../ui/tooltip";
// 导入右键菜单组件，用于上下文菜单
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui/context-menu";
// 导入状态管理钩子
import { useTimelineStore } from "@/stores/timeline-store"; // 时间线状态
// 导入项目模块
import { useMediaStore } from "@/stores/media-store"; // 媒体状态
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store"; // 播放状态
// 导入项目模块
import { useProjectStore } from "@/stores/project-store"; // 项目状态
// 导入自定义钩子
import { useTimelineZoom } from "@/hooks/use-timeline-zoom"; // 时间线缩放
// 导入工具函数
import { processMediaFiles } from "@/lib/media-processing"; // 媒体文件处理
// 导入 Sonner 通知组件
import { toast } from "sonner"; // 通知提示
// 导入 React 钩子
import { useState, useRef, useEffect, useCallback } from "react";
// 导入子组件
import { TimelineTrackContent } from "./timeline-track"; // 轨道内容组件
// 导入模块
import {
  TimelinePlayhead, // 播放头组件
  useTimelinePlayheadRuler, // 播放头标尺钩子
} from "./timeline-playhead";
// 导入本地模块
import { SelectionBox } from "../selection-box"; // 选择框组件
// 导入项目模块
import { useSelectionBox } from "@/hooks/use-selection-box"; // 选择框钩子
// 导入本地模块
import { SnapIndicator } from "../snap-indicator"; // 吸附指示器
// 导入项目模块
import { SnapPoint } from "@/hooks/use-timeline-snapping"; // 吸附点类型
// 导入类型定义
import type { DragData, TimelineTrack } from "@/types/timeline";
// 导入常量
import {
  getTrackHeight, // 获取轨道高度
  getCumulativeHeightBefore, // 获取累积高度
  getTotalTracksHeight, // 获取总轨道高度
  TIMELINE_CONSTANTS, // 时间线常量
  snapTimeToFrame, // 时间吸附到帧
} from "@/constants/timeline-constants";
// 导入滑块组件，用于缩放控制
import { Slider } from "@/components/ui/slider";
// 导入自定义图标
import { CustomFlipHorizontal } from "@/components/ui/icons";

// 时间线组件 - 显示所有轨道（视频、音频、特效）及其元素
// 用户可以拖拽媒体文件到这里添加到项目中
// 元素可以被裁剪、删除和移动
// 导出组件 - 可复用的 UI 组件
export function Timeline() {
  // 从时间线状态获取数据和方法
  const {
    tracks, // 轨道列表
    getTotalDuration, // 获取总时长
    clearSelectedElements, // 清除选中元素
    snappingEnabled, // 吸附功能是否启用
    setSelectedElements, // 设置选中元素
    toggleTrackMute, // 切换轨道静音
    dragState, // 拖拽状态
  } = useTimelineStore();
  
  // 从媒体状态获取数据和方法
  const { mediaItems, addMediaItem } = useMediaStore();
  
  // 从项目状态获取当前项目
  const { activeProject } = useProjectStore();
  
  // 从播放状态获取播放控制数据和方法
  const { currentTime, duration, seek, setDuration, isPlaying, toggle } =
    usePlaybackStore();
  
  // 本地状态管理
  const [isDragOver, setIsDragOver] = useState(false); // 是否正在拖拽
// 状态管理 - 创建和管理组件内部状态
  const [isProcessing, setIsProcessing] = useState(false); // 是否正在处理文件
// 状态管理 - 创建和管理组件内部状态
  const [progress, setProgress] = useState(0); // 处理进度
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const dragCounterRef = useRef(0); // 拖拽计数器引用
// 常量定义 - 模块内部使用的固定值
  const timelineRef = useRef<HTMLDivElement>(null); // 时间线容器引用
// 常量定义 - 模块内部使用的固定值
  const rulerRef = useRef<HTMLDivElement>(null); // 标尺引用
// 状态管理 - 创建和管理组件内部状态
  const [isInTimeline, setIsInTimeline] = useState(false); // 是否在时间线区域内

  // 鼠标跟踪引用 - 用于区分点击和拖拽/调整大小操作
  const mouseTrackingRef = useRef({
    isMouseDown: false, // 鼠标是否按下
    downX: 0, // 按下时的X坐标
    downY: 0, // 按下时的Y坐标
    downTime: 0, // 按下的时间戳
  });

  // 时间线缩放功能
  const { zoomLevel, setZoomLevel, handleWheel } = useTimelineZoom({
    containerRef: timelineRef,
    isInTimeline,
  });

  // Old marquee selection removed - using new SelectionBox component instead

  // Dynamic timeline width calculation based on playhead position and duration
  const dynamicTimelineWidth = Math.max(
    (duration || 0) * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel, // Base width from duration
    (currentTime + 30) * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel, // Width to show current time + 30 seconds buffer
    timelineRef.current?.clientWidth || 1000 // Minimum width
  );

  // Scroll synchronization and auto-scroll to playhead
  const rulerScrollRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const tracksScrollRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const trackLabelsRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const playheadRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const trackLabelsScrollRef = useRef<HTMLDivElement>(null);
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const isUpdatingRef = useRef(false);
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const lastRulerSync = useRef(0);
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const lastTracksSync = useRef(0);
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const lastVerticalSync = useRef(0);

  // Timeline playhead ruler handlers
  const { handleRulerMouseDown } = useTimelinePlayheadRuler({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
  });

  // Selection box functionality
  const tracksContainerRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const {
    selectionBox,
    handleMouseDown: handleSelectionMouseDown,
    isSelecting,
    justFinishedSelecting,
  } = useSelectionBox({
    containerRef: tracksContainerRef,
    playheadRef,
    onSelectionComplete: (elements) => {
      console.log(JSON.stringify({ onSelectionComplete: elements.length }));
      setSelectedElements(elements);
    },
  });

  // Calculate snap indicator state
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint | null>(
    null
  );
// 常量定义 - 模块内部使用的固定值
  const showSnapIndicator =
    dragState.isDragging && snappingEnabled && currentSnapPoint !== null;

  // Callback to handle snap point changes from TimelineTrackContent
  const handleSnapPointChange = useCallback((snapPoint: SnapPoint | null) => {
    setCurrentSnapPoint(snapPoint);
  }, []);

  // Track mouse down to distinguish real clicks from drag/resize ends
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    // Only track mouse down on timeline background areas (not elements)
    const target = e.target as HTMLElement;
// 常量定义 - 模块内部使用的固定值
    const isTimelineBackground =
      !target.closest(".timeline-element") &&
      !playheadRef.current?.contains(target) &&
      !target.closest("[data-track-labels]");

    if (isTimelineBackground) {
      mouseTrackingRef.current = {
        isMouseDown: true,
        downX: e.clientX,
        downY: e.clientY,
        downTime: e.timeStamp,
      };
    }
  }, []);

  // Timeline content click to seek handler
  const handleTimelineContentClick = useCallback(
    (e: React.MouseEvent) => {
// 常量定义 - 模块内部使用的固定值
      const { isMouseDown, downX, downY, downTime } = mouseTrackingRef.current;

      // Reset mouse tracking
      mouseTrackingRef.current = {
        isMouseDown: false,
        downX: 0,
        downY: 0,
        downTime: 0,
      };

      // Only process as click if we tracked a mouse down on timeline background
      if (!isMouseDown) {
        console.log(
          JSON.stringify({
            ignoredClickWithoutMouseDown: true,
            timeStamp: e.timeStamp,
          })
        );
        return;
      }

      // Check if mouse moved significantly (indicates drag, not click)
      const deltaX = Math.abs(e.clientX - downX);
// 常量定义 - 模块内部使用的固定值
      const deltaY = Math.abs(e.clientY - downY);
// 常量定义 - 模块内部使用的固定值
      const deltaTime = e.timeStamp - downTime;

      if (deltaX > 5 || deltaY > 5 || deltaTime > 500) {
        console.log(
          JSON.stringify({
            ignoredDragNotClick: true,
            deltaX,
            deltaY,
            deltaTime,
            timeStamp: e.timeStamp,
          })
        );
        return;
      }

      // Don't seek if this was a selection box operation
      if (isSelecting || justFinishedSelecting) {
        return;
      }

      // Don't seek if clicking on timeline elements, but still deselect
      if ((e.target as HTMLElement).closest(".timeline-element")) {
        return;
      }

      // Don't seek if clicking on playhead
      if (playheadRef.current?.contains(e.target as Node)) {
        return;
      }

      // Don't seek if clicking on track labels
      if ((e.target as HTMLElement).closest("[data-track-labels]")) {
        clearSelectedElements();
        return;
      }

      // Clear selected elements when clicking empty timeline area
      console.log(JSON.stringify({ clearingSelectedElements: true }));
      clearSelectedElements();

      // Determine if we're clicking in ruler or tracks area
      const isRulerClick = (e.target as HTMLElement).closest(
        "[data-ruler-area]"
      );

      let mouseX: number;
      let scrollLeft = 0;

      if (isRulerClick) {
        // Calculate based on ruler position
        const rulerContent = rulerScrollRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLElement;
        if (!rulerContent) return;
// 常量定义 - 模块内部使用的固定值
        const rect = rulerContent.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        scrollLeft = rulerContent.scrollLeft;
      } else {
        // Calculate based on tracks content position
        const tracksContent = tracksScrollRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLElement;
        if (!tracksContent) return;
// 常量定义 - 模块内部使用的固定值
        const rect = tracksContent.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        scrollLeft = tracksContent.scrollLeft;
      }

// 常量定义 - 模块内部使用的固定值
      const rawTime = Math.max(
        0,
        Math.min(
          duration,
          (mouseX + scrollLeft) /
          (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel)
        )
      );

      // Use frame snapping for timeline clicking
      const projectFps = activeProject?.fps || 30;
// 常量定义 - 模块内部使用的固定值
      const time = snapTimeToFrame(rawTime, projectFps);

      seek(time);
    },
    [
      duration,
      zoomLevel,
      seek,
      rulerScrollRef,
      tracksScrollRef,
      clearSelectedElements,
      isSelecting,
      justFinishedSelecting,
    ]
  );

  // Update timeline duration when tracks change
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const totalDuration = getTotalDuration();
    setDuration(Math.max(totalDuration, 10)); // Minimum 10 seconds for empty timeline
  }, [tracks, setDuration, getTotalDuration]);

  // Old marquee system removed - using new SelectionBox component instead

// handleDragEnter 函数
  const handleDragEnter = (e: React.DragEvent) => {
    // When something is dragged over the timeline, show overlay
    e.preventDefault();
    // Don't show overlay for timeline elements - they're handled by tracks
    if (e.dataTransfer.types.includes("application/x-timeline-element")) {
      return;
    }
    dragCounterRef.current += 1;
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

// handleDragOver 函数
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

// handleDragLeave 函数
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();

    // Don't update state for timeline elements - they're handled by tracks
    if (e.dataTransfer.types.includes("application/x-timeline-element")) {
      return;
    }

    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

// 常量定义 - 模块内部使用的固定值
  const handleDrop = async (e: React.DragEvent) => {
    // When media is dropped, add it as a new track/element
    e.preventDefault();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    // Ignore timeline element drags - they're handled by track-specific handlers
    const hasTimelineElement = e.dataTransfer.types.includes(
      "application/x-timeline-element"
    );
    if (hasTimelineElement) {
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const itemData = e.dataTransfer.getData("application/x-media-item");
    if (itemData) {
      try {
// 常量定义 - 模块内部使用的固定值
        const dragData: DragData = JSON.parse(itemData);

        if (dragData.type === "text") {
          // Always create new text track to avoid overlaps
          useTimelineStore.getState().addTextToNewTrack(dragData);
        } else {
          // Handle media items
          const mediaItem = mediaItems.find(
            (item: any) => item.id === dragData.id
          );
          if (!mediaItem) {
            toast.error("Media item not found");
            return;
          }

          useTimelineStore.getState().addMediaToNewTrack(mediaItem);
        }
      } catch (error) {
        console.error("Error parsing dropped item data:", error);
        toast.error("Failed to add item to timeline");
      }
    } else if (e.dataTransfer.files?.length > 0) {
      // Handle file drops by creating new tracks
      if (!activeProject) {
        toast.error("No active project");
        return;
      }

      setIsProcessing(true);
      setProgress(0);
      try {
// 常量定义 - 模块内部使用的固定值
        const processedItems = await processMediaFiles(
          e.dataTransfer.files,
          (p) => setProgress(p)
        );
        for (const processedItem of processedItems) {
          await addMediaItem(activeProject.id, processedItem);
// 常量定义 - 模块内部使用的固定值
          const currentMediaItems = useMediaStore.getState().mediaItems;
// 常量定义 - 模块内部使用的固定值
          const addedItem = currentMediaItems.find(
            (item) =>
              item.name === processedItem.name && item.url === processedItem.url
          );
          if (addedItem) {
            useTimelineStore.getState().addMediaToNewTrack(addedItem);
          }
        }
      } catch (error) {
        // Show error if file processing fails
        console.error("Error processing external files:", error);
        toast.error("Failed to process dropped files");
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    }
  };

// 常量定义 - 模块内部使用的固定值
  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  // --- Scroll synchronization effect ---
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const rulerViewport = rulerScrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
// 常量定义 - 模块内部使用的固定值
    const tracksViewport = tracksScrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
// 常量定义 - 模块内部使用的固定值
    const trackLabelsViewport = trackLabelsScrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    if (!rulerViewport || !tracksViewport) return;

    // Horizontal scroll synchronization between ruler and tracks
    const handleRulerScroll = () => {
// 常量定义 - 模块内部使用的固定值
      const now = Date.now();
      if (isUpdatingRef.current || now - lastRulerSync.current < 16) return;
      lastRulerSync.current = now;
      isUpdatingRef.current = true;
      tracksViewport.scrollLeft = rulerViewport.scrollLeft;
      isUpdatingRef.current = false;
    };
// handleTracksScroll 函数
    const handleTracksScroll = () => {
// 常量定义 - 模块内部使用的固定值
      const now = Date.now();
      if (isUpdatingRef.current || now - lastTracksSync.current < 16) return;
      lastTracksSync.current = now;
      isUpdatingRef.current = true;
      rulerViewport.scrollLeft = tracksViewport.scrollLeft;
      isUpdatingRef.current = false;
    };

    rulerViewport.addEventListener("scroll", handleRulerScroll);
    tracksViewport.addEventListener("scroll", handleTracksScroll);

    // Vertical scroll synchronization between track labels and tracks content
    if (trackLabelsViewport) {
// handleTrackLabelsScroll 函数
      const handleTrackLabelsScroll = () => {
// 常量定义 - 模块内部使用的固定值
        const now = Date.now();
        if (isUpdatingRef.current || now - lastVerticalSync.current < 16)
          return;
        lastVerticalSync.current = now;
        isUpdatingRef.current = true;
        tracksViewport.scrollTop = trackLabelsViewport.scrollTop;
        isUpdatingRef.current = false;
      };
// handleTracksVerticalScroll 函数
      const handleTracksVerticalScroll = () => {
// 常量定义 - 模块内部使用的固定值
        const now = Date.now();
        if (isUpdatingRef.current || now - lastVerticalSync.current < 16)
          return;
        lastVerticalSync.current = now;
        isUpdatingRef.current = true;
        trackLabelsViewport.scrollTop = tracksViewport.scrollTop;
        isUpdatingRef.current = false;
      };

      trackLabelsViewport.addEventListener("scroll", handleTrackLabelsScroll);
      tracksViewport.addEventListener("scroll", handleTracksVerticalScroll);

      return () => {
        rulerViewport.removeEventListener("scroll", handleRulerScroll);
        tracksViewport.removeEventListener("scroll", handleTracksScroll);
        trackLabelsViewport.removeEventListener(
          "scroll",
          handleTrackLabelsScroll
        );
        tracksViewport.removeEventListener(
          "scroll",
          handleTracksVerticalScroll
        );
      };
    }

    return () => {
      rulerViewport.removeEventListener("scroll", handleRulerScroll);
      tracksViewport.removeEventListener("scroll", handleTracksScroll);
    };
  }, []);

  return (
    <div
      className={`h-full flex flex-col transition-colors duration-200 relative bg-panel rounded-sm overflow-hidden`}
      {...dragProps}
      onMouseEnter={() => setIsInTimeline(true)}
      onMouseLeave={() => setIsInTimeline(false)}
    >
      <TimelineToolbar zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />

      {/* Timeline Container */}
      <div
        className="flex-1 flex flex-col overflow-hidden relative"
        ref={timelineRef}
      >
        <TimelinePlayhead
          currentTime={currentTime}
          duration={duration}
          zoomLevel={zoomLevel}
          tracks={tracks}
          seek={seek}
          rulerRef={rulerRef}
          rulerScrollRef={rulerScrollRef}
          tracksScrollRef={tracksScrollRef}
          trackLabelsRef={trackLabelsRef}
          timelineRef={timelineRef}
          playheadRef={playheadRef}
          isSnappingToPlayhead={
            showSnapIndicator && currentSnapPoint?.type === "playhead"
          }
        />
        <SnapIndicator
          snapPoint={currentSnapPoint}
          zoomLevel={zoomLevel}
          tracks={tracks}
          timelineRef={timelineRef}
          trackLabelsRef={trackLabelsRef}
          isVisible={showSnapIndicator}
        />
        {/* Timeline Header with Ruler */}
        <div className="flex bg-panel sticky top-0 z-10">
          {/* Track Labels Header */}
          <div className="w-48 flex-shrink-0 bg-muted/30 border-r flex items-center justify-between px-3 py-2">
            {/* Empty space */}
            <span className="text-sm font-medium text-muted-foreground opacity-0">
              .
            </span>
          </div>

          {/* Timeline Ruler */}
          <div
            className="flex-1 relative overflow-hidden h-4"
            onWheel={(e) => {
              // Check if this is horizontal scrolling - if so, don't handle it here
              if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                return; // Let ScrollArea handle horizontal scrolling
              }
              handleWheel(e);
            }}
            onMouseDown={handleSelectionMouseDown}
            onClick={handleTimelineContentClick}
            data-ruler-area
          >
            <ScrollArea className="w-full" ref={rulerScrollRef}>
              <div
                ref={rulerRef}
                className="relative h-4 select-none cursor-default"
                style={{
                  width: `${dynamicTimelineWidth}px`,
                }}
                onMouseDown={handleRulerMouseDown}
              >
                {/* Time markers */}
                {(() => {
                  // Calculate appropriate time interval based on zoom level
                  const getTimeInterval = (zoom: number) => {
// 常量定义 - 模块内部使用的固定值
                    const pixelsPerSecond =
                      TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoom;
                    if (pixelsPerSecond >= 200) return 0.1; // Every 0.1s when very zoomed in
                    if (pixelsPerSecond >= 100) return 0.5; // Every 0.5s when zoomed in
                    if (pixelsPerSecond >= 50) return 1; // Every 1s at normal zoom
                    if (pixelsPerSecond >= 25) return 2; // Every 2s when zoomed out
                    if (pixelsPerSecond >= 12) return 5; // Every 5s when more zoomed out
                    if (pixelsPerSecond >= 6) return 10; // Every 10s when very zoomed out
                    return 30; // Every 30s when extremely zoomed out
                  };

// 常量定义 - 模块内部使用的固定值
                  const interval = getTimeInterval(zoomLevel);
// 常量定义 - 模块内部使用的固定值
                  const markerCount = Math.ceil(duration / interval) + 1;

                  return Array.from({ length: markerCount }, (_, i) => {
// 常量定义 - 模块内部使用的固定值
                    const time = i * interval;
                    if (time > duration) return null;

// 常量定义 - 模块内部使用的固定值
                    const isMainMarker =
                      time % (interval >= 1 ? Math.max(1, interval) : 1) === 0;

                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 ${isMainMarker
                            ? "border-l border-muted-foreground/40"
                            : "border-l border-muted-foreground/20"
                          }`}
                        style={{
                          left: `${time * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel}px`,
                        }}
                      >
                        <span
                          className={`absolute top-1 left-1 text-[0.6rem] ${isMainMarker
                              ? "text-muted-foreground font-medium"
                              : "text-muted-foreground/70"
                            }`}
                        >
                          {(() => {
// formatTime 函数
                            const formatTime = (seconds: number) => {
// 常量定义 - 模块内部使用的固定值
                              const hours = Math.floor(seconds / 3600);
// 常量定义 - 模块内部使用的固定值
                              const minutes = Math.floor((seconds % 3600) / 60);
// 常量定义 - 模块内部使用的固定值
                              const secs = seconds % 60;

                              if (hours > 0) {
                                return `${hours}:${minutes.toString().padStart(2, "0")}:${Math.floor(secs).toString().padStart(2, "0")}`;
                              } else if (minutes > 0) {
                                return `${minutes}:${Math.floor(secs).toString().padStart(2, "0")}`;
                              } else if (interval >= 1) {
                                return `${Math.floor(secs)}s`;
                              } else {
                                return `${secs.toFixed(1)}s`;
                              }
                            };
                            return formatTime(time);
                          })()}
                        </span>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Track Labels */}
          {tracks.length > 0 && (
            <div
              ref={trackLabelsRef}
              className="w-48 flex-shrink-0 border-r border-black overflow-y-auto"
              data-track-labels
            >
              <ScrollArea className="w-full h-full" ref={trackLabelsScrollRef}>
                <div className="flex flex-col gap-1">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center px-3 border-b border-muted/30 group bg-foreground/5"
                      style={{ height: `${getTrackHeight(track.type)}px` }}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <TrackIcon track={track} />
                      </div>
                      {track.muted && (
                        <span className="ml-2 text-xs text-red-500 font-semibold flex-shrink-0">
                          Muted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Timeline Tracks Content */}
          <div
            className="flex-1 relative overflow-hidden"
            onWheel={(e) => {
              // Check if this is horizontal scrolling - if so, don't handle it here
              if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                return; // Let ScrollArea handle horizontal scrolling
              }
              handleWheel(e);
            }}
            onMouseDown={(e) => {
              handleTimelineMouseDown(e);
              handleSelectionMouseDown(e);
            }}
            onClick={handleTimelineContentClick}
            ref={tracksContainerRef}
          >
            <SelectionBox
              startPos={selectionBox?.startPos || null}
              currentPos={selectionBox?.currentPos || null}
              containerRef={tracksContainerRef}
              isActive={selectionBox?.isActive || false}
            />
            <ScrollArea
              className="w-full h-full"
              ref={tracksScrollRef}
              type="scroll"
              showHorizontalScrollbar
            >
              <div
                className="relative flex-1"
                style={{
                  height: `${Math.max(200, Math.min(800, getTotalTracksHeight(tracks)))}px`,
                  width: `${dynamicTimelineWidth}px`,
                }}
              >
                {tracks.length === 0 ? (
                  <div></div>
                ) : (
                  <>
                    {tracks.map((track, index) => (
                      <ContextMenu key={track.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className="absolute left-0 right-0 border-b border-muted/30 py-[0.05rem]"
                            style={{
                              top: `${getCumulativeHeightBefore(tracks, index)}px`,
                              height: `${getTrackHeight(track.type)}px`,
                            }}
                            onClick={(e) => {
                              // If clicking empty area (not on a element), deselect all elements
                              if (
                                !(e.target as HTMLElement).closest(
                                  ".timeline-element"
                                )
                              ) {
                                clearSelectedElements();
                              }
                            }}
                          >
                            <TimelineTrackContent
                              track={track}
                              zoomLevel={zoomLevel}
                              onSnapPointChange={handleSnapPointChange}
                            />
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => toggleTrackMute(track.id)}
                          >
                            {track.muted ? "Unmute Track" : "Mute Track"}
                          </ContextMenuItem>
                          <ContextMenuItem>
                            Track settings (soon)
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

// TrackIcon 函数
function TrackIcon({ track }: { track: TimelineTrack }) {
  return (
    <>
      {track.type === "media" && (
        <Video className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
      )}
      {track.type === "text" && (
        <TypeIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
      )}
      {track.type === "audio" && (
        <Music className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
      )}
    </>
  );
}

// TimelineToolbar 函数
function TimelineToolbar({
  zoomLevel,
  setZoomLevel,
}: {
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
}) {
// 常量定义 - 模块内部使用的固定值
  const {
    tracks,
    addTrack,
    addElementToTrack,
    removeElementFromTrack,
    removeElementFromTrackWithRipple,
    selectedElements,
    clearSelectedElements,
    splitElement,
    splitAndKeepLeft,
    splitAndKeepRight,
    separateAudio,
    snappingEnabled,
    toggleSnapping,
    rippleEditingEnabled,
    toggleRippleEditing,
    flipSelectedElements,
  } = useTimelineStore();
// 常量定义 - 模块内部使用的固定值
  const { currentTime, duration, isPlaying, toggle } = usePlaybackStore();

  // Action handlers
  const handleSplitSelected = () => {
    if (selectedElements.length === 0) return;
    let splitCount = 0;
    selectedElements.forEach(({ trackId, elementId }) => {
// 常量定义 - 模块内部使用的固定值
      const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((c) => c.id === elementId);
      if (element && track) {
// 常量定义 - 模块内部使用的固定值
        const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
        const effectiveEnd =
          element.startTime +
          (element.duration - element.trimStart - element.trimEnd);
        if (currentTime > effectiveStart && currentTime < effectiveEnd) {
// 常量定义 - 模块内部使用的固定值
          const newElementId = splitElement(trackId, elementId, currentTime);
          if (newElementId) splitCount++;
        }
      }
    });
    if (splitCount === 0) {
      toast.error("Playhead must be within selected elements to split");
    }
  };

// handleDuplicateSelected 函数
  const handleDuplicateSelected = () => {
    if (selectedElements.length === 0) return;
// 常量定义 - 模块内部使用的固定值
    const canDuplicate = selectedElements.length === 1;
    if (!canDuplicate) return;

    selectedElements.forEach(({ trackId, elementId }) => {
// 常量定义 - 模块内部使用的固定值
      const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((el) => el.id === elementId);
      if (element) {
// 常量定义 - 模块内部使用的固定值
        const newStartTime =
          element.startTime +
          (element.duration - element.trimStart - element.trimEnd) +
          0.1;
// 常量定义 - 模块内部使用的固定值
        const { id, ...elementWithoutId } = element;
        addElementToTrack(trackId, {
          ...elementWithoutId,
          startTime: newStartTime,
        });
      }
    });
    clearSelectedElements();
  };

// handleFreezeSelected 函数
  const handleFreezeSelected = () => {
    toast.info("Freeze frame functionality coming soon!");
  };

// handleSplitAndKeepLeft 函数
  const handleSplitAndKeepLeft = () => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element");
      return;
    }
// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((c) => c.id === elementId);
    if (!element) return;
// 常量定义 - 模块内部使用的固定值
    const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
    const effectiveEnd =
      element.startTime +
      (element.duration - element.trimStart - element.trimEnd);
    if (currentTime <= effectiveStart || currentTime >= effectiveEnd) {
      toast.error("Playhead must be within selected element");
      return;
    }
    splitAndKeepLeft(trackId, elementId, currentTime);
  };

// handleSplitAndKeepRight 函数
  const handleSplitAndKeepRight = () => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element");
      return;
    }
// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((c) => c.id === elementId);
    if (!element) return;
// 常量定义 - 模块内部使用的固定值
    const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
    const effectiveEnd =
      element.startTime +
      (element.duration - element.trimStart - element.trimEnd);
    if (currentTime <= effectiveStart || currentTime >= effectiveEnd) {
      toast.error("Playhead must be within selected element");
      return;
    }
    splitAndKeepRight(trackId, elementId, currentTime);
  };

// handleSeparateAudio 函数
  const handleSeparateAudio = () => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one media element to separate audio");
      return;
    }
// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t) => t.id === trackId);
    if (!track || track.type !== "media") {
      toast.error("Select a media element to separate audio");
      return;
    }
    separateAudio(trackId, elementId);
  };

// handleDeleteSelected 函数
  const handleDeleteSelected = () => {
    if (selectedElements.length === 0) return;
    selectedElements.forEach(({ trackId, elementId }) => {
      if (rippleEditingEnabled) {
        removeElementFromTrackWithRipple(trackId, elementId);
      } else {
        removeElementFromTrack(trackId, elementId);
      }
    });
    clearSelectedElements();
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(Math.min(4, zoomLevel + 0.25));
  };

// handleZoomOut 函数
  const handleZoomOut = () => {
    setZoomLevel(Math.max(0.25, zoomLevel - 0.25));
  };

// handleZoomSliderChange 函数
  const handleZoomSliderChange = (values: number[]) => {
    setZoomLevel(values[0]);
  };
  return (
    <div className="border-b flex items-center justify-between px-2 py-1">
      <div className="flex items-center gap-1 w-full">
        <TooltipProvider delayDuration={500}>
          {/* Play/Pause Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="icon"
                onClick={toggle}
                className="mr-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? "Pause (Space)" : "Play (Space)"}
            </TooltipContent>
          </Tooltip>
          <div className="w-px h-6 bg-border mx-1" />
          {/* Time Display */}
          <div
            className="text-xs text-muted-foreground font-mono px-2"
            style={{ minWidth: "18ch", textAlign: "center" }}
          >
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </div>
          {/* Test Clip Button - for debugging */}
          {tracks.length === 0 && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
// 常量定义 - 模块内部使用的固定值
                      const trackId = addTrack("media");
                      addElementToTrack(trackId, {
                        type: "media",
                        mediaId: "test",
                        name: "Test Clip",
                        duration: TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
                        startTime: 0,
                        trimStart: 0,
                        trimEnd: 0,
                        horizontalFlip: false,
                      });
                    }}
                    className="text-xs"
                  >
                    Add Test Clip
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add a test clip to try playback</TooltipContent>
              </Tooltip>
            </>
          )}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="icon" onClick={handleSplitSelected}>
                <Scissors className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split element (Ctrl+S)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="icon"
                onClick={handleSplitAndKeepLeft}
              >
                <ArrowLeftToLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split and keep left (Ctrl+Q)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="icon"
                onClick={handleSplitAndKeepRight}
              >
                <ArrowRightToLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split and keep right (Ctrl+W)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="icon" onClick={handleSeparateAudio}>
                <SplitSquareHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Separate audio (Ctrl+D)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="icon"
                onClick={handleDuplicateSelected}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate element (Ctrl+D)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="icon" onClick={handleFreezeSelected}>
                <Snowflake className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Freeze frame (F)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="icon" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete element (Delete)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="icon"
                onClick={flipSelectedElements}
                className={selectedElements.length > 0 ? "text-primary" : ""}
              >
                <CustomFlipHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>水平翻转 (H)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="icon" onClick={toggleSnapping}>
                {snappingEnabled ? (
                  <Magnet className="h-4 w-4 text-primary" />
                ) : (
                  <Magnet className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto snapping</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="icon" onClick={toggleRippleEditing}>
                <Link
                  className={`h-4 w-4 ${rippleEditingEnabled ? "text-primary" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {rippleEditingEnabled
                ? "Disable Ripple Editing"
                : "Enable Ripple Editing"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-1">
          <Button variant="text" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            className="w-24"
            value={[zoomLevel]}
            onValueChange={handleZoomSliderChange}
            min={0.25}
            max={4}
            step={0.25}
          />
          <Button variant="text" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
