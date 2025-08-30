// python-export-client.ts - Python导出服务客户端
// 此文件提供与Python导出服务的通信接口
// 文件路径: lib/python-export-client.ts

import { TimelineIR } from "@/types/timeline";
import { ExportOptions, ExportProgress, ExportResult } from "@/types/export";

export interface PythonExportConfig {
  /** Python导出服务的基础URL */
  baseUrl: string;
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 是否启用Python导出服务 */
  enabled: boolean;
}

export interface PythonExportRequest {
  /** 时间轴中间表示数据 */
  ir: TimelineIR;
  /** 导出选项 */
  options: {
    quality: 'preview' | 'standard' | 'professional';
    codec: string;
    subtitleMode: 'hard' | 'soft' | 'none';
    format?: string;
  };
  /** 视频文件数据 */
  videoFiles?: {
    [blobId: string]: string; // blobId -> base64数据
  };
}

export interface PythonExportResponse {
  /** 事件类型 */
  type: 'start' | 'progress' | 'complete' | 'error' | 'info';
  /** 进度消息 */
  message: string;
  /** 时间戳 */
  timestamp: string;
  /** 进度百分比 (0-1) */
  progress?: number;
  /** 当前阶段 */
  stage?: string;
  /** 当前处理时间 */
  current_time?: number;
  /** 总时长 */
  total_time?: number;
  /** 处理速度 */
  speed?: number;
  /** 已处理帧数 */
  frames?: number;
  /** 下载URL（完成时） */
  download_url?: string;
  /** 文件大小（完成时） */
  file_size?: number;
  /** 输出路径（完成时） */
  output_path?: string;
  /** 是否使用云存储 */
  cloud_storage?: boolean;
  /** 导出ID */
  export_id?: string;
}

/**
 * Python导出服务客户端
 */
export class PythonExportClient {
  private config: PythonExportConfig;
  private abortController: AbortController | null = null;
  private exportStartTime: number = 0;

  constructor(config: PythonExportConfig) {
    this.config = config;
  }

  /**
   * 检查Python导出服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      console.warn('Python导出服务健康检查失败:', error);
      return false;
    }
  }

  /**
   * 从blob URL获取base64数据
   */
  private async blobToBase64(blobUrl: string): Promise<string> {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // 移除data:前缀，只保留base64数据
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('转换blob到base64失败:', error);
      throw error;
    }
  }

  /**
   * 收集所有blob视频数据
   */
  private async collectVideoFiles(ir: TimelineIR): Promise<{[blobId: string]: string}> {
    const videoFiles: {[blobId: string]: string} = {};
    const blobVideos = ir.video.filter(video => video.src && video.src.startsWith('blob:'));
    
    if (blobVideos.length === 0) {
      console.log('没有需要处理的blob视频文件');
      return videoFiles;
    }

    console.log(`🚀 开始收集${blobVideos.length}个blob视频文件...`);

    for (const video of blobVideos) {
      const blobUrl = video.src;
      const blobId = blobUrl.split('/').pop() || '';
      
      try {
        console.log(`📥 正在处理视频: ${blobId}`);
        const base64Data = await this.blobToBase64(blobUrl);
        videoFiles[blobId] = base64Data;
        console.log(`✅ 视频收集成功: ${blobId} (${(base64Data.length / 1024 / 1024 * 0.75).toFixed(1)}MB)`);
      } catch (error) {
        console.error(`❌ 处理视频失败: ${blobId}`, error);
        throw error;
      }
    }

    console.log(`🎉 所有视频文件收集完成，共${Object.keys(videoFiles).length}个文件`);
    return videoFiles;
  }

  /**
   * 流式导出视频
   */
  async streamExport(
    ir: TimelineIR,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    if (!this.config.enabled) {
      throw new Error('Python导出服务未启用');
    }

    // 创建中止控制器
    this.abortController = new AbortController();

    try {
      // 🚀 记录导出开始时间
      this.exportStartTime = Date.now();
      
      // 🚀 收集所有blob视频文件数据
      const videoFiles = await this.collectVideoFiles(ir);

      // 构建请求数据
      const requestData: PythonExportRequest = {
        ir,
        options: {
          quality: options.quality,
          codec: options.codec || 'libx264',
          subtitleMode: options.subtitleMode || 'hard',
          format: options.format || 'mp4',
        },
        videoFiles, // 包含所有视频文件的base64数据
      };

      console.log('🚀 调用Python导出服务:', {
        url: `${this.config.baseUrl}/api/export/stream`,
        requestData,
      });

      // 发送流式导出请求
      const response = await fetch(`${this.config.baseUrl}/api/export/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Python导出服务请求失败: ${response.status} ${response.statusText}`);
      }

      // 处理Server-Sent Events流
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let finalResult: ExportResult | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: PythonExportResponse = JSON.parse(line.slice(6));
                console.log('📊 Python导出进度:', data);

                // 转换进度格式
                const exportProgress: ExportProgress = {
                  overall: data.progress || 0,
                  stage: this.mapStage(data.stage || 'preparing'),
                  message: data.message,
                  elapsedTime: Date.now() - this.exportStartTime, // 计算实际已用时间
                  startTime: this.exportStartTime,
                  estimatedTimeRemaining: undefined,
                  currentFrame: data.frames,
                  processingSpeed: data.speed,
                };

                // 调用进度回调
                if (onProgress) {
                  onProgress(exportProgress);
                }

                // 处理完成事件
                if (data.type === 'complete') {
                  // 🚀 智能处理下载URL - 支持七牛云直链和本地下载
                  let downloadUrl = data.download_url || '';
                  
                  if (data.cloud_storage && downloadUrl.startsWith('http')) {
                    // 七牛云直链，直接使用
                    console.log('🌐 使用七牛云直链下载:', downloadUrl);
                  } else if (downloadUrl.startsWith('/api/export/download/')) {
                    // 本地下载，添加baseUrl前缀
                    downloadUrl = `${this.config.baseUrl}${downloadUrl}`;
                    console.log('🏠 使用本地服务器下载:', downloadUrl);
                  } else {
                    // 兜底逻辑，如果没有下载URL，构建本地下载URL
                    const exportId = data.export_id || Date.now().toString();
                    downloadUrl = `${this.config.baseUrl}/api/export/download/${exportId}`;
                    console.log('🔧 构建兜底下载URL:', downloadUrl);
                  }

                  finalResult = {
                    success: true,
                    url: downloadUrl,
                    filename: `export_${data.export_id || Date.now()}.mp4`,
                    size: data.file_size,
                    duration: 0,
                    quality: options.quality,
                    method: 'backend',
                    format: options.format || 'mp4',
                    codec: options.codec || 'libx264',
                    // 添加额外信息
                    cloudStorage: data.cloud_storage || false,
                    exportId: data.export_id,
                  };
                  
                  console.log('🎉 Python导出完成:', {
                    downloadUrl,
                    cloudStorage: data.cloud_storage,
                    fileSize: data.file_size,
                    exportId: data.export_id,
                  });
                  
                  break;
                }

                // 处理错误事件
                if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (parseError) {
                console.warn('解析Python导出进度数据失败:', parseError);
              }
            }
          }

          // 如果已完成，退出循环
          if (finalResult) break;
        }
      } finally {
        reader.releaseLock();
      }

      if (!finalResult) {
        throw new Error('Python导出服务未返回结果');
      }

      return finalResult;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('导出被用户取消');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 同步导出视频
   */
  async syncExport(
    ir: TimelineIR,
    options: ExportOptions
  ): Promise<ExportResult> {
    if (!this.config.enabled) {
      throw new Error('Python导出服务未启用');
    }

    try {
      const requestData: PythonExportRequest = {
        ir,
        options: {
          quality: options.quality,
          codec: options.codec || 'libx264',
          subtitleMode: options.subtitleMode || 'hard',
          format: options.format || 'mp4',
        },
      };

      console.log('🚀 调用Python同步导出服务:', {
        url: `${this.config.baseUrl}/api/export/sync`,
        requestData,
      });

      const response = await fetch(`${this.config.baseUrl}/api/export/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Python导出服务请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.result?.message || 'Python导出失败');
      }

      return {
        success: true,
        url: `${this.config.baseUrl}${result.result.download_url}`,
        filename: `export_${Date.now()}.mp4`,
        size: result.result.file_size,
        duration: 0,
        quality: options.quality,
        method: 'backend',
        format: options.format || 'mp4',
        codec: options.codec || 'libx264',
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 中止当前导出
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 验证导出请求
   */
  async validateRequest(ir: TimelineIR, options: ExportOptions): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const requestData: PythonExportRequest = {
        ir,
        options: {
          quality: options.quality,
          codec: options.codec || 'libx264',
          subtitleMode: options.subtitleMode || 'hard',
          format: options.format || 'mp4',
        },
      };

      const response = await fetch(`${this.config.baseUrl}/api/export/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(5000), // 验证请求使用较短超时
      });

      if (response.ok) {
        const result = await response.json();
        return result.valid;
      }
      return false;
    } catch (error) {
      console.warn('Python导出请求验证失败:', error);
      return false;
    }
  }

  /**
   * 映射Python阶段到导出阶段
   */
  private mapStage(pythonStage: string): ExportProgress['stage'] {
    const stageMap: Record<string, ExportProgress['stage']> = {
      'preparing': 'preparing',
      'processing': 'processing', // 添加处理阶段
      'encoding': 'encoding',
      'uploading': 'finalizing', // 上传阶段映射为最终化阶段
      'finalizing': 'finalizing',
      'completed': 'completed',
    };
    return stageMap[pythonStage] || 'preparing';
  }
}

/**
 * 创建Python导出客户端实例
 */
export function createPythonExportClient(): PythonExportClient {
  const config: PythonExportConfig = {
    baseUrl: 'https://smartcut.api.movieflow.ai', // 直接写死Python服务地址https://smartcut.huiying.video
    timeout: 300000, // 5分钟超时，直接写死
    enabled: true, // 直接启，不需要环境变量
  };

  return new PythonExportClient(config);
}

// 导出默认实例
export const pythonExportClient = createPythonExportClient();
