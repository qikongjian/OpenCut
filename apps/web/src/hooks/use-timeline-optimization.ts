// use-timeline-optimization.ts - 时间轴性能优化Hook
// 专门优化时间轴组件的渲染性能

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { debounce, throttle } from 'lodash';

interface TimelineOptimizationConfig {
  virtualScrolling?: boolean;
  batchRendering?: boolean;
  lazyLoading?: boolean;
  memoryOptimization?: boolean;
  performanceMonitoring?: boolean;
}

interface TimelineElement {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  [key: string]: any;
}

export function useTimelineOptimization(
  elements: TimelineElement[],
  config: TimelineOptimizationConfig = {}
) {
  const {
    virtualScrolling = true,
    batchRendering = true,
    lazyLoading = true,
    memoryOptimization = true,
    performanceMonitoring = true
  } = config;

  // 🎯 性能监控状态
  const [performanceStats, setPerformanceStats] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
    elementsRendered: 0
  });

  // 🎯 虚拟滚动状态
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎯 批量渲染状态
  const [renderQueue, setRenderQueue] = useState<TimelineElement[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // 🎯 懒加载状态
  const [loadedCount, setLoadedCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 🚀 虚拟滚动优化
  const handleScroll = useCallback(
    throttle((event: Event) => {
      if (!virtualScrolling || !containerRef.current) return;

      const startTime = performance.now();
      const target = event.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const clientHeight = target.clientHeight;
      
      // 计算可见范围
      const itemHeight = 60; // 假设每个元素高度
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(clientHeight / itemHeight) + 5, // 5个缓冲元素
        elements.length
      );

      setVisibleRange({ start: Math.max(0, startIndex - 5), end: endIndex });

      // 🎯 性能监控
      if (performanceMonitoring) {
        const endTime = performance.now();
        setPerformanceStats(prev => ({
          ...prev,
          renderTime: endTime - startTime,
          elementsRendered: endIndex - startIndex
        }));
      }

      // 🎯 懒加载检查
      if (lazyLoading && scrollTop + clientHeight > target.scrollHeight * 0.8) {
        loadMoreElements();
      }
    }, 16), // 60fps
    [elements.length, virtualScrolling, lazyLoading, performanceMonitoring]
  );

  // 🚀 批量渲染优化
  const addElementsToBatch = useCallback((newElements: TimelineElement[]) => {
    if (!batchRendering) {
      return newElements;
    }

    setRenderQueue(prev => [...prev, ...newElements]);
    processBatch();
  }, [batchRendering]);

  const processBatch = useCallback(
    debounce(async () => {
      if (isProcessingBatch || renderQueue.length === 0) return;

      setIsProcessingBatch(true);
      const batchSize = 10;
      
      while (renderQueue.length > 0) {
        const batch = renderQueue.splice(0, batchSize);
        
        // 🎯 使用 requestAnimationFrame 确保不阻塞UI
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            // 这里执行实际的渲染逻辑
            resolve(void 0);
          });
        });
        
        // 批次间短暂延迟
        await new Promise(resolve => setTimeout(resolve, 16));
      }
      
      setIsProcessingBatch(false);
    }, 100),
    [renderQueue, isProcessingBatch]
  );

  // 🚀 懒加载更多元素
  const loadMoreElements = useCallback(
    debounce(() => {
      if (isLoadingMore || loadedCount >= elements.length) return;

      setIsLoadingMore(true);
      
      setTimeout(() => {
        setLoadedCount(prev => Math.min(prev + 20, elements.length));
        setIsLoadingMore(false);
      }, 100);
    }, 200),
    [elements.length, loadedCount, isLoadingMore]
  );

  // 🚀 内存优化
  useEffect(() => {
    if (!memoryOptimization) return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setPerformanceStats(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize
        }));

        // 🚨 内存使用过高时触发清理
        if (memInfo.usedJSHeapSize > 500 * 1024 * 1024) { // 500MB
          console.warn('🚨 内存使用过高，触发优化清理');
          
          // 触发内存清理事件
          window.dispatchEvent(new CustomEvent('timeline-memory-cleanup'));
        }
      }
    };

    const interval = setInterval(checkMemory, 5000); // 每5秒检查一次
    return () => clearInterval(interval);
  }, [memoryOptimization]);

  // 🎯 获取当前应该渲染的元素
  const visibleElements = useMemo(() => {
    let elementsToRender = elements;

    // 应用懒加载
    if (lazyLoading) {
      elementsToRender = elementsToRender.slice(0, loadedCount);
    }

    // 应用虚拟滚动
    if (virtualScrolling) {
      elementsToRender = elementsToRender.slice(visibleRange.start, visibleRange.end);
    }

    return elementsToRender;
  }, [elements, lazyLoading, loadedCount, virtualScrolling, visibleRange]);

  // 🎯 容器尺寸监听
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 🎯 性能统计计算
  const performanceSummary = useMemo(() => {
    const totalElements = elements.length;
    const renderedElements = visibleElements.length;
    const renderEfficiency = totalElements > 0 ? (renderedElements / totalElements) * 100 : 0;
    
    return {
      totalElements,
      renderedElements,
      renderEfficiency: Math.round(renderEfficiency),
      memoryUsageMB: Math.round(performanceStats.memoryUsage / 1024 / 1024),
      avgRenderTime: Math.round(performanceStats.renderTime * 100) / 100,
      hasMore: loadedCount < elements.length
    };
  }, [elements.length, visibleElements.length, performanceStats, loadedCount]);

  return {
    // 🎯 渲染相关
    visibleElements,
    containerRef,
    handleScroll,
    
    // 🎯 批量处理
    addElementsToBatch,
    isProcessingBatch,
    
    // 🎯 懒加载
    loadMoreElements,
    isLoadingMore,
    hasMore: loadedCount < elements.length,
    
    // 🎯 性能监控
    performanceStats,
    performanceSummary,
    
    // 🎯 状态
    visibleRange,
    loadedCount
  };
}

// 🚀 时间轴元素预加载Hook
export function useTimelineElementPreloader(elements: TimelineElement[]) {
  const [preloadedElements, setPreloadedElements] = useState<Set<string>>(new Set());
  const [preloadQueue, setPreloadQueue] = useState<TimelineElement[]>([]);

  // 🎯 预加载元素
  const preloadElement = useCallback(async (element: TimelineElement) => {
    if (preloadedElements.has(element.id)) return;

    try {
      // 这里可以预加载缩略图、视频元数据等
      console.log(`🔄 预加载元素: ${element.name}`);
      
      // 模拟预加载过程
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setPreloadedElements(prev => new Set([...prev, element.id]));
    } catch (error) {
      console.error(`❌ 预加载失败: ${element.name}`, error);
    }
  }, [preloadedElements]);

  // 🎯 批量预加载
  const preloadBatch = useCallback(async (elements: TimelineElement[]) => {
    const batchSize = 5;
    
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(element => preloadElement(element))
      );
      
      // 批次间短暂延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [preloadElement]);

  // 🎯 智能预加载（基于可见范围）
  useEffect(() => {
    if (elements.length === 0) return;

    // 预加载前20个元素
    const elementsToPreload = elements.slice(0, 20);
    preloadBatch(elementsToPreload);
  }, [elements, preloadBatch]);

  return {
    preloadedElements,
    preloadElement,
    preloadBatch,
    isPreloaded: (elementId: string) => preloadedElements.has(elementId)
  };
}
