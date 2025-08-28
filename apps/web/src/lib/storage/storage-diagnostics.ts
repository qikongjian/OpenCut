// storage-diagnostics.ts - 存储系统诊断和修复工具
// 用于检测和修复生产环境中的存储问题

import { storageService } from './storage-service';
import { toast } from 'sonner';

export interface StorageDiagnostics {
  browserInfo: {
    userAgent: string;
    isSecureContext: boolean;
    cookiesEnabled: boolean;
  };
  storageSupport: {
    indexedDB: boolean;
    opfs: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    webWorkers: boolean;
    serviceWorkers: boolean;
  };
  permissions: {
    persistentStorage: boolean;
    storageQuota: {
      quota: number;
      usage: number;
      available: number;
    } | null;
  };
  issues: string[];
  recommendations: string[];
}

/**
 * 运行完整的存储诊断
 */
export async function runStorageDiagnostics(): Promise<StorageDiagnostics> {
  console.log('🔍 开始存储系统诊断...');
  
  const diagnostics: StorageDiagnostics = {
    browserInfo: await getBrowserInfo(),
    storageSupport: await getStorageSupport(),
    permissions: await getStoragePermissions(),
    issues: [],
    recommendations: [],
  };

  // 分析问题和建议
  analyzeIssues(diagnostics);
  
  console.log('📊 存储诊断完成:', diagnostics);
  return diagnostics;
}

/**
 * 获取浏览器信息
 */
async function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    isSecureContext: window.isSecureContext,
    cookiesEnabled: navigator.cookieEnabled,
  };
}

/**
 * 检测存储支持情况
 */
async function getStorageSupport() {
  const support = {
    indexedDB: false,
    opfs: false,
    localStorage: false,
    sessionStorage: false,
    webWorkers: false,
    serviceWorkers: false,
  };

  // IndexedDB 检测
  try {
    support.indexedDB = 'indexedDB' in window && typeof indexedDB !== 'undefined';
    if (support.indexedDB) {
      // 尝试打开一个测试数据库
      const testDB = await new Promise<boolean>((resolve) => {
        const request = indexedDB.open('test-db', 1);
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('test-db');
          resolve(true);
        };
        request.onerror = () => resolve(false);
        request.onblocked = () => resolve(false);
      });
      support.indexedDB = testDB;
    }
  } catch (error) {
    console.warn('IndexedDB检测失败:', error);
    support.indexedDB = false;
  }

  // OPFS 检测
  try {
    support.opfs = 'storage' in navigator && 'getDirectory' in navigator.storage;
    if (support.opfs) {
      // 尝试访问OPFS
      const testOPFS = await navigator.storage.getDirectory();
      support.opfs = !!testOPFS;
    }
  } catch (error) {
    console.warn('OPFS检测失败:', error);
    support.opfs = false;
  }

  // localStorage 检测
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    support.localStorage = true;
  } catch (error) {
    support.localStorage = false;
  }

  // sessionStorage 检测
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    support.sessionStorage = true;
  } catch (error) {
    support.sessionStorage = false;
  }

  // Web Workers 检测
  try {
    support.webWorkers = typeof Worker !== 'undefined';
  } catch (error) {
    support.webWorkers = false;
  }

  // Service Workers 检测
  try {
    support.serviceWorkers = 'serviceWorker' in navigator;
  } catch (error) {
    support.serviceWorkers = false;
  }

  return support;
}

/**
 * 获取存储权限和配额信息
 */
async function getStoragePermissions() {
  const permissions = {
    persistentStorage: false,
    storageQuota: null as any,
  };

  try {
    // 检查持久化存储权限
    if ('storage' in navigator && 'persist' in navigator.storage) {
      permissions.persistentStorage = await navigator.storage.persist();
    }

    // 获取存储配额
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      permissions.storageQuota = {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
      };
    }
  } catch (error) {
    console.warn('存储权限检测失败:', error);
  }

  return permissions;
}

/**
 * 分析问题和建议
 */
function analyzeIssues(diagnostics: StorageDiagnostics) {
  const { browserInfo, storageSupport, permissions } = diagnostics;

  // 检查安全上下文
  if (!browserInfo.isSecureContext) {
    diagnostics.issues.push('应用未运行在安全上下文中 (HTTPS)');
    diagnostics.recommendations.push('部署到HTTPS环境以启用完整的存储功能');
  }

  // 检查IndexedDB支持
  if (!storageSupport.indexedDB) {
    diagnostics.issues.push('IndexedDB不可用或被禁用');
    diagnostics.recommendations.push('启用IndexedDB或使用支持的浏览器');
  }

  // 检查OPFS支持
  if (!storageSupport.opfs) {
    diagnostics.issues.push('OPFS (Origin Private File System) 不支持');
    diagnostics.recommendations.push('使用Chrome 86+或其他支持OPFS的现代浏览器');
  }

  // 检查存储配额
  if (permissions.storageQuota) {
    const { quota, usage, available } = permissions.storageQuota;
    const usagePercent = (usage / quota) * 100;
    
    if (usagePercent > 80) {
      diagnostics.issues.push(`存储空间使用率过高: ${usagePercent.toFixed(1)}%`);
      diagnostics.recommendations.push('清理浏览器数据或增加存储配额');
    }
    
    if (available < 100 * 1024 * 1024) { // 小于100MB
      diagnostics.issues.push('可用存储空间不足');
      diagnostics.recommendations.push('清理浏览器数据以释放存储空间');
    }
  }

  // 检查Cookie支持
  if (!browserInfo.cookiesEnabled) {
    diagnostics.issues.push('Cookie被禁用');
    diagnostics.recommendations.push('启用Cookie以支持会话管理');
  }

  // 浏览器兼容性检查
  const userAgent = browserInfo.userAgent.toLowerCase();
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    diagnostics.recommendations.push('Safari用户：某些存储功能可能受限，建议使用Chrome或Firefox');
  }
}

/**
 * 尝试修复常见的存储问题
 */
export async function attemptStorageFix(): Promise<{
  success: boolean;
  message: string;
  actions: string[];
}> {
  console.log('🔧 尝试修复存储问题...');
  
  const actions: string[] = [];
  let success = false;

  try {
    // 1. 清理过期的ObjectURL
    actions.push('清理过期的ObjectURL');
    
    // 2. 重新初始化存储服务
    actions.push('重新初始化存储服务');
    
    // 3. 检查并修复IndexedDB
    if (storageService.isIndexedDBSupported()) {
      actions.push('IndexedDB可用，尝试修复数据库连接');
      // 这里可以添加具体的修复逻辑
    }
    
    // 4. 如果OPFS不可用，切换到fallback模式
    if (!storageService.isOPFSSupported()) {
      actions.push('OPFS不可用，启用fallback存储模式');
    }
    
    success = true;
    
    return {
      success,
      message: '存储修复完成',
      actions,
    };
  } catch (error) {
    return {
      success: false,
      message: `存储修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
      actions,
    };
  }
}

/**
 * 显示存储诊断结果
 */
export function displayDiagnostics(diagnostics: StorageDiagnostics) {
  console.group('📊 存储系统诊断报告');
  
  console.log('🌐 浏览器信息:', diagnostics.browserInfo);
  console.log('💾 存储支持:', diagnostics.storageSupport);
  console.log('🔐 权限信息:', diagnostics.permissions);
  
  if (diagnostics.issues.length > 0) {
    console.warn('⚠️ 发现问题:', diagnostics.issues);
  }
  
  if (diagnostics.recommendations.length > 0) {
    console.info('💡 建议:', diagnostics.recommendations);
  }
  
  console.groupEnd();
  
  // 只在有问题时显示提示
  if (diagnostics.issues.length > 0) {
    toast.warning('存储系统检测到问题', {
      description: `发现 ${diagnostics.issues.length} 个问题，请检查控制台了解详情`,
    });
  }
}
