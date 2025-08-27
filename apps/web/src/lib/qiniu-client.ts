// qiniu-client.ts - 七牛云上传客户端工具
// 此文件提供前端调用七牛云上传的接口
// 文件路径: lib/qiniu-client.ts

import { QiniuUploadResult, QiniuUploadOptions } from '@/types/qiniu';

/**
 * 七牛云上传客户端
 */
export class QiniuClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/qiniu';
  }

  /**
   * 上传文件到七牛云
   */
  async uploadFile(
    file: File, 
    options: QiniuUploadOptions = {}
  ): Promise<QiniuUploadResult> {
    try {
      const { keyPrefix = "uploads", customFileName } = options;
      
      // 生成文件key
      const fileName = customFileName || this.generateFileName(file.name);
      const fileKey = `${keyPrefix}/${fileName}`;

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', fileKey);
      formData.append('bucket', 'risingfalling'); // 默认bucket

      console.log(`🚀 开始上传文件到七牛云: ${file.name} -> ${fileKey}`);

      // 调用后端上传API
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `上传失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 文件上传成功: ${result.url}`);
        return {
          success: true,
          url: result.url,
          key: result.key,
          info: result
        };
      } else {
        console.error(`❌ 文件上传失败: ${result.error}`);
        return {
          success: false,
          error: result.error || '上传失败'
        };
      }

    } catch (error) {
      const errorMsg = `上传文件失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * 上传视频文件到七牛云
   */
  async uploadVideo(file: File, customFileName?: string): Promise<QiniuUploadResult> {
    return this.uploadFile(file, { 
      keyPrefix: "videos", 
      customFileName 
    });
  }

  /**
   * 上传音频文件到七牛云
   */
  async uploadAudio(file: File, customFileName?: string): Promise<QiniuUploadResult> {
    return this.uploadFile(file, { 
      keyPrefix: "audios", 
      customFileName 
    });
  }

  /**
   * 上传图片文件到七牛云
   */
  async uploadImage(file: File, customFileName?: string): Promise<QiniuUploadResult> {
    return this.uploadFile(file, { 
      keyPrefix: "images", 
      customFileName 
    });
  }

  /**
   * 生成文件名
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop() || '';
    const nameWithoutExt = originalName.replace(`.${extension}`, '');
    return `${timestamp}_${nameWithoutExt}.${extension}`;
  }

  /**
   * 检查文件类型
   */
  private getFileType(file: File): string {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'other';
  }

  /**
   * 验证文件大小
   */
  private validateFileSize(file: File, maxSizeMB: number = 100): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * 获取上传进度
   */
  async uploadWithProgress(
    file: File, 
    options: QiniuUploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<QiniuUploadResult> {
    // 这里可以实现带进度条的上传
    // 目前使用简单的上传方式
    return this.uploadFile(file, options);
  }
}

/**
 * 创建七牛云客户端实例
 */
export function createQiniuClient(): QiniuClient {
  return new QiniuClient();
}

/**
 * 默认七牛云客户端实例
 */
export const qiniuClient = createQiniuClient();
