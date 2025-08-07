// preview-panel.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/preview-panel.tsx
// 最后更新: 2025/7/23

// preview-panel.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { TimelineElement, TimelineTrack, TransitionElement } from "@/types/timeline";
// 导入项目模块
import { useMediaStore, type MediaItem } from "@/stores/media-store";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";
// 导入项目模块
import { useEditorStore } from "@/stores/editor-store";
// 导入项目模块
import { useAspectRatio } from "@/hooks/use-aspect-ratio";
// 导入项目模块
import { VideoPlayer } from "@/components/ui/video-player";
// 导入项目模块
import { AudioPlayer } from "@/components/ui/audio-player";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入模块
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// 导入 React 核心库
import { Play, Pause, Expand, SkipBack, SkipForward } from "lucide-react";
// 导入 React 核心库
import { useState, useRef, useEffect, useCallback } from "react";
// 导入项目模块
import { cn } from "@/lib/utils";
// 导入项目模块
import { formatTimeCode } from "@/lib/time";
// 导入项目模块
import { FONT_CLASS_MAP } from "@/lib/font-config";
// 导入本地模块
import { BackgroundSettings } from "../background-settings";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入字幕拖拽组件
import { SubtitleOverlay } from "./subtitle-overlay";
// 导入蒙板覆盖层组件
import { MaskOverlay } from "./mask-overlay";
// 导入蒙板工具
import { MaskRenderer } from "@/lib/mask-utils";

// ActiveElement 接口定义
interface ActiveElement {
  element: TimelineElement;
  track: TimelineTrack;
  mediaItem: MediaItem | null;
}

// PreviewPanel 函数
// 导出组件 - 可复用的 UI 组件
export function PreviewPanel() {
// 常量定义 - 模块内部使用的固定值
  const { tracks, getTotalDuration, selectedElements } = useTimelineStore();
// 常量定义 - 模块内部使用的固定值
  const { mediaItems } = useMediaStore();
// 常量定义 - 模块内部使用的固定值
  const { 
    currentTime, 
    toggle, 
    setCurrentTime, 
    isPlaying, 
    previewMode, 
    previewMedia,
    setPreviewMode,
    playPreview,
    pausePreview,
    // 新增播放控制增强
    isLooping,
    toggleLoop,
    skipForward,
    skipBackward,
    jumpToStart,
    jumpToEnd,
    buffering,
    error
  } = usePlaybackStore();
// 常量定义 - 模块内部使用的固定值
  const { canvasSize } = useEditorStore();
// 常量定义 - 模块内部使用的固定值
  const previewRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const containerRef = useRef<HTMLDivElement>(null);
// 状态管理 - 创建和管理组件内部状态
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });
// 状态管理 - 创建和管理组件内部状态
  const [isExpanded, setIsExpanded] = useState(false);
// 新增预览播放状态
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
// 常量定义 - 模块内部使用的固定值
  const { activeProject } = useProjectStore();

// 监听预览视频播放状态
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;
    
    const handlePlay = () => setIsPreviewPlaying(true);
    const handlePause = () => setIsPreviewPlaying(false);
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [previewMode, previewMedia]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// updatePreviewSize 函数
    const updatePreviewSize = () => {
      if (!containerRef.current) return;

      let availableWidth, availableHeight;

      if (isExpanded) {
// 常量定义 - 模块内部使用的固定值
        const controlsHeight = 80;
// 常量定义 - 模块内部使用的固定值
        const marginSpace = 24;
        availableWidth = window.innerWidth - marginSpace;
        availableHeight = window.innerHeight - controlsHeight - marginSpace;
      } else {
// 常量定义 - 模块内部使用的固定值
        const container = containerRef.current.getBoundingClientRect();
// 常量定义 - 模块内部使用的固定值
        const computedStyle = getComputedStyle(containerRef.current);
// 常量定义 - 模块内部使用的固定值
        const paddingTop = parseFloat(computedStyle.paddingTop);
// 常量定义 - 模块内部使用的固定值
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
// 常量定义 - 模块内部使用的固定值
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
// 常量定义 - 模块内部使用的固定值
        const paddingRight = parseFloat(computedStyle.paddingRight);
// 常量定义 - 模块内部使用的固定值
        const gap = parseFloat(computedStyle.gap) || 16;
// 常量定义 - 模块内部使用的固定值
        const toolbar = containerRef.current.querySelector("[data-toolbar]");
// 常量定义 - 模块内部使用的固定值
        const toolbarHeight = toolbar
          ? toolbar.getBoundingClientRect().height
          : 0;

        availableWidth = container.width - paddingLeft - paddingRight;
        availableHeight =
          container.height -
          paddingTop -
          paddingBottom -
          toolbarHeight -
          (toolbarHeight > 0 ? gap : 0);
      }

// 常量定义 - 模块内部使用的固定值
      const targetRatio = canvasSize.width / canvasSize.height;
// 常量定义 - 模块内部使用的固定值
      const containerRatio = availableWidth / availableHeight;
      let width, height;

      if (containerRatio > targetRatio) {
        height = availableHeight * (isExpanded ? 0.95 : 1);
        width = height * targetRatio;
      } else {
        width = availableWidth * (isExpanded ? 0.95 : 1);
        height = width / targetRatio;
      }

      setPreviewDimensions({ width, height });
    };

    updatePreviewSize();
// 常量定义 - 模块内部使用的固定值
    const resizeObserver = new ResizeObserver(updatePreviewSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (isExpanded) {
      window.addEventListener("resize", updatePreviewSize);
    }

    return () => {
      resizeObserver.disconnect();
      if (isExpanded) {
        window.removeEventListener("resize", updatePreviewSize);
      }
    };
  }, [canvasSize.width, canvasSize.height, isExpanded]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// handleEscapeKey 函数
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

// 常量定义 - 模块内部使用的固定值
  const hasAnyElements = tracks.some((track) => track.elements.length > 0);
// getActiveElements 函数
  const getActiveElements = (): ActiveElement[] => {
// 常量定义 - 模块内部使用的固定值
    const activeElements: ActiveElement[] = [];

    tracks.forEach((track) => {
      track.elements.forEach((element) => {
// 常量定义 - 模块内部使用的固定值
        const elementStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
        const elementEnd =
          element.startTime +
          (element.duration - element.trimStart - element.trimEnd);

        if (currentTime >= elementStart && currentTime < elementEnd) {
          let mediaItem = null;
          
          if (element.type === "media") {
            if (element.mediaId === "test") {
              mediaItem = null;
            } else {
              // 优先使用时间轴元素中存储的媒体文件副本
              const elementMedia = element as MediaElement;
              
              if (elementMedia.mediaFile) {
                // 使用时间轴元素中的媒体文件副本，重新创建URL
                const mediaUrl = elementMedia.mediaUrl || URL.createObjectURL(elementMedia.mediaFile);
                mediaItem = {
                  id: element.mediaId,
                  name: element.name,
                  type: elementMedia.mediaType || "video",
                  url: mediaUrl,
                  thumbnailUrl: elementMedia.thumbnailUrl,
                  width: elementMedia.mediaWidth,
                  height: elementMedia.mediaHeight,
                  fps: elementMedia.mediaFps,
                  duration: element.duration,
                  file: elementMedia.mediaFile
                };
              } else {
                // 回退到从媒体库中查找
                mediaItem = mediaItems.find((item) => item.id === element.mediaId) || null;
              }
            }
          }
          
          // 转场元素不需要mediaItem，直接添加
          if (element.type === "transition") {
            activeElements.push({ element, track, mediaItem: null });
          } else {
          activeElements.push({ element, track, mediaItem });
          }
        }
      });
    });

    return activeElements;
  };

// 常量定义 - 模块内部使用的固定值
  const activeElements = getActiveElements();

  // Get media elements for blur background (video/image only)
  const getBlurBackgroundElements = (): ActiveElement[] => {
    return activeElements.filter(
      ({ element, mediaItem }) =>
        element.type === "media" &&
        mediaItem &&
        (mediaItem.type === "video" || mediaItem.type === "image") &&
        element.mediaId !== "test" // Exclude test elements
    );
  };

// 常量定义 - 模块内部使用的固定值
  const blurBackgroundElements = getBlurBackgroundElements();

  // Render blur background layer
  const renderBlurBackground = () => {
    if (
      !activeProject?.backgroundType ||
      activeProject.backgroundType !== "blur" ||
      blurBackgroundElements.length === 0
    ) {
      return null;
    }

    // Use the first media element for background (could be enhanced to use primary/focused element)
    const backgroundElement = blurBackgroundElements[0];
// 常量定义 - 模块内部使用的固定值
    const { element, mediaItem } = backgroundElement;

    if (!mediaItem) return null;

// 常量定义 - 模块内部使用的固定值
    const blurIntensity = activeProject.blurIntensity || 8;

    if (mediaItem.type === "video") {
      return (
        <div
          key={`blur-${element.id}`}
          className="absolute inset-0 overflow-hidden"
          style={{
            filter: `blur(${blurIntensity}px)`,
            transform: "scale(1.1)", // Slightly zoom to avoid blur edge artifacts
            transformOrigin: "center",
          }}
        >
          <VideoPlayer
            src={mediaItem.url!}
            poster={mediaItem.thumbnailUrl}
            clipStartTime={element.startTime}
            trimStart={element.trimStart}
            trimEnd={element.trimEnd}
            clipDuration={element.duration}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (mediaItem.type === "image") {
      return (
        <div
          key={`blur-${element.id}`}
          className="absolute inset-0 overflow-hidden"
          style={{
            filter: `blur(${blurIntensity}px)`,
            transform: "scale(1.1)", // Slightly zoom to avoid blur edge artifacts
            transformOrigin: "center",
          }}
        >
          <img
            src={mediaItem.url!}
            alt={mediaItem.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      );
    }

    return null;
  };

  // 生成蒙板CSS样式
  const generateMaskStyle = (element: TimelineElement) => {
    const masks = element.masks || [];
    if (masks.length === 0) return {};

    // 只使用第一个蒙板（简化实现）
    const mask = masks[0];
    if (!mask) return {};

    // 生成CSS clip-path属性
    const clipPath = MaskRenderer.generateCSSMask(mask, previewDimensions.width, previewDimensions.height);

    return {
      clipPath: clipPath,
      WebkitClipPath: clipPath,
    };
  };

  // Render an element
  const renderElement = (elementData: ActiveElement, index: number) => {
// 常量定义 - 模块内部使用的固定值
    const { element, mediaItem, track } = elementData;

    // 转场元素
    if (element.type === "transition") {
      const transitionElement = element as TransitionElement;
      
      // 获取转场相关的媒体元素
      const fromTrack = tracks.find(t => t.id === transitionElement.fromTrackId);
      const toTrack = tracks.find(t => t.id === transitionElement.toTrackId);
      const fromElement = fromTrack?.elements.find(e => e.id === transitionElement.fromElementId);
      const toElement = toTrack?.elements.find(e => e.id === transitionElement.toElementId);
      
      // 计算转场进度 (0-1)
      const transitionProgress = (currentTime - element.startTime) / element.duration;
      
      // 根据转场类型渲染不同的效果
      switch (transitionElement.transitionType) {
        case "flash":
          return (
            <div
              key={element.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                zIndex: 200 + index, // 转场元素在最顶层
              }}
            >
              {transitionElement.direction === "in" ? (
                // 闪黑效果
                <div
                  className="absolute inset-0 bg-black"
                  style={{
                    opacity: transitionProgress < 0.3 ? 1 - (transitionProgress / 0.3) : 0,
                    transition: "opacity 0.1s ease-out",
                  }}
                />
              ) : (
                // 闪白效果
                <div
                  className="absolute inset-0 bg-white"
                  style={{
                    opacity: transitionProgress > 0.7 ? (transitionProgress - 0.7) / 0.3 : 0,
                    transition: "opacity 0.1s ease-out",
                  }}
                />
              )}
            </div>
          );
          
        case "dissolve":
          return (
            <div
              key={element.id}
              className="absolute inset-0"
              style={{
                zIndex: 200 + index,
              }}
            >
              {/* 叠化效果 - 使用CSS混合模式 */}
              <div
                className="absolute inset-0 bg-black/50"
                style={{
                  opacity: Math.sin(transitionProgress * Math.PI),
                  mixBlendMode: "multiply",
                }}
              />
            </div>
          );
          
        default:
          return (
            <div
              key={element.id}
              className="absolute inset-0 flex items-center justify-center bg-purple-500/20"
              style={{
                zIndex: 200 + index,
              }}
            >
              <div className="text-center text-white">
                <div className="text-lg mb-1">✨</div>
                <p className="text-xs">{element.name}</p>
              </div>
            </div>
          );
      }
    }

    // Text elements - 🎬 字幕拖拽模式下隐藏原始渲染
    if (element.type === "text") {
      // 检查是否有选中的字幕元素，如果有则隐藏原始渲染（由SubtitleOverlay接管）
      const hasSelectedSubtitle = selectedElements.some(sel =>
        sel.elementId === element.id && sel.trackId === track.id
      );

      if (hasSelectedSubtitle) {
        // 返回透明占位符，保持布局但不显示内容
        return (
          <div
            key={element.id}
            className="absolute pointer-events-none"
            style={{
              left: `${50 + (element.x / canvasSize.width) * 100}%`,
              top: `${50 + (element.y / canvasSize.height) * 100}%`,
              transform: `translate(-50%, -50%)`,
              opacity: 0,
              zIndex: 1,
            }}
          />
        );
      }

// 常量定义 - 模块内部使用的固定值
      const fontClassName =
        FONT_CLASS_MAP[element.fontFamily as keyof typeof FONT_CLASS_MAP] || "";

// 常量定义 - 模块内部使用的固定值
      const scaleRatio = previewDimensions.width / canvasSize.width;

      const maskStyle = generateMaskStyle(element);
      return (
        <div
          key={element.id}
          className="absolute flex items-center justify-center"
          style={{
            left: `${50 + (element.x / canvasSize.width) * 100}%`,
            top: `${50 + (element.y / canvasSize.height) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${scaleRatio}) ${element.horizontalFlip ? 'scaleX(-1)' : ''}`,
            opacity: element.opacity,
            zIndex: 100 + index, // Text elements on top
            ...maskStyle,
          }}
        >
          <div
            className={fontClassName}
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
        </div>
      );
    }

    // Media elements
    if (element.type === "media") {
      // Test elements
      if (!mediaItem || element.mediaId === "test") {
        return (
          <div
            key={element.id}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🎬</div>
              <p className="text-xs text-white">{element.name}</p>
            </div>
          </div>
        );
      }

      // Video elements
      if (mediaItem.type === "video") {
        const maskStyle = generateMaskStyle(element);
        return (
          <div
            key={element.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: (element as any).horizontalFlip ? 'scaleX(-1)' : '',
              ...maskStyle,
            }}
          >
            <VideoPlayer
              src={mediaItem.url!}
              poster={mediaItem.thumbnailUrl}
              clipStartTime={element.startTime}
              trimStart={element.trimStart}
              trimEnd={element.trimEnd}
              clipDuration={element.duration}
            />
          </div>
        );
      }

      // Image elements
      if (mediaItem.type === "image") {
        const maskStyle = generateMaskStyle(element);
        return (
          <div
            key={element.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: (element as any).horizontalFlip ? 'scaleX(-1)' : '',
              ...maskStyle,
            }}
          >
            <img
              src={mediaItem.url!}
              alt={mediaItem.name}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        );
      }

      // Audio elements (no visual representation)
      if (mediaItem.type === "audio") {
        return (
          <div key={element.id} className="absolute inset-0">
            <AudioPlayer
              src={mediaItem.url!}
              clipStartTime={element.startTime}
              trimStart={element.trimStart}
              trimEnd={element.trimEnd}
              clipDuration={element.duration}
              trackMuted={elementData.track.muted}
            />
          </div>
        );
      }
    }

    return null;
  };

  return (
    <>
      <div className="h-full w-full flex flex-col min-h-0 min-w-0 bg-panel rounded-sm">
        <div
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-center p-3 min-h-0 min-w-0"
        >
          <div className="flex-1"></div>
          {(hasAnyElements || previewMedia) ? (
            <div
              ref={previewRef}
              className="relative overflow-hidden border"
              style={{
                width: previewDimensions.width,
                height: previewDimensions.height,
                backgroundColor:
                  activeProject?.backgroundType === "blur"
                    ? "transparent"
                    : activeProject?.backgroundColor || "#000000",
              }}
            >
              {previewMode && previewMedia ? (
                // 预览模式显示 - 独立播放器
                <div className="absolute inset-0 flex items-center justify-center">
                  <video
                    ref={previewVideoRef}
                    data-preview="true"
                    src={previewMedia.url!}
                    poster={previewMedia.thumbnailUrl}
                    className="max-w-full max-h-full object-contain"
                    playsInline
                    preload="auto"
                    controls={false}
                    style={{ pointerEvents: "none" }}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              ) : (
                // 正常时间轴模式显示
                <>
                  {renderBlurBackground()}
                  {activeElements.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      No elements at current time
                    </div>
                  ) : (
                    <>
                      {activeElements.map((elementData, index) =>
                        renderElement(elementData, index)
                      )}
                      {/* 可交互的蒙板编辑覆盖层 - 只为选中的元素显示 */}
                      {activeElements.map((elementData, index) => {
                        const masks = elementData.element.masks || [];
                        if (masks.length === 0) return null;

                        // 检查元素是否被选中
                        const isSelected = selectedElements.some(sel =>
                          sel.elementId === elementData.element.id && sel.trackId === elementData.track.id
                        );

                        if (!isSelected) return null;

                        return (
                          <MaskOverlay
                            key={`mask-editor-${elementData.element.id}`}
                            masks={masks}
                            canvasWidth={previewDimensions.width}
                            canvasHeight={previewDimensions.height}
                            editMode={true} // 启用编辑模式
                            onMaskUpdate={(maskId, updates) => {
                              // 更新蒙板属性
                              const { updateElementMask } = useTimelineStore.getState();
                              updateElementMask(elementData.track.id, elementData.element.id, maskId, updates);
                            }}
                            className="z-20"
                          />
                        );
                      })}

                      {/* 🎬 字幕拖拽编辑覆盖层 */}
                      <SubtitleOverlay
                        textElements={activeElements
                          .filter(elementData => elementData.element.type === 'text')
                          .map(elementData => ({
                            element: elementData.element as any,
                            trackId: elementData.track.id
                          }))
                        }
                        canvasWidth={canvasSize.width}
                        canvasHeight={canvasSize.height}
                        previewDimensions={previewDimensions}
                        selectedElements={selectedElements}
                        editMode={true}
                      />
                    </>
                  )}
                  {activeProject?.backgroundType === "blur" &&
                    blurBackgroundElements.length === 0 &&
                    activeElements.length > 0 && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                        Add a video or image to use blur background
                      </div>
                    )}
                </>
              )}
            </div>
          ) : null}

          <div className="flex-1"></div>

          <PreviewToolbar
            hasAnyElements={hasAnyElements}
            onToggleExpanded={toggleExpanded}
            isExpanded={isExpanded}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            toggle={toggle}
            getTotalDuration={getTotalDuration}
            previewMode={previewMode}
            previewMedia={previewMedia}
            playPreview={playPreview}
            pausePreview={pausePreview}
            setPreviewMode={setPreviewMode}
            isPreviewPlaying={isPreviewPlaying}
            previewVideoRef={previewVideoRef}
            // 新增播放控制增强
            isLooping={isLooping}
            toggleLoop={toggleLoop}
            skipForward={skipForward}
            skipBackward={skipBackward}
            jumpToStart={jumpToStart}
            jumpToEnd={jumpToEnd}
            buffering={buffering}
            error={error}
          />
        </div>
      </div>

      {isExpanded && (
        <FullscreenPreview
          previewDimensions={previewDimensions}
          activeProject={activeProject}
          renderBlurBackground={renderBlurBackground}
          activeElements={activeElements}
          renderElement={renderElement}
          blurBackgroundElements={blurBackgroundElements}
          hasAnyElements={hasAnyElements}
          toggleExpanded={toggleExpanded}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          toggle={toggle}
          getTotalDuration={getTotalDuration}
        />
      )}
    </>
  );
}

// FullscreenToolbar 函数
function FullscreenToolbar({
  hasAnyElements,
  onToggleExpanded,
  currentTime,
  setCurrentTime,
  toggle,
  getTotalDuration,
}: {
  hasAnyElements: boolean;
  onToggleExpanded: () => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  toggle: () => void;
  getTotalDuration: () => number;
}) {
// 常量定义 - 模块内部使用的固定值
  const { isPlaying } = usePlaybackStore();
// 常量定义 - 模块内部使用的固定值
  const { activeProject } = useProjectStore();
// 状态管理 - 创建和管理组件内部状态
  const [isDragging, setIsDragging] = useState(false);

// 常量定义 - 模块内部使用的固定值
  const totalDuration = getTotalDuration();
// 常量定义 - 模块内部使用的固定值
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

// handleTimelineClick 函数
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasAnyElements) return;
// 常量定义 - 模块内部使用的固定值
    const rect = e.currentTarget.getBoundingClientRect();
// 常量定义 - 模块内部使用的固定值
    const clickX = e.clientX - rect.left;
// 常量定义 - 模块内部使用的固定值
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
// 常量定义 - 模块内部使用的固定值
    const newTime = percentage * totalDuration;
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
  };

// handleTimelineDrag 函数
  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasAnyElements) return;
    e.preventDefault();
    e.stopPropagation();
// 常量定义 - 模块内部使用的固定值
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);

// handleMouseMove 自定义钩子
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
// 常量定义 - 模块内部使用的固定值
      const dragX = moveEvent.clientX - rect.left;
// 常量定义 - 模块内部使用的固定值
      const percentage = Math.max(0, Math.min(1, dragX / rect.width));
// 常量定义 - 模块内部使用的固定值
      const newTime = percentage * totalDuration;
      setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
    };

// handleMouseUp 自定义钩子
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    handleMouseMove(e.nativeEvent);
  };

// skipBackward 函数
  const skipBackward = () => {
// 常量定义 - 模块内部使用的固定值
    const newTime = Math.max(0, currentTime - 1);
    setCurrentTime(newTime);
  };

// skipForward 函数
  const skipForward = () => {
// 常量定义 - 模块内部使用的固定值
    const newTime = Math.min(totalDuration, currentTime + 1);
    setCurrentTime(newTime);
  };

  return (
    <div
      data-toolbar
      className="flex items-center gap-2 p-1 pt-2 w-full text-white"
    >
      <div className="flex items-center gap-1 text-[0.70rem] tabular-nums text-white/90">
        <span className="text-primary">
          {formatTimeCode(currentTime, "HH:MM:SS:FF", activeProject?.fps || 30)}
        </span>
        <span className="opacity-50">/</span>
        <span>
          {formatTimeCode(
            totalDuration,
            "HH:MM:SS:FF",
            activeProject?.fps || 30
          )}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="text"
          size="icon"
          onClick={skipBackward}
          disabled={!hasAnyElements}
          className="h-auto p-0 text-white hover:text-white/80"
          title="Skip backward 1s"
        >
          <SkipBack className="h-3 w-3" />
        </Button>
        <Button
          variant="text"
          size="icon"
          onClick={toggle}
          disabled={!hasAnyElements}
          className="h-auto p-0 text-white hover:text-white/80"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="text"
          size="icon"
          onClick={skipForward}
          disabled={!hasAnyElements}
          className="h-auto p-0 text-white hover:text-white/80"
          title="Skip forward 1s"
        >
          <SkipForward className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <div
          className={cn(
            "relative h-1 rounded-full cursor-pointer flex-1 bg-white/20",
            !hasAnyElements && "opacity-50 cursor-not-allowed"
          )}
          onClick={hasAnyElements ? handleTimelineClick : undefined}
          onMouseDown={hasAnyElements ? handleTimelineDrag : undefined}
          style={{ userSelect: "none" }}
        >
          <div
            className={cn(
              "absolute top-0 left-0 h-full rounded-full bg-white",
              !isDragging && "duration-100"
            )}
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 shadow-sm bg-white border border-black/20"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        variant="text"
        size="icon"
        className="!size-4 text-white/80 hover:text-white"
        onClick={onToggleExpanded}
        title="Exit fullscreen (Esc)"
      >
        <Expand className="!size-4" />
      </Button>
    </div>
  );
}

// FullscreenPreview 函数
function FullscreenPreview({
  previewDimensions,
  activeProject,
  renderBlurBackground,
  activeElements,
  renderElement,
  blurBackgroundElements,
  hasAnyElements,
  toggleExpanded,
  currentTime,
  setCurrentTime,
  toggle,
  getTotalDuration,
}: {
  previewDimensions: { width: number; height: number };
  activeProject: any;
  renderBlurBackground: () => React.ReactNode;
  activeElements: ActiveElement[];
  renderElement: (elementData: ActiveElement, index: number) => React.ReactNode;
  blurBackgroundElements: ActiveElement[];
  hasAnyElements: boolean;
  toggleExpanded: () => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  toggle: () => void;
  getTotalDuration: () => number;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-background">
        <div
          className="relative overflow-hidden border border-border m-3"
          style={{
            width: previewDimensions.width,
            height: previewDimensions.height,
            backgroundColor:
              activeProject?.backgroundType === "blur"
                ? "#1a1a1a"
                : activeProject?.backgroundColor || "#1a1a1a",
          }}
        >
          {renderBlurBackground()}
          {activeElements.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              No elements at current time
            </div>
          ) : (
            <>
              {activeElements.map((elementData, index) =>
                renderElement(elementData, index)
              )}
              {/* 全屏模式的可交互蒙板编辑覆盖层 - 只为选中的元素显示 */}
              {activeElements.map((elementData, index) => {
                const masks = elementData.element.masks || [];
                if (masks.length === 0) return null;

                // 检查元素是否被选中
                const isSelected = selectedElements.some(sel =>
                  sel.elementId === elementData.element.id && sel.trackId === elementData.track.id
                );

                if (!isSelected) return null;

                return (
                  <MaskOverlay
                    key={`mask-editor-fullscreen-${elementData.element.id}`}
                    masks={masks}
                    canvasWidth={window.innerWidth}
                    canvasHeight={window.innerHeight - 160}
                    editMode={true}
                    onMaskUpdate={(maskId, updates) => {
                      const { updateElementMask } = useTimelineStore.getState();
                      updateElementMask(elementData.track.id, elementData.element.id, maskId, updates);
                    }}
                    className="z-20"
                  />
                );
              })}

              {/* 🎬 全屏模式字幕拖拽编辑覆盖层 */}
              <SubtitleOverlay
                textElements={activeElements
                  .filter(elementData => elementData.element.type === 'text')
                  .map(elementData => ({
                    element: elementData.element as any,
                    trackId: elementData.track.id
                  }))
                }
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                previewDimensions={{
                  width: window.innerWidth,
                  height: window.innerHeight - 160
                }}
                selectedElements={selectedElements}
                editMode={true}
              />
            </>
          )}
          {activeProject?.backgroundType === "blur" &&
            blurBackgroundElements.length === 0 &&
            activeElements.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                Add a video or image to use blur background
              </div>
            )}
        </div>
      </div>
      <div className="p-4 bg-black">
        <FullscreenToolbar
          hasAnyElements={hasAnyElements}
          onToggleExpanded={toggleExpanded}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          toggle={toggle}
          getTotalDuration={getTotalDuration}
        />
      </div>
    </div>
  );
}

// PreviewToolbar 函数
function PreviewToolbar({
  hasAnyElements,
  onToggleExpanded,
  isExpanded,
  currentTime,
  setCurrentTime,
  toggle,
  getTotalDuration,
  previewMode,
  previewMedia,
  playPreview,
  pausePreview,
  setPreviewMode,
  isPreviewPlaying,
  previewVideoRef,
  // 新增播放控制增强
  isLooping,
  toggleLoop,
  skipForward,
  skipBackward,
  jumpToStart,
  jumpToEnd,
  buffering,
  error,
}: {
  hasAnyElements: boolean;
  onToggleExpanded: () => void;
  isExpanded: boolean;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  toggle: () => void;
  getTotalDuration: () => number;
  previewMode: boolean;
  previewMedia: any | null;
  playPreview: () => void;
  pausePreview: () => void;
  setPreviewMode: (mode: boolean) => void;
  isPreviewPlaying: boolean;
  previewVideoRef: React.RefObject<HTMLVideoElement>;
  // 新增播放控制增强
  isLooping: boolean;
  toggleLoop: () => void;
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  buffering: boolean;
  error: string | null;
}) {
// 常量定义 - 模块内部使用的固定值
  const { isPlaying } = usePlaybackStore();
// 常量定义 - 模块内部使用的固定值
  const { setCanvasSize, setCanvasSizeToOriginal } = useEditorStore();
// 常量定义 - 模块内部使用的固定值
  const { activeProject } = useProjectStore();
// 常量定义 - 模块内部使用的固定值
  const {
    currentPreset,
    isOriginal,
    getOriginalAspectRatio,
    getDisplayName,
    canvasPresets,
  } = useAspectRatio();

// handlePresetSelect 函数
  const handlePresetSelect = (preset: { width: number; height: number }) => {
    setCanvasSize({ width: preset.width, height: preset.height });
  };

// handleOriginalSelect 函数
  const handleOriginalSelect = () => {
// 常量定义 - 模块内部使用的固定值
    const aspectRatio = getOriginalAspectRatio();
    setCanvasSizeToOriginal(aspectRatio);
  };

  if (isExpanded) {
    return (
      <FullscreenToolbar
        {...{
          hasAnyElements,
          onToggleExpanded,
          currentTime,
          setCurrentTime,
          toggle,
          getTotalDuration,
        }}
      />
    );
  }

  return (
    <div
      data-toolbar
      className="flex items-end justify-between gap-2 p-1 pt-2 w-full"
    >
      <div>
        <p
          className={cn(
            "text-[0.75rem] text-muted-foreground flex items-center gap-1",
            !hasAnyElements && "opacity-50"
          )}
        >
          <span className="text-primary tabular-nums">
            {formatTimeCode(
              currentTime,
              "HH:MM:SS:FF",
              activeProject?.fps || 30
            )}
          </span>
          <span className="opacity-50">/</span>
          <span className="tabular-nums">
            {formatTimeCode(
              getTotalDuration(),
              "HH:MM:SS:FF",
              activeProject?.fps || 30
            )}
          </span>
          {/* 新增状态显示 */}
          {buffering && (
            <span className="text-blue-500 text-xs">缓冲中...</span>
          )}
          {error && (
            <span className="text-red-500 text-xs">错误: {error}</span>
          )}
        </p>
      </div>
      <Button
        variant="text"
        size="icon"
        onClick={() => {
          if (previewMode && previewMedia) {
            // 预览模式播放控制 - 直接控制视频元素
            const video = previewVideoRef.current;
            if (video) {
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
            }
          } else {
            // 正常时间轴播放控制
            toggle();
          }
        }}
        disabled={!hasAnyElements && !previewMedia}
        className="h-auto p-0"
      >
        {previewMode && previewMedia ? (
          isPreviewPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>
      <div className="flex items-center gap-3">
        {previewMode && previewMedia && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(false)}
            className="text-xs"
          >
            退出预览
          </Button>
        )}
        
        {/* 新增播放控制增强按钮 */}
        {!previewMode && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipBackward(5)}
              className="text-xs"
              title="后退5秒"
            >
              -5s
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipForward(5)}
              className="text-xs"
              title="前进5秒"
            >
              +5s
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={jumpToStart}
              className="text-xs"
              title="跳转到开始"
            >
              开始
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={jumpToEnd}
              className="text-xs"
              title="跳转到结束"
            >
              结束
            </Button>
            <Button
              variant={isLooping ? "default" : "ghost"}
              size="sm"
              onClick={toggleLoop}
              className="text-xs"
              title="循环播放"
            >
              循环
            </Button>
          </>
        )}
        
        <BackgroundSettings />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="!bg-panel-accent text-foreground/85 text-[0.70rem] h-4 rounded-none border border-muted-foreground px-0.5 py-0 font-light"
              disabled={!hasAnyElements}
            >
              {getDisplayName()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleOriginalSelect}
              className={cn("text-xs", isOriginal && "font-semibold")}
            >
              Original
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canvasPresets.map((preset) => (
              <DropdownMenuItem
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "text-xs",
                  currentPreset?.name === preset.name && "font-semibold"
                )}
              >
                {preset.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="text"
          size="icon"
          className="!size-4 text-muted-foreground"
          onClick={onToggleExpanded}
          title="Enter fullscreen"
        >
          <Expand className="!size-4" />
        </Button>
      </div>
    </div>
  );
}
