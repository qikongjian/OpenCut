// export.ts - 导出系统类型定义
// 此文件包含导出系统的所有类型定义
// 文件路径: types/export.ts

import { TimelineIR, Time } from "./timeline";

// ==================== 导出配置类型 ====================

// 导出质量级别
export type ExportQuality = 'preview' | 'standard' | 'professional';

// 导出方法
export type ExportMethod = 'frontend' | 'backend' | 'hybrid';

// 隐私级别
export type PrivacyLevel = 'strict' | 'balanced' | 'performance';

// 设备性能级别
export type DevicePerformance = 'low' | 'medium' | 'high';

// 网络速度
export type NetworkSpeed = 'slow' | 'medium' | 'fast';

// 导出格式
export type ExportFormat = 'mp4' | 'webm' | 'mov';

// 编码器类型
export type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1';

// 字幕模式
export type SubtitleMode = 'hard' | 'soft' | 'none';

// 导出阶段
export type ExportStage = 'preparing' | 'processing' | 'encoding' | 'finalizing';

// ==================== 设备和环境检测 ====================

// 设备信息
export interface DeviceInfo {
  // 硬件信息
  availableMemory: number; // 可用内存（字节）
  cpuCores: number; // CPU核心数
  isLowEndDevice: boolean; // 是否为低端设备
  
  // 网络信息
  networkSpeed: NetworkSpeed; // 网络速度
  isOnline: boolean; // 是否在线
  
  // 浏览器能力
  supportsWebCodecs: boolean; // 是否支持WebCodecs
  supportsOffscreenCanvas: boolean; // 是否支持OffscreenCanvas
  supportsWebWorkers: boolean; // 是否支持Web Workers
  supportsWasm: boolean; // 是否支持WebAssembly
  
  // 性能评级
  performanceLevel: DevicePerformance;
  
  // 浏览器信息
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

// 项目复杂度分析
export interface ProjectAnalysis {
  // 基本统计
  totalDuration: number; // 总时长（毫秒）
  videoCount: number; // 视频片段数量
  audioCount: number; // 音频片段数量
  textCount: number; // 文本片段数量
  transitionCount: number; // 转场数量
  
  // 文件大小
  totalFileSize: number; // 总文件大小（字节）
  largestFileSize: number; // 最大单文件大小（字节）
  averageFileSize: number; // 平均文件大小（字节）
  
  // 复杂度分析
  hasComplexEffects: boolean; // 是否包含复杂效果
  hasAIFeatures: boolean; // 是否使用AI功能
  hasCustomTransitions: boolean; // 是否有自定义转场
  hasMultipleTracks: boolean; // 是否有多轨道
  complexityScore: number; // 复杂度评分（0-100）
  
  // 质量要求
  maxResolution: { width: number; height: number }; // 最高分辨率
  requiresHighQuality: boolean; // 是否需要高质量输出
  
  // 性能预估
  estimatedMemoryUsage: number; // 预估内存使用（字节）
  estimatedProcessingTime: number; // 预估处理时间（秒）
}

// 用户偏好设置
export interface UserPreference {
  privacy: PrivacyLevel; // 隐私级别
  quality: ExportQuality; // 质量偏好
  method?: ExportMethod; // 导出方法偏好（可选，auto为自动选择）
  maxWaitTime?: number; // 最大等待时间（秒）
  allowCloudProcessing?: boolean; // 是否允许云端处理
  preferredFormat?: ExportFormat; // 首选格式
  preferredCodec?: VideoCodec; // 首选编码器
}

// ==================== 导出策略和选项 ====================

// 导出策略
export interface ExportStrategy {
  method: ExportMethod; // 推荐的导出方法
  quality: ExportQuality; // 推荐的质量级别
  reason: string; // 推荐理由
  estimatedTime: number; // 预估时间（秒）
  estimatedSize: number; // 预估文件大小（字节）
  confidence: number; // 推荐置信度（0-1）
  warnings?: string[]; // 警告信息
  alternatives?: ExportStrategy[]; // 备选方案
  
  // 技术细节
  segmentDuration?: number; // 分段时长（秒）
  useGPU?: boolean; // 是否使用GPU
  useProxy?: boolean; // 是否使用代理媒体
  maxConcurrency?: number; // 最大并发数
}

// 导出选项
export interface ExportOptions {
  // 基本设置
  quality: ExportQuality;
  method: ExportMethod;
  
  // 输出设置
  format: ExportFormat; // 输出格式
  codec: VideoCodec; // 编码器
  bitrate?: number; // 码率（kbps）
  fps?: number; // 帧率
  
  // 分辨率设置
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  
  // 字幕设置
  subtitleMode: SubtitleMode; // 字幕模式
  fontDir?: string; // 字体目录
  
  // 高级设置
  useGPU?: boolean; // 是否使用GPU加速
  useProxy?: boolean; // 是否使用代理媒体
  segmentDuration?: number; // 分段时长（秒）
  maxConcurrency?: number; // 最大并发数
  
  // 质量设置
  crf?: number; // 恒定质量因子
  preset?: string; // 编码预设
  
  // 回调函数
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: (result: ExportResult) => void;
  onError?: (error: ExportError) => void;
  onWarning?: (warning: string) => void;
}

// ==================== 导出进度和结果 ====================

// 导出进度
export interface ExportProgress {
  // 总体进度
  overall: number; // 总体进度（0-1）
  stage: ExportStage; // 当前阶段
  
  // 分段进度（前端导出）
  currentSegment?: number; // 当前处理的段
  totalSegments?: number; // 总段数
  segmentProgress?: number; // 当前段进度（0-1）
  
  // 时间信息
  elapsedTime: number; // 已用时间（秒）
  estimatedTimeRemaining?: number; // 预估剩余时间（秒）
  startTime: number; // 开始时间戳
  
  // 详细信息
  message?: string; // 进度消息
  currentFile?: string; // 当前处理的文件
  processedFrames?: number; // 已处理帧数
  totalFrames?: number; // 总帧数
  
  // 性能信息
  memoryUsage?: number; // 内存使用（字节）
  cpuUsage?: number; // CPU使用率（0-1）
  speed?: number; // 处理速度（倍速）
}

// 导出结果
export interface ExportResult {
  success: boolean;
  blob?: Blob; // 导出的文件
  url?: string; // 文件URL
  filename?: string; // 文件名
  size?: number; // 文件大小（字节）
  duration?: number; // 实际处理时间（秒）
  quality?: ExportQuality; // 实际质量级别
  method?: ExportMethod; // 实际使用的方法
  
  // 统计信息
  stats?: {
    totalFrames: number;
    processedFrames: number;
    averageSpeed: number; // 平均处理速度
    peakMemoryUsage: number; // 峰值内存使用
    finalFileSize: number; // 最终文件大小
  };
  
  // 元数据
  metadata?: {
    width: number;
    height: number;
    fps: number;
    duration: number; // 视频时长（秒）
    codec: string;
    bitrate: number;
  };
}

// 导出错误
export interface ExportError {
  code: string; // 错误代码
  message: string; // 错误消息
  stage?: ExportStage; // 出错阶段
  details?: any; // 详细错误信息
  recoverable?: boolean; // 是否可恢复
  suggestions?: string[]; // 解决建议
  
  // 错误上下文
  context?: {
    currentSegment?: number;
    currentFile?: string;
    memoryUsage?: number;
    timeElapsed?: number;
  };
}

// ==================== 分段处理相关 ====================

// 时间线分段
export interface TimelineSegment {
  id: string;
  startTime: number; // 段开始时间（毫秒）
  endTime: number; // 段结束时间（毫秒）
  duration: number; // 段时长（毫秒）
  
  // 包含的元素
  videoElements: string[]; // 视频元素ID列表
  audioElements: string[]; // 音频元素ID列表
  textElements: string[]; // 文本元素ID列表
  transitions: string[]; // 转场ID列表
  
  // 分段特性
  hasComplexEffects: boolean; // 是否包含复杂效果
  estimatedMemoryUsage: number; // 预估内存使用
  priority: number; // 处理优先级
}

// 分段处理结果
export interface SegmentResult {
  segmentId: string;
  success: boolean;
  blob?: Blob; // 分段文件
  tempPath?: string; // 临时文件路径
  duration: number; // 处理时间（秒）
  size: number; // 文件大小（字节）
  error?: ExportError; // 错误信息
}

// ==================== ASS字幕相关 ====================

// ASS样式定义
export interface ASSStyle {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string; // 主要颜色
  secondaryColor: string; // 次要颜色
  outlineColor: string; // 描边颜色
  backColor: string; // 背景颜色
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeOut: boolean;
  scaleX: number;
  scaleY: number;
  spacing: number;
  angle: number;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
  encoding: number;
}

// ASS对话行
export interface ASSDialogue {
  layer: number;
  start: string; // 开始时间（ASS格式）
  end: string; // 结束时间（ASS格式）
  style: string; // 样式名称
  name: string; // 说话人
  marginL: number;
  marginR: number;
  marginV: number;
  effect: string;
  text: string; // 对话文本
}

// ASS文件结构
export interface ASSFile {
  scriptInfo: Record<string, string>;
  styles: ASSStyle[];
  events: ASSDialogue[];
}
