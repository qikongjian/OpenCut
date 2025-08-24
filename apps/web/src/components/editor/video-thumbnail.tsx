"use client";

// video-thumbnail.tsx - 视频Preview组件（改为直接显示视频）
// 此文件包含 视频Preview和播放功能 的相关代码
// 文件路径: components/editor/video-thumbnail.tsx
// Last updated: 2025/1/8

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface VideoThumbnailProps {
  videoUrl: string;
  startTime?: number; // 视频开始时间点（秒）
  width?: number;
  height?: number;
  onPreview?: (videoUrl: string, startTime?: number) => void;
  className?: string;
}

export function VideoThumbnail({
  videoUrl,
  startTime = 0,
  width = 120,
  height = 68,
  onPreview,
  className = ""
}: VideoThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // 默认静音
  const videoRef = useRef<HTMLVideoElement>(null);

  // 处理视频加载
  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (!video) return;

    // Settings开始时间
    video.currentTime = startTime;
    setIsLoading(false);
    setHasError(false);
  };

  // 处理视频加载错误
  const handleVideoError = (error: any) => {
    console.error('视频加载失败:', error);
    console.error('视频URL:', videoUrl);
    console.error('错误详情:', error.target?.error);
    setHasError(true);
    setIsLoading(false);

    // 检查错误类型
    const video = videoRef.current;
    if (video?.error) {
      const errorCode = video.error.code;
      const errorMessage = video.error.message;
      console.error(`视频错误代码: ${errorCode}, 消息: ${errorMessage}`);

      switch (errorCode) {
        case 1: // MEDIA_ERR_ABORTED
          console.error('视频加载被中止');
          break;
        case 2: // MEDIA_ERR_NETWORK
          console.error('网络错误');
          break;
        case 3: // MEDIA_ERR_DECODE
          console.error('视频解码错误');
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          console.error('视频格式不支持');
          break;
      }
    }

    toast.error("视频加载失败，请检查网络连接或视频URL");
  };

  // 处理视频播放/暂停
  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('播放失败:', error);
        toast.error("视频播放失败");
      });
    }
  };

  // 切换静音
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // 处理Preview点击
  const handlePreviewClick = () => {
    if (onPreview && !hasError) {
      onPreview(videoUrl, startTime);
      toast.success("正在中央Preview区播放视频");
    }
  };

  // 处理视频时间更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // 可以在这里添加时间更新逻辑
    };

    const handleEnded = () => {
      setIsPlaying(false);
      video.currentTime = startTime; // 重置到开始时间
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [startTime]);

  // 处理静音状态
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className={`relative group ${className}`}>
      {/* 视频显示区域 */}
      <div
        className={`relative overflow-hidden rounded-md cursor-pointer transition-all duration-200 bg-black ${
          isHovered ? 'ring-2 ring-blue-500 scale-105' : ''
        }`}
        style={{ 
          width, 
          height,
          aspectRatio: '16/9' // 确保视频比例正确
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePreviewClick}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">加载失败</span>
          </div>
        )}

        {/* 直接显示视频 - 优化全屏显示 */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          preload="metadata"
          muted={isMuted}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          style={{ 
            display: hasError ? 'none' : 'block',
            objectFit: 'cover',
            objectPosition: 'center',
            backgroundColor: '#000'
          }}
          playsInline
          controls={false}
        />

        {/* 控制按钮覆盖层 */}
        {!isLoading && !hasError && (
          <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center gap-2">
              {/* 播放/暂停按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
                className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </Button>

              {/* 静音按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
                className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2"
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 移除时间标签以获得更清洁的显示效果 */}
        {/* 
        {!isLoading && !hasError && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
            {Math.floor(startTime / 60)}:{(startTime % 60).toString().padStart(2, '0')}
          </div>
        )}
        */}

        {/* 移除视频类型标识框 - 这是导致头部出现框的原因 */}
        {/* 
        {!isLoading && !hasError && (
          <div className="absolute top-1 left-1 bg-blue-600/80 text-white text-xs px-1 rounded">
            视频
          </div>
        )}
        */}
      </div>

      {/* Preview提示 */}
      {isHovered && !hasError && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          点击在中央区域Preview
        </div>
      )}
    </div>
  );
}
