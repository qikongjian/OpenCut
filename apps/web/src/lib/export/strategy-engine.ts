// strategy-engine.ts - 导出策略决策引擎
// 此文件负责根据设备性能、项目复杂度和用户偏好选择最优导出策略
// 文件路径: lib/export/strategy-engine.ts

import { 
  ExportStrategy, 
  ExportMethod, 
  ExportQuality, 
  DeviceInfo, 
  ProjectAnalysis, 
  UserPreference 
} from "@/types/export";
import { TimelineIR } from "@/types/timeline";

/**
 * 智能导出策略决策引擎
 */
export class ExportStrategyEngine {
  /**
   * 确定最优导出策略
   * 🚀 强制使用前端导出，优化视频质量和速度
   */
  static determineStrategy(
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    // 🎯 强制使用前端导出，不考虑后端
    return this.createOptimizedFrontendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
  }

  /**
   * 创建优化的前端导出策略 - 专注视频质量和速度
   */
  private static createOptimizedFrontendStrategy(
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    // 🎬 根据项目复杂度选择最佳质量
    const quality = this.determineOptimalQuality(projectAnalysis, deviceInfo);
    
    // ⚡ 优化处理时间和文件大小估算
    const estimatedTime = this.estimateOptimizedFrontendTime(projectAnalysis, deviceInfo);
    const estimatedSize = this.estimateOptimizedOutputSize(ir, quality);

    const warnings: string[] = [];
    
    // 📱 设备性能检查
    if (deviceInfo.performanceLevel === 'low') {
      warnings.push("设备性能较低，建议关闭其他应用以获得最佳导出体验");
    }
    
    if (projectAnalysis.estimatedMemoryUsage > deviceInfo.availableMemory * 0.7) {
      warnings.push("内存使用较高，建议关闭其他标签页");
    }

    // 🚀 性能优化建议
    if (estimatedTime > 300) { // 5分钟
      warnings.push("项目较大，建议使用预览质量进行快速导出");
    }

    return {
      method: 'frontend',
      quality,
      reason: "🚀 强制前端导出模式 - 专注视频质量和处理速度",
      estimatedTime,
      estimatedSize,
      confidence: 0.95, // 高置信度
      warnings,
      segmentDuration: this.calculateOptimalSegmentDuration(projectAnalysis, deviceInfo),
      useProxy: false, // 不使用代理，直接处理
      maxConcurrency: Math.min(deviceInfo.cpuCores, 4), // 增加并发数
    };
  }

  /**
   * 确定最优质量设置 - 平衡质量和速度
   */
  private static determineOptimalQuality(
    projectAnalysis: ProjectAnalysis,
    deviceInfo: DeviceInfo
  ): ExportQuality {
    // 🎬 根据项目复杂度选择质量
    if (projectAnalysis.complexityScore > 70) {
      return 'standard'; // 复杂项目使用标准质量
    } else if (projectAnalysis.complexityScore > 40) {
      return 'preview'; // 中等复杂度使用预览质量
    } else {
      return 'professional'; // 简单项目可以使用专业质量
    }
  }

  /**
   * 估算优化的前端处理时间
   */
  private static estimateOptimizedFrontendTime(
    projectAnalysis: ProjectAnalysis,
    deviceInfo: DeviceInfo
  ): number {
    let baseTime = projectAnalysis.estimatedProcessingTime;
    
    // 🚀 性能优化因子
    if (deviceInfo.performanceLevel === 'high') {
      baseTime *= 0.6; // 高性能设备
    } else if (deviceInfo.performanceLevel === 'medium') {
      baseTime *= 0.8; // 中等性能设备
    } else {
      baseTime *= 1.2; // 低性能设备
    }

    // 📱 内存优化
    if (deviceInfo.availableMemory > 8 * 1024 * 1024 * 1024) { // 8GB+
      baseTime *= 0.9;
    }

    // 🔧 并发优化
    if (deviceInfo.cpuCores >= 8) {
      baseTime *= 0.85;
    }

    return Math.max(baseTime, 30); // 最少30秒
  }

  /**
   * 估算优化的输出文件大小
   */
  private static estimateOptimizedOutputSize(
    ir: TimelineIR,
    quality: ExportQuality
  ): number {
    const baseSize = ir.width * ir.height * ir.duration / 1000; // 基础大小
    
    // 🎯 质量优化因子
    const qualityFactors: Record<ExportQuality, number> = {
      'preview': 0.3,      // 预览质量：30%大小
      'standard': 0.6,     // 标准质量：60%大小
      'professional': 1.0,  // 专业质量：100%大小
    };

    return Math.round(baseSize * qualityFactors[quality]);
  }

  /**
   * 计算最优分段时长
   */
  private static calculateOptimalSegmentDuration(
    projectAnalysis: ProjectAnalysis,
    deviceInfo: DeviceInfo
  ): number {
    let segmentDuration = 30; // 默认30秒

    // 根据设备性能调整
    switch (deviceInfo.performanceLevel) {
      case 'low':
        segmentDuration = 15; // 低端设备用更短的段
        break;
      case 'high':
        segmentDuration = 60; // 高端设备可以用更长的段
        break;
    }

    // 根据内存使用调整
    const memoryRatio = projectAnalysis.estimatedMemoryUsage / deviceInfo.availableMemory;
    if (memoryRatio > 0.7) {
      segmentDuration = Math.min(segmentDuration, 20);
    }

    return segmentDuration;
  }

  /**
   * 获取备选策略
   */
  static getAlternativeStrategies(
    primaryStrategy: ExportStrategy,
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy[] {
    const alternatives: ExportStrategy[] = [];

    // 如果主策略是前端，提供后端备选
    if (primaryStrategy.method === 'frontend' && deviceInfo.isOnline) {
      // 强制前端导出，不提供后端备选
    }

    // 提供不同质量级别的备选
    const qualityAlternatives: ExportQuality[] = ['preview', 'standard', 'professional'];
    for (const quality of qualityAlternatives) {
      if (quality !== primaryStrategy.quality) {
        const altPreference = { ...userPreference, quality };
        const altStrategy = this.createOptimizedFrontendStrategy(
          ir,
          deviceInfo,
          projectAnalysis,
          altPreference
        );
        alternatives.push(altStrategy);
      }
    }

    return alternatives.slice(0, 3); // 最多返回3个备选方案
  }
}
