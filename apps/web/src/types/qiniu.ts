// types/qiniu.ts - 七牛云相关类型定义
// 文件路径: types/qiniu.ts

/**
 * 七牛云配置接口
 */
export interface QiniuConfig {
  accessKey: string;
  secretKey: string;
  bucketName: string;
  domain: string;
}

/**
 * 七牛云上传结果接口
 */
export interface QiniuUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  info?: any;
}

/**
 * 七牛云上传选项接口
 */
export interface QiniuUploadOptions {
  keyPrefix?: string;
  customFileName?: string;
  overwrite?: boolean;
  mimeType?: string;
}

/**
 * 七牛云文件信息接口
 */
export interface QiniuFileInfo {
  key: string;
  hash: string;
  fsize: number;
  mimeType: string;
  putTime: number;
  endUser?: string;
}

/**
 * 七牛云上传策略接口
 */
export interface QiniuUploadPolicy {
  scope: string;
  deadline: number;
  returnBody?: string;
  callbackUrl?: string;
  callbackBody?: string;
  callbackBodyType?: string;
  persistentOps?: string;
  persistentNotifyUrl?: string;
  persistentPipeline?: string;
  saveKey?: string;
  insertOnly?: number;
  detectMime?: number;
  mimeLimit?: string;
  fsizeLimit?: number;
  fsizeMin?: number;
}
