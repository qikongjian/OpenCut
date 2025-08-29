// video-processing-optimizer.ts - 视频处理性能优化工具
// 专门优化ai-editor页面的视频加载和处理性能

import { getVideoInfoFast } from './ffmpeg-utils';

// 🚀 视频处理任务队列管理器
class VideoProcessingQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrentLimit = 2; // 并发处理限制

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    // 🎯 并发处理多个任务
    const activeTasks: Promise<any>[] = [];
    
    while (this.queue.length > 0 && activeTasks.length < this.concurrentLimit) {
      const task = this.queue.shift();
      if (task) {
        activeTasks.push(task());
      }
    }
    
    if (activeTasks.length > 0) {
      await Promise.allSettled(activeTasks);
    }
    
    this.processing = false;
    
    // 继续处理剩余任务
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
}

// 全局视频处理队列
const videoProcessingQueue = new VideoProcessingQueue();

// 🚀 优化的视频信息提取
export async function getVideoInfoOptimized(file: File) {
  return videoProcessingQueue.add(async () => {
    console.log(`🚀 开始快速提取视频信息: ${file.name}`);
    const startTime = performance.now();
    
    try {
      const info = await getVideoInfoFast(file);
      const endTime = performance.now();
      console.log(`✅ 视频信息提取完成: ${file.name} (${(endTime - startTime).toFixed(2)}ms)`);
      return info;
    } catch (error) {
      console.error(`❌ 视频信息提取失败: ${file.name}`, error);
      throw error;
    }
  });
}

// 🚀 优化的缩略图生成（完全使用浏览器原生API，避免FFmpeg依赖）
export async function generateThumbnailOptimized(file: File, timeInSeconds = 1) {
  return videoProcessingQueue.add(async () => {
    console.log(`🖼️ 开始生成缩略图: ${file.name}`);
    const startTime = performance.now();

    try {
      // 🎯 完全使用浏览器原生API，不依赖FFmpeg
      const thumbnail = await generateThumbnailNative(file, timeInSeconds);
      const endTime = performance.now();
      console.log(`✅ 缩略图生成完成: ${file.name} (${(endTime - startTime).toFixed(2)}ms)`);
      return thumbnail;
    } catch (error) {
      console.error(`❌ 缩略图生成失败: ${file.name}`, error);

      // 🎯 直接返回默认缩略图，不再尝试FFmpeg
      console.log(`🔄 使用默认缩略图: ${file.name}`);
      return generateDefaultThumbnail();
    }
  });
}



// 🚀 生成默认缩略图占位符
export function generateDefaultThumbnail(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = 320;
  canvas.height = 240;

  // 绘制默认缩略图
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('视频缩略图', canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/jpeg', 0.8);
}

// 🚀 浏览器原生获取视频时长
export async function getVideoDurationNative(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      video.remove();
      resolve(duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
      reject(new Error('无法获取视频时长'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

// 🚀 浏览器原生生成缩略图（导出版本）
export async function generateThumbnailNative(file: File, timeInSeconds = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取canvas上下文'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 设置时间点
      video.currentTime = Math.min(timeInSeconds, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

        // 清理资源
        URL.revokeObjectURL(video.src);
        video.remove();
        canvas.remove();

        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
      canvas.remove();
      reject(new Error('视频加载失败'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

// 🚀 批量视频处理优化器
export class BatchVideoProcessor {
  private results: Map<string, any> = new Map();
  private errors: Map<string, Error> = new Map();
  
  async processVideos(
    files: File[],
    onProgress?: (current: number, total: number, fileName: string) => void
  ) {
    console.log(`🎬 开始批量处理 ${files.length} 个视频文件`);
    
    const startTime = performance.now();
    let completed = 0;
    
    // 🎯 分批处理，避免内存溢出
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        try {
          // 🚀 使用浏览器原生API，避免FFmpeg依赖问题
          const [videoInfo, thumbnailUrl] = await Promise.allSettled([
            getVideoDurationNative(file).then(duration => ({ duration, width: 1920, height: 1080, fps: 30 })),
            generateThumbnailNative(file).catch(() => generateDefaultThumbnail())
          ]);

          const result = {
            file,
            videoInfo: videoInfo.status === 'fulfilled' ? videoInfo.value : null,
            thumbnailUrl: thumbnailUrl.status === 'fulfilled' ? thumbnailUrl.value : null,
            error: videoInfo.status === 'rejected' ? videoInfo.reason : null
          };
          
          this.results.set(file.name, result);
          completed++;
          
          if (onProgress) {
            onProgress(completed, files.length, file.name);
          }
          
          return result;
        } catch (error) {
          this.errors.set(file.name, error as Error);
          completed++;
          
          if (onProgress) {
            onProgress(completed, files.length, file.name);
          }
          
          throw error;
        }
      });
      
      // 等待当前批次完成
      await Promise.allSettled(batchPromises);
      
      // 🎯 批次间短暂延迟，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const endTime = performance.now();
    console.log(`✅ 批量视频处理完成: ${files.length} 个文件 (${(endTime - startTime).toFixed(2)}ms)`);
    
    return {
      results: this.results,
      errors: this.errors,
      totalTime: endTime - startTime
    };
  }
  
  getResult(fileName: string) {
    return this.results.get(fileName);
  }
  
  getError(fileName: string) {
    return this.errors.get(fileName);
  }
  
  clear() {
    this.results.clear();
    this.errors.clear();
  }
}

// 🚀 内存管理优化
export class VideoMemoryManager {
  private static instance: VideoMemoryManager;
  private objectUrls: Set<string> = new Set();
  private memoryThreshold = 500 * 1024 * 1024; // 500MB
  
  static getInstance() {
    if (!VideoMemoryManager.instance) {
      VideoMemoryManager.instance = new VideoMemoryManager();
    }
    return VideoMemoryManager.instance;
  }
  
  trackObjectUrl(url: string) {
    this.objectUrls.add(url);
    this.checkMemoryUsage();
  }
  
  revokeObjectUrl(url: string) {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }
  
  private checkMemoryUsage() {
    // 🎯 检查内存使用情况
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      if (memInfo.usedJSHeapSize > this.memoryThreshold) {
        console.warn('🚨 内存使用过高，开始清理Object URLs');
        this.cleanupOldUrls();
      }
    }
  }
  
  private cleanupOldUrls() {
    // 清理一半的Object URLs
    const urlsArray = Array.from(this.objectUrls);
    const toCleanup = urlsArray.slice(0, Math.floor(urlsArray.length / 2));
    
    toCleanup.forEach(url => {
      this.revokeObjectUrl(url);
    });
    
    console.log(`🧹 已清理 ${toCleanup.length} 个Object URLs`);
  }
  
  cleanup() {
    this.objectUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls.clear();
  }
}

// 导出单例实例
export const videoMemoryManager = VideoMemoryManager.getInstance();
