// ffmpeg-types.ts - FFmpeg模块类型定义

export interface ExportConfig {
  format: 'mp4' | 'webm' | 'avi' | 'mov';
  resolution: '480p' | '720p' | '1080p' | '4k';
  quality: 'low' | 'medium' | 'high';
  frameRate: string;
}

export interface TimelineData {
  tracks: Array<{
    id: string;
    type: string;
    elements: Array<{
      id: string;
      name?: string; // 添加name属性
      type: string;
      startTime: number;
      duration: number;
      trimStart: number;
      trimEnd: number;
      mediaId?: string;
      mediaFile?: File;
      mediaUrl?: string;
      mediaType?: string;
      mediaWidth?: number;
      mediaHeight?: number;
      mediaFps?: number;
      thumbnailUrl?: string;
      // 转场元素属性
      transitionType?: string;
      direction?: string;
      fromElementId?: string;
      toElementId?: string;
      fromTrackId?: string;
      toTrackId?: string;
      intensity?: number;
      blur?: number;
      // 文本元素属性
      content?: string;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      backgroundColor?: string;
      textAlign?: string;
      fontWeight?: string;
      fontStyle?: string;
      textDecoration?: string;
      x?: number;
      y?: number;
      rotation?: number;
      opacity?: number;
      horizontalFlip?: boolean;
      verticalFlip?: boolean;
      masks?: any[];
    }>;
  }>;
  totalDuration: number;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export type ProgressCallback = (progress: number) => void;

export interface EncodingSettings {
  videoCodec: string;
  audioCodec: string;
  crf: string;
  preset: string;
  tune: string;
  threads: string;
  g: string;
  keyint_min: string;
  sc_threshold: string;
  bf: string;
  refs: string;
  flags: string;
  movflags: string;
  pixfmt: string;
} 