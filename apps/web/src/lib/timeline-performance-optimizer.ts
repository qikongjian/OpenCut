// timeline-performance-optimizer.ts - 时间轴性能优化工具
// 专门优化时间轴渲染和交互性能

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

// 🚀 虚拟化时间轴渲染器
export class VirtualTimelineRenderer {
  private containerRef: HTMLElement | null = null;
  private visibleRange = { start: 0, end: 0 };
  private itemHeight = 60; // 轨道高度
  private bufferSize = 3; // 缓冲区大小
  
  constructor(containerRef: HTMLElement) {
    this.containerRef = containerRef;
  }
  
  // 🎯 计算可见范围
  calculateVisibleRange(scrollTop: number, containerHeight: number, totalItems: number) {
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / this.itemHeight) + this.bufferSize,
      totalItems
    );
    
    this.visibleRange = {
      start: Math.max(0, startIndex - this.bufferSize),
      end: endIndex
    };
    
    return this.visibleRange;
  }
  
  // 🎯 获取需要渲染的元素
  getVisibleItems<T>(items: T[]) {
    return items.slice(this.visibleRange.start, this.visibleRange.end);
  }
  
  // 🎯 计算容器样式
  getContainerStyle(totalItems: number) {
    return {
      height: totalItems * this.itemHeight,
      position: 'relative' as const
    };
  }
  
  // 🎯 计算可见项目的偏移
  getItemOffset(index: number) {
    return (this.visibleRange.start + index) * this.itemHeight;
  }
}

// 🚀 时间轴元素批量渲染优化
export class TimelineElementBatcher {
  private batchSize = 10;
  private renderQueue: Array<() => void> = [];
  private isProcessing = false;
  
  // 🎯 添加渲染任务到批次
  addRenderTask(task: () => void) {
    this.renderQueue.push(task);
    this.processBatch();
  }
  
  // 🎯 批量处理渲染任务
  private async processBatch() {
    if (this.isProcessing || this.renderQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.renderQueue.length > 0) {
      const batch = this.renderQueue.splice(0, this.batchSize);
      
      // 🚀 使用 requestAnimationFrame 确保不阻塞UI
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          batch.forEach(task => task());
          resolve(void 0);
        });
      });
      
      // 批次间短暂延迟
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
    }
    
    this.isProcessing = false;
  }
  
  // 🎯 清空队列
  clear() {
    this.renderQueue = [];
  }
}

// 🚀 时间轴性能监控器
export class TimelinePerformanceMonitor {
  private renderTimes: number[] = [];
  private maxSamples = 100;
  
  // 🎯 记录渲染时间
  recordRenderTime(startTime: number, endTime: number) {
    const renderTime = endTime - startTime;
    this.renderTimes.push(renderTime);
    
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }
    
    // 🚨 性能警告
    if (renderTime > 16) { // 超过一帧时间
      console.warn(`⚠️ 时间轴渲染耗时过长: ${renderTime.toFixed(2)}ms`);
    }
  }
  
  // 🎯 获取性能统计
  getPerformanceStats() {
    if (this.renderTimes.length === 0) return null;
    
    const avg = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    const max = Math.max(...this.renderTimes);
    const min = Math.min(...this.renderTimes);
    
    return {
      averageRenderTime: avg,
      maxRenderTime: max,
      minRenderTime: min,
      totalSamples: this.renderTimes.length,
      fps: 1000 / avg
    };
  }
  
  // 🎯 重置统计
  reset() {
    this.renderTimes = [];
  }
}

// 🚀 React Hook: 优化的时间轴渲染
export function useOptimizedTimelineRender<T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement>,
  itemHeight = 60
) {
  const virtualRenderer = useRef<VirtualTimelineRenderer | null>(null);
  const performanceMonitor = useRef(new TimelinePerformanceMonitor());
  const elementBatcher = useRef(new TimelineElementBatcher());
  
  // 🎯 初始化虚拟渲染器
  useEffect(() => {
    if (containerRef.current && !virtualRenderer.current) {
      virtualRenderer.current = new VirtualTimelineRenderer(containerRef.current);
    }
  }, [containerRef]);
  
  // 🎯 优化的滚动处理
  const handleScroll = useCallback(
    throttle((event: Event) => {
      if (!virtualRenderer.current || !containerRef.current) return;
      
      const startTime = performance.now();
      
      const target = event.target as HTMLElement;
      const visibleRange = virtualRenderer.current.calculateVisibleRange(
        target.scrollTop,
        target.clientHeight,
        items.length
      );
      
      const endTime = performance.now();
      performanceMonitor.current.recordRenderTime(startTime, endTime);
      
      // 触发重新渲染
      // 这里需要配合状态管理来触发组件更新
    }, 16), // 60fps
    [items.length]
  );
  
  // 🎯 获取可见项目
  const visibleItems = useMemo(() => {
    if (!virtualRenderer.current) return items;
    return virtualRenderer.current.getVisibleItems(items);
  }, [items, virtualRenderer.current]);
  
  // 🎯 批量添加元素
  const addElementsBatch = useCallback((elements: T[], onProgress?: (current: number, total: number) => void) => {
    elements.forEach((element, index) => {
      elementBatcher.current.addRenderTask(() => {
        // 这里执行实际的元素添加逻辑
        if (onProgress) {
          onProgress(index + 1, elements.length);
        }
      });
    });
  }, []);
  
  // 🎯 获取性能统计
  const getPerformanceStats = useCallback(() => {
    return performanceMonitor.current.getPerformanceStats();
  }, []);
  
  return {
    visibleItems,
    handleScroll,
    addElementsBatch,
    getPerformanceStats,
    virtualRenderer: virtualRenderer.current
  };
}

// 🚀 时间轴元素懒加载Hook
export function useTimelineElementLazyLoading<T>(
  elements: T[],
  loadThreshold = 5 // 距离底部多少个元素时开始加载
) {
  const [loadedCount, setLoadedCount] = useState(Math.min(10, elements.length));
  const [isLoading, setIsLoading] = useState(false);
  
  // 🎯 检查是否需要加载更多
  const checkLoadMore = useCallback(
    debounce((scrollTop: number, containerHeight: number, totalHeight: number) => {
      const scrollPercentage = (scrollTop + containerHeight) / totalHeight;
      const loadThresholdPercentage = 1 - (loadThreshold / elements.length);
      
      if (scrollPercentage > loadThresholdPercentage && loadedCount < elements.length && !isLoading) {
        setIsLoading(true);
        
        // 🚀 模拟异步加载
        setTimeout(() => {
          setLoadedCount(prev => Math.min(prev + 10, elements.length));
          setIsLoading(false);
        }, 100);
      }
    }, 200),
    [elements.length, loadedCount, isLoading, loadThreshold]
  );
  
  // 🎯 获取当前加载的元素
  const loadedElements = useMemo(() => {
    return elements.slice(0, loadedCount);
  }, [elements, loadedCount]);
  
  return {
    loadedElements,
    loadedCount,
    isLoading,
    hasMore: loadedCount < elements.length,
    checkLoadMore
  };
}

// 🚀 导出性能优化工具集
export const timelinePerformanceTools = {
  VirtualTimelineRenderer,
  TimelineElementBatcher,
  TimelinePerformanceMonitor,
  useOptimizedTimelineRender,
  useTimelineElementLazyLoading
};
