// playback.ts - TypeScript 类型定义
// 此文件包含 typescript 类型定义 的相关代码
// 文件路径: types/playback.ts
// 最后更新: 2025/7/23

// playback.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 接口定义 - 定义对象的结构和属性类型
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  muted: boolean;
  previousVolume?: number;
}

// 接口定义 - 定义对象的结构和属性类型
export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  toggle: () => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
}
