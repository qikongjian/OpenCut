// export-manager.ts - 导出管理器
// 此文件统一管理前端和后端导出，提供智能策略选择
// 文件路径: lib/export/export-manager.ts

import { TimelineIR } from "@/types/timeline";
import { 
  ExportOptions, 
  ExportProgress, 
  ExportResult, 
  ExportError,
  ExportStrategy,
  DeviceInfo,
  ProjectAnalysis,
  UserPreference 
} from "@/types/export";
import { detectDeviceInfo } from "./device-detection";
import { analyzeProject } from "./project-analyzer";
import { ExportStrategyEngine } from "./strategy-engine";
import { FrontendExporter } from "./frontend-exporter";
import { BackendExporter } from "./backend-exporter";
import { IRGenerator } from "./ir-generator";

/**
 * 导出管理器 - 统一的导出接口
 */
export class ExportManager {
  private static instance: ExportManager;
  private frontendExporter: FrontendExporter;
  private backendExporter: BackendExporter;
  private deviceInfo: DeviceInfo | null = null;
  private isInitialized = false;

  private constructor() {
    this.frontendExporter = new FrontendExporter();
    this.backendExporter = new BackendExporter();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager();
    }
    return ExportManager.instance;
  }

  /**
   * 初始化导出管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 检测设备信息
      this.deviceInfo = await detectDeviceInfo();
      this.isInitialized = true;
      console.log('Export manager initialized with device info:', this.deviceInfo);
    } catch (error) {
      console.warn('Failed to initialize export manager:', error);
      // 使用默认设备信息
      this.deviceInfo = this.getDefaultDeviceInfo();
      this.isInitialized = true;
    }
  }

  /**
   * 智能导出 - 强制使用后端导出（调试模式）
   */
  async smartExport(
    userPreference: UserPreference,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    await this.ensureInitialized();

    // 生成IR
    const ir = IRGenerator.generateIR();

    console.log('🔧 调试模式：强制使用后端导出');
    console.log('IR数据:', {
      videoCount: ir.video.length,
      audioCount: ir.audio.length,
      textCount: ir.texts.length,
      duration: ir.duration,
      width: ir.width,
      height: ir.height,
      fps: ir.fps,
    });

    // 强制使用后端导出策略（跳过策略选择和健康检查）
    const strategy = {
      method: 'backend' as const,
      quality: userPreference.preferredQuality || 'standard' as const,
      reason: '调试模式：强制后端导出',
      estimatedTime: 60,
      estimatedSize: 50 * 1024 * 1024, // 50MB
      useGPU: false,
      useProxy: false,
      segmentDuration: 10,
      maxConcurrency: 1,
      alternatives: [],
    };

    console.log('🚀 使用后端导出策略:', strategy);

    // 构建导出选项
    const options: ExportOptions = {
      quality: strategy.quality,
      method: strategy.method,
      format: userPreference.preferredFormat || 'mp4',
      codec: userPreference.preferredCodec || 'h264',
      subtitleMode: 'hard',
      useGPU: strategy.useGPU,
      useProxy: strategy.useProxy,
      segmentDuration: strategy.segmentDuration,
      maxConcurrency: strategy.maxConcurrency,
      onProgress,
    };

    console.log('📋 导出选项:', options);

    // 直接执行后端导出（跳过executeExport的策略判断）
    console.log('🎬 开始后端导出...');
    return await this.backendExporter.exportWithProgress(ir, options);
  }

  /**
   * 手动导出 - 使用指定选项
   */
  async manualExport(
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    await this.ensureInitialized();

    const ir = IRGenerator.generateIR();
    const enhancedOptions = { ...options, onProgress };

    // 根据指定方法执行导出
    switch (options.method) {
      case 'frontend':
        return await this.frontendExporter.export(ir, enhancedOptions);
      case 'backend':
        return await this.backendExporter.exportWithProgress(ir, enhancedOptions);
      default:
        throw new Error(`Unsupported export method: ${options.method}`);
    }
  }

  /**
   * 获取导出策略建议
   */
  async getExportStrategy(userPreference: UserPreference): Promise<{
    primary: ExportStrategy;
    alternatives: ExportStrategy[];
  }> {
    await this.ensureInitialized();

    const ir = IRGenerator.generateIR();
    const projectAnalysis = analyzeProject(ir);
    
    const primaryStrategy = ExportStrategyEngine.determineStrategy(
      ir,
      this.deviceInfo!,
      projectAnalysis,
      userPreference
    );

    const alternatives = ExportStrategyEngine.getAlternativeStrategies(
      primaryStrategy,
      ir,
      this.deviceInfo!,
      projectAnalysis,
      userPreference
    );

    return {
      primary: primaryStrategy,
      alternatives,
    };
  }

  /**
   * 检查导出能力
   */
  async checkCapabilities(): Promise<{
    frontend: {
      available: boolean;
      features: string[];
      limitations: string[];
    };
    backend: {
      available: boolean;
      features: string[];
      limitations: string[];
    };
  }> {
    await this.ensureInitialized();

    // 检查前端能力
    const frontendCapabilities = {
      available: this.deviceInfo!.supportsWasm && this.deviceInfo!.supportsWebWorkers,
      features: [] as string[],
      limitations: [] as string[],
    };

    if (this.deviceInfo!.supportsWebCodecs) {
      frontendCapabilities.features.push('硬件加速解码');
    }
    if (this.deviceInfo!.supportsOffscreenCanvas) {
      frontendCapabilities.features.push('离屏渲染');
    }
    if (this.deviceInfo!.performanceLevel === 'low') {
      frontendCapabilities.limitations.push('设备性能较低');
    }

    // 检查后端能力
    const backendHealth = await this.backendExporter.checkHealth();
    const backendCapabilities = {
      available: backendHealth.healthy && backendHealth.ffmpeg,
      features: [] as string[],
      limitations: [] as string[],
    };

    if (backendCapabilities.available) {
      backendCapabilities.features.push('GPU硬件加速', '高质量编码', '大文件处理');
    } else {
      backendCapabilities.limitations.push(backendHealth.message || '服务不可用');
    }

    if (!this.deviceInfo!.isOnline) {
      backendCapabilities.limitations.push('当前离线');
    }

    return {
      frontend: frontendCapabilities,
      backend: backendCapabilities,
    };
  }

  /**
   * 预览导出设置
   */
  async previewExport(userPreference: UserPreference): Promise<{
    strategy: ExportStrategy;
    projectAnalysis: ProjectAnalysis;
    estimatedResult: {
      fileSize: number;
      duration: number;
      quality: string;
    };
    warnings: string[];
  }> {
    await this.ensureInitialized();

    const ir = IRGenerator.generateIR();
    const projectAnalysis = analyzeProject(ir);
    const strategy = ExportStrategyEngine.determineStrategy(
      ir,
      this.deviceInfo!,
      projectAnalysis,
      userPreference
    );

    // 估算结果
    const estimatedResult = {
      fileSize: strategy.estimatedSize,
      duration: strategy.estimatedTime,
      quality: strategy.quality,
    };

    // 收集警告
    const warnings = [...(strategy.warnings || [])];
    
    if (projectAnalysis.complexityScore > 80) {
      warnings.push('项目复杂度较高，导出时间可能较长');
    }
    
    if (strategy.estimatedTime > 600) {
      warnings.push('预估导出时间超过10分钟');
    }

    return {
      strategy,
      projectAnalysis,
      estimatedResult,
      warnings,
    };
  }

  /**
   * 执行导出
   */
  private async executeExport(
    ir: TimelineIR,
    options: ExportOptions,
    strategy: ExportStrategy
  ): Promise<ExportResult> {
    try {
      switch (strategy.method) {
        case 'frontend':
          return await this.frontendExporter.export(ir, options);
        case 'backend':
          return await this.backendExporter.exportWithProgress(ir, options);
        default:
          throw new Error(`Unsupported export method: ${strategy.method}`);
      }
    } catch (error) {
      // 如果主要方法失败，尝试备选方案
      if (strategy.alternatives && strategy.alternatives.length > 0) {
        console.warn('Primary export method failed, trying alternative:', error);
        
        const alternative = strategy.alternatives[0];
        const alternativeOptions = { ...options, method: alternative.method };
        
        return await this.executeExport(ir, alternativeOptions, alternative);
      }
      
      throw error;
    }
  }

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * 获取默认设备信息
   */
  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
      cpuCores: 4,
      isLowEndDevice: false,
      networkSpeed: 'medium',
      isOnline: navigator.onLine,
      supportsWebCodecs: false,
      supportsOffscreenCanvas: false,
      supportsWebWorkers: true,
      supportsWasm: true,
      performanceLevel: 'medium',
      userAgent: navigator.userAgent,
      browserName: 'Unknown',
      browserVersion: 'Unknown',
    };
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  /**
   * 取消当前导出
   */
  async cancelExport(): Promise<void> {
    await Promise.all([
      this.frontendExporter.cancel(),
      this.backendExporter.cancel(),
    ]);
  }
}

// 导出单例实例
export const exportManager = ExportManager.getInstance();
