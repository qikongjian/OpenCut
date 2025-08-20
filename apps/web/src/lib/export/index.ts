// index.ts - 导出系统入口文件
// 此文件统一导出所有导出相关的功能
// 文件路径: lib/export/index.ts

// 核心导出管理器
export { exportManager, ExportManager } from "./export-manager";

// 导出引擎
export { FrontendExporter } from "./frontend-exporter";
export { BackendExporter } from "./backend-exporter";

// 策略和分析
export { ExportStrategyEngine } from "./strategy-engine";
export { detectDeviceInfo, watchDeviceChanges, runPerformanceBenchmark } from "./device-detection";
export { analyzeProject, getPerformanceRecommendations, isSuitableForFrontendExport } from "./project-analyzer";

// IR和字幕生成
export { IRGenerator } from "./ir-generator";
export { ASSGenerator } from "./ass-generator";

// FFmpeg工具
export { ffmpegManager, FFmpegManager, FFmpegCommandBuilder } from "./ffmpeg-manager";

// 性能分析和优化
export { performanceAnalyzer, PerformanceAnalyzer, type PerformanceAnalysis } from "./performance-analyzer";

// 类型定义
export type {
  ExportOptions,
  ExportProgress,
  ExportResult,
  ExportError,
  ExportStrategy,
  ExportQuality,
  ExportMethod,
  PrivacyLevel,
  DeviceInfo,
  ProjectAnalysis,
  UserPreference,
  TimelineSegment,
  ASSFile,
  ASSStyle,
  ASSDialogue,
} from "@/types/export";

export type { TimelineIR } from "@/types/timeline";

/**
 * 导出系统快速开始指南
 * 
 * 1. 基础使用：
 * ```typescript
 * import { exportManager } from "@/lib/export";
 * 
 * // 智能导出（推荐）
 * const result = await exportManager.smartExport({
 *   privacy: 'balanced',
 *   quality: 'standard',
 * });
 * 
 * // 手动导出
 * const result = await exportManager.manualExport({
 *   quality: 'standard',
 *   method: 'frontend',
 *   format: 'mp4',
 *   codec: 'h264',
 *   subtitleMode: 'hard',
 * });
 * ```
 * 
 * 2. 获取导出策略建议：
 * ```typescript
 * const strategies = await exportManager.getExportStrategy({
 *   privacy: 'balanced',
 *   quality: 'standard',
 * });
 * 
 * console.log('推荐策略:', strategies.primary);
 * console.log('备选方案:', strategies.alternatives);
 * ```
 * 
 * 3. 检查导出能力：
 * ```typescript
 * const capabilities = await exportManager.checkCapabilities();
 * 
 * if (capabilities.frontend.available) {
 *   console.log('支持前端导出');
 * }
 * 
 * if (capabilities.backend.available) {
 *   console.log('支持后端导出');
 * }
 * ```
 * 
 * 4. 预览导出设置：
 * ```typescript
 * const preview = await exportManager.previewExport({
 *   privacy: 'balanced',
 *   quality: 'standard',
 * });
 * 
 * console.log('预估文件大小:', preview.estimatedResult.fileSize);
 * console.log('预估处理时间:', preview.estimatedResult.duration);
 * console.log('警告信息:', preview.warnings);
 * ```
 * 
 * 5. 监听导出进度：
 * ```typescript
 * const result = await exportManager.smartExport(
 *   { privacy: 'balanced', quality: 'standard' },
 *   (progress) => {
 *     console.log(`进度: ${Math.round(progress.overall * 100)}%`);
 *     console.log(`阶段: ${progress.stage}`);
 *     console.log(`消息: ${progress.message}`);
 *   }
 * );
 * ```
 */

/**
 * 导出系统初始化
 * 在应用启动时调用此函数来初始化导出系统
 */
export async function initializeExportSystem(): Promise<void> {
  try {
    await exportManager.initialize();
    console.log('Export system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize export system:', error);
    throw error;
  }
}

/**
 * 导出系统健康检查
 * 检查导出系统的各个组件是否正常工作
 */
export async function checkExportSystemHealth(): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    frontend: 'healthy' | 'unhealthy';
    backend: 'healthy' | 'unhealthy';
    device: 'healthy' | 'unhealthy';
  };
  details: string[];
}> {
  const details: string[] = [];
  let healthyComponents = 0;
  const totalComponents = 3;

  // 检查前端能力
  let frontendHealth: 'healthy' | 'unhealthy' = 'unhealthy';
  try {
    const deviceInfo = exportManager.getDeviceInfo();
    if (deviceInfo && deviceInfo.supportsWasm && deviceInfo.supportsWebWorkers) {
      frontendHealth = 'healthy';
      healthyComponents++;
      details.push('前端导出功能正常');
    } else {
      details.push('前端导出功能受限：缺少WebAssembly或Web Workers支持');
    }
  } catch (error) {
    details.push(`前端导出检查失败: ${error}`);
  }

  // 检查后端能力
  let backendHealth: 'healthy' | 'unhealthy' = 'unhealthy';
  try {
    const backendExporter = new BackendExporter();
    const health = await backendExporter.checkHealth();
    if (health.healthy && health.ffmpeg) {
      backendHealth = 'healthy';
      healthyComponents++;
      details.push('后端导出功能正常');
    } else {
      details.push(`后端导出功能异常: ${health.message}`);
    }
  } catch (error) {
    details.push(`后端导出检查失败: ${error}`);
  }

  // 检查设备状态
  let deviceHealth: 'healthy' | 'unhealthy' = 'unhealthy';
  try {
    const deviceInfo = exportManager.getDeviceInfo();
    if (deviceInfo && deviceInfo.performanceLevel !== 'low') {
      deviceHealth = 'healthy';
      healthyComponents++;
      details.push('设备性能良好');
    } else {
      details.push('设备性能较低，可能影响导出体验');
    }
  } catch (error) {
    details.push(`设备检查失败: ${error}`);
  }

  // 确定总体健康状态
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyComponents === totalComponents) {
    overall = 'healthy';
  } else if (healthyComponents > 0) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  return {
    overall,
    components: {
      frontend: frontendHealth,
      backend: backendHealth,
      device: deviceHealth,
    },
    details,
  };
}

/**
 * 导出系统配置
 */
export const exportSystemConfig = {
  // 默认用户偏好
  defaultUserPreference: {
    privacy: 'balanced' as PrivacyLevel,
    quality: 'standard' as ExportQuality,
    allowCloudProcessing: true,
  },

  // 性能阈值
  performanceThresholds: {
    maxFrontendMemoryUsage: 1.5 * 1024 * 1024 * 1024, // 1.5GB
    maxFrontendProcessingTime: 600, // 10分钟
    maxComplexityScore: 85,
    maxFileSize: 500 * 1024 * 1024, // 500MB
  },

  // 质量设置
  qualitySettings: {
    preview: {
      crf: 28,
      videoBitrate: '2M',
      audioBitrate: '128k',
      preset: 'veryfast',
    },
    standard: {
      crf: 23,
      videoBitrate: '5M',
      audioBitrate: '192k',
      preset: 'medium',
    },
    professional: {
      crf: 18,
      videoBitrate: '15M',
      audioBitrate: '320k',
      preset: 'slow',
    },
  },

  // 分段设置
  segmentSettings: {
    defaultDuration: 30, // 秒
    minDuration: 10,
    maxDuration: 120,
    maxConcurrency: 2,
  },
} as const;
