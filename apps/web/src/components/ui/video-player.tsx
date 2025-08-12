// video-player.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/video-player.tsx
// 最后更新: 2025/7/23

// video-player.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useRef, useEffect } from "react";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";

// VideoPlayerProps 接口定义
interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  clipStartTime: number;
  trimStart: number;
  trimEnd: number;
  clipDuration: number;
  // 新增播放控制增强属性
  loop?: boolean;
  playbackQuality?: 'auto' | 'low' | 'medium' | 'high';
  onError?: (error: string) => void;
  onBuffering?: (buffering: boolean) => void;
}

// VideoPlayer 函数
// 导出组件 - 可复用的 UI 组件
export function VideoPlayer({
  src,
  poster,
  className = "",
  clipStartTime,
  trimStart,
  trimEnd,
  clipDuration,
  loop = false,
  playbackQuality = 'auto',
  onError,
  onBuffering,
}: VideoPlayerProps) {
// 常量定义 - 模块内部使用的固定值
  const videoRef = useRef<HTMLVideoElement>(null);
// 常量定义 - 模块内部使用的固定值
  const { isPlaying, currentTime, volume, speed, muted } = usePlaybackStore();

  // Calculate if we're within this clip's timeline range
  const clipEndTime = clipStartTime + (clipDuration - trimStart - trimEnd);
// 常量定义 - 模块内部使用的固定值
  const isInClipRange =
    currentTime >= clipStartTime && currentTime < clipEndTime;

  // 🚀 调试：只在关键时刻记录播放范围信息
  if (isPlaying && !isInClipRange) {
    console.log(`⚠️ VideoPlayer播放但不在范围内:`, {
      src: src.substring(0, 50) + '...',
      currentTime,
      clipStartTime,
      clipEndTime,
      isInClipRange
    });
  }

  // Sync playback events
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const video = videoRef.current;
    if (!video || !isInClipRange) return;

// handleSeekEvent 函数
    const handleSeekEvent = (e: CustomEvent) => {
      // Always update video time, even if outside clip range
      const timelineTime = e.detail.time;
// 常量定义 - 模块内部使用的固定值
      const videoTime = Math.max(
        trimStart,
        Math.min(
          clipDuration - trimEnd,
          timelineTime - clipStartTime + trimStart
        )
      );
      video.currentTime = videoTime;
    };

// handleUpdateEvent 函数
    const handleUpdateEvent = (e: CustomEvent) => {
      // Always update video time, even if outside clip range
      const timelineTime = e.detail.time;
// 常量定义 - 模块内部使用的固定值
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

// handleSpeed 函数
    const handleSpeed = (e: CustomEvent) => {
      video.playbackRate = e.detail.speed;
    };

    // 新增预览播放事件处理
    const handlePreviewPlay = (e: CustomEvent) => {
      const { media } = e.detail;
      // 检查是否是当前视频的预览播放
      if (media && media.url === src) {
        video.play().catch(() => {});
      }
    };

    const handlePreviewPause = () => {
      video.pause();
    };

    window.addEventListener("playback-seek", handleSeekEvent as EventListener);
    window.addEventListener(
      "playback-update",
      handleUpdateEvent as EventListener
    );
    window.addEventListener("playback-speed", handleSpeed as EventListener);
    window.addEventListener("preview-play", handlePreviewPlay as EventListener);
    window.addEventListener("preview-pause", handlePreviewPause as EventListener);

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
      window.removeEventListener(
        "preview-play",
        handlePreviewPlay as EventListener
      );
      window.removeEventListener(
        "preview-pause",
        handlePreviewPause as EventListener
      );
    };
  }, [clipStartTime, trimStart, trimEnd, clipDuration, isInClipRange]);

  // Sync playback state
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const video = videoRef.current;
    if (!video) return;

    console.log(`🎬 VideoPlayer播放状态同步:`, {
      src: src.substring(0, 50) + '...',
      isPlaying,
      isInClipRange,
      action: isPlaying && isInClipRange ? 'play' : 'pause'
    });

    if (isPlaying && isInClipRange) {
      video.play().catch((error) => {
        console.error(`❌ VideoPlayer播放失败:`, error);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, isInClipRange]);

  // Sync volume and speed
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = muted;
    video.playbackRate = speed;
    video.loop = loop;
  }, [volume, speed, muted, loop]);

  // 新增视频事件处理
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      onBuffering?.(true);
    };

    const handleCanPlay = () => {
      onBuffering?.(false);
    };

    const handleError = () => {
      const error = video.error?.message || 'Video playback error';
      console.error(`🚨 VideoPlayer错误:`, error);
      console.error(`🚨 视频源URL:`, src);
      console.error(`🚨 错误详情:`, {
        code: video.error?.code,
        message: video.error?.message,
        networkState: video.networkState,
        readyState: video.readyState
      });
      onError?.(error);
    };

    const handleEnded = () => {
      // 视频结束时的处理
      if (!loop) {
        // 如果不循环，触发结束事件
        window.dispatchEvent(new CustomEvent('video-ended', {
          detail: { src }
        }));
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src, loop, onError, onBuffering]);

  // 🚀 优化：确保页面刷新后视频能正确初始化
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    console.log(`🎬 VideoPlayer初始化: ${src.substring(0, 50)}...`);

    // 确保视频在正确的时间点
    const targetTime = trimStart + (currentTime - clipStartTime);
    if (Math.abs(video.currentTime - targetTime) > 0.1) {
      video.currentTime = Math.max(0, targetTime);
    }

    // 确保视频状态与播放状态同步
    if (isPlaying && isInClipRange) {
      if (video.paused) {
        video.play().catch((error) => {
          console.error('🚨 VideoPlayer播放失败:', error);
        });
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [src]); // 当视频源变化时重新初始化

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className={`w-full h-full object-cover ${className}`}
      playsInline
      preload="metadata" // 改为metadata，减少初始加载
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      style={{ pointerEvents: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      // 添加加载状态处理
      onLoadStart={() => {
        console.log(`🔄 开始加载视频: ${src}`);
      }}
      onCanPlay={() => {
        console.log(`✅ 视频可播放: ${src}`);
      }}
      onWaiting={() => {
        console.log(`⏳ 视频缓冲中: ${src}`);
      }}
      onError={(e) => {
        console.error(`❌ 视频加载失败: ${src}`, e);
      }}
    />
  );
}
