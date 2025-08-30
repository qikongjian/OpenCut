// rough-cut-client.ts - 前端粗剪接口调用客户端
// 此文件提供前端调用粗剪视频API的服务
// 文件路径: lib/rough-cut-client.ts

import { env } from '@/env';
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
 * 粗剪接口调用选项
 */
export interface RoughCutCallOptions {
  projectId: string;
  videoUrl: string;
  taskName?: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  onProgress?: (progress: { stage: string; message: string; progress: number }) => void;
}

/**
 * 粗剪接口调用结果
 */
export interface RoughCutCallResult {
  success: boolean;
  data?: RoughCutApiResponse;
  error?: string;
  duration: number;
  retryCount: number;
}

/**
 * 前端粗剪接口调用客户端
 * 负责在浏览器中调用外部粗剪视频API
 */
export class RoughCutClient {
  private defaultConfig = {
    apiUrl: env.NEXT_PUBLIC_AI_EDITING_PLAN_API_URL?.replace('/ai-editing-plan', '/movie/update_task_result') || 
             'https://77.smartvideo.py.qikongjian.com/movie/update_task_result',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  };

  /**
   * 调用粗剪视频接口
   * @param options 调用选项
   * @returns 调用结果
   */
  async callRoughCutAPI(options: RoughCutCallOptions): Promise<RoughCutCallResult> {
    const startTime = Date.now();
    let lastError: string = '';
    let retryCount = 0;

    // 🔐 初始化token系统
    try {
      await initializeTokenSystem();
      console.log('✅ 粗剪接口token系统初始化成功');
    } catch (error) {
      console.warn('⚠️ 粗剪接口token系统初始化失败:', error);
    }

    // 🔍 检查token状态
    const tokenInfo = await getSmartToken();
    if (tokenInfo) {
      console.log(`🔑 粗剪接口使用${tokenInfo.source}来源的token进行API调用`);
    } else {
      console.warn('⚠️ 粗剪接口未找到token，将尝试无认证调用');
    }

    // 更新进度
    options.onProgress?.({
      stage: 'preparing',
      message: '准备调用粗剪视频接口...',
      progress: 0
    });

    for (let attempt = 1; attempt <= (options.retryCount || this.defaultConfig.retryCount); attempt++) {
      try {
        retryCount = attempt - 1;
        
        options.onProgress?.({
          stage: 'calling',
          message: `正在调用粗剪视频接口 (第${attempt}次)...`,
          progress: (attempt - 1) / (options.retryCount || this.defaultConfig.retryCount) * 0.8
        });

        console.log(`🎬 尝试调用粗剪视频API (第${attempt}次):`, this.defaultConfig.apiUrl);

        const result = await this.makeAPICall(options);
        
        if (result.success) {
          options.onProgress?.({
            stage: 'completed',
            message: '粗剪视频接口调用成功',
            progress: 1
          });

          return {
            success: true,
            data: result.data,
            duration: Date.now() - startTime,
            retryCount
          };
        }

        lastError = result.error || '未知错误';
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < (options.retryCount || this.defaultConfig.retryCount)) {
          options.onProgress?.({
            stage: 'retrying',
            message: `调用失败，${options.retryDelay || this.defaultConfig.retryDelay}ms后重试...`,
            progress: 0.8 + (attempt / (options.retryCount || this.defaultConfig.retryCount)) * 0.2
          });

          console.log(`⏳ 等待 ${options.retryDelay || this.defaultConfig.retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, options.retryDelay || this.defaultConfig.retryDelay));
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ 第${attempt}次调用失败:`, lastError);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < (options.retryCount || this.defaultConfig.retryCount)) {
          options.onProgress?.({
            stage: 'retrying',
            message: `调用异常，${options.retryDelay || this.defaultConfig.retryDelay}ms后重试...`,
            progress: 0.8 + (attempt / (options.retryCount || this.defaultConfig.retryCount)) * 0.2
          });

          console.log(`⏳ 等待 ${options.retryDelay || this.defaultConfig.retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, options.retryDelay || this.defaultConfig.retryDelay));
        }
      }
    }

    options.onProgress?.({
      stage: 'failed',
      message: `经过${options.retryCount || this.defaultConfig.retryCount}次尝试后仍然失败`,
      progress: 1
    });

    return {
      success: false,
      error: `经过${options.retryCount || this.defaultConfig.retryCount}次尝试后仍然失败: ${lastError}`,
      duration: Date.now() - startTime,
      retryCount
    };
  }

  /**
   * 执行单次API调用
   * @param options 调用选项
   * @returns API调用结果
   */
  private async makeAPICall(options: RoughCutCallOptions): Promise<{ success: boolean; data?: RoughCutApiResponse; error?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultConfig.timeout);

    try {
      // 构建任务结果数据
      const taskResult: RoughCutTaskResult = {
        task_result: JSON.stringify({ 
          video: options.videoUrl
        }),
        task_name: options.taskName || 'generate_final_simple_video',
        project_id: options.projectId,
      };

      console.log('📤 粗剪视频接口入参:', taskResult);

      // 🚀 使用智能token处理的fetch
      const response = await authFetchWithSmartToken(this.defaultConfig.apiUrl, {
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
          error: `API响应错误: ${response.status} ${response.statusText} - ${errorText}`
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
          error: `请求超时 (${options.timeout || this.defaultConfig.timeout}ms)`
        };
      }

      throw error;
    }
  }

  /**
   * 检查服务是否可用
   * @returns 服务状态
   */
  async checkServiceHealth(): Promise<{ healthy: boolean; message: string; config: any }> {
    try {
      // 尝试调用API的健康检查端点（如果存在）
      const testUrl = this.defaultConfig.apiUrl.replace('/movie/update_task_result', '/health');
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      return {
        healthy: response.ok,
        message: response.ok ? '服务正常' : `服务异常: ${response.status}`,
        config: {
          apiUrl: this.defaultConfig.apiUrl,
          timeout: this.defaultConfig.timeout,
          retryCount: this.defaultConfig.retryCount
        }
      };

    } catch (error) {
      return {
        healthy: false,
        message: `健康检查失败: ${error instanceof Error ? error.message : String(error)}`,
        config: {
          apiUrl: this.defaultConfig.apiUrl,
          timeout: this.defaultConfig.timeout,
          retryCount: this.defaultConfig.retryCount
        }
      };
    }
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return { ...this.defaultConfig };
  }
}

/**
 * 创建粗剪接口调用客户端实例
 */
export const createRoughCutClient = (): RoughCutClient => {
  return new RoughCutClient();
};

/**
 * 默认粗剪接口调用客户端实例
 */
export const roughCutClient = createRoughCutClient();

/**
 * 便捷函数：调用粗剪视频接口
 */
export const callRoughCutAPI = async (options: RoughCutCallOptions): Promise<RoughCutCallResult> => {
  return roughCutClient.callRoughCutAPI(options);
};

/**
 * 测试函数：验证task_result格式
 * @param videoUrl 视频URL
 * @returns 格式化的task_result字符串
 */
export const formatTaskResult = (videoUrl: string): string => {
  const taskData = { video: videoUrl };
  return JSON.stringify(taskData);
};

/**
 * 测试函数：验证task_result格式是否正确
 * @param taskResult task_result字符串
 * @returns 验证结果
 */
export const validateTaskResult = (taskResult: string): { valid: boolean; parsed?: any; error?: string } => {
  try {
    const parsed = JSON.parse(taskResult);
    
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.video === 'string') {
      return { valid: true, parsed };
    } else {
      return { valid: false, error: 'task_result必须包含video字段且为字符串' };
    }
  } catch (error) {
    return { valid: false, error: `JSON解析失败: ${error instanceof Error ? error.message : String(error)}` };
  }
};
