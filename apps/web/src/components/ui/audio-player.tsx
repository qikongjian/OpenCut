// audio-player.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/audio-player.tsx
// 最后更新: 2025/7/23

// audio-player.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useRef, useEffect } from "react";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";

// AudioPlayerProps 接口定义
interface AudioPlayerProps {
  src: string;
  className?: string;
  clipStartTime: number;
  trimStart: number;
  trimEnd: number;
  clipDuration: number;
  trackMuted?: boolean;
}

// AudioPlayer 函数
// 导出组件 - 可复用的 UI 组件
export function AudioPlayer({
  src,
  className = "",
  clipStartTime,
  trimStart,
  trimEnd,
  clipDuration,
  trackMuted = false,
}: AudioPlayerProps) {
// 常量定义 - 模块内部使用的固定值
  const audioRef = useRef<HTMLAudioElement>(null);
// 常量定义 - 模块内部使用的固定值
  const { isPlaying, currentTime, volume, speed, muted } = usePlaybackStore();

  // Calculate if we're within this clip's timeline range
  const clipEndTime = clipStartTime + (clipDuration - trimStart - trimEnd);
// 常量定义 - 模块内部使用的固定值
  const isInClipRange =
    currentTime >= clipStartTime && currentTime < clipEndTime;

  // Sync playback events
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const audio = audioRef.current;
    if (!audio || !isInClipRange) return;

// handleSeekEvent 函数
    const handleSeekEvent = (e: CustomEvent) => {
      // Always update audio time, even if outside clip range
      const timelineTime = e.detail.time;
// 常量定义 - 模块内部使用的固定值
      const audioTime = Math.max(
        trimStart,
        Math.min(
          clipDuration - trimEnd,
          timelineTime - clipStartTime + trimStart
        )
      );
      audio.currentTime = audioTime;
    };

// handleUpdateEvent 函数
    const handleUpdateEvent = (e: CustomEvent) => {
      // Always update audio time, even if outside clip range
      const timelineTime = e.detail.time;
// 常量定义 - 模块内部使用的固定值
      const targetTime = Math.max(
        trimStart,
        Math.min(
          clipDuration - trimEnd,
          timelineTime - clipStartTime + trimStart
        )
      );

      if (Math.abs(audio.currentTime - targetTime) > 0.5) {
        audio.currentTime = targetTime;
      }
    };

// handleSpeed 函数
    const handleSpeed = (e: CustomEvent) => {
      audio.playbackRate = e.detail.speed;
    };

    window.addEventListener("playback-seek", handleSeekEvent as EventListener);
    window.addEventListener(
      "playback-update",
      handleUpdateEvent as EventListener
    );
    window.addEventListener("playback-speed", handleSpeed as EventListener);

    return () => {
      window.removeEventListener(
        "playback-seek",
        handleSeekEvent as EventListener
      );
      window.removeEventListener(
        "playback-update",
        handleUpdateEvent as EventListener
      );
      window.removeEventListener(
        "playback-speed",
        handleSpeed as EventListener
      );
    };
  }, [clipStartTime, trimStart, trimEnd, clipDuration, isInClipRange]);

  // Sync playback state
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && isInClipRange && !trackMuted) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isInClipRange, trackMuted]);

  // Sync volume and speed
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = muted || trackMuted;
    audio.playbackRate = speed;
  }, [volume, speed, muted, trackMuted]);

  return (
    <audio
      ref={audioRef}
      src={src}
      className={className}
      preload="auto"
      controls={false}
      style={{ display: "none" }} // Audio elements don't need visual representation
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
