"use client";

// video-preview-player.tsx - 中央视频预览播放器
// 此文件包含 中央视频播放区预览功能 的相关代码
// 文件路径: components/editor/video-preview-player.tsx
// 最后更新: 2025/1/8

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from "lucide-react";
import { useVideoPreviewStore } from "@/stores/video-preview-store";
import { toast } from "sonner";

export function VideoPreviewPlayer() {
  const {
    currentVideoUrl,
    currentStartTime,
    isPlaying,
    isPreviewing,
    togglePlayPause,
    stopPreview,
    setPlaybackTime
  } = useVideoPreviewStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 处理视频加载
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.currentTime = currentStartTime;
      setCurrentTime(currentStartTime);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setCurrentTime(0);
      video.currentTime = currentStartTime;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoUrl, currentStartTime]);

  // 处理播放状态变化
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(error => {
        console.error('播放失败:', error);
        toast.error("视频播放失败");
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // 处理音量变化
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // 格式化时间显示
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 处理进度条拖拽
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    setPlaybackTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // 处理音量调节
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // 切换静音
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 重置到开始时间
  const resetToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentStartTime;
      setCurrentTime(currentStartTime);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!isPreviewing || !currentVideoUrl) {
    return (
      <div className="w-full h-full bg-black/5 rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>点击视频缩略图开始预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden flex flex-col">
      {/* 视频播放区域 */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          src={currentVideoUrl}
          className="w-full h-full object-cover"
          preload="metadata"
          playsInline
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={(e) => {
            console.error('视频预览播放器加载失败:', e);
            console.error('视频URL:', currentVideoUrl);
          }}
        />
        
        {/* 播放控制覆盖层 */}
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlayPause}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* 视频信息显示 */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
          AI剪辑预览
        </div>

        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={stopPreview}
          className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white"
        >
          ✕
        </Button>
      </div>

      {/* 控制栏 */}
      <div className="bg-black/90 text-white p-4 space-y-3">
        {/* 进度条 */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-sm font-mono min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToStart}
              className="text-white hover:bg-white/20"
              title="重置到开始时间"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* 音量控制 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />

            {/* 全屏按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
