/**
 * 🚀 OpenCut 导出性能优化验证脚本
 * 
 * 用于测试和验证导出性能优化的效果
 */

// 性能基准配置
const PERFORMANCE_BENCHMARKS = {
  // 原始性能基准
  ORIGINAL: {
    TOTAL_TIME: 420, // 7分钟
    BASE64_TIME: 6, // 6秒
    FFMPEG_TIME: 414, // 6分54秒
    DESCRIPTION: '原始版本性能'
  },
  
  // 优化目标
  TARGET: {
    TOTAL_TIME: 120, // 2分钟
    BASE64_TIME: 6, // 保持不变
    FFMPEG_TIME: 114, // 1分54秒
    DESCRIPTION: '优化目标性能'
  },
  
  // 最佳期望
  BEST_CASE: {
    TOTAL_TIME: 60, // 1分钟
    BASE64_TIME: 6, // 保持不变
    FFMPEG_TIME: 54, // 54秒
    DESCRIPTION: '最佳期望性能'
  }
};

/**
 * 导出性能监控器
 */
class ExportPerformanceMonitor {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.phases = new Map();
    this.isMonitoring = false;
    this.logs = [];
    this.ffmpegOperations = [];
  }

  /**
   * 开始性能监控
   */
  startMonitoring() {
    console.log('🚀 开始导出性能监控...');
    this.startTime = Date.now();
    this.isMonitoring = true;
    this.phases.clear();
    this.logs = [];
    this.ffmpegOperations = [];

    // 监控关键阶段
    this.monitorPhase('initialization', '导出初始化');
    this.monitorPhase('media_collection', 'Base64转换');
    this.monitorPhase('ffmpeg_processing', 'FFmpeg处理');
    this.monitorPhase('finalization', '最终化');

    // 拦截控制台日志
    this.interceptConsoleLogs();
    
    console.log('📊 性能监控已启动，请开始导出测试...');
  }

  /**
   * 监控特定阶段
   */
  monitorPhase(phaseId, phaseName) {
    this.phases.set(phaseId, {
      name: phaseName,
      startTime: null,
      endTime: null,
      duration: 0,
      operations: []
    });
  }

  /**
   * 拦截控制台日志
   */
  interceptConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      if (this.isMonitoring) {
        const message = args.join(' ');
        const timestamp = Date.now();
        
        this.logs.push({
          timestamp,
          message,
          type: 'log'
        });

        // 检测阶段开始/结束
        this.detectPhaseTransitions(message, timestamp);
        
        // 检测FFmpeg操作
        this.detectFFmpegOperations(message, timestamp);
      }
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      if (this.isMonitoring) {
        const message = args.join(' ');
        this.logs.push({
          timestamp: Date.now(),
          message,
          type: 'error'
        });
      }
      originalError.apply(console, args);
    };
  }

  /**
   * 检测阶段转换
   */
  detectPhaseTransitions(message, timestamp) {
    // 导出初始化
    if (message.includes('导出管理器初始化完成')) {
      this.startPhase('initialization', timestamp);
    }
    
    // Base64转换阶段
    if (message.includes('🔍 collectProcessedMediaData started')) {
      this.endPhase('initialization', timestamp);
      this.startPhase('media_collection', timestamp);
    }
    
    if (message.includes('🎯 Incremental export request prepared')) {
      this.endPhase('media_collection', timestamp);
      this.startPhase('ffmpeg_processing', timestamp);
    }
    
    // 导出完成
    if (message.includes('导出成功')) {
      this.endPhase('ffmpeg_processing', timestamp);
      this.startPhase('finalization', timestamp);
      this.endPhase('finalization', timestamp);
      this.stopMonitoring();
    }
  }

  /**
   * 检测FFmpeg操作
   */
  detectFFmpegOperations(message, timestamp) {
    if (message.includes('✂️ Creating trimmed segment')) {
      const elementMatch = message.match(/element (\w+-\w+-\w+-\w+-\w+)/);
      if (elementMatch) {
        this.ffmpegOperations.push({
          type: 'trim',
          elementId: elementMatch[1],
          startTime: timestamp,
          endTime: null,
          duration: 0
        });
      }
    }
    
    if (message.includes('✅ Successfully created trimmed segment')) {
      const lastTrimOp = this.ffmpegOperations
        .filter(op => op.type === 'trim' && !op.endTime)
        .pop();
      if (lastTrimOp) {
        lastTrimOp.endTime = timestamp;
        lastTrimOp.duration = timestamp - lastTrimOp.startTime;
      }
    }
    
    if (message.includes('🎬 Executing FFmpeg') && message.includes('concat')) {
      this.ffmpegOperations.push({
        type: 'concat',
        startTime: timestamp,
        endTime: null,
        duration: 0
      });
    }
  }

  /**
   * 开始阶段
   */
  startPhase(phaseId, timestamp) {
    const phase = this.phases.get(phaseId);
    if (phase) {
      phase.startTime = timestamp;
      console.log(`📊 阶段开始: ${phase.name}`);
    }
  }

  /**
   * 结束阶段
   */
  endPhase(phaseId, timestamp) {
    const phase = this.phases.get(phaseId);
    if (phase && phase.startTime) {
      phase.endTime = timestamp;
      phase.duration = timestamp - phase.startTime;
      console.log(`📊 阶段完成: ${phase.name} (${(phase.duration / 1000).toFixed(1)}秒)`);
    }
  }

  /**
   * 停止监控并生成报告
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.endTime = Date.now();
    this.isMonitoring = false;
    
    setTimeout(() => {
      this.generatePerformanceReport();
    }, 1000);
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport() {
    const totalTime = (this.endTime - this.startTime) / 1000;
    
    console.log('\n🚀 ===== 导出性能优化验证报告 =====');
    console.log(`⏱️ 总导出时间: ${totalTime.toFixed(1)}秒 (${(totalTime / 60).toFixed(1)}分钟)`);
    
    // 阶段性能分析
    console.log('\n📊 阶段性能分析:');
    for (const [phaseId, phase] of this.phases) {
      if (phase.duration > 0) {
        const percentage = (phase.duration / (this.endTime - this.startTime) * 100).toFixed(1);
        console.log(`  ${phase.name}: ${(phase.duration / 1000).toFixed(1)}秒 (${percentage}%)`);
      }
    }
    
    // FFmpeg操作分析
    console.log('\n🎬 FFmpeg操作分析:');
    const trimOperations = this.ffmpegOperations.filter(op => op.type === 'trim' && op.duration > 0);
    const concatOperations = this.ffmpegOperations.filter(op => op.type === 'concat' && op.duration > 0);
    
    if (trimOperations.length > 0) {
      const avgTrimTime = trimOperations.reduce((sum, op) => sum + op.duration, 0) / trimOperations.length;
      const totalTrimTime = trimOperations.reduce((sum, op) => sum + op.duration, 0);
      
      console.log(`  裁剪操作: ${trimOperations.length}个`);
      console.log(`  平均裁剪时间: ${(avgTrimTime / 1000).toFixed(1)}秒`);
      console.log(`  总裁剪时间: ${(totalTrimTime / 1000).toFixed(1)}秒`);
      
      // 检测并行处理效果
      const maxConcurrentOps = this.detectMaxConcurrentOperations(trimOperations);
      console.log(`  最大并发操作: ${maxConcurrentOps}个`);
      
      if (maxConcurrentOps > 1) {
        console.log(`  ✅ 检测到并行处理优化`);
      } else {
        console.log(`  ⚠️ 未检测到并行处理，仍为串行模式`);
      }
    }
    
    if (concatOperations.length > 0) {
      const totalConcatTime = concatOperations.reduce((sum, op) => sum + op.duration, 0);
      console.log(`  合并操作: ${(totalConcatTime / 1000).toFixed(1)}秒`);
    }
    
    // 性能对比
    console.log('\n📈 性能对比分析:');
    this.compareWithBenchmarks(totalTime);
    
    // 优化建议
    console.log('\n💡 优化建议:');
    this.generateOptimizationSuggestions(totalTime, trimOperations);
  }

  /**
   * 检测最大并发操作数
   */
  detectMaxConcurrentOperations(operations) {
    let maxConcurrent = 0;
    
    for (let i = 0; i < operations.length; i++) {
      const currentOp = operations[i];
      let concurrent = 1;
      
      for (let j = 0; j < operations.length; j++) {
        if (i !== j) {
          const otherOp = operations[j];
          // 检查时间重叠
          if (currentOp.startTime < otherOp.endTime && otherOp.startTime < currentOp.endTime) {
            concurrent++;
          }
        }
      }
      
      maxConcurrent = Math.max(maxConcurrent, concurrent);
    }
    
    return maxConcurrent;
  }

  /**
   * 与基准性能对比
   */
  compareWithBenchmarks(totalTime) {
    const original = PERFORMANCE_BENCHMARKS.ORIGINAL.TOTAL_TIME;
    const target = PERFORMANCE_BENCHMARKS.TARGET.TOTAL_TIME;
    const bestCase = PERFORMANCE_BENCHMARKS.BEST_CASE.TOTAL_TIME;
    
    const improvementVsOriginal = ((original - totalTime) / original * 100).toFixed(1);
    const progressToTarget = ((original - totalTime) / (original - target) * 100).toFixed(1);
    
    console.log(`  vs 原始版本: ${improvementVsOriginal}% 改善 (${original}秒 → ${totalTime.toFixed(1)}秒)`);
    console.log(`  vs 目标性能: ${progressToTarget}% 进度 (目标: ${target}秒)`);
    
    if (totalTime <= bestCase) {
      console.log(`  🎉 已达到最佳期望性能！`);
    } else if (totalTime <= target) {
      console.log(`  ✅ 已达到目标性能！`);
    } else if (totalTime < original) {
      console.log(`  📈 性能有改善，但未达到目标`);
    } else {
      console.log(`  ❌ 性能未改善，需要进一步优化`);
    }
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(totalTime, trimOperations) {
    const suggestions = [];
    
    if (trimOperations.length > 0) {
      const avgTrimTime = trimOperations.reduce((sum, op) => sum + op.duration, 0) / trimOperations.length / 1000;
      
      if (avgTrimTime > 20) {
        suggestions.push('FFmpeg裁剪时间过长，建议使用更快的预设参数');
      }
      
      const maxConcurrent = this.detectMaxConcurrentOperations(trimOperations);
      if (maxConcurrent === 1) {
        suggestions.push('未检测到并行处理，建议实现FFmpeg并行优化');
      } else if (maxConcurrent < 3) {
        suggestions.push('并发度较低，建议增加并行处理的并发数');
      }
    }
    
    if (totalTime > PERFORMANCE_BENCHMARKS.TARGET.TOTAL_TIME) {
      suggestions.push('总体性能未达标，建议考虑一次性FFmpeg处理方案');
    }
    
    const base64Phase = this.phases.get('media_collection');
    if (base64Phase && base64Phase.duration > 10000) {
      suggestions.push('Base64转换时间过长，建议考虑直接传递blob URL');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('性能表现良好，可以考虑更高级的优化策略');
    }
    
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
  }
}

// 创建全局监控实例
window.exportPerformanceMonitor = new ExportPerformanceMonitor();

// 使用说明
console.log('🚀 导出性能优化验证工具已加载');
console.log('📖 使用方法:');
console.log('1. 运行: exportPerformanceMonitor.startMonitoring()');
console.log('2. 执行导出操作');
console.log('3. 等待自动生成性能报告');
console.log('');
console.log('🎯 性能目标:');
console.log(`- 原始性能: ${PERFORMANCE_BENCHMARKS.ORIGINAL.TOTAL_TIME}秒`);
console.log(`- 目标性能: ${PERFORMANCE_BENCHMARKS.TARGET.TOTAL_TIME}秒`);
console.log(`- 最佳期望: ${PERFORMANCE_BENCHMARKS.BEST_CASE.TOTAL_TIME}秒`);
console.log('');
console.log('🚀 建议运行: exportPerformanceMonitor.startMonitoring()');
