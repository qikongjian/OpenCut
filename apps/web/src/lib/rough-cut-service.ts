// rough-cut-service.ts - 粗剪视频服务
// 此文件提供粗剪视频API的调用服务，用于在视频导出完成后通知粗剪系统
// 文件路径: lib/rough-cut-service.ts

import { authFetchWithSmartToken, getSmartToken, initializeTokenSystem } from '@/lib/ai-editing-auth';

/**
 * 粗剪视频任务结果接口
 */
export interface RoughCutTaskResult {
  task_result: string; // JSON字符串，包含视频URL等信息
  task_name: string;   // 任务名称
  project_id: string;  // 项目ID
}

/**
 * 粗剪视频API响应接口
 */
export interface RoughCutApiResponse {
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
  [key: string]: any;
}

/**
 * 粗剪视频服务配置
 */
export interface RoughCutServiceConfig {
  apiUrl: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

/**
 * 粗剪视频服务类
 * 负责调用外部粗剪视频API，更新任务结果
 */
export class RoughCutService {
  private config: RoughCutServiceConfig;
  private isConfigured: boolean;

  constructor(config?: Partial<RoughCutServiceConfig>) {
    // 直接使用硬编码配置，避免环境变量问题
    this.config = {
      apiUrl: config?.apiUrl || 'https://77.smartvideo.py.qikongjian.com/movie/update_task_result',
      timeout: config?.timeout || 30000,
      retryCount: config?.retryCount || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    this.isConfigured = !!this.config.apiUrl;
  }

  /**
   * 检查服务是否已配置
   */
  get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * 获取服务配置信息
   */
  get configuration(): RoughCutServiceConfig {
    return { ...this.config };
  }

  /**
   * 更新粗剪视频任务结果
   * @param projectId 项目ID
   * @param videoUrl 视频URL
   * @param taskName 任务名称（可选，默认为generate_final_simple_video）
   * @returns 更新结果
   */
  async updateTaskResult(
    projectId: string,
    videoUrl: string,
    taskName: string = 'generate_final_simple_video'
  ): Promise<{ success: boolean; data?: RoughCutApiResponse; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: '粗剪视频服务未配置，请检查ROUGH_CUT_API_URL环境变量'
      };
    }

    try {
      // 🔐 初始化token系统
      try {
        await initializeTokenSystem();
        console.log('✅ 粗剪服务token系统初始化成功');
      } catch (error) {
        console.warn('⚠️ 粗剪服务token系统初始化失败:', error);
      }

      // 🔍 检查token状态
      const tokenInfo = await getSmartToken();
      if (tokenInfo) {
        console.log(`🔑 粗剪服务使用${tokenInfo.source}来源的token进行API调用`);
      } else {
        console.warn('⚠️ 粗剪服务未找到token，将尝试无认证调用');
      }

      console.log('🎬 开始调用粗剪视频接口:');
      console.log('  - 项目ID:', projectId);
      console.log('  - 视频URL:', videoUrl);
      console.log('  - 任务名称:', taskName);
      console.log('  - API地址:', this.config.apiUrl);

      // 构建任务结果数据
      const taskResult: RoughCutTaskResult = {
        task_result: JSON.stringify({ video: videoUrl }),
        task_name: taskName,
        project_id: projectId,
      };

      console.log('📤 粗剪视频接口入参:', taskResult);

      // 执行API调用（带重试机制）
      const result = await this.callApiWithRetry(taskResult);

      if (result.success) {
        console.log('✅ 粗剪视频接口调用成功');
        return {
          success: true,
          data: result.data
        };
      } else {
        console.error('❌ 粗剪视频接口调用失败:', result.error);
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 更新粗剪视频任务结果失败:', errorMessage);
      return {
        success: false,
        error: `调用粗剪视频API失败: ${errorMessage}`
      };
    }
  }

  /**
   * 带重试机制的API调用
   * @param taskResult 任务结果数据
   * @returns API调用结果
   */
  private async callApiWithRetry(taskResult: RoughCutTaskResult): Promise<{ success: boolean; data?: RoughCutApiResponse; error?: string }> {
    let lastError: string = '';
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        console.log(`🔄 尝试调用粗剪视频API (第${attempt}次):`, this.config.apiUrl);

        const result = await this.callApi(taskResult);
        
        if (result.success) {
          console.log(`✅ 第${attempt}次调用成功`);
          return result;
        }

        lastError = result.error || '未知错误';
        lastStatusCode = result.statusCode;
        
        // 🚀 检查是否是可重试的错误
        const isRetryable = this.isRetryableError(result.error, lastStatusCode);
        
        if (!isRetryable && attempt < this.config.retryCount) {
          console.warn(`❌ 检测到不可重试错误，停止重试: ${lastError}`);
          break;
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.retryCount) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ 第${attempt}次调用失败:`, lastError);
        
        // 检查网络错误类型
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn('⏰ 请求超时');
          } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            console.warn('🌐 网络连接错误');
          }
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.retryCount) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: `经过${this.config.retryCount}次尝试后仍然失败: ${lastError}`
    };
  }

  /**
   * 🚀 判断错误是否可重试
   * @param error 错误信息
   * @param statusCode HTTP状态码
   * @returns 是否可重试
   */
  private isRetryableError(error?: string, statusCode?: number): boolean {
    if (!error) return true;
    
    // 网络相关错误通常可重试
    if (error.includes('timeout') || 
        error.includes('network') || 
        error.includes('connection') ||
        error.includes('ECONNRESET') ||
        error.includes('ENOTFOUND')) {
      return true;
    }
    
    // HTTP状态码相关
    if (statusCode) {
      // 5xx服务器错误通常可重试
      if (statusCode >= 500 && statusCode < 600) {
        return true;
      }
      
      // 429 Too Many Requests 可重试
      if (statusCode === 429) {
        return true;
      }
      
      // 4xx客户端错误通常不可重试（除了429）
      if (statusCode >= 400 && statusCode < 500) {
        return false;
      }
    }
    
    return true; // 默认可重试
  }

  /**
   * 🚀 计算重试延迟（指数退避）
   * @param attempt 重试次数
   * @returns 延迟时间（毫秒）
   */
  private calculateRetryDelay(attempt: number): number {
    // 指数退避：基础延迟 * 2^(attempt-1) + 随机抖动
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // 0-1000ms随机抖动
    
    return Math.min(exponentialDelay + jitter, 30000); // 最大30秒
  }

  /**
   * 执行单次API调用
   * @param taskResult 任务结果数据
   * @returns API调用结果
   */
  private async callApi(taskResult: RoughCutTaskResult): Promise<{ success: boolean; data?: RoughCutApiResponse; error?: string; statusCode?: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // 🚀 使用智能token处理的fetch
      const response = await authFetchWithSmartToken(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'OpenCut/1.0',
        },
        body: JSON.stringify(taskResult),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📥 粗剪视频API响应:');
      console.log('  - 状态码:', response.status);
      console.log('  - 状态文本:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 粗剪视频API响应错误:', response.status, response.statusText);
        console.error('错误详情:', errorText);
        
        return {
          success: false,
          error: `API响应错误: ${response.status} ${response.statusText} - ${errorText}`,
          statusCode: response.status // 🚀 添加状态码用于重试判断
        };
      }

      const responseData = await response.json();
      console.log('📥 粗剪视频API返回数据:', responseData);

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: `请求超时 (${this.config.timeout}ms)`
        };
      }

      throw error;
    }
  }

  /**
   * 健康检查
   * @returns 服务状态
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; config: Partial<RoughCutServiceConfig> }> {
    if (!this.isConfigured) {
      return {
        healthy: false,
        message: '服务未配置',
        config: {}
      };
    }

    try {
      // 尝试调用API的健康检查端点（如果存在）
      const testUrl = this.config.apiUrl.replace('/movie/update_task_result', '/health');
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      return {
        healthy: response.ok,
        message: response.ok ? '服务正常' : `服务异常: ${response.status}`,
        config: {
          apiUrl: this.config.apiUrl,
          timeout: this.config.timeout,
          retryCount: this.config.retryCount
        }
      };

    } catch (error) {
      return {
        healthy: false,
        message: `健康检查失败: ${error instanceof Error ? error.message : String(error)}`,
        config: {
          apiUrl: this.config.apiUrl,
          timeout: this.config.timeout,
          retryCount: this.config.retryCount
        }
      };
    }
  }
}

/**
 * 创建粗剪视频服务实例
 */
export const createRoughCutService = (config?: Partial<RoughCutServiceConfig>): RoughCutService => {
  return new RoughCutService(config);
};

/**
 * 默认粗剪视频服务实例
 */
export const roughCutService = createRoughCutService();
