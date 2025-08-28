/**
 * SmartChatBox专用认证配置
 * 基于AI编辑认证系统的SmartChatBox特定配置
 */

import { getSmartToken, TokenInfo } from "@/lib/ai-editing-auth";

// SmartChatBox API配置
export const SMART_CHAT_CONFIG = {
  // API基础URL
  baseUrl: process.env.NEXT_PUBLIC_SMART_API || 'https://77.smartvideo.py.qikongjian.com',
  
  // 重试配置
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
  
  // 超时配置
  timeout: {
    default: 30000, // 30秒
    chat: 60000,    // 聊天请求60秒
    history: 15000, // 历史记录15秒
  },
  
  // 日志配置
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info' as 'debug' | 'info' | 'warn' | 'error',
  }
};

// SmartChatBox特定的token验证
export async function validateSmartChatToken(): Promise<boolean> {
  try {
    const tokenInfo = await getSmartToken();
    
    if (!tokenInfo) {
      console.log('🔍 SmartChatBox: 未找到有效token');
      return false;
    }
    
    // 检查token是否过期
    if (tokenInfo.expiresAt && Date.now() > tokenInfo.expiresAt) {
      console.log('⏰ SmartChatBox: Token已过期');
      return false;
    }
    
    console.log(`✅ SmartChatBox: Token验证成功 (来源: ${tokenInfo.source})`);
    return true;
  } catch (error) {
    console.error('❌ SmartChatBox: Token验证失败:', error);
    return false;
  }
}

// 获取SmartChatBox专用的请求头
export async function getSmartChatHeaders(): Promise<Record<string, string>> {
  const tokenInfo = await getSmartToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (tokenInfo) {
    // 根据token来源使用不同的认证格式
    switch (tokenInfo.source) {
      case 'url':
      case 'localStorage':
        // 使用video-flow的token格式
        headers['X-EASE-ADMIN-TOKEN'] = tokenInfo.token;
        break;
      case 'better-auth':
        // 使用标准Bearer格式
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
        break;
      case 'session':
        // 使用自定义格式
        headers['X-AI-API-TOKEN'] = tokenInfo.token;
        break;
      default:
        // 默认使用Bearer格式
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
        break;
    }
    
    console.log(`🔐 SmartChatBox: 使用${tokenInfo.source}来源的token`);
  } else {
    console.log('⚠️ SmartChatBox: 未找到token，将发送无认证请求');
  }
  
  return headers;
}

// SmartChatBox错误类型
export class SmartChatError extends Error {
  constructor(
    message: string,
    public code?: number,
    public type?: 'network' | 'auth' | 'business' | 'timeout'
  ) {
    super(message);
    this.name = 'SmartChatError';
  }
}

// 错误分类和处理
export function categorizeError(error: any): SmartChatError {
  if (error instanceof SmartChatError) {
    return error;
  }
  
  const message = error.message || String(error);
  
  // 网络错误
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return new SmartChatError(message, undefined, 'network');
  }
  
  // 认证错误
  if (message.includes('401') || message.includes('token') || message.includes('auth')) {
    return new SmartChatError(message, 401, 'auth');
  }
  
  // 超时错误
  if (message.includes('timeout') || message.includes('abort')) {
    return new SmartChatError(message, undefined, 'timeout');
  }
  
  // 业务错误
  if (error.code && error.code !== 0) {
    return new SmartChatError(message, error.code, 'business');
  }
  
  // 默认为网络错误
  return new SmartChatError(message, undefined, 'network');
}

// 错误恢复策略
export function shouldRetry(error: SmartChatError, attempt: number, maxRetries: number): boolean {
  // 超过最大重试次数
  if (attempt >= maxRetries) {
    return false;
  }
  
  // 根据错误类型决定是否重试
  switch (error.type) {
    case 'network':
    case 'timeout':
      return true; // 网络和超时错误可以重试
    case 'auth':
      return attempt === 1; // 认证错误只重试一次
    case 'business':
      return false; // 业务错误不重试
    default:
      return attempt <= 2; // 未知错误最多重试2次
  }
}

// 计算重试延迟
export function calculateRetryDelay(attempt: number, error: SmartChatError): number {
  const { baseDelay, maxDelay } = SMART_CHAT_CONFIG.retry;
  
  // 认证错误立即重试
  if (error.type === 'auth') {
    return 0;
  }
  
  // 指数退避
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
}

// 日志记录
export function logSmartChatEvent(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: any
) {
  if (!SMART_CHAT_CONFIG.logging.enabled) {
    return;
  }
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(SMART_CHAT_CONFIG.logging.level);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] SmartChatBox`;
    
    switch (level) {
      case 'debug':
        console.debug(`${prefix} 🐛 ${message}`, data);
        break;
      case 'info':
        console.log(`${prefix} ℹ️ ${message}`, data);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`, data);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`, data);
        break;
    }
  }
}

// 性能监控
export class SmartChatPerformanceMonitor {
  private static timers = new Map<string, number>();
  
  static start(operation: string): void {
    this.timers.set(operation, Date.now());
    logSmartChatEvent('debug', `开始操作: ${operation}`);
  }
  
  static end(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      logSmartChatEvent('warn', `未找到操作的开始时间: ${operation}`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.timers.delete(operation);
    
    logSmartChatEvent('info', `操作完成: ${operation}`, { duration: `${duration}ms` });
    
    // 性能警告
    if (duration > 10000) { // 超过10秒
      logSmartChatEvent('warn', `操作耗时过长: ${operation}`, { duration: `${duration}ms` });
    }
    
    return duration;
  }
}

// 健康检查
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    token: boolean;
    api: boolean;
    latency?: number;
  };
}> {
  const details = {
    token: false,
    api: false,
    latency: undefined as number | undefined,
  };
  
  try {
    // 检查token
    details.token = await validateSmartChatToken();
    
    // 检查API连通性（简单的ping）
    const startTime = Date.now();
    try {
      const response = await fetch(`${SMART_CHAT_CONFIG.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      details.api = response.ok;
      details.latency = Date.now() - startTime;
    } catch {
      details.api = false;
    }
    
    // 判断整体状态
    if (details.token && details.api) {
      return { status: 'healthy', details };
    } else if (details.token || details.api) {
      return { status: 'degraded', details };
    } else {
      return { status: 'unhealthy', details };
    }
  } catch (error) {
    logSmartChatEvent('error', '健康检查失败', error);
    return { status: 'unhealthy', details };
  }
}
