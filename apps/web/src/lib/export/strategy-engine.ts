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
   */
  static determineStrategy(
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    // 如果用户强制指定方法，优先使用
    if (userPreference.method && userPreference.method !== 'hybrid') {
      return this.createStrategyForMethod(
        userPreference.method,
        ir,
        deviceInfo,
        projectAnalysis,
        userPreference
      );
    }

    // 隐私优先策略
    if (userPreference.privacy === 'strict') {
      return this.createFrontendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
    }

    // 性能优先策略
    if (userPreference.privacy === 'performance') {
      return this.createBackendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
    }

    // 平衡策略 - 智能选择
    return this.createBalancedStrategy(ir, deviceInfo, projectAnalysis, userPreference);
  }

  /**
   * 创建前端导出策略
   */
  private static createFrontendStrategy(
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    const quality = this.determineQuality(projectAnalysis, userPreference, 'frontend');
    const estimatedTime = this.estimateFrontendTime(projectAnalysis, deviceInfo);
    const estimatedSize = this.estimateOutputSize(ir, quality);

    const warnings: string[] = [];
    
    // 检查设备能力
    if (deviceInfo.performanceLevel === 'low') {
      warnings.push("设备性能较低，导出可能较慢");
    }
    
    if (projectAnalysis.estimatedMemoryUsage > deviceInfo.availableMemory * 0.8) {
      warnings.push("内存使用可能接近上限");
    }

    if (estimatedTime > 600) { // 10分钟
      warnings.push("预估处理时间较长，建议考虑后端导出");
    }

    return {
      method: 'frontend',
      quality,
      reason: userPreference.privacy === 'strict' 
        ? "用户选择严格隐私模式，使用本地处理"
        : "适合前端处理的项目",
      estimatedTime,
      estimatedSize,
      confidence: this.calculateFrontendConfidence(deviceInfo, projectAnalysis),
      warnings,
      segmentDuration: this.calculateOptimalSegmentDuration(projectAnalysis, deviceInfo),
      useProxy: quality === 'preview',
      maxConcurrency: Math.min(deviceInfo.cpuCores, 2), // 限制并发数
    };
  }

  /**
   * 创建后端导出策略
   */
  private static createBackendStrategy(
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    const quality = this.determineQuality(projectAnalysis, userPreference, 'backend');
    const estimatedTime = this.estimateBackendTime(projectAnalysis);
    const estimatedSize = this.estimateOutputSize(ir, quality);

    const warnings: string[] = [];
    
    if (!deviceInfo.isOnline) {
      warnings.push("当前离线，无法使用后端导出");
    }
    
    if (deviceInfo.networkSpeed === 'slow') {
      warnings.push("网络速度较慢，上传可能需要较长时间");
    }

    return {
      method: 'backend',
      quality,
      reason: "使用服务器处理，获得更好的性能和质量",
      estimatedTime,
      estimatedSize,
      confidence: this.calculateBackendConfidence(deviceInfo, projectAnalysis),
      warnings,
      useGPU: true,
      useProxy: false,
    };
  }

  /**
   * 创建平衡策略
   */
  private static createBalancedStrategy(
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    // 决策逻辑
    const shouldUseBackend = this.shouldUseBackend(deviceInfo, projectAnalysis, userPreference);
    
    if (shouldUseBackend) {
      return this.createBackendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
    } else {
      return this.createFrontendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
    }
  }

  /**
   * 为指定方法创建策略
   */
  private static createStrategyForMethod(
    method: ExportMethod,
    ir: TimelineIR,
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): ExportStrategy {
    switch (method) {
      case 'frontend':
        return this.createFrontendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
      case 'backend':
        return this.createBackendStrategy(ir, deviceInfo, projectAnalysis, userPreference);
      default:
        return this.createBalancedStrategy(ir, deviceInfo, projectAnalysis, userPreference);
    }
  }

  /**
   * 判断是否应该使用后端导出
   */
  private static shouldUseBackend(
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference
  ): boolean {
    let score = 0;

    // 设备性能评分
    if (deviceInfo.performanceLevel === 'low') score += 30;
    else if (deviceInfo.performanceLevel === 'medium') score += 10;

    // 项目复杂度评分
    if (projectAnalysis.complexityScore > 80) score += 25;
    else if (projectAnalysis.complexityScore > 60) score += 15;
    else if (projectAnalysis.complexityScore > 40) score += 5;

    // 文件大小评分
    if (projectAnalysis.totalFileSize > 1024 * 1024 * 1024) score += 20; // 1GB
    else if (projectAnalysis.totalFileSize > 500 * 1024 * 1024) score += 10; // 500MB

    // 时长评分
    if (projectAnalysis.totalDuration > 30 * 60 * 1000) score += 15; // 30分钟
    else if (projectAnalysis.totalDuration > 10 * 60 * 1000) score += 8; // 10分钟

    // 内存使用评分
    if (projectAnalysis.estimatedMemoryUsage > deviceInfo.availableMemory * 0.8) score += 20;
    else if (projectAnalysis.estimatedMemoryUsage > deviceInfo.availableMemory * 0.6) score += 10;

    // 网络状态评分
    if (!deviceInfo.isOnline) score -= 50; // 离线时强烈倾向前端
    else if (deviceInfo.networkSpeed === 'slow') score -= 15;
    else if (deviceInfo.networkSpeed === 'fast') score += 5;

    // 用户偏好调整
    if (userPreference.allowCloudProcessing === false) score -= 30;
    if (userPreference.maxWaitTime && userPreference.maxWaitTime < 300) score += 10; // 5分钟内

    return score >= 50;
  }

  /**
   * 确定导出质量
   */
  private static determineQuality(
    projectAnalysis: ProjectAnalysis,
    userPreference: UserPreference,
    method: ExportMethod
  ): ExportQuality {
    // 用户明确指定质量
    if (userPreference.quality) {
      return userPreference.quality;
    }

    // 根据项目特征自动判断
    if (projectAnalysis.requiresHighQuality) {
      return method === 'backend' ? 'professional' : 'standard';
    }

    if (projectAnalysis.complexityScore > 60) {
      return 'standard';
    }

    return 'preview';
  }

  /**
   * 估算前端处理时间
   */
  private static estimateFrontendTime(
    projectAnalysis: ProjectAnalysis,
    deviceInfo: DeviceInfo
  ): number {
    let baseTime = projectAnalysis.estimatedProcessingTime;

    // 设备性能调整
    switch (deviceInfo.performanceLevel) {
      case 'low':
        baseTime *= 2;
        break;
      case 'medium':
        baseTime *= 1.2;
        break;
      case 'high':
        baseTime *= 0.8;
        break;
    }

    // 浏览器能力调整
    if (!deviceInfo.supportsWebCodecs) baseTime *= 1.3;
    if (!deviceInfo.supportsOffscreenCanvas) baseTime *= 1.1;

    return Math.round(baseTime);
  }

  /**
   * 估算后端处理时间
   */
  private static estimateBackendTime(projectAnalysis: ProjectAnalysis): number {
    // 后端处理通常比前端快3-5倍
    let baseTime = projectAnalysis.estimatedProcessingTime * 0.3;
    
    // 加上网络传输时间
    const uploadTime = projectAnalysis.totalFileSize / (10 * 1024 * 1024); // 假设10MB/s
    const downloadTime = projectAnalysis.totalFileSize * 0.1 / (10 * 1024 * 1024); // 输出文件约为输入的10%
    
    return Math.round(baseTime + uploadTime + downloadTime);
  }

  /**
   * 估算输出文件大小
   */
  private static estimateOutputSize(ir: TimelineIR, quality: ExportQuality): number {
    const durationSeconds = ir.duration / 1000;
    const pixelCount = ir.width * ir.height;
    
    let bitrate: number;
    switch (quality) {
      case 'preview':
        bitrate = Math.min(2000, pixelCount / 1000); // 最高2Mbps
        break;
      case 'standard':
        bitrate = Math.min(5000, pixelCount / 500); // 最高5Mbps
        break;
      case 'professional':
        bitrate = Math.min(15000, pixelCount / 200); // 最高15Mbps
        break;
    }
    
    return (durationSeconds * bitrate * 1000) / 8; // 转换为字节
  }

  /**
   * 计算前端导出置信度
   */
  private static calculateFrontendConfidence(
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis
  ): number {
    let confidence = 0.5; // 基础置信度

    // 设备性能加分
    switch (deviceInfo.performanceLevel) {
      case 'high':
        confidence += 0.3;
        break;
      case 'medium':
        confidence += 0.1;
        break;
      case 'low':
        confidence -= 0.2;
        break;
    }

    // 项目复杂度减分
    confidence -= (projectAnalysis.complexityScore / 100) * 0.3;

    // 浏览器能力加分
    if (deviceInfo.supportsWebCodecs) confidence += 0.1;
    if (deviceInfo.supportsOffscreenCanvas) confidence += 0.05;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 计算后端导出置信度
   */
  private static calculateBackendConfidence(
    deviceInfo: DeviceInfo,
    projectAnalysis: ProjectAnalysis
  ): number {
    let confidence = 0.8; // 后端基础置信度较高

    // 网络状态影响
    if (!deviceInfo.isOnline) confidence = 0;
    else if (deviceInfo.networkSpeed === 'slow') confidence -= 0.3;
    else if (deviceInfo.networkSpeed === 'fast') confidence += 0.1;

    // 项目复杂度加分（后端更适合复杂项目）
    confidence += (projectAnalysis.complexityScore / 100) * 0.2;

    return Math.max(0, Math.min(1, confidence));
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
      alternatives.push(
        this.createBackendStrategy(ir, deviceInfo, projectAnalysis, userPreference)
      );
    }

    // 如果主策略是后端，提供前端备选
    if (primaryStrategy.method === 'backend') {
      alternatives.push(
        this.createFrontendStrategy(ir, deviceInfo, projectAnalysis, userPreference)
      );
    }

    // 提供不同质量级别的备选
    const qualityAlternatives: ExportQuality[] = ['preview', 'standard', 'professional'];
    for (const quality of qualityAlternatives) {
      if (quality !== primaryStrategy.quality) {
        const altPreference = { ...userPreference, quality };
        const altStrategy = this.createStrategyForMethod(
          primaryStrategy.method,
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
