// media-processing.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/media-processing.ts
// 最后更新: 2025/7/23

// media-processing.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入模块
import {
  getFileType,
  generateVideoThumbnail,
  getMediaDuration,
  getImageDimensions,
// MediaItem 类型定义
  type MediaItem,
  validateFileByExtension,
  SUPPORTED_FORMATS,
  type MediaType,
} from "@/stores/media-store";
// 导入 FFmpeg 视频处理库
import { generateThumbnail, getVideoInfo } from "./ffmpeg-utils";

// 接口定义 - 定义对象的结构和属性类型
export interface ProcessedMediaItem extends Omit<MediaItem, "id"> {}

// 批量处理进度回调接口
export interface BatchProcessProgress {
  current: number;
  total: number;
  percentage: number;
  currentFileName: string;
  phase: 'validating' | 'processing' | 'generating_thumbnails' | 'completed';
}

// 文件验证结果接口
export interface FileValidationResult {
  file: File;
  isValid: boolean;
  type?: MediaType;
  error?: string;
}

// 批量验证文件格式
export async function validateFileFormats(files: File[]): Promise<FileValidationResult[]> {
  const results: FileValidationResult[] = [];
  
  for (const file of files) {
    // 优先使用MIME类型验证
    const mimeType = getFileType(file);
    if (mimeType) {
      results.push({
        file,
        isValid: true,
        type: mimeType
      });
    } else {
      // 回退到文件扩展名验证
      const extensionValidation = validateFileByExtension(file.name);
      results.push({
        file,
        isValid: extensionValidation.isValid,
        type: extensionValidation.type,
        error: extensionValidation.error
      });
    }
  }
  
  return results;
}

// 批量生成缩略图
export async function generateBatchThumbnails(
  files: File[],
  onProgress?: (progress: BatchProcessProgress) => void
): Promise<Map<File, string>> {
  const thumbnailMap = new Map<File, string>();
  let processedCount = 0;
  
  // 过滤出需要生成缩略图的视频文件
  const videoFiles = files.filter(file => getFileType(file) === 'video');
  
  if (videoFiles.length === 0) {
    return thumbnailMap;
  }
  
  for (const file of videoFiles) {
    try {
      if (onProgress) {
        onProgress({
          current: processedCount + 1,
          total: videoFiles.length,
          percentage: Math.round(((processedCount + 1) / videoFiles.length) * 100),
          currentFileName: file.name,
          phase: 'generating_thumbnails'
        });
      }
      
      // 优先使用FFmpeg生成缩略图
      try {
        const thumbnailUrl = await generateThumbnail(file, 1);
        thumbnailMap.set(file, thumbnailUrl);
      } catch (error) {
        console.warn(`FFmpeg thumbnail generation failed for ${file.name}, falling back to basic method:`, error);
        
        // 回退到基础方法
        const { thumbnailUrl } = await generateVideoThumbnail(file);
        thumbnailMap.set(file, thumbnailUrl);
      }
      
      processedCount++;
      
      // 短暂延迟以保持UI响应性
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${file.name}:`, error);
      processedCount++;
    }
  }
  
  return thumbnailMap;
}

// 批量提取媒体元数据
export async function getBatchFileMetadata(
  files: File[],
  onProgress?: (progress: BatchProcessProgress) => void
): Promise<Map<File, Partial<ProcessedMediaItem>>> {
  const metadataMap = new Map<File, Partial<ProcessedMediaItem>>();
  let processedCount = 0;
  
  for (const file of files) {
    try {
      if (onProgress) {
        onProgress({
          current: processedCount + 1,
          total: files.length,
          percentage: Math.round(((processedCount + 1) / files.length) * 100),
          currentFileName: file.name,
          phase: 'processing'
        });
      }
      
      const fileType = getFileType(file);
      if (!fileType) continue;
      
      const url = URL.createObjectURL(file);
      let metadata: Partial<ProcessedMediaItem> = {
        name: file.name,
        type: fileType,
        file,
        url
      };
      
      if (fileType === "image") {
        // 处理图片元数据
        try {
          const dimensions = await getImageDimensions(file);
          metadata.width = dimensions.width;
          metadata.height = dimensions.height;
        } catch (error) {
          console.warn(`Failed to get image dimensions for ${file.name}:`, error);
        }
        
      } else if (fileType === "video") {
        // 处理视频元数据
        try {
          // 优先使用FFmpeg获取详细信息
          const videoInfo = await getVideoInfo(file);
          metadata.duration = videoInfo.duration;
          metadata.width = videoInfo.width;
          metadata.height = videoInfo.height;
          metadata.fps = videoInfo.fps;
        } catch (error) {
          console.warn(`FFmpeg metadata extraction failed for ${file.name}, using fallback:`, error);
          
          // 回退到基础方法
          try {
            const duration = await getMediaDuration(file);
            metadata.duration = duration;
            
            // 尝试从视频缩略图生成中获取尺寸信息
            const { width, height } = await generateVideoThumbnail(file);
            metadata.width = width;
            metadata.height = height;
          } catch (fallbackError) {
            console.error(`Fallback metadata extraction failed for ${file.name}:`, fallbackError);
          }
        }
        
      } else if (fileType === "audio") {
        // 处理音频元数据
        try {
          const duration = await getMediaDuration(file);
          metadata.duration = duration;
        } catch (error) {
          console.warn(`Failed to get audio duration for ${file.name}:`, error);
        }
      }
      
      metadataMap.set(file, metadata);
      processedCount++;
      
      // 短暂延迟以保持UI响应性
      await new Promise(resolve => setTimeout(resolve, 10));
      
    } catch (error) {
      console.error(`Failed to extract metadata for ${file.name}:`, error);
      processedCount++;
    }
  }
  
  return metadataMap;
}

// 增强的批量处理媒体文件函数
export async function processBatchMediaFiles(
  files: File[],
  onProgress?: (progress: BatchProcessProgress) => void
): Promise<{
  successful: ProcessedMediaItem[];
  failed: { file: File; error: string }[];
}> {
  const result = {
    successful: [] as ProcessedMediaItem[],
    failed: [] as { file: File; error: string }[]
  };
  
  if (files.length === 0) {
    return result;
  }
  
  try {
    // 第1阶段：验证文件格式
    if (onProgress) {
      onProgress({
        current: 0,
        total: files.length,
        percentage: 0,
        currentFileName: '验证文件格式...',
        phase: 'validating'
      });
    }
    
    const validationResults = await validateFileFormats(files);
    const validFiles = validationResults
      .filter(result => result.isValid)
      .map(result => result.file);
    
    // 记录验证失败的文件
    validationResults
      .filter(result => !result.isValid)
      .forEach(invalidResult => {
        result.failed.push({
          file: invalidResult.file,
          error: invalidResult.error || '不支持的文件格式'
        });
      });
    
    if (validFiles.length === 0) {
      return result;
    }
    
    // 第2阶段：批量提取元数据
    const metadataMap = await getBatchFileMetadata(validFiles, onProgress);
    
    // 第3阶段：批量生成缩略图
    const thumbnailMap = await generateBatchThumbnails(validFiles, onProgress);
    
    // 第4阶段：组装最终结果
    for (const file of validFiles) {
      try {
        const metadata = metadataMap.get(file);
        if (metadata) {
          const processedItem: ProcessedMediaItem = {
            ...metadata,
            thumbnailUrl: thumbnailMap.get(file) || metadata.thumbnailUrl
          };
          result.successful.push(processedItem);
        }
      } catch (error) {
        result.failed.push({
          file,
          error: error instanceof Error ? error.message : '处理文件时发生未知错误'
        });
      }
    }
    
    // 完成处理
    if (onProgress) {
      onProgress({
        current: files.length,
        total: files.length,
        percentage: 100,
        currentFileName: '',
        phase: 'completed'
      });
    }
    
  } catch (error) {
    console.error('Batch processing failed:', error);
    // 将所有文件标记为失败
    files.forEach(file => {
      if (!result.failed.some(f => f.file === file) && !result.successful.some(s => s.file === file)) {
        result.failed.push({
          file,
          error: '批量处理过程中发生错误'
        });
      }
    });
  }
  
  return result;
}

// processMediaFiles 函数（保持向后兼容）
export async function processMediaFiles(
  files: FileList | File[],
  onProgress?: (progress: number) => void
): Promise<ProcessedMediaItem[]> {
// 常量定义 - 模块内部使用的固定值
  const fileArray = Array.from(files);
  
  // 如果有新的批量处理进度回调，转换为旧的格式
  const batchProgress = onProgress ? (progress: BatchProcessProgress) => {
    onProgress(progress.percentage);
  } : undefined;
  
  const batchResult = await processBatchMediaFiles(fileArray, batchProgress);
  
  // 显示错误信息（保持原有行为）
  batchResult.failed.forEach(({ file, error }) => {
    toast.error(`Failed to process ${file.name}: ${error}`);
  });
  
  return batchResult.successful;
}

// 获取支持的文件格式信息
export function getSupportedFormats(): typeof SUPPORTED_FORMATS {
  return SUPPORTED_FORMATS;
}

// 检查文件是否为支持的格式
export function isSupportedFile(file: File): boolean {
  return getFileType(file) !== null || validateFileByExtension(file.name).isValid;
}

// 根据文件类型获取建议的处理选项
export function getProcessingOptionsForFile(file: File): {
  needsThumbnail: boolean;
  needsDuration: boolean;
  needsDimensions: boolean;
  supportedOperations: string[];
} {
  const fileType = getFileType(file);
  
  switch (fileType) {
    case 'video':
      return {
        needsThumbnail: true,
        needsDuration: true,
        needsDimensions: true,
        supportedOperations: ['trim', 'crop', 'resize', 'rotate', 'speed', 'effects']
      };
    case 'audio':
      return {
        needsThumbnail: false,
        needsDuration: true,
        needsDimensions: false,
        supportedOperations: ['trim', 'volume', 'effects']
      };
    case 'image':
      return {
        needsThumbnail: false,
        needsDuration: false,
        needsDimensions: true,
        supportedOperations: ['crop', 'resize', 'rotate', 'effects']
      };
    default:
      return {
        needsThumbnail: false,
        needsDuration: false,
        needsDimensions: false,
        supportedOperations: []
      };
  }
}
