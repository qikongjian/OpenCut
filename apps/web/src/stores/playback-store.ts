// playback-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/playback-store.ts
// 最后更新: 2025/7/23

// playback-store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Zustand 状态管理库
import { create } from "zustand";
import { persist } from "zustand/middleware";
// 导入项目模块
import type { PlaybackState, PlaybackControls } from "@/types/playback";

// PlaybackStore 接口定义
interface PlaybackStore extends PlaybackState, PlaybackControls {
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
}

let playbackTimer: number | null = null;

// startTimer 函数
const startTimer = (store: () => PlaybackStore) => {
  if (playbackTimer) cancelAnimationFrame(playbackTimer);

  // Use requestAnimationFrame for smoother updates
  const updateTime = () => {
// 常量定义 - 模块内部使用的固定值
    const state = store();
    if (state.isPlaying && state.currentTime < state.duration) {
// 常量定义 - 模块内部使用的固定值
      const now = performance.now();
// delta 函数
      const delta = (now - lastUpdate) / 1000; // Convert to seconds
      lastUpdate = now;

// 常量定义 - 模块内部使用的固定值
      const newTime = state.currentTime + delta * state.speed;
      if (newTime >= state.duration) {
        // When video completes, handle based on loop setting
        if (state.isLooping) {
          // Loop back to start
          state.setCurrentTime(0);
          window.dispatchEvent(
            new CustomEvent("playback-seek", { detail: { time: 0 } })
          );
        } else {
          // Pause and reset playhead to start
          state.pause();
          state.setCurrentTime(0);
          // Notify video elements to sync with reset
          window.dispatchEvent(
            new CustomEvent("playback-seek", { detail: { time: 0 } })
          );
        }
      } else {
        state.setCurrentTime(newTime);
        // Notify video elements to sync
        window.dispatchEvent(
          new CustomEvent("playback-update", { detail: { time: newTime } })
        );
      }
    }
    playbackTimer = requestAnimationFrame(updateTime);
  };

  let lastUpdate = performance.now();
  playbackTimer = requestAnimationFrame(updateTime);
};

// stopTimer 函数
const stopTimer = () => {
  if (playbackTimer) {
    cancelAnimationFrame(playbackTimer);
    playbackTimer = null;
  }
};

// 导出常量对象 - 包含多个相关常量的对象
export const usePlaybackStore = create<PlaybackStore>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      previousVolume: 1,
      speed: 1.0,
      // 新增预览模式状态
      previewMode: false,
      previewMedia: null,
      // 新增播放控制增强状态
      isLooping: false,
      playbackQuality: 'auto' as const,
      buffering: false,
      error: null,

  play: () => {
    // 设置状态 - 更新状态值
    set({ isPlaying: true });
    startTimer(get);
  },

  pause: () => {
    // 设置状态 - 更新状态值
    set({ isPlaying: false });
    stopTimer();
  },

  toggle: () => {
// 常量定义 - 模块内部使用的固定值
    const { isPlaying } = get();
    if (isPlaying) {
      // 获取状态 - 读取状态值
      get().pause();
    } else {
      // 获取状态 - 读取状态值
      get().play();
    }
  },

  seek: (time: number) => {
// 常量定义 - 模块内部使用的固定值
    const { duration } = get();
// 常量定义 - 模块内部使用的固定值
    const clampedTime = Math.max(0, Math.min(duration, time));
    // 设置状态 - 更新状态值
    set({ currentTime: clampedTime });

// 常量定义 - 模块内部使用的固定值
    const event = new CustomEvent("playback-seek", {
      detail: { time: clampedTime },
    });
    window.dispatchEvent(event);
  },

  setVolume: (volume: number) =>
    // 设置状态 - 更新状态值
    set((state) => ({
      volume: Math.max(0, Math.min(1, volume)),
      muted: volume === 0,
      previousVolume: volume > 0 ? volume : state.previousVolume,
    })),

  setSpeed: (speed: number) => {
// 常量定义 - 模块内部使用的固定值
    const newSpeed = Math.max(0.1, Math.min(2.0, speed));
    // 设置状态 - 更新状态值
    set({ speed: newSpeed });

// 常量定义 - 模块内部使用的固定值
    const event = new CustomEvent("playback-speed", {
      detail: { speed: newSpeed },
    });
    window.dispatchEvent(event);
  },

  setDuration: (duration: number) => set({ duration }),
  setCurrentTime: (time: number) => set({ currentTime: time }),

  mute: () => {
// 常量定义 - 模块内部使用的固定值
    const { volume, previousVolume } = get();
    // 设置状态 - 更新状态值
    set({
      muted: true,
      previousVolume: volume > 0 ? volume : previousVolume,
      volume: 0,
    });
  },

  unmute: () => {
// 常量定义 - 模块内部使用的固定值
    const { previousVolume } = get();
    // 设置状态 - 更新状态值
    set({ muted: false, volume: previousVolume ?? 1 });
  },

  toggleMute: () => {
// 常量定义 - 模块内部使用的固定值
    const { muted } = get();
    if (muted) {
      // 获取状态 - 读取状态值
      get().unmute();
    } else {
      // 获取状态 - 读取状态值
      get().mute();
    }
  },

  // 新增预览模式控制方法
  setPreviewMode: (mode: boolean) => set({ previewMode: mode }),
  
  setPreviewMedia: (media: any | null) => set({ previewMedia: media }),
  
  playPreview: () => {
    const { previewMedia } = get();
    if (previewMedia) {
      // 预览播放不影响时间轴播放状态
      set({ previewMode: true });
      // 触发预览播放事件
      window.dispatchEvent(new CustomEvent('preview-play', {
        detail: { media: previewMedia }
      }));
    }
  },
  
  pausePreview: () => {
    // 预览暂停不影响时间轴播放状态
    // 触发预览暂停事件
    window.dispatchEvent(new CustomEvent('preview-pause'));
  },

  // 新增播放控制增强方法
  
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  
  setPlaybackQuality: (quality: 'auto' | 'low' | 'medium' | 'high') => 
    set({ playbackQuality: quality }),
  
  setBuffering: (buffering: boolean) => set({ buffering }),
  
  setError: (error: string | null) => set({ error }),
  
  skipForward: (seconds: number) => {
    const { currentTime, duration } = get();
    const newTime = Math.min(currentTime + seconds, duration);
    set({ currentTime: newTime });
    window.dispatchEvent(new CustomEvent('playback-seek', { 
      detail: { time: newTime } 
    }));
  },
  
  skipBackward: (seconds: number) => {
    const { currentTime } = get();
    const newTime = Math.max(currentTime - seconds, 0);
    set({ currentTime: newTime });
    window.dispatchEvent(new CustomEvent('playback-seek', { 
      detail: { time: newTime } 
    }));
  },
  
  jumpToStart: () => {
    set({ currentTime: 0 });
    window.dispatchEvent(new CustomEvent('playback-seek', { 
      detail: { time: 0 } 
    }));
  },
  
  jumpToEnd: () => {
    const { duration } = get();
    set({ currentTime: duration });
    window.dispatchEvent(new CustomEvent('playback-seek', {
      detail: { time: duration }
    }));
  },
    }),
    {
      name: 'playback-store',
      // 🚀 优化：只持久化必要的状态，避免播放状态在刷新后自动恢复
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        previousVolume: state.previousVolume,
        speed: state.speed,
        isLooping: state.isLooping,
        playbackQuality: state.playbackQuality,
        // 不持久化播放状态，避免刷新后自动播放
        // isPlaying: false,
        // currentTime: 0,
        // duration: 0,
      }),
      // 🚀 优化：页面加载后重置播放状态
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 确保页面刷新后播放状态重置
          state.isPlaying = false;
          state.currentTime = 0;
          state.previewMode = false;
          state.previewMedia = null;
          state.buffering = false;
          state.error = null;
        }
      },
    }
  )
);
