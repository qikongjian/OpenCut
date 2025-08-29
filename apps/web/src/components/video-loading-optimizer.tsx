// video-loading-optimizer.tsx - 视频加载性能优化UI组件
// 提供更好的用户体验和加载状态反馈

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Loader2, Zap, Video, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface VideoLoadingOptimizerProps {
  isLoading: boolean;
  progress: number;
  stage: string;
  currentItem?: string;
  totalItems?: number;
  currentItemIndex?: number;
  onCancel?: () => void;
  showOptimizationTips?: boolean;
}

export function VideoLoadingOptimizer({
  isLoading,
  progress,
  stage,
  currentItem,
  totalItems = 0,
  currentItemIndex = 0,
  onCancel,
  showOptimizationTips = true
}: VideoLoadingOptimizerProps) {
  const [optimizationStats, setOptimizationStats] = useState({
    estimatedTimeRemaining: 0,
    averageProcessingTime: 0,
    processedItems: 0
  });

  const [performanceMode, setPerformanceMode] = useState<'standard' | 'turbo' | 'quality'>('standard');

  // 🎯 计算预估剩余时间
  useEffect(() => {
    if (currentItemIndex > 0 && totalItems > 0) {
      const avgTime = optimizationStats.averageProcessingTime;
      const remainingItems = totalItems - currentItemIndex;
      const estimatedTime = remainingItems * avgTime;
      
      setOptimizationStats(prev => ({
        ...prev,
        estimatedTimeRemaining: estimatedTime,
        processedItems: currentItemIndex
      }));
    }
  }, [currentItemIndex, totalItems, optimizationStats.averageProcessingTime]);

  // 🎯 性能模式切换
  const handlePerformanceModeChange = useCallback((mode: 'standard' | 'turbo' | 'quality') => {
    setPerformanceMode(mode);
    
    // 触发性能模式变更事件
    window.dispatchEvent(new CustomEvent('video-processing-mode-change', {
      detail: { mode }
    }));
  }, []);

  // 🎯 获取阶段图标
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'showing-original':
        return <Video className="w-5 h-5" />;
      case 'visual-editing':
        return <Zap className="w-5 h-5" />;
      case 'applying-result':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  // 🎯 获取优化提示
  const getOptimizationTip = (stage: string) => {
    switch (stage) {
      case 'showing-original':
        return '💡 正在使用并行处理技术加速视频加载';
      case 'visual-editing':
        return '💡 正在使用虚拟化渲染优化时间轴性能';
      case 'applying-result':
        return '💡 正在使用批量操作减少UI阻塞';
      default:
        return '💡 正在使用智能缓存提升处理速度';
    }
  };

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* 🎯 主要进度显示 */}
          <div className="flex items-center gap-3 mb-4">
            {getStageIcon(stage)}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">视频加载优化中</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stage}</p>
            </div>
          </div>

          {/* 🎯 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>总体进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* 🎯 当前处理项目 */}
          {currentItem && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">当前处理</span>
                {totalItems > 0 && (
                  <span>{currentItemIndex}/{totalItems}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {currentItem}
              </p>
            </div>
          )}

          {/* 🎯 性能模式选择器 */}
          {showOptimizationTips && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">性能模式</p>
              <div className="flex gap-2">
                {(['standard', 'turbo', 'quality'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={performanceMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePerformanceModeChange(mode)}
                    className="flex-1"
                  >
                    {mode === 'standard' && '标准'}
                    {mode === 'turbo' && '⚡ 极速'}
                    {mode === 'quality' && '🎯 高质量'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 🎯 优化提示 */}
          {showOptimizationTips && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {getOptimizationTip(stage)}
              </p>
            </div>
          )}

          {/* 🎯 性能统计 */}
          {optimizationStats.processedItems > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">{optimizationStats.processedItems}</div>
                <div className="text-gray-500">已处理</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">
                  {optimizationStats.estimatedTimeRemaining > 0 
                    ? `${Math.round(optimizationStats.estimatedTimeRemaining)}s`
                    : '--'
                  }
                </div>
                <div className="text-gray-500">预估剩余</div>
              </div>
            </div>
          )}

          {/* 🎯 操作按钮 */}
          <div className="flex gap-2">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                取消
              </Button>
            )}
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                // 切换到后台处理模式
                window.dispatchEvent(new CustomEvent('switch-to-background-processing'));
              }}
            >
              后台处理
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 🚀 视频加载性能监控Hook
export function useVideoLoadingPerformance() {
  const [stats, setStats] = useState({
    startTime: 0,
    endTime: 0,
    totalDuration: 0,
    itemsProcessed: 0,
    averageTimePerItem: 0,
    peakMemoryUsage: 0
  });

  const startMonitoring = useCallback(() => {
    setStats(prev => ({
      ...prev,
      startTime: performance.now()
    }));
  }, []);

  const recordItemProcessed = useCallback(() => {
    setStats(prev => {
      const newItemsProcessed = prev.itemsProcessed + 1;
      const currentTime = performance.now();
      const totalDuration = currentTime - prev.startTime;
      
      return {
        ...prev,
        itemsProcessed: newItemsProcessed,
        totalDuration,
        averageTimePerItem: totalDuration / newItemsProcessed,
        peakMemoryUsage: Math.max(
          prev.peakMemoryUsage,
          (performance as any).memory?.usedJSHeapSize || 0
        )
      };
    });
  }, []);

  const finishMonitoring = useCallback(() => {
    setStats(prev => ({
      ...prev,
      endTime: performance.now()
    }));
  }, []);

  return {
    stats,
    startMonitoring,
    recordItemProcessed,
    finishMonitoring
  };
}

// 🚀 渐进式加载状态管理Hook
export function useProgressiveVideoLoading() {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    stage: '',
    progress: 0,
    currentItem: '',
    totalItems: 0,
    currentItemIndex: 0,
    errors: [] as string[]
  });

  const updateLoadingState = useCallback((updates: Partial<typeof loadingState>) => {
    setLoadingState(prev => ({ ...prev, ...updates }));
  }, []);

  const addError = useCallback((error: string) => {
    setLoadingState(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      errors: []
    }));
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      stage: '',
      progress: 0,
      currentItem: '',
      totalItems: 0,
      currentItemIndex: 0,
      errors: []
    });
  }, []);

  return {
    loadingState,
    updateLoadingState,
    addError,
    clearErrors,
    reset
  };
}
