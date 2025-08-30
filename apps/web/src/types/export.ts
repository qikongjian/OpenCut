// types/export.ts - 导出系统类型定义
// 此文件定义导出系统所需的所有类型接口
// 文件路径: types/export.ts

import { TimelineIR } from "./timeline";

/**
 * 导出质量级别
 */
export type ExportQuality = 'preview' | 'standard' | 'professional';

/**
 * 导出方法
 */
export type ExportMethod = 'frontend' | 'backend';

/**
 * 隐私级别
 */
export type PrivacyLevel = 'strict' | 'balanced' | 'permissive';

/**
 * 字幕模式
 */
export type SubtitleMode = 'hard' | 'soft' | 'none';

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出质量 */
  quality: ExportQuality;
  /** 导出方法 */
  method: ExportMethod;
  /** 输出格式 */
  format?: 'mp4' | 'webm' | 'mov';
  /** 视频编码器 */
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';
  /** 字幕模式 */
  subtitleMode?: SubtitleMode;
  /** 是否使用GPU */
  useGPU?: boolean;
  /** 是否使用代理 */
  useProxy?: boolean;
  /** 分段时长（秒） */
  segmentDuration?: number;
  /** 最大并发数 */
  maxConcurrency?: number;
  /** 进度回调 */
  onProgress?: (progress: ExportProgress) => void;
  /** 自定义FFmpeg参数 */
  customFFmpegArgs?: string[];
  /** 🚀 速度模式 */
  speedMode?: 'normal' | 'fast' | 'ultrafast';
}

/**
 * 导出进度
 */
export interface ExportProgress {
  /** 总体进度 (0-1) */
  overall: number;
  /** 当前阶段 */
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing' | 'completed';
  /** 阶段进度 (0-1) */
  stageProgress?: number;
  /** 当前消息 */
  message?: string;
  /** 已用时间（毫秒） */
  elapsedTime: number;
  /** 开始时间 */
  startTime: number;
  /** 预估剩余时间（毫秒） */
  estimatedTimeRemaining?: number;
  /** 当前处理的片段 */
  currentSegment?: number;
  /** 总片段数 */
  totalSegments?: number;
  /** 当前处理的帧数 */
  currentFrame?: number;
  /** 总帧数 */
  totalFrames?: number;
  /** 处理速度（帧/秒） */
  processingSpeed?: number;
  /** 内存使用情况 */
  memoryUsage?: {
    used: number;
    total: number;
    peak: number;
  };
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 输出文件URL */
  url?: string;
  /** 输出文件Blob */
  blob?: Blob;
  /** 文件名 */
  filename?: string;
  /** 文件大小（字节） */
  size?: number;
  /** 处理时长（秒） */
  duration?: number;
  /** 导出质量 */
  quality?: ExportQuality;
  /** 导出方法 */
  method?: ExportMethod;
  /** 输出格式 */
  format?: string;
  /** 视频编码器 */
  codec?: string;
  /** 分辨率 */
  resolution?: {
    width: number;
    height: number;
  };
  /** 帧率 */
  fps?: number;
  /** 比特率 */
  bitrate?: number;
  /** 统计信息 */
  stats?: {
    totalFrames: number;
    processedFrames: number;
    averageSpeed: number;
    peakMemoryUsage: number;
    finalFileSize: number;
  };
  /** 元数据 */
  metadata?: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
  };
  /** 🌐 是否使用云存储 */
  cloudStorage?: boolean;
  /** 🆔 导出任务ID */
  exportId?: string;
  /** 🌍 云存储提供商 */
  cloudProvider?: 'qiniu' | 'aliyun' | 'tencent' | 'aws';
}

/**
 * 导出错误
 */
export interface ExportError extends Error {
  /** 错误代码 */
  code: string;
  /** 错误类型 */
  type: 'validation' | 'processing' | 'encoding' | 'network' | 'system';
  /** 是否可重试 */
  retryable: boolean;
  /** 建议的解决方案 */
  suggestion?: string;
  /** 原始错误 */
  originalError?: Error;
}

/**
 * 导出策略
 */
export interface ExportStrategy {
  /** 导出方法 */
  method: ExportMethod;
  /** 导出质量 */
  quality: ExportQuality;
  /** 选择原因 */
  reason: string;
  /** 预估时间（秒） */
  estimatedTime: number;
  /** 预估文件大小（字节） */
  estimatedSize: number;
  /** 是否使用GPU */
  useGPU: boolean;
  /** 是否使用代理 */
  useProxy: boolean;
  /** 分段时长（秒） */
  segmentDuration: number;
  /** 最大并发数 */
  maxConcurrency: number;
  /** 备选策略 */
  alternatives?: ExportStrategy[];
  /** 警告信息 */
  warnings?: string[];
  /** 性能评分 */
  performanceScore?: number;
  /** 适用性评分 */
  suitabilityScore?: number;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  /** 可用内存（字节） */
  availableMemory: number;
  /** CPU核心数 */
  cpuCores: number;
  /** 是否为低端设备 */
  isLowEndDevice: boolean;
  /** 网络速度 */
  networkSpeed: 'slow' | 'medium' | 'fast';
  /** 是否在线 */
  isOnline: boolean;
  /** 是否支持WebCodecs */
  supportsWebCodecs: boolean;
  /** 是否支持离屏Canvas */
  supportsOffscreenCanvas: boolean;
  /** 是否支持Web Workers */
  supportsWebWorkers: boolean;
  /** 是否支持WebAssembly */
  supportsWasm: boolean;
  /** 性能等级 */
  performanceLevel: 'low' | 'medium' | 'high';
  /** 用户代理 */
  userAgent: string;
  /** 浏览器名称 */
  browserName: string;
  /** 浏览器版本 */
  browserVersion: string;
  /** 操作系统 */
  os?: string;
  /** 设备类型 */
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

/**
 * 项目分析结果
 */
export interface ProjectAnalysis {
  /** 复杂度评分 (0-100) */
  complexityScore: number;
  /** 视频元素数量 */
  videoElementCount: number;
  /** 音频元素数量 */
  audioElementCount: number;
  /** 文本元素数量 */
  textElementCount: number;
  /** 转场效果数量 */
  transitionCount: number;
  /** 特效数量 */
  effectCount: number;
  /** 总时长（秒） */
  totalDuration: number;
  /** 最大分辨率 */
  maxResolution: {
    width: number;
    height: number;
  };
  /** 平均帧率 */
  averageFps: number;
  /** 是否包含字幕 */
  hasSubtitles: boolean;
  /** 是否包含复杂效果 */
  hasComplexEffects: boolean;
  /** 是否包含高分辨率视频 */
  hasHighResVideo: boolean;
  /** 是否包含长视频 */
  hasLongVideos: boolean;
  /** 建议的导出方法 */
  recommendedMethod: ExportMethod;
  /** 建议的质量设置 */
  recommendedQuality: ExportQuality;
  /** 预估处理时间（秒） */
  estimatedProcessingTime: number;
  /** 预估文件大小（字节） */
  estimatedFileSize: number;
  /** 性能建议 */
  performanceRecommendations: string[];
  /** 潜在问题 */
  potentialIssues: string[];
}

/**
 * 用户偏好设置
 */
export interface UserPreference {
  /** 隐私级别 */
  privacy: PrivacyLevel;
  /** 首选质量 */
  preferredQuality: ExportQuality;
  /** 首选格式 */
  preferredFormat?: string;
  /** 首选编码器 */
  preferredCodec?: string;
  /** 是否允许云端处理 */
  allowCloudProcessing: boolean;
  /** 是否优先考虑速度 */
  prioritizeSpeed?: boolean;
  /** 是否优先考虑质量 */
  prioritizeQuality?: boolean;
  /** 是否优先考虑隐私 */
  prioritizePrivacy?: boolean;
  /** 最大等待时间（秒） */
  maxWaitTime?: number;
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 自定义设置 */
  customSettings?: Record<string, any>;
}

/**
 * 时间轴分段
 */
export interface TimelineSegment {
  /** 分段ID */
  id: string;
  /** 开始时间（毫秒） */
  startTime: number;
  /** 结束时间（毫秒） */
  endTime: number;
  /** 时长（毫秒） */
  duration: number;
  /** 包含的元素 */
  elements: {
    video: any[];
    audio: any[];
    text: any[];
    transitions: any[];
  };
  /** 分段类型 */
  type: 'video' | 'audio' | 'mixed' | 'transition';
  /** 复杂度评分 */
  complexityScore: number;
  /** 是否适合前端处理 */
  suitableForFrontend: boolean;
}

/**
 * ASS字幕文件
 */
export interface ASSFile {
  /** 文件内容 */
  content: string;
  /** 样式定义 */
  styles: ASSStyle[];
  /** 对话内容 */
  dialogues: ASSDialogue[];
  /** 字体信息 */
  fonts: string[];
  /** 分辨率 */
  resolution: {
    width: number;
    height: number;
  };
}

/**
 * ASS样式
 */
export interface ASSStyle {
  /** 样式名称 */
  name: string;
  /** 字体名称 */
  fontname: string;
  /** 字体大小 */
  fontsize: number;
  /** 主要颜色 */
  primaryColour: string;
  /** 次要颜色 */
  secondaryColour: string;
  /** 轮廓颜色 */
  outlineColour: string;
  /** 阴影颜色 */
  backColour: string;
  /** 是否粗体 */
  bold: boolean;
  /** 是否斜体 */
  italic: boolean;
  /** 是否下划线 */
  underline: boolean;
  /** 是否删除线 */
  strikeOut: boolean;
  /** 缩放X */
  scaleX: number;
  /** 缩放Y */
  scaleY: number;
  /** 间距 */
  spacing: number;
  /** 角度 */
  angle: number;
  /** 边框样式 */
  borderStyle: number;
  /** 轮廓宽度 */
  outline: number;
  /** 阴影深度 */
  shadow: number;
  /** 对齐方式 */
  alignment: number;
  /** 边距L */
  marginL: number;
  /** 边距R */
  marginR: number;
  /** 边距V */
  marginV: number;
  /** 编码 */
  encoding: number;
}

/**
 * ASS对话
 */
export interface ASSDialogue {
  /** 层 */
  layer: number;
  /** 开始时间 */
  start: string;
  /** 结束时间 */
  end: string;
  /** 样式 */
  style: string;
  /** 名称 */
  name: string;
  /** 边距L */
  marginL: number;
  /** 边距R */
  marginR: number;
  /** 边距V */
  marginV: number;
  /** 效果 */
  effect: string;
  /** 文本内容 */
  text: string;
}

/**
 * 性能分析结果
 */
export interface PerformanceAnalysis {
  /** 总体评分 (0-100) */
  overallScore: number;
  /** CPU性能评分 */
  cpuScore: number;
  /** 内存性能评分 */
  memoryScore: number;
  /** GPU性能评分 */
  gpuScore: number;
  /** 网络性能评分 */
  networkScore: number;
  /** 浏览器兼容性评分 */
  browserScore: number;
  /** 性能等级 */
  performanceLevel: 'low' | 'medium' | 'high';
  /** 瓶颈分析 */
  bottlenecks: string[];
  /** 优化建议 */
  optimizations: string[];
  /** 预期性能 */
  expectedPerformance: {
    maxConcurrentTasks: number;
    maxFileSize: number;
    maxProcessingTime: number;
    recommendedQuality: ExportQuality;
  };
}
