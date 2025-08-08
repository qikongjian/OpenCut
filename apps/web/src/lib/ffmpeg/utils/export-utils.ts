// utils/export-utils.ts - 导出相关工具函数

// 缓存系统
const exportCache = new Map<string, Blob>();
const thumbnailCache = new Map<string, string>();

// 导出取消控制
let exportCancelled = false;
let currentExportController: AbortController | null = null;

// 全局导出状态锁定
let isExportInProgress = false;

/**
 * 重置导出取消状态
 */
export const resetExportCancellation = () => {
  exportCancelled = false;
  if (currentExportController) {
    currentExportController.abort();
  }
  currentExportController = new AbortController();
};

/**
 * 取消当前导出
 */
export const cancelCurrentExport = () => {
  console.log('🛑 Cancelling current export...');
  exportCancelled = true;
  if (currentExportController) {
    currentExportController.abort();
  }
  // 重置导出锁定状态
  isExportInProgress = false;
};

/**
 * 检查是否已取消
 */
export const checkCancellation = () => {
  if (exportCancelled || currentExportController?.signal.aborted) {
    throw new Error('Export cancelled by user');
  }
};

/**
 * 清理缓存函数
 */
export const clearExportCache = () => {
  exportCache.clear();
  thumbnailCache.clear();
  console.log('🧹 Export cache cleared');
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = () => {
  return {
    exportCacheSize: exportCache.size,
    thumbnailCacheSize: thumbnailCache.size,
    exportCacheKeys: Array.from(exportCache.keys()),
    thumbnailCacheKeys: Array.from(thumbnailCache.keys())
  };
};

/**
 * 获取导出状态
 */
export const getExportStatus = () => ({
  isExportInProgress,
  exportCancelled
});

/**
 * 设置导出状态
 */
export const setExportInProgress = (inProgress: boolean) => {
  isExportInProgress = inProgress;
};

/**
 * 缓存操作
 */
export const cacheOperations = {
  // 导出缓存
  export: {
    get: (key: string): Blob | undefined => exportCache.get(key),
    set: (key: string, value: Blob): void => { exportCache.set(key, value); },
    has: (key: string): boolean => exportCache.has(key),
    delete: (key: string): boolean => exportCache.delete(key)
  },
  
  // 缩略图缓存
  thumbnail: {
    get: (key: string): string | undefined => thumbnailCache.get(key),
    set: (key: string, value: string): void => { thumbnailCache.set(key, value); },
    has: (key: string): boolean => thumbnailCache.has(key),
    delete: (key: string): boolean => thumbnailCache.delete(key)
  }
}; 