// rough-cut.ts - 粗剪视频配置文件
// 此文件提供粗剪视频API的配置管理和默认参数
// 文件路径: config/rough-cut.ts

import { env } from '@/env';

/**
 * 粗剪视频API配置
 */
export const ROUGH_CUT_CONFIG = {
  // API端点配置
  api: {
    // 默认API地址
    defaultUrl: 'https://77.smartvideo.py.qikongjian.com/movie/update_task_result',
    // 从环境变量获取的API地址
    url: env.ROUGH_CUT_API_URL || 'https://77.smartvideo.py.qikongjian.com/movie/update_task_result',
    // 请求超时时间（毫秒）
    timeout: env.ROUGH_CUT_API_TIMEOUT || 30000,
    // 重试次数
    retryCount: 3,
    // 重试延迟（毫秒）
    retryDelay: 1000,
    // 用户代理
    userAgent: 'OpenCut/1.0',
  },

  // 任务配置
  task: {
    // 默认任务名称
    defaultName: 'generate_final_simple_video',
    // 支持的任务名称列表
    supportedNames: [
      'generate_final_simple_video',
      'generate_final_video',
      'process_video',
      'update_video_status'
    ],
    // 任务结果模板
    resultTemplate: {
      video: '' // 视频URL
    }
  },

  // 错误处理配置
  errorHandling: {
    // 是否在失败时抛出错误
    throwOnError: false,
    // 最大重试次数
    maxRetries: 3,
    // 错误日志级别
    logLevel: 'warn' as 'info' | 'warn' | 'error',
    // 是否记录详细错误信息
    logDetailedErrors: true
  },

  // 监控和日志配置
  monitoring: {
    // 是否启用健康检查
    enableHealthCheck: true,
    // 健康检查间隔（毫秒）
    healthCheckInterval: 60000, // 1分钟
    // 是否记录API调用统计
    enableMetrics: true,
    // 是否记录请求/响应日志
    enableRequestLogging: true
  }
} as const;

/**
 * 获取粗剪视频API配置
 * @param overrides 覆盖配置
 * @returns 合并后的配置
 */
export function getRoughCutConfig(overrides?: Partial<typeof ROUGH_CUT_CONFIG>) {
  return {
    ...ROUGH_CUT_CONFIG,
    ...overrides,
    api: {
      ...ROUGH_CUT_CONFIG.api,
      ...overrides?.api
    },
    task: {
      ...ROUGH_CUT_CONFIG.task,
      ...overrides?.task
    },
    errorHandling: {
      ...ROUGH_CUT_CONFIG.errorHandling,
      ...overrides?.errorHandling
    },
    monitoring: {
      ...ROUGH_CUT_CONFIG.monitoring,
      ...overrides?.monitoring
    }
  };
}

/**
 * 验证粗剪视频配置
 * @returns 验证结果
 */
export function validateRoughCutConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // 检查API URL
  if (!ROUGH_CUT_CONFIG.api.url) {
    result.valid = false;
    result.errors.push('粗剪视频API URL未配置');
  } else if (!ROUGH_CUT_CONFIG.api.url.startsWith('http')) {
    result.valid = false;
    result.errors.push('粗剪视频API URL格式无效');
  }

  // 检查超时时间
  if (ROUGH_CUT_CONFIG.api.timeout < 1000) {
    result.warnings.push('API超时时间过短，可能导致请求失败');
  } else if (ROUGH_CUT_CONFIG.api.timeout > 120000) {
    result.warnings.push('API超时时间过长，可能影响用户体验');
  }

  // 检查重试配置
  if (ROUGH_CUT_CONFIG.api.retryCount > 5) {
    result.warnings.push('重试次数过多，可能影响性能');
  }

  // 检查任务名称
  if (!ROUGH_CUT_CONFIG.task.supportedNames.includes(ROUGH_CUT_CONFIG.task.defaultName)) {
    result.warnings.push('默认任务名称不在支持列表中');
  }

  return result;
}

/**
 * 获取环境相关的配置
 * @returns 环境相关配置
 */
export function getEnvironmentSpecificConfig() {
  const isDevelopment = env.NODE_ENV === 'development';
  const isProduction = env.NODE_ENV === 'production';

  return {
    // 开发环境配置
    development: {
      ...ROUGH_CUT_CONFIG,
      api: {
        ...ROUGH_CUT_CONFIG.api,
        timeout: 60000, // 开发环境增加超时时间
        retryCount: 1,  // 开发环境减少重试次数
      },
      monitoring: {
        ...ROUGH_CUT_CONFIG.monitoring,
        enableRequestLogging: true,  // 开发环境启用请求日志
        enableMetrics: true
      }
    },

    // 生产环境配置
    production: {
      ...ROUGH_CUT_CONFIG,
      api: {
        ...ROUGH_CUT_CONFIG.api,
        timeout: 30000, // 生产环境使用标准超时
        retryCount: 3,  // 生产环境使用标准重试次数
      },
      monitoring: {
        ...ROUGH_CUT_CONFIG.monitoring,
        enableRequestLogging: false, // 生产环境关闭详细请求日志
        enableMetrics: true
      },
      errorHandling: {
        ...ROUGH_CUT_CONFIG.errorHandling,
        logDetailedErrors: false // 生产环境不记录详细错误
      }
    }
  };
}

/**
 * 获取当前环境的配置
 * @returns 当前环境配置
 */
export function getCurrentEnvironmentConfig() {
  const envConfigs = getEnvironmentSpecificConfig();
  
  switch (env.NODE_ENV) {
    case 'development':
      return envConfigs.development;
    case 'production':
      return envConfigs.production;
    default:
      return ROUGH_CUT_CONFIG;
  }
}
