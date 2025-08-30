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
import { pythonExportClient } from "@/lib/python-export-client";

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
   * 智能导出 - 强制使用Python导出服务（七牛云集成）
   * 🚀 优先使用七牛云存储，自动上传并返回直链
   */
  async smartExport(
    userPreference: UserPreference,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    await this.ensureInitialized();

    // 检查Python服务可用性
    const pythonAvailable = await pythonExportClient.checkHealth();
    if (!pythonAvailable) {
      throw new Error('🐍 Python导出服务不可用，请检查服务器状态');
    }

    // 生成IR
    const ir = IRGenerator.generateIR();

    console.log('🎬 开始Python后端导出（七牛云集成）...');
    console.log('IR数据:', {
      videoCount: ir.video.length,
      audioCount: ir.audio.length,
      textCount: ir.texts.length,
      duration: ir.duration,
      width: ir.width,
      height: ir.height,
      fps: ir.fps,
    });

    // 分析项目复杂度
    const projectAnalysis = analyzeProject(ir);
    console.log('📊 项目分析结果:', projectAnalysis);

    // 🚀 强制使用Python导出服务
    console.log('🐍 强制使用Python导出服务（七牛云集成）');
    
    // 构建导出选项 - 速度优化
    const options: ExportOptions = {
      quality: this.determineOptimalQuality(projectAnalysis),
      method: 'backend', // Python服务作为后端
      format: (userPreference.preferredFormat as 'mp4' | 'webm' | 'mov') || 'mp4',
      codec: (userPreference.preferredCodec as 'h264' | 'h265' | 'vp9' | 'av1') || 'h264',
      subtitleMode: 'hard',
      useGPU: false,
      useProxy: false,
      segmentDuration: 20,
      maxConcurrency: 1, // Python服务单线程处理
      onProgress,
      // 🚀 默认启用快速模式
      speedMode: projectAnalysis.complexityScore > 60 ? 'fast' : 'normal',
    };

    console.log('🐍 Python导出选项（七牛云集成）:', options);
    const result = await pythonExportClient.streamExport(ir, options);
    
    // 添加云存储提供商信息
    if (result.cloudStorage) {
      result.cloudProvider = 'qiniu';
    }
    
    return result;
  }

  /**
   * 手动导出 - 强制使用Python导出服务（七牛云集成）
   * 🚀 只使用Python后端导出，不回退
   */
  async manualExport(
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    await this.ensureInitialized();

    // 检查Python服务可用性
    const pythonAvailable = await pythonExportClient.checkHealth();
    if (!pythonAvailable) {
      throw new Error('🐍 Python导出服务不可用，请检查服务器状态');
    }

    const ir = IRGenerator.generateIR();
    
    // 🚀 强制使用Python导出服务
    console.log('🐍 强制使用Python导出服务（七牛云集成）');
    const result = await pythonExportClient.streamExport(ir, options);
    
    // 添加云存储提供商信息
    if (result.cloudStorage) {
      result.cloudProvider = 'qiniu';
    }
    
    return result;
  }

  /**
   * 强制使用Python导出服务（七牛云集成）
   * 🌐 专门的Python导出接口，支持七牛云自动上传
   */
  async pythonExport(
    userPreference: UserPreference,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    await this.ensureInitialized();

    const ir = IRGenerator.generateIR();
    
    // 检查Python服务可用性
    const pythonAvailable = await pythonExportClient.checkHealth();
    if (!pythonAvailable) {
      throw new Error('🐍 Python导出服务不可用，请检查服务器状态');
    }

    console.log('🐍 强制使用Python导出服务（七牛云集成）');

    // 构建导出选项
    const options: ExportOptions = {
      quality: userPreference.preferredQuality || 'standard',
      method: 'backend',
      format: (userPreference.preferredFormat as 'mp4' | 'webm' | 'mov') || 'mp4',
      codec: (userPreference.preferredCodec as 'h264' | 'h265' | 'vp9' | 'av1') || 'h264',
      subtitleMode: 'hard',
      useGPU: false,
      useProxy: false,
      segmentDuration: 20,
      maxConcurrency: 1,
      onProgress,
    };

    const result = await pythonExportClient.streamExport(ir, options);
    
    // 添加云存储提供商信息
    if (result.cloudStorage) {
      result.cloudProvider = 'qiniu';
    }
    
    return result;
  }

  /**
   * 获取导出策略建议
   * 🚀 优先推荐Python导出服务（七牛云集成）
   */
  async getExportStrategy(userPreference: UserPreference): Promise<{
    primary: ExportStrategy;
    alternatives: ExportStrategy[];
  }> {
    await this.ensureInitialized();

    const ir = IRGenerator.generateIR();
    const projectAnalysis = analyzeProject(ir);
    
    // 🚀 检查Python导出服务可用性
    let pythonAvailable = false;
    try {
      pythonAvailable = await pythonExportClient.checkHealth();
    } catch (error) {
      console.warn('Python导出服务健康检查失败:', error);
    }
    
    if (pythonAvailable) {
      // 🐍 主策略：Python导出服务（七牛云集成）
      const primaryStrategy: ExportStrategy = {
        method: 'backend',
        quality: this.determineOptimalQuality(projectAnalysis),
        reason: "🐍 Python导出服务 - 高性能后端处理，七牛云加速下载",
        estimatedTime: this.estimateFrontendTime(projectAnalysis), // 使用前端时间估算
        estimatedSize: this.estimateOutputSize(ir),
        useGPU: false,
        useProxy: false,
        segmentDuration: 20,
        maxConcurrency: 1,
        warnings: [],
      };

      // 🐍 备选策略：不同质量级别
      const alternatives: ExportStrategy[] = [];
      const qualityLevels: Array<'preview' | 'standard' | 'professional'> = ['preview', 'standard', 'professional'];
      
      for (const quality of qualityLevels) {
        if (quality !== primaryStrategy.quality) {
          alternatives.push({
            ...primaryStrategy,
            quality,
            reason: `🐍 Python导出服务（七牛云）- ${quality}质量`,
          });
        }
      }

      return {
        primary: primaryStrategy,
        alternatives: alternatives.slice(0, 2), // 最多2个备选
      };
    } else {
      // ❌ Python服务不可用，抛出错误
      throw new Error('🐍 Python导出服务不可用，请检查服务器状态。当前版本仅支持Python后端导出。');
    }
  }

  /**
   * 检查导出能力
   * 🚀 只检查Python后端能力（七牛云集成）
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

    // 🐍 检查Python后端能力
    let pythonAvailable = false;
    try {
      pythonAvailable = await pythonExportClient.checkHealth();
    } catch (error) {
      console.warn('Python导出服务健康检查失败:', error);
    }

    const backendCapabilities = {
      available: pythonAvailable,
      features: pythonAvailable ? [
        '🐍 Python FFmpeg处理',
        '🌐 七牛云自动上传',
        '🚀 高性能视频编码',
        '📝 字幕硬编码支持',
        '🎛️ 多质量级别输出'
      ] : [],
      limitations: pythonAvailable ? [] : ['🐍 Python导出服务不可用'],
    };

    // 前端能力：已禁用
    const frontendCapabilities = {
      available: false,
      features: [],
      limitations: ['🚀 当前版本仅支持Python后端导出'],
    };

    return {
      frontend: frontendCapabilities,
      backend: backendCapabilities,
    };
  }

  /**
   * 预览导出设置
   * 🚀 只提供Python后端导出预览（七牛云集成）
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
    
    // 检查Python服务可用性
    const pythonAvailable = await pythonExportClient.checkHealth();
    if (!pythonAvailable) {
      throw new Error('🐍 Python导出服务不可用，无法预览导出设置');
    }
    
    // 🎯 Python后端策略（七牛云集成）
    const strategy: ExportStrategy = {
      method: 'backend',
      quality: this.determineOptimalQuality(projectAnalysis),
      reason: "🐍 Python导出服务 - 高性能后端处理，七牛云加速下载",
      estimatedTime: this.estimateFrontendTime(projectAnalysis),
      estimatedSize: this.estimateOutputSize(ir),
      useGPU: false,
      useProxy: false,
      segmentDuration: 20,
      maxConcurrency: 1,
      warnings: [],
    };

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
    
    if (strategy.estimatedTime > 300) { // 5分钟
      warnings.push('预估导出时间超过5分钟，建议使用预览质量');
    }

    // 添加七牛云相关信息
    warnings.push('🌐 文件将自动上传到七牛云，提供高速下载');

    return {
      strategy,
      projectAnalysis,
      estimatedResult,
      warnings,
    };
  }

  /**
   * 执行导出
   * 🎯 强制使用Python后端导出（七牛云集成）
   */
  private async executeExport(
    ir: TimelineIR,
    options: ExportOptions,
    strategy: ExportStrategy
  ): Promise<ExportResult> {
    try {
      // 🎯 强制Python后端导出
      console.log('🐍 执行Python后端导出（七牛云集成）...');
      const result = await pythonExportClient.streamExport(ir, options);
      
      // 添加云存储提供商信息
      if (result.cloudStorage) {
        result.cloudProvider = 'qiniu';
      }
      
      return result;
    } catch (error) {
      console.error('Python后端导出失败:', error);
      throw error;
    }
  }

  /**
   * 确定最优质量设置 - 速度优先
   */
  private determineOptimalQuality(projectAnalysis: ProjectAnalysis): 'preview' | 'standard' | 'professional' {
    // 🚀 优先选择更快的质量设置
    if (projectAnalysis.complexityScore > 80) {
      return 'preview';  // 高复杂度用最快速度
    } else if (projectAnalysis.complexityScore > 50) {
      return 'standard'; // 中等复杂度用标准速度
    } else {
      return 'standard'; // 简单项目也用标准速度（不用professional）
    }
  }

  /**
   * 估算前端处理时间
   */
  private estimateFrontendTime(projectAnalysis: ProjectAnalysis): number {
    let baseTime = projectAnalysis.estimatedProcessingTime;
    
    if (this.deviceInfo!.performanceLevel === 'high') {
      baseTime *= 0.6;
    } else if (this.deviceInfo!.performanceLevel === 'medium') {
      baseTime *= 0.8;
    } else {
      baseTime *= 1.2;
    }

    if (this.deviceInfo!.availableMemory > 8 * 1024 * 1024 * 1024) {
      baseTime *= 0.9;
    }

    if (this.deviceInfo!.cpuCores >= 8) {
      baseTime *= 0.85;
    }

    return Math.max(baseTime, 30);
  }

  /**
   * 估算输出文件大小
   */
  private estimateOutputSize(ir: TimelineIR): number {
    const baseSize = ir.width * ir.height * ir.duration / 1000;
    const quality = this.determineOptimalQuality({ complexityScore: 50 } as any);
    
    const qualityFactors: Record<'preview' | 'standard' | 'professional', number> = {
      'preview': 0.3,
      'standard': 0.6,
      'professional': 1.0,
    };

    return Math.round(baseSize * qualityFactors[quality]);
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
