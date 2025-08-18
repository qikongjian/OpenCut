// project-analyzer.ts - 项目复杂度分析器
// 此文件负责分析项目的复杂度和资源需求
// 文件路径: lib/export/project-analyzer.ts

import { ProjectAnalysis } from "@/types/export";
import { TimelineIR } from "@/types/timeline";

/**
 * 分析项目复杂度和资源需求
 */
export function analyzeProject(ir: TimelineIR): ProjectAnalysis {
  const analysis: ProjectAnalysis = {
    totalDuration: ir.duration,
    videoCount: ir.video.length,
    audioCount: ir.audio.length,
    textCount: ir.texts.length,
    transitionCount: ir.transitions.length,
    
    totalFileSize: 0,
    largestFileSize: 0,
    averageFileSize: 0,
    
    hasComplexEffects: false,
    hasAIFeatures: false,
    hasCustomTransitions: false,
    hasMultipleTracks: false,
    complexityScore: 0,
    
    maxResolution: { width: ir.width, height: ir.height },
    requiresHighQuality: false,
    
    estimatedMemoryUsage: 0,
    estimatedProcessingTime: 0,
  };

  // 分析文件大小（需要从实际文件获取，这里先估算）
  analysis.totalFileSize = estimateProjectFileSize(ir);
  analysis.largestFileSize = estimateLargestFileSize(ir);
  analysis.averageFileSize = analysis.totalFileSize / Math.max(1, analysis.videoCount + analysis.audioCount);

  // 分析复杂度特征
  analysis.hasComplexEffects = detectComplexEffects(ir);
  analysis.hasAIFeatures = detectAIFeatures(ir);
  analysis.hasCustomTransitions = detectCustomTransitions(ir);
  analysis.hasMultipleTracks = detectMultipleTracks(ir);

  // 计算复杂度评分
  analysis.complexityScore = calculateComplexityScore(analysis, ir);

  // 判断是否需要高质量输出
  analysis.requiresHighQuality = determineHighQualityRequirement(analysis, ir);

  // 估算资源需求
  analysis.estimatedMemoryUsage = estimateMemoryUsage(analysis, ir);
  analysis.estimatedProcessingTime = estimateProcessingTime(analysis, ir);

  return analysis;
}

/**
 * 估算项目总文件大小
 */
function estimateProjectFileSize(ir: TimelineIR): number {
  let totalSize = 0;

  // 估算视频文件大小
  for (const video of ir.video) {
    const duration = (video.out - video.in) / 1000; // 转换为秒
    const estimatedBitrate = 5000; // 5Mbps 估算
    totalSize += (duration * estimatedBitrate * 1000) / 8; // 转换为字节
  }

  // 估算音频文件大小
  for (const audio of ir.audio) {
    const duration = (audio.out - audio.in) / 1000;
    const estimatedBitrate = 128; // 128kbps 估算
    totalSize += (duration * estimatedBitrate * 1000) / 8;
  }

  return totalSize;
}

/**
 * 估算最大单文件大小
 */
function estimateLargestFileSize(ir: TimelineIR): number {
  let largestSize = 0;

  for (const video of ir.video) {
    const duration = (video.out - video.in) / 1000;
    const estimatedBitrate = 5000; // 5Mbps
    const fileSize = (duration * estimatedBitrate * 1000) / 8;
    largestSize = Math.max(largestSize, fileSize);
  }

  return largestSize;
}

/**
 * 检测复杂效果
 */
function detectComplexEffects(ir: TimelineIR): boolean {
  // 检查视频变换
  for (const video of ir.video) {
    if (video.transform) {
      const { x, y, scale, rotate } = video.transform;
      if (x !== 0 || y !== 0 || scale !== 1 || rotate !== 0) {
        return true;
      }
    }
  }

  // 检查复杂转场
  for (const transition of ir.transitions) {
    if (transition.kind === 'wipe' || transition.kind === 'slide') {
      return true;
    }
  }

  // 检查文本效果
  for (const text of ir.texts) {
    if (text.style.shadow || text.style.rotation || text.style.opacity !== 1) {
      return true;
    }
  }

  return false;
}

/**
 * 检测AI功能使用
 */
function detectAIFeatures(ir: TimelineIR): boolean {
  // 检查是否有AI生成的字幕或内容
  // 这里可以根据实际的AI功能标识来判断
  return false; // 暂时返回false，后续根据实际情况调整
}

/**
 * 检测自定义转场
 */
function detectCustomTransitions(ir: TimelineIR): boolean {
  return ir.transitions.some(t => 
    !['cross', 'fade'].includes(t.kind) || t.duration > 2000
  );
}

/**
 * 检测多轨道
 */
function detectMultipleTracks(ir: TimelineIR): boolean {
  // 检查是否有多个视频轨道同时存在
  const videoTracks = new Set(ir.video.map(v => v.trackId));
  const audioTracks = new Set(ir.audio.map(a => a.trackId));
  
  return videoTracks.size > 1 || audioTracks.size > 1 || ir.texts.length > 0;
}

/**
 * 计算复杂度评分 (0-100)
 */
function calculateComplexityScore(analysis: ProjectAnalysis, ir: TimelineIR): number {
  let score = 0;

  // 基础复杂度 (20分)
  score += Math.min(20, analysis.videoCount * 2);
  score += Math.min(10, analysis.audioCount);
  score += Math.min(10, analysis.textCount);

  // 时长复杂度 (20分)
  const durationMinutes = analysis.totalDuration / (1000 * 60);
  score += Math.min(20, durationMinutes * 2);

  // 效果复杂度 (30分)
  if (analysis.hasComplexEffects) score += 15;
  if (analysis.hasCustomTransitions) score += 10;
  if (analysis.hasMultipleTracks) score += 5;

  // 转场复杂度 (15分)
  score += Math.min(15, analysis.transitionCount * 3);

  // 分辨率复杂度 (15分)
  const pixelCount = analysis.maxResolution.width * analysis.maxResolution.height;
  if (pixelCount >= 3840 * 2160) score += 15; // 4K
  else if (pixelCount >= 1920 * 1080) score += 10; // 1080p
  else if (pixelCount >= 1280 * 720) score += 5; // 720p

  return Math.min(100, score);
}

/**
 * 判断是否需要高质量输出
 */
function determineHighQualityRequirement(analysis: ProjectAnalysis, ir: TimelineIR): boolean {
  // 4K分辨率
  if (ir.width >= 3840 || ir.height >= 2160) return true;
  
  // 长视频
  if (analysis.totalDuration > 10 * 60 * 1000) return true; // 超过10分钟
  
  // 复杂项目
  if (analysis.complexityScore > 70) return true;
  
  // 多轨道项目
  if (analysis.hasMultipleTracks && analysis.videoCount > 5) return true;

  return false;
}

/**
 * 估算内存使用 (字节)
 */
function estimateMemoryUsage(analysis: ProjectAnalysis, ir: TimelineIR): number {
  let memoryUsage = 0;

  // 基础内存使用
  memoryUsage += 100 * 1024 * 1024; // 100MB 基础

  // 视频解码内存
  const pixelCount = ir.width * ir.height;
  const frameSize = pixelCount * 4; // RGBA
  const bufferFrames = 30; // 缓冲30帧
  memoryUsage += frameSize * bufferFrames * analysis.videoCount;

  // 音频解码内存
  const audioBufferSize = 48000 * 2 * 4; // 48kHz, 立体声, 32位浮点
  memoryUsage += audioBufferSize * analysis.audioCount;

  // 效果处理内存
  if (analysis.hasComplexEffects) {
    memoryUsage *= 1.5; // 增加50%
  }

  // 转场处理内存
  if (analysis.hasCustomTransitions) {
    memoryUsage += frameSize * 2; // 额外2帧用于转场
  }

  return memoryUsage;
}

/**
 * 估算处理时间 (秒)
 */
function estimateProcessingTime(analysis: ProjectAnalysis, ir: TimelineIR): number {
  const durationSeconds = analysis.totalDuration / 1000;
  
  // 基础处理时间 (实时的2-5倍)
  let processingTime = durationSeconds * 3;

  // 复杂度调整
  const complexityMultiplier = 1 + (analysis.complexityScore / 100);
  processingTime *= complexityMultiplier;

  // 分辨率调整
  const pixelCount = ir.width * ir.height;
  if (pixelCount >= 3840 * 2160) processingTime *= 2; // 4K
  else if (pixelCount >= 1920 * 1080) processingTime *= 1.5; // 1080p

  // 效果调整
  if (analysis.hasComplexEffects) processingTime *= 1.3;
  if (analysis.hasCustomTransitions) processingTime *= 1.2;

  return processingTime;
}

/**
 * 获取项目性能建议
 */
export function getPerformanceRecommendations(analysis: ProjectAnalysis): string[] {
  const recommendations: string[] = [];

  if (analysis.complexityScore > 80) {
    recommendations.push("项目复杂度很高，建议使用后端导出以获得更好的性能");
  }

  if (analysis.estimatedMemoryUsage > 2 * 1024 * 1024 * 1024) { // 2GB
    recommendations.push("预估内存使用较高，建议关闭其他应用程序");
  }

  if (analysis.videoCount > 20) {
    recommendations.push("视频片段较多，建议使用分段导出模式");
  }

  if (analysis.totalDuration > 30 * 60 * 1000) { // 30分钟
    recommendations.push("视频较长，建议使用后端导出以避免浏览器超时");
  }

  if (analysis.hasComplexEffects) {
    recommendations.push("包含复杂效果，可能需要更长的处理时间");
  }

  if (analysis.requiresHighQuality) {
    recommendations.push("检测到高质量需求，建议选择专业导出模式");
  }

  return recommendations;
}

/**
 * 检查项目是否适合前端导出
 */
export function isSuitableForFrontendExport(analysis: ProjectAnalysis): {
  suitable: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let suitable = true;

  // 检查内存使用
  if (analysis.estimatedMemoryUsage > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
    suitable = false;
    reasons.push("预估内存使用过高");
  }

  // 检查处理时间
  if (analysis.estimatedProcessingTime > 600) { // 10分钟
    suitable = false;
    reasons.push("预估处理时间过长");
  }

  // 检查复杂度
  if (analysis.complexityScore > 85) {
    suitable = false;
    reasons.push("项目复杂度过高");
  }

  // 检查文件大小
  if (analysis.totalFileSize > 500 * 1024 * 1024) { // 500MB
    suitable = false;
    reasons.push("项目文件总大小过大");
  }

  return { suitable, reasons };
}
