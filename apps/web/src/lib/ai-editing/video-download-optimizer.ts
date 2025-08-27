// video-download-optimizer.ts - 视频下载进度优化器
// 解决视频下载阶段耗时过长的问题
// 文件路径: lib/ai-editing/video-download-optimizer.ts

export interface DownloadProgress {
  videoId: string;
  progress: number;
  speed: number; // KB/s
  estimatedTimeRemaining: number; // 秒
  status: 'pending' | 'downloading' | 'completed' | 'error';
}

export interface BatchDownloadProgress {
  totalVideos: number;
  completedVideos: number;
  currentVideo: string;
  overallProgress: number;
  averageSpeed: number;
  estimatedTimeRemaining: number;
}

/**
 * 视频下载优化器
 * 提供并行下载、进度监控、速度优化等功能
 */
export class VideoDownloadOptimizer {
  private downloads = new Map<string, DownloadProgress>();
  private onProgressUpdate?: (progress: BatchDownloadProgress) => void;
  private maxConcurrentDownloads = 3; // 最大并发下载数
  private activeDownloads = 0;

  constructor(onProgressUpdate?: (progress: BatchDownloadProgress) => void) {
    this.onProgressUpdate = onProgressUpdate;
  }

  /**
   * 批量下载视频（优化版）
   */
  async batchDownloadVideos(
    videos: Array<{ id: string; url: string; name: string }>
  ): Promise<void> {
    console.log(`🚀 开始优化批量下载 ${videos.length} 个视频`);
    
    // 初始化下载状态
    videos.forEach(video => {
      this.downloads.set(video.id, {
        videoId: video.id,
        progress: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        status: 'pending',
      });
    });

    // 创建下载队列
    const downloadQueue = [...videos];
    const downloadPromises: Promise<void>[] = [];

    // 启动并发下载
    while (downloadQueue.length > 0 || this.activeDownloads > 0) {
      // 启动新的下载任务
      while (
        downloadQueue.length > 0 && 
        this.activeDownloads < this.maxConcurrentDownloads
      ) {
        const video = downloadQueue.shift()!;
        const downloadPromise = this.downloadSingleVideo(video);
        downloadPromises.push(downloadPromise);
      }

      // 等待至少一个下载完成
      if (downloadPromises.length > 0) {
        await Promise.race(downloadPromises);
      }

      // 更新整体进度
      this.updateBatchProgress(videos);
    }

    console.log('✅ 批量下载完成');
  }

  /**
   * 下载单个视频（优化版）
   */
  private async downloadSingleVideo(
    video: { id: string; url: string; name: string }
  ): Promise<void> {
    this.activeDownloads++;
    
    try {
      const downloadState = this.downloads.get(video.id)!;
      downloadState.status = 'downloading';
      
      console.log(`📥 开始下载视频: ${video.name}`);
      const startTime = Date.now();

      // 🎯 使用优化的下载策略
      await this.optimizedDownload(video, (progress, speed) => {
        downloadState.progress = progress;
        downloadState.speed = speed;
        downloadState.estimatedTimeRemaining = 
          speed > 0 ? (100 - progress) / speed : 0;
        
        this.updateBatchProgress([video]);
      });

      downloadState.status = 'completed';
      downloadState.progress = 100;
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ 视频下载完成: ${video.name} (${duration.toFixed(1)}s)`);

    } catch (error) {
      console.error(`❌ 视频下载失败: ${video.name}`, error);
      const downloadState = this.downloads.get(video.id)!;
      downloadState.status = 'error';
    } finally {
      this.activeDownloads--;
    }
  }

  /**
   * 优化的下载实现
   */
  private async optimizedDownload(
    video: { id: string; url: string; name: string },
    onProgress: (progress: number, speed: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let lastProgressTime = startTime;
      let lastLoaded = 0;

      xhr.open('GET', video.url, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          
          // 计算下载速度
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastProgressTime) / 1000;
          const loadedDiff = event.loaded - lastLoaded;
          const speed = timeDiff > 0 ? (loadedDiff / 1024) / timeDiff : 0; // KB/s
          
          onProgress(progress, speed);
          
          lastProgressTime = currentTime;
          lastLoaded = event.loaded;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          // 这里应该保存文件到存储系统
          // 暂时模拟保存过程
          setTimeout(() => {
            resolve();
          }, 100);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('网络错误'));
      };

      xhr.ontimeout = () => {
        reject(new Error('下载超时'));
      };

      xhr.timeout = 30000; // 30秒超时
      xhr.send();
    });
  }

  /**
   * 更新批量下载进度
   */
  private updateBatchProgress(allVideos: Array<{ id: string; url: string; name: string }>) {
    const completedCount = Array.from(this.downloads.values())
      .filter(d => d.status === 'completed').length;
    
    const totalProgress = Array.from(this.downloads.values())
      .reduce((sum, d) => sum + d.progress, 0) / this.downloads.size;
    
    const averageSpeed = Array.from(this.downloads.values())
      .filter(d => d.status === 'downloading')
      .reduce((sum, d) => sum + d.speed, 0) / Math.max(this.activeDownloads, 1);
    
    const currentVideo = Array.from(this.downloads.values())
      .find(d => d.status === 'downloading')?.videoId || '';
    
    const estimatedTimeRemaining = averageSpeed > 0 
      ? (100 - totalProgress) / averageSpeed 
      : 0;

    const batchProgress: BatchDownloadProgress = {
      totalVideos: allVideos.length,
      completedVideos: completedCount,
      currentVideo,
      overallProgress: totalProgress,
      averageSpeed,
      estimatedTimeRemaining,
    };

    this.onProgressUpdate?.(batchProgress);
  }

  /**
   * 获取下载统计
   */
  getDownloadStats() {
    const downloads = Array.from(this.downloads.values());
    return {
      total: downloads.length,
      completed: downloads.filter(d => d.status === 'completed').length,
      downloading: downloads.filter(d => d.status === 'downloading').length,
      pending: downloads.filter(d => d.status === 'pending').length,
      error: downloads.filter(d => d.status === 'error').length,
    };
  }

  /**
   * 设置最大并发下载数
   */
  setMaxConcurrentDownloads(max: number) {
    this.maxConcurrentDownloads = Math.max(1, Math.min(max, 5));
  }

  /**
   * 清理下载状态
   */
  cleanup() {
    this.downloads.clear();
    this.activeDownloads = 0;
  }
}

/**
 * 创建视频下载优化器实例
 */
export function createVideoDownloadOptimizer(
  onProgressUpdate?: (progress: BatchDownloadProgress) => void
): VideoDownloadOptimizer {
  return new VideoDownloadOptimizer(onProgressUpdate);
}
