// video-preview-store.ts - 视频预览状态管理
// 此文件包含 中央视频播放区预览功能 的相关代码
// 文件路径: stores/video-preview-store.ts
// 最后更新: 2025/1/8

import { create } from "zustand";
import { toast } from "sonner";

// 视频预览状态接口
interface VideoPreviewState {
  // 当前预览的视频信息
  currentVideoUrl: string | null;
  currentStartTime: number;
  isPlaying: boolean;
  isPreviewing: boolean;
  
  // 预览控制方法
  startPreview: (videoUrl: string, startTime?: number) => void;
  stopPreview: () => void;
  togglePlayPause: () => void;
  setPlaybackTime: (time: number) => void;
  
  // 预览状态查询
  isPreviewingVideo: (videoUrl: string) => boolean;
}

// 创建视频预览状态管理
export const useVideoPreviewStore = create<VideoPreviewState>((set, get) => ({
  // 初始状态
  currentVideoUrl: null,
  currentStartTime: 0,
  isPlaying: false,
  isPreviewing: false,

  // 开始预览视频
  startPreview: (videoUrl: string, startTime = 0) => {
    const { currentVideoUrl } = get();
    
    // 如果是同一个视频，只更新时间
    if (currentVideoUrl === videoUrl) {
      set({
        currentStartTime: startTime,
        isPlaying: true
      });
      return;
    }

    // 切换到新视频
    set({
      currentVideoUrl: videoUrl,
      currentStartTime: startTime,
      isPlaying: true,
      isPreviewing: true
    });

    console.log(`开始预览视频: ${videoUrl}, 起始时间: ${startTime}s`);
  },

  // 停止预览
  stopPreview: () => {
    set({
      currentVideoUrl: null,
      currentStartTime: 0,
      isPlaying: false,
      isPreviewing: false
    });
  },

  // 切换播放/暂停
  togglePlayPause: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  // 设置播放时间
  setPlaybackTime: (time: number) => {
    set({ currentStartTime: time });
  },

  // 检查是否正在预览指定视频
  isPreviewingVideo: (videoUrl: string) => {
    const { currentVideoUrl, isPreviewing } = get();
    return isPreviewing && currentVideoUrl === videoUrl;
  },
}));
