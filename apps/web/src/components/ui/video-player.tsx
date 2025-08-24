"use client";

import { useRef, useEffect } from "react";
import { usePlaybackStore } from "@/stores/playback-store";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  clipStartTime: number;
  trimStart: number;
  trimEnd: number;
  clipDuration: number;
  trackMuted?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  className = "",
  clipStartTime,
  trimStart,
  trimEnd,
  clipDuration,
  trackMuted = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPlaying, currentTime, volume, speed, muted } = usePlaybackStore();
  const isReadyRef = useRef(false);
  const lastSrcRef = useRef<string>("");

  // Calculate if we're within this clip's timeline range
  const clipEndTime = clipStartTime + (clipDuration - trimStart - trimEnd);
  const isInClipRange =
    currentTime >= clipStartTime && currentTime < clipEndTime;

  // 🎯 关键优化：预测即将进入的Clip范围（提前0.5秒开始预加载）
  const PRELOAD_BUFFER = 0.5; // 提前0.5秒预加载
  const isNearClipStart =
    currentTime >= (clipStartTime - PRELOAD_BUFFER) &&
    currentTime < clipStartTime;
  const shouldPreload = isInClipRange || isNearClipStart;

  // Sync playback events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInClipRange) return;

    const handleSeekEvent = (e: CustomEvent) => {
      // Always update video time, even if outside clip range
      const timelineTime = e.detail.time;
      const videoTime = Math.max(
        trimStart,
        Math.min(
          clipDuration - trimEnd,
          timelineTime - clipStartTime + trimStart
        )
      );
      video.currentTime = videoTime;
    };

    const handleUpdateEvent = (e: CustomEvent) => {
      // Always update video time, even if outside clip range
      const timelineTime = e.detail.time;
      const targetTime = Math.max(
        trimStart,
        Math.min(
          clipDuration - trimEnd,
          timelineTime - clipStartTime + trimStart
        )
      );

      if (Math.abs(video.currentTime - targetTime) > 0.5) {
        video.currentTime = targetTime;
      }
    };

    const handleSpeed = (e: CustomEvent) => {
      video.playbackRate = e.detail.speed;
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

  // 🎯 关键优化：视频预加载和就绪状态管理
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 检测视频源变化，重置就绪状态
    if (lastSrcRef.current !== src) {
      isReadyRef.current = false;
      lastSrcRef.current = src;

      // Settings视频就绪监听器
      const handleCanPlay = () => {
        isReadyRef.current = true;
        console.log(`🎬 视频就绪: ${src.substring(src.lastIndexOf('/') + 1)}`);
      };

      const handleLoadStart = () => {
        console.log(`📥 开始加载视频: ${src.substring(src.lastIndexOf('/') + 1)}`);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadstart', handleLoadStart);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadstart', handleLoadStart);
      };
    }
  }, [src]);

  // 🎯 优化的预加载逻辑
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPreload) {
      // 确保视频已经开始加载
      if (video.readyState < 2) { // HAVE_CURRENT_DATA
        video.load(); // 强制开始加载
      }
    }
  }, [shouldPreload]);

  // 🎯 优化的播放状态同步
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && isInClipRange) {
      // 只有在视频就绪时才播放，避免卡顿
      if (isReadyRef.current || video.readyState >= 2) {
        video.play().catch((error) => {
          console.warn('视频播放失败:', error);
        });
      } else {
        // 视频未就绪，等待就绪后播放
        const handleCanPlay = () => {
          if (isPlaying && isInClipRange) {
            video.play().catch((error) => {
              console.warn('延迟视频播放失败:', error);
            });
          }
          video.removeEventListener('canplay', handleCanPlay);
        };
        video.addEventListener('canplay', handleCanPlay);
      }
    } else {
      video.pause();
    }
  }, [isPlaying, isInClipRange]);

  // Sync volume and speed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = muted || trackMuted;
    video.playbackRate = speed;
  }, [volume, speed, muted, trackMuted]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className={`w-full h-full object-contain ${className}`}
      playsInline
      preload={shouldPreload ? "auto" : "metadata"} // 🎯 动态预加载策略
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      style={{
        pointerEvents: "none",
        // 🎯 优化渲染性能
        willChange: isInClipRange ? "transform" : "auto"
      }}
      onContextMenu={(e) => e.preventDefault()}
      // 🎯 添加性能监控事件
      onLoadStart={() => console.log(`📥 视频开始加载: ${src.substring(src.lastIndexOf('/') + 1)}`)}
      onCanPlay={() => console.log(`✅ 视频可播放: ${src.substring(src.lastIndexOf('/') + 1)}`)}
      onWaiting={() => console.log(`⏳ 视频缓冲中: ${src.substring(src.lastIndexOf('/') + 1)}`)}
      onPlaying={() => console.log(`▶️ 视频开始播放: ${src.substring(src.lastIndexOf('/') + 1)}`)}
    />
  );
}
