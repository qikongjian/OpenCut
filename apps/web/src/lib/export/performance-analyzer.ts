// performance-analyzer.ts - 导出性能分析器
// 此文件分析导出性能瓶颈并提供优化建议
// 文件路径: lib/export/performance-analyzer.ts

import { TimelineIR } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { useAIEditingStore } from "@/stores/ai-editing-store";

export interface PerformanceAnalysis {
  // 基础指标
  totalElements: number;
  totalDuration: number; // 秒
  estimatedFileSize: number; // MB
  
  // 性能瓶颈分析
  bottlenecks: {
    type: 'network' | 'processing' | 'memory' | 'complexity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    estimatedDelay: number; // 秒
  }[];
  
  // 优化建议
  optimizations: {
    type: 'incremental' | 'preprocessing' | 'caching' | 'strategy';
    title: string;
    description: string;
    estimatedSpeedup: number; // 倍数
    difficulty: 'easy' | 'medium' | 'hard';
    priority: 'low' | 'medium' | 'high';
  }[];
  
  // 导出策略建议
  recommendedStrategy: {
    method: 'frontend' | 'backend' | 'hybrid';
    reason: string;
    estimatedTime: number; // 秒
    confidence: number; // 0-1
  };
  
  // 性能评分
  performanceScore: number; // 0-100
  optimizationPotential: number; // 0-100
}

export class PerformanceAnalyzer {
  /**
   * 分析当前项目的导出性能
   */
  static analyzeExportPerformance(): PerformanceAnalysis {
    const timelineStore = useTimelineStore.getState();
    const mediaStore = useMediaStore.getState();
    const aiEditingStore = useAIEditingStore.getState();
    
    const ir = timelineStore.toIR();
    
    console.log('🔍 Starting performance analysis...');
    
    // 基础指标计算
    const basicMetrics = this.calculateBasicMetrics(ir, mediaStore);
    
    // 瓶颈分析
    const bottlenecks = this.identifyBottlenecks(ir, mediaStore, aiEditingStore);
    
    // 优化建议
    const optimizations = this.generateOptimizations(ir, mediaStore, aiEditingStore, bottlenecks);
    
    // 策略建议
    const recommendedStrategy = this.recommendStrategy(ir, mediaStore, aiEditingStore, bottlenecks);
    
    // 性能评分
    const scores = this.calculatePerformanceScores(bottlenecks, optimizations);
    
    const analysis: PerformanceAnalysis = {
      ...basicMetrics,
      bottlenecks,
      optimizations,
      recommendedStrategy,
      ...scores
    };
    
    console.log('📊 Performance analysis completed:', analysis);
    return analysis;
  }
  
  /**
   * 计算基础性能指标
   */
  private static calculateBasicMetrics(ir: TimelineIR, mediaStore: any) {
    const totalElements = ir.video.length + ir.audio.length + ir.texts.length;
    const totalDuration = ir.duration / 1000; // 转换为秒
    
    // 估算文件大小（基于视频时长和质量）
    let estimatedFileSize = 0;
    for (const video of ir.video) {
      const duration = ((video.out || 0) - (video.in || 0)) / 1000;
      estimatedFileSize += duration * 2; // 假设2MB/秒
    }
    
    return {
      totalElements,
      totalDuration,
      estimatedFileSize
    };
  }
  
  /**
   * 识别性能瓶颈
   */
  private static identifyBottlenecks(ir: TimelineIR, mediaStore: any, aiEditingStore: any) {
    const bottlenecks: PerformanceAnalysis['bottlenecks'] = [];
    
    // 1. 网络瓶颈分析
    const remoteVideos = ir.video.filter(v => {
      const mediaItem = mediaStore.mediaItems.find((item: any) => 
        item.url === v.src || item.id === v.id
      );
      return !mediaItem?.file && v.src.startsWith('http');
    });
    
    if (remoteVideos.length > 0) {
      bottlenecks.push({
        type: 'network',
        severity: remoteVideos.length > 3 ? 'critical' : 'high',
        description: `需要下载 ${remoteVideos.length} 个远程视频文件`,
        impact: '网络下载是主要瓶颈，占用80%以上的导出时间',
        estimatedDelay: remoteVideos.length * 15 // 每个文件15秒
      });
    }
    
    // 2. 处理复杂度瓶颈
    const complexElements = ir.video.filter(v => 
      v.transform && (v.transform.scale !== 1 || v.transform.rotate !== 0)
    );
    
    if (complexElements.length > 5) {
      bottlenecks.push({
        type: 'processing',
        severity: 'medium',
        description: `${complexElements.length} 个视频元素包含变换效果`,
        impact: '复杂变换增加CPU处理时间',
        estimatedDelay: complexElements.length * 2
      });
    }
    
    // 3. 内存瓶颈
    const totalVideoSize = ir.video.reduce((sum, v) => {
      const mediaItem = mediaStore.mediaItems.find((item: any) => 
        item.url === v.src || item.id === v.id
      );
      return sum + (mediaItem?.file?.size || 50 * 1024 * 1024); // 默认50MB
    }, 0);
    
    if (totalVideoSize > 500 * 1024 * 1024) { // 500MB
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: `总视频文件大小 ${(totalVideoSize / 1024 / 1024).toFixed(1)}MB`,
        impact: '大文件可能导致内存不足，影响处理速度',
        estimatedDelay: 10
      });
    }
    
    // 4. AI剪辑特定瓶颈
    if (aiEditingStore.currentEditingPlan && !aiEditingStore.optimizationHints?.hasProcessedClips) {
      bottlenecks.push({
        type: 'processing',
        severity: 'high',
        description: 'AI剪辑计划存在但时间轴未处理',
        impact: '需要重新下载和处理原始视频，无法利用已有数据',
        estimatedDelay: 30
      });
    }
    
    return bottlenecks;
  }
  
  /**
   * 生成优化建议
   */
  private static generateOptimizations(
    ir: TimelineIR, 
    mediaStore: any, 
    aiEditingStore: any, 
    bottlenecks: PerformanceAnalysis['bottlenecks']
  ) {
    const optimizations: PerformanceAnalysis['optimizations'] = [];
    
    // 1. 增量导出优化
    const hasLocalFiles = ir.video.some(v => {
      const mediaItem = mediaStore.mediaItems.find((item: any) => 
        item.url === v.src || item.id === v.id
      );
      return !!mediaItem?.file;
    });
    
    if (hasLocalFiles && ir.texts.length > 0) {
      optimizations.push({
        type: 'incremental',
        title: '启用增量导出',
        description: '利用时间轴已处理的视频和字幕数据，跳过重复下载和处理',
        estimatedSpeedup: 4.5,
        difficulty: 'easy',
        priority: 'high'
      });
    }
    
    // 2. 预处理优化
    const networkBottleneck = bottlenecks.find(b => b.type === 'network');
    if (networkBottleneck) {
      optimizations.push({
        type: 'preprocessing',
        title: '预下载视频文件',
        description: '在AI剪辑阶段预先下载所需视频文件到本地',
        estimatedSpeedup: 3.2,
        difficulty: 'medium',
        priority: 'high'
      });
    }
    
    // 3. 缓存优化
    if (aiEditingStore.currentEditingPlan) {
      optimizations.push({
        type: 'caching',
        title: '智能缓存策略',
        description: '缓存已处理的视频片段和字幕，避免重复处理',
        estimatedSpeedup: 2.8,
        difficulty: 'medium',
        priority: 'medium'
      });
    }
    
    // 4. 策略优化
    const complexityBottleneck = bottlenecks.find(b => b.type === 'processing');
    if (complexityBottleneck) {
      optimizations.push({
        type: 'strategy',
        title: '分段并行处理',
        description: '将复杂项目分段处理，利用多核CPU并行编码',
        estimatedSpeedup: 2.1,
        difficulty: 'hard',
        priority: 'medium'
      });
    }
    
    return optimizations;
  }
  
  /**
   * 推荐导出策略
   */
  private static recommendStrategy(
    ir: TimelineIR, 
    mediaStore: any, 
    aiEditingStore: any, 
    bottlenecks: PerformanceAnalysis['bottlenecks']
  ) {
    const hasLocalFiles = ir.video.some(v => {
      const mediaItem = mediaStore.mediaItems.find((item: any) => 
        item.url === v.src || item.id === v.id
      );
      return !!mediaItem?.file;
    });
    
    const hasNetworkBottleneck = bottlenecks.some(b => b.type === 'network');
    const hasMemoryBottleneck = bottlenecks.some(b => b.type === 'memory');
    
    // 策略决策逻辑
    if (hasLocalFiles && ir.texts.length > 0 && !hasMemoryBottleneck) {
      return {
        method: 'backend' as const,
        reason: '时间轴包含本地文件和字幕，后端增量导出最优',
        estimatedTime: Math.max(10, ir.duration / 1000 / 4), // 4倍速度
        confidence: 0.9
      };
    }
    
    if (hasNetworkBottleneck && !hasMemoryBottleneck) {
      return {
        method: 'frontend' as const,
        reason: '网络瓶颈严重，前端处理避免重复下载',
        estimatedTime: Math.max(20, ir.duration / 1000 / 2), // 2倍速度
        confidence: 0.7
      };
    }
    
    return {
      method: 'hybrid' as const,
      reason: '项目复杂度中等，混合策略平衡性能和质量',
      estimatedTime: Math.max(15, ir.duration / 1000 / 3), // 3倍速度
      confidence: 0.6
    };
  }
  
  /**
   * 计算性能评分
   */
  private static calculatePerformanceScores(
    bottlenecks: PerformanceAnalysis['bottlenecks'],
    optimizations: PerformanceAnalysis['optimizations']
  ) {
    // 性能评分（越低越好的瓶颈影响）
    const bottleneckPenalty = bottlenecks.reduce((sum, b) => {
      const severityWeight = { low: 5, medium: 15, high: 30, critical: 50 };
      return sum + severityWeight[b.severity];
    }, 0);
    
    const performanceScore = Math.max(0, 100 - bottleneckPenalty);
    
    // 优化潜力（可获得的性能提升）
    const maxSpeedup = Math.max(...optimizations.map(o => o.estimatedSpeedup), 1);
    const optimizationPotential = Math.min(100, (maxSpeedup - 1) * 25);
    
    return {
      performanceScore,
      optimizationPotential
    };
  }
  
  /**
   * 生成性能报告摘要
   */
  static generatePerformanceSummary(analysis: PerformanceAnalysis): string {
    const { bottlenecks, optimizations, recommendedStrategy, performanceScore } = analysis;
    
    let summary = `📊 导出性能分析报告\n\n`;
    
    // 性能评分
    summary += `🎯 性能评分: ${performanceScore}/100\n`;
    if (performanceScore >= 80) {
      summary += `✅ 性能优秀，预计导出顺畅\n\n`;
    } else if (performanceScore >= 60) {
      summary += `⚠️ 性能良好，有优化空间\n\n`;
    } else {
      summary += `❌ 性能较差，建议优化后导出\n\n`;
    }
    
    // 主要瓶颈
    if (bottlenecks.length > 0) {
      summary += `🚨 主要瓶颈:\n`;
      bottlenecks.slice(0, 3).forEach(b => {
        summary += `• ${b.description} (${b.severity})\n`;
      });
      summary += `\n`;
    }
    
    // 推荐优化
    if (optimizations.length > 0) {
      summary += `💡 推荐优化:\n`;
      optimizations
        .filter(o => o.priority === 'high')
        .slice(0, 2)
        .forEach(o => {
          summary += `• ${o.title} (${o.estimatedSpeedup}x 提速)\n`;
        });
      summary += `\n`;
    }
    
    // 策略建议
    summary += `🎯 推荐策略: ${recommendedStrategy.method}\n`;
    summary += `📝 理由: ${recommendedStrategy.reason}\n`;
    summary += `⏱️ 预计时间: ${Math.round(recommendedStrategy.estimatedTime)}秒\n`;
    
    return summary;
  }
}

// 导出单例
export const performanceAnalyzer = PerformanceAnalyzer;
