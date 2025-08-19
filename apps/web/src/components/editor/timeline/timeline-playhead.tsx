"use client";

import { useRef, useState, useEffect } from "react";
import { TimelineTrack } from "@/types/timeline";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
import { useTimelinePlayhead } from "@/hooks/use-timeline-playhead";

interface TimelinePlayheadProps {
  currentTime: number;
  duration: number;
  zoomLevel: number;
  tracks: TimelineTrack[];
  seek: (time: number) => void;
  rulerRef: React.RefObject<HTMLDivElement>;
  rulerScrollRef: React.RefObject<HTMLDivElement>;
  tracksScrollRef: React.RefObject<HTMLDivElement>;
  trackLabelsRef?: React.RefObject<HTMLDivElement>;
  timelineRef: React.RefObject<HTMLDivElement>;
  playheadRef?: React.RefObject<HTMLDivElement>;
  isSnappingToPlayhead?: boolean;
}

export function TimelinePlayhead({
  currentTime,
  duration,
  zoomLevel,
  tracks,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  trackLabelsRef,
  timelineRef,
  playheadRef: externalPlayheadRef,
  isSnappingToPlayhead = false,
}: TimelinePlayheadProps) {
  const internalPlayheadRef = useRef<HTMLDivElement>(null);
  const playheadRef = externalPlayheadRef || internalPlayheadRef;
  const [scrollLeft, setScrollLeft] = useState(0);

  // 🎯 性能优化：使用 RAF 节流滚动更新
  const scrollUpdateRef = useRef<number | null>(null);
  const lastScrollLeftRef = useRef(0);

  const { playheadPosition, handlePlayheadMouseDown } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
  });

  // 🎯 性能优化：节流滚动事件处理，避免频繁重绘
  useEffect(() => {
    const tracksViewport = tracksScrollRef.current;

    if (!tracksViewport) return;

    const handleScroll = () => {
      const newScrollLeft = tracksViewport.scrollLeft;

      // 避免不必要的更新
      if (Math.abs(newScrollLeft - lastScrollLeftRef.current) < 1) return;

      lastScrollLeftRef.current = newScrollLeft;

      // 使用 RAF 节流更新
      if (scrollUpdateRef.current) {
        cancelAnimationFrame(scrollUpdateRef.current);
      }

      scrollUpdateRef.current = requestAnimationFrame(() => {
        setScrollLeft(newScrollLeft);
        scrollUpdateRef.current = null;
      });
    };

    // Set initial scroll position
    const initialScrollLeft = tracksViewport.scrollLeft;
    setScrollLeft(initialScrollLeft);
    lastScrollLeftRef.current = initialScrollLeft;

    tracksViewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      tracksViewport.removeEventListener("scroll", handleScroll);
      if (scrollUpdateRef.current) {
        cancelAnimationFrame(scrollUpdateRef.current);
      }
    };
  }, [tracksScrollRef]);

  // Use timeline container height minus a few pixels for breathing room
  const timelineContainerHeight = timelineRef.current?.offsetHeight || 400;
  const totalHeight = timelineContainerHeight - 4;

  // Get dynamic track labels width, fallback to 0 if no tracks or no ref
  const trackLabelsWidth =
    tracks.length > 0 && trackLabelsRef?.current
      ? trackLabelsRef.current.offsetWidth
      : 0;

  // Calculate position locked to timeline content (accounting for scroll)
  const timelinePosition =
    playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const rawLeftPosition = trackLabelsWidth + timelinePosition - scrollLeft;

  // Get the timeline content width and viewport width for right boundary
  const timelineContentWidth =
    duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const tracksViewport = tracksScrollRef.current;
  const viewportWidth = tracksViewport?.clientWidth || 1000;

  // Constrain playhead to never appear outside the timeline area
  const leftBoundary = trackLabelsWidth;
  const rightBoundary = Math.min(
    trackLabelsWidth + timelineContentWidth - scrollLeft, // Don't go beyond timeline content
    trackLabelsWidth + viewportWidth // Don't go beyond viewport
  );

  const leftPosition = Math.max(
    leftBoundary,
    Math.min(rightBoundary, rawLeftPosition)
  );

  // Debug logging when playhead might go outside
  if (rawLeftPosition < leftBoundary || rawLeftPosition > rightBoundary) {
    console.log(
      "PLAYHEAD VISUAL DEBUG:",
      JSON.stringify({
        playheadPosition,
        timelinePosition,
        trackLabelsWidth,
        scrollLeft,
        rawLeftPosition,
        constrainedLeftPosition: leftPosition,
        leftBoundary,
        rightBoundary,
        timelineContentWidth,
        viewportWidth,
        zoomLevel,
      })
    );
  }

  return (
    <div
      ref={playheadRef}
      className="absolute pointer-events-auto z-40"
      style={{
        left: `${leftPosition}px`,
        top: 0,
        height: `${totalHeight}px`,
        width: "2px", // 2px宽度用于更好的点击目标
        // 🎯 性能优化：使用 transform3d 启用硬件加速
        transform: "translate3d(-1px, 0, 0)", // 向左偏移1px确保2px容器居中
        // 🎯 优化：提示浏览器这个元素会频繁变化
        willChange: "left",
      }}
      onMouseDown={handlePlayheadMouseDown}
    >
      {/* The playhead line spanning full height */}
      <div
        className={`absolute w-0.5 cursor-col-resize h-full ${isSnappingToPlayhead ? "bg-foreground" : "bg-foreground"}`}
        style={{
          // 🎯 性能优化：使用 transform3d 启用硬件加速 + 居中对齐
          left: "50%",
          transform: "translate3d(-50%, 0, 0)", // 相对于容器中心对齐
        }}
      />

      {/* Playhead dot indicator at the top (in ruler area) */}
      <div
        className={`absolute w-3 h-3 rounded-full border-2 shadow-xs ${isSnappingToPlayhead ? "bg-foreground border-foreground" : "bg-foreground border-foreground/50"}`}
        style={{
          // 🎯 性能优化：使用 transform3d 启用硬件加速 + 居中对齐
          left: "50%",
          top: "0", // 向上移动3px (原来是top-1即4px，现在是1px)
          transform: "translate3d(-50%, 0, 0)", // 相对于容器中心对齐，与线条完全一致
        }}
      />
    </div>
  );
}

// Also export a hook for getting ruler handlers
export function useTimelinePlayheadRuler({
  currentTime,
  duration,
  zoomLevel,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  playheadRef,
}: Omit<TimelinePlayheadProps, "tracks" | "trackLabelsRef" | "timelineRef">) {
  const { handleRulerMouseDown, isDraggingRuler } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
  });

  return { handleRulerMouseDown, isDraggingRuler };
}

export { TimelinePlayhead as default };
