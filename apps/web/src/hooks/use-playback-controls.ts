// use-playback-controls.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-playback-controls.ts
// 最后更新: 2025/7/23

// use-playback-controls.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useEffect, useCallback } from "react";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入 Sonner 通知组件
import { toast } from "sonner";

// usePlaybackControls 自定义钩子
export const usePlaybackControls = () => {
// 常量定义 - 模块内部使用的固定值
  const { isPlaying, currentTime, play, pause, seek } = usePlaybackStore();

// 常量定义 - 模块内部使用的固定值
  const {
    selectedElements,
    tracks,
    splitElement,
    splitAndKeepLeft,
    splitAndKeepRight,
    separateAudio,
  } = useTimelineStore();

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const handleSplitSelectedElement = useCallback(() => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element to split");
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((e) => e.id === elementId);

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

    splitElement(trackId, elementId, currentTime);
  }, [selectedElements, tracks, currentTime, splitElement]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const handleSplitAndKeepLeftCallback = useCallback(() => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element");
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((e) => e.id === elementId);

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
  }, [selectedElements, tracks, currentTime, splitAndKeepLeft]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const handleSplitAndKeepRightCallback = useCallback(() => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element");
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((e) => e.id === elementId);

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
  }, [selectedElements, tracks, currentTime, splitAndKeepRight]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const handleSeparateAudioCallback = useCallback(() => {
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
  }, [selectedElements, tracks, separateAudio]);
};
