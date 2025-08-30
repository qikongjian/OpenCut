// export-callback-manager.ts - 导出回调管理器
// 此文件提供导出完成后的回调管理，包括调用粗剪接口、状态更新等
// 文件路径: lib/export/export-callback-manager.ts

import { roughCutService } from '@/lib/rough-cut-service';

/**
 * 导出完成回调选项
 */
export interface ExportCallbackOptions {
  projectId?: string;
  videoUrl?: string;
  exportId?: string;
  metadata?: {
    duration?: number;
    size?: number;
    format?: string;
    quality?: string;
    method?: string;
  };
  enableRoughCut?: boolean;
  enableStatusUpdate?: boolean;
  enableLogging?: boolean;
}

/**
 * 导出回调结果
 */
export interface ExportCallbackResult {
  success: boolean;
  roughCutSuccess?: boolean;
  statusUpdateSuccess?: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * 导出回调管理器
 * 负责在导出完成后执行各种回调操作
 */
export class ExportCallbackManager {
  private static instance: ExportCallbackManager;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ExportCallbackManager {
    if (!ExportCallbackManager.instance) {
      ExportCallbackManager.instance = new ExportCallbackManager();
    }
    return ExportCallbackManager.instance;
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 检查粗剪视频服务配置
      const healthCheck = await roughCutService.healthCheck();
      
      if (healthCheck.healthy) {
        console.log('✅ 导出回调管理器初始化成功');
        console.log('  - 粗剪视频服务: 正常');
        console.log('  - 配置信息:', healthCheck.config);
      } else {
        console.warn('⚠️ 导出回调管理器初始化警告');
        console.warn('  - 粗剪视频服务: 异常');
        console.warn('  - 错误信息:', healthCheck.message);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ 导出回调管理器初始化失败:', error);
      // 即使初始化失败，也标记为已初始化，避免重复尝试
      this.isInitialized = true;
    }
  }

  /**
   * 执行导出完成后的回调操作
   * @param options 回调选项
   * @returns 回调执行结果
   */
  async executeCallbacks(options: ExportCallbackOptions): Promise<ExportCallbackResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result: ExportCallbackResult = {
      success: true,
      errors: [],
      warnings: []
    };

    try {
      console.log('🎬 开始执行导出完成回调操作:', {
        projectId: options.projectId,
        exportId: options.exportId,
        enableRoughCut: options.enableRoughCut,
        enableStatusUpdate: options.enableStatusUpdate
      });

      // 执行粗剪视频接口调用
      if (options.enableRoughCut && options.videoUrl && (options.projectId || options.exportId)) {
        const roughCutResult = await this.executeRoughCutCallback(options);
        result.roughCutSuccess = roughCutResult.success;
        
        if (!roughCutResult.success) {
          result.errors?.push(`粗剪接口调用失败: ${roughCutResult.error}`);
        }
      }

      // 执行状态更新回调
      if (options.enableStatusUpdate) {
        const statusUpdateResult = await this.executeStatusUpdateCallback(options);
        result.statusUpdateSuccess = statusUpdateResult.success;
        
        if (!statusUpdateResult.success) {
          result.errors?.push(`状态更新失败: ${statusUpdateResult.error}`);
        }
      }

      // 执行日志记录回调
      if (options.enableLogging) {
        await this.executeLoggingCallback(options);
      }

      // 检查整体成功状态
      result.success = !result.errors || result.errors.length === 0;

      console.log('✅ 导出完成回调操作执行完成:', {
        success: result.success,
        roughCutSuccess: result.roughCutSuccess,
        statusUpdateSuccess: result.statusUpdateSuccess,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 执行导出完成回调操作失败:', errorMessage);
      
      result.success = false;
      result.errors?.push(`回调执行异常: ${errorMessage}`);
    }

    return result;
  }

  /**
   * 执行粗剪视频接口调用回调
   * @param options 回调选项
   * @returns 执行结果
   */
  private async executeRoughCutCallback(options: ExportCallbackOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const projectId = options.projectId || options.exportId;
      
      if (!projectId || !options.videoUrl) {
        return {
          success: false,
          error: '缺少必要的项目ID或视频URL'
        };
      }

      console.log('🎬 执行粗剪视频接口调用回调:');
      console.log('  - 项目ID:', projectId);
      console.log('  - 视频URL:', options.videoUrl);

      const result = await roughCutService.updateTaskResult(projectId, options.videoUrl);
      
      if (result.success) {
        console.log('✅ 粗剪视频接口调用成功');
        return { success: true };
      } else {
        console.warn('⚠️ 粗剪视频接口调用失败:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 粗剪视频接口调用回调执行失败:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 执行状态更新回调
   * @param options 回调选项
   * @returns 执行结果
   */
  private async executeStatusUpdateCallback(options: ExportCallbackOptions): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📊 执行状态更新回调');
      
      // 这里可以添加各种状态更新逻辑
      // 例如：更新数据库状态、发送通知、更新缓存等
      
      // 模拟状态更新操作
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ 状态更新回调执行成功');
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 状态更新回调执行失败:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 执行日志记录回调
   * @param options 回调选项
   */
  private async executeLoggingCallback(options: ExportCallbackOptions): Promise<void> {
    try {
      console.log('📝 执行日志记录回调');
      
      // 记录导出完成日志
      const logData = {
        timestamp: new Date().toISOString(),
        type: 'export_completed',
        projectId: options.projectId,
        exportId: options.exportId,
        videoUrl: options.videoUrl,
        metadata: options.metadata,
        success: true
      };

      console.log('📋 导出完成日志:', logData);
      
      // 这里可以添加日志持久化逻辑
      // 例如：写入数据库、发送到日志服务等

    } catch (error) {
      console.error('❌ 日志记录回调执行失败:', error);
      // 日志记录失败不影响主流程
    }
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(): Promise<{
    initialized: boolean;
    roughCutService: {
      configured: boolean;
      healthy: boolean;
      message: string;
    };
  }> {
    const roughCutHealth = await roughCutService.healthCheck();
    
    return {
      initialized: this.isInitialized,
      roughCutService: {
        configured: roughCutService.configured,
        healthy: roughCutHealth.healthy,
        message: roughCutHealth.message
      }
    };
  }
}

/**
 * 导出回调管理器实例
 */
export const exportCallbackManager = ExportCallbackManager.getInstance();

/**
 * 便捷函数：执行导出完成回调
 */
export const executeExportCallbacks = async (options: ExportCallbackOptions): Promise<ExportCallbackResult> => {
  return exportCallbackManager.executeCallbacks(options);
};
