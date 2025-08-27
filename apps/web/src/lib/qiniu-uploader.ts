// qiniu-uploader.ts - 七牛云上传工具类
// 此文件提供七牛云文件上传功能，支持本地文件和URL上传
// 文件路径: lib/qiniu-uploader.ts

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { QiniuConfig, QiniuUploadResult, QiniuUploadOptions } from '@/types/qiniu';

/**
 * 七牛云上传工具类
 */
export class QiniuUploader {
  private config: QiniuConfig;

  constructor(config?: Partial<QiniuConfig>) {
    // 七牛云配置（硬编码）
    this.config = {
      accessKey: config?.accessKey || 'Ef8cxF6Hg01m6wuLpMpUgICXcztrdsXKTJzjeoro',
      secretKey: config?.secretKey || '-VcHBrdszBch8hBKXw4itiF-dpCIcAc91LCb_pn3',
      bucketName: config?.bucketName || 'risingfalling',
      domain: config?.domain || 'cdn.qikongjian.com',
    };

    // 简化配置日志
    console.log('🔧 七牛云配置初始化完成');
  }

  /**
   * 上传本地文件到七牛云
   */
  async uploadLocalFile(
    filePath: string, 
    options: QiniuUploadOptions = {}
  ): Promise<QiniuUploadResult> {
    const { keyPrefix = "uploads", customFileName } = options;
    
    try {
      // 检查文件是否存在
      try {
        await fs.stat(filePath);
      } catch {
        const errorMsg = `文件不存在: ${filePath}`;
        console.error('❌', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }

      // 生成文件key
      const fileName = customFileName || this.generateFileName(filePath);
      const fileKey = `${keyPrefix}/${fileName}`;

      // 直接上传到七牛云
      const result = await this.uploadDirectly(filePath, fileKey);

      if (result.success) {
        console.log(`✅ 七牛云上传成功: ${result.url}`);
        return result;
      } else {
        console.error(`❌ 七牛云上传失败: ${result.error}`);
        return result;
      }

    } catch (error) {
      const errorMsg = `上传文件失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌ 上传异常:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * 上传视频文件到七牛云
   */
  async uploadVideo(filePath: string, customFileName?: string): Promise<QiniuUploadResult> {
    return this.uploadLocalFile(filePath, { keyPrefix: "videos", customFileName });
  }

  /**
   * 直接上传到七牛云（不通过后端API）
   */
  private async uploadDirectly(filePath: string, fileKey: string): Promise<QiniuUploadResult> {
    try {
      // 动态导入qiniu包
      const qiniu = await import('qiniu');
      
      // 创建认证和上传Token
      const mac = new qiniu.auth.digest.Mac(this.config.accessKey, this.config.secretKey);
      const putPolicy = new qiniu.rs.PutPolicy({
        scope: this.config.bucketName,
        key: fileKey
      });
      const token = putPolicy.uploadToken(mac);
      
      return new Promise((resolve) => {
        // 使用FormUploader进行上传
        const formUploader = new qiniu.form_up.FormUploader();
        const putExtra = new qiniu.form_up.PutExtra();
        
        formUploader.putFile(token, fileKey, filePath, putExtra, (respErr, respBody, respInfo) => {
          if (respErr) {
            resolve({
              success: false,
              error: `上传失败: ${respErr.message}`
            });
          } else if (respInfo.statusCode === 200) {
            const url = `https://${this.config.domain}/${fileKey}`;
            resolve({
              success: true,
              url: url,
              key: fileKey
            });
          } else {
            resolve({
              success: false,
              error: `上传失败: HTTP ${respInfo.statusCode}`
            });
          }
        });
      });
      
    } catch (error) {
      const errorMsg = `qiniu包不可用: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌ qiniu包异常:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * 生成文件名
   */
  private generateFileName(filePath: string): string {
    const timestamp = Date.now();
    const originalName = filePath.split('/').pop() || 'file';
    return `${timestamp}_${originalName}`;
  }

  /**
   * 获取配置信息
   */
  getConfig(): QiniuConfig {
    return { ...this.config };
  }

  /**
   * 检查配置是否完整
   */
  isConfigured(): boolean {
    return !!(this.config.accessKey && this.config.secretKey && this.config.bucketName && this.config.domain);
  }
}

/**
 * 创建七牛云上传器实例
 */
export function createQiniuUploader(config?: Partial<QiniuConfig>): QiniuUploader {
  return new QiniuUploader(config);
}
