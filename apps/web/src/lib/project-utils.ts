// project-utils.ts - 项目工具函数
// 此文件提供项目相关的工具函数，包括获取项目ID等
// 文件路径: lib/project-utils.ts

/**
 * 从浏览器URL获取项目ID
 * @returns 项目ID，如果无法获取则返回null
 */
export function getProjectIdFromURL(): string | null {
  try {
    // 获取当前路径
    const pathname = window.location.pathname;
    
    // 🚀 优化：支持多种路径格式
    // 支持路径: /ai-editor/[project_id] 或 /editor/[project_id]
    const projectIdMatch = pathname.match(/\/(?:editor|ai-editor)\/([^\/]+)/);
    if (projectIdMatch) {
      const projectId = projectIdMatch[1];
      console.log('🔍 从URL路径获取项目ID:', projectId);
      if (isValidProjectId(projectId)) {
        return projectId;
      }
    }
    
    // 移除末尾的斜杠
    const cleanPath = pathname.replace(/\/$/, '');
    
    // 分割路径并获取最后一部分
    const pathParts = cleanPath.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // 验证项目ID格式（假设是UUID格式）
    if (lastPart && isValidProjectId(lastPart)) {
      console.log('🔍 从URL最后部分获取项目ID:', lastPart);
      return lastPart;
    }
    
    // 如果不是有效的项目ID，尝试从查询参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const projectIdParam = urlParams.get('project_id');
    
    if (projectIdParam && isValidProjectId(projectIdParam)) {
      console.log('🔍 从URL查询参数获取项目ID:', projectIdParam);
      return projectIdParam;
    }
    
    console.warn('⚠️ 无法从URL获取有效的项目ID');
    return null;
  } catch (error) {
    console.error('❌ 获取项目ID失败:', error);
    return null;
  }
}

/**
 * 验证项目ID格式
 * @param projectId 项目ID
 * @returns 是否为有效的项目ID
 */
export function isValidProjectId(projectId: string): boolean {
  if (!projectId || typeof projectId !== 'string') {
    return false;
  }
  
  // UUID格式验证（8-4-4-4-12格式）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // 也支持纯数字或字母数字组合（长度至少8位）
  const alphanumericRegex = /^[a-zA-Z0-9]{8,}$/;
  
  return uuidRegex.test(projectId) || alphanumericRegex.test(projectId);
}

/**
 * 从URL获取项目ID，如果无法获取则生成临时ID
 * @returns 项目ID
 */
export function getProjectIdWithFallback(): string {
  const projectId = getProjectIdFromURL();
  
  if (projectId) {
    return projectId;
  }
  
  // 如果无法从URL获取，生成临时ID
  console.warn('⚠️ 无法从URL获取项目ID，使用临时ID');
  return `temp-project-${Date.now()}`;
}

/**
 * 🚀 增强版项目ID获取函数 - 支持多种来源
 * 按优先级从以下来源获取项目ID:
 * 1. URL路径参数
 * 2. AI编辑Store
 * 3. 时间轴Store 
 * 4. URL查询参数
 * 5. 生成临时ID
 * @returns 项目ID
 */
export function getProjectIdFromMultipleSources(): string {
  try {
    // 方法1: 从URL路径获取项目ID (最优先)
    const urlProjectId = getProjectIdFromURL();
    if (urlProjectId) {
      console.log('🔍 从URL获取项目ID:', urlProjectId);
      return urlProjectId;
    }

    // 方法2: 从AI编辑Store中获取项目ID
    if (typeof window !== 'undefined') {
      try {
        // 动态导入以避免SSR问题
        const aiEditingStoreModule = require('@/stores/ai-editing-store');
        const aiEditingStore = aiEditingStoreModule.useAIEditingStore?.getState?.();
        if (aiEditingStore?.aiEditingData?.project_id) {
          const projectId = aiEditingStore.aiEditingData.project_id;
          console.log('🔍 从AI编辑store获取项目ID:', projectId);
          return projectId;
        }
      } catch (error) {
        console.warn('⚠️ 无法从AI编辑store获取项目ID:', error);
      }

      // 方法3: 从时间轴Store中获取项目ID
      try {
        const timelineStoreModule = require('@/stores/timeline-store');
        const timelineStore = timelineStoreModule.useTimelineStore?.getState?.();
        if (timelineStore?.projectId) {
          const projectId = timelineStore.projectId;
          console.log('🔍 从时间轴store获取项目ID:', projectId);
          return projectId;
        }
      } catch (error) {
        console.warn('⚠️ 无法从时间轴store获取项目ID:', error);
      }
    }

    // 方法4: 使用临时ID作为最后的备选方案
    const tempId = `temp-project-${Date.now()}`;
    console.warn('⚠️ 无法获取项目ID，使用临时ID:', tempId);
    return tempId;

  } catch (error) {
    console.error('❌ 获取项目ID失败:', error);
    const fallbackId = `error-project-${Date.now()}`;
    console.warn('⚠️ 使用错误备选ID:', fallbackId);
    return fallbackId;
  }
}

/**
 * 获取当前页面的完整URL信息
 * @returns URL信息对象
 */
export function getCurrentPageInfo(): {
  pathname: string;
  search: string;
  hash: string;
  fullUrl: string;
  projectId: string | null;
} {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    fullUrl: window.location.href,
    projectId: getProjectIdFromURL()
  };
}

/**
 * 构建项目相关的URL
 * @param projectId 项目ID
 * @param path 路径（可选）
 * @returns 完整的项目URL
 */
export function buildProjectURL(projectId: string, path: string = ''): string {
  const baseUrl = window.location.origin;
  const projectPath = `/project/${projectId}`;
  
  if (path) {
    return `${baseUrl}${projectPath}/${path}`.replace(/\/+/g, '/');
  }
  
  return `${baseUrl}${projectPath}`;
}

/**
 * 检查当前页面是否为项目页面
 * @returns 是否为项目页面
 */
export function isProjectPage(): boolean {
  const pathname = window.location.pathname;
  return pathname.includes('/project/') || pathname.includes('/editor/');
}

/**
 * 获取项目页面类型
 * @returns 页面类型
 */
export function getProjectPageType(): 'editor' | 'viewer' | 'settings' | 'unknown' {
  const pathname = window.location.pathname;
  
  if (pathname.includes('/editor/')) {
    return 'editor';
  } else if (pathname.includes('/viewer/')) {
    return 'viewer';
  } else if (pathname.includes('/settings/')) {
    return 'settings';
  }
  
  return 'unknown';
}
