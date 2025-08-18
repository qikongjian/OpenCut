// backend-exporter.ts - 后端导出客户端
// 此文件负责与后端导出API通信
// 文件路径: lib/export/backend-exporter.ts

import { TimelineIR } from "@/types/timeline";
import {
  ExportOptions,
  ExportProgress,
  ExportResult,
  ExportError
} from "@/types/export";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { useMediaStore } from "@/stores/media-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { ASSGenerator } from "@/lib/export/ass-generator";

/**
 * 后端导出客户端
 */
export class BackendExporter {
  private isExporting = false;
  private currentProgress: ExportProgress = {
    overall: 0,
    stage: 'preparing',
    elapsedTime: 0,
    startTime: Date.now(),
  };
  private abortController: AbortController | null = null;

  /**
   * 导出视频（简单模式）
   */
  async export(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    this.isExporting = true;
    this.currentProgress = {
      overall: 0,
      stage: 'preparing',
      elapsedTime: 0,
      startTime: Date.now(),
    };

    try {
      this.updateProgress({ message: '连接到服务器...' });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ir, options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      this.updateProgress({ 
        stage: 'finalizing', 
        overall: 0.9, 
        message: '下载结果文件...' 
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      this.updateProgress({ overall: 1, message: '导出完成!' });

      return {
        success: true,
        blob,
        url,
        filename: `export_${Date.now()}.mp4`,
        size: blob.size,
        duration: (Date.now() - this.currentProgress.startTime) / 1000,
        quality: options.quality,
        method: 'backend',
      };

    } catch (error) {
      throw this.createExportError(error);
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * 流式导出（支持实时进度）
   */
  async exportWithProgress(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    this.isExporting = true;
    this.abortController = new AbortController();
    
    this.currentProgress = {
      overall: 0,
      stage: 'preparing',
      elapsedTime: 0,
      startTime: Date.now(),
    };

    try {
      return await this.streamExport(ir, options);
    } catch (error) {
      throw this.createExportError(error);
    } finally {
      this.isExporting = false;
      this.abortController = null;
    }
  }

  /**
   * 执行流式导出
   */
  private async streamExport(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🚀 Starting export process...');
      console.log('IR:', { videoCount: ir.video.length, duration: ir.duration, textCount: ir.texts.length });

      // 优先检查是否为AI剪辑（最快）
      const aiClipsData = await this.checkForAIClips();
      if (aiClipsData) {
        console.log('✅ Using AI clips fast export API');
        return this.streamExportAIClips(aiClipsData, options);
      }

      // 其次尝试使用文件上传API来获取真实视频内容
      const hasRealVideoFiles = await this.checkForRealVideoFiles(ir);
      if (hasRealVideoFiles) {
        console.log('✅ Using upload API for real video files');
        return this.streamExportWithFiles(ir, options);
      } else {
        console.log('✅ Using standard API (test videos)');
        return this.streamExportStandard(ir, options);
      }
    } catch (error) {
      console.error('❌ Export process failed:', error);
      throw error;
    }
  }

  /**
   * 检查是否为AI剪辑（优先级最高）
   */
  private async checkForAIClips(): Promise<any | null> {
    try {
      console.log('🔍 Checking for AI clips...');
      const aiEditingStore = useAIEditingStore.getState();
      console.log('AI editing store state:', {
        hasCurrentEditingPlan: !!aiEditingStore.currentEditingPlan,
        planKeys: aiEditingStore.currentEditingPlan ? Object.keys(aiEditingStore.currentEditingPlan) : []
      });

      // 检查是否有AI剪辑计划数据
      if (aiEditingStore.currentEditingPlan &&
          aiEditingStore.currentEditingPlan.timeline_clips &&
          aiEditingStore.currentEditingPlan.timeline_clips.length > 0) {

        console.log('✅ Found AI editing plan with', aiEditingStore.currentEditingPlan.timeline_clips.length, 'clips');
        console.log('First clip sample:', aiEditingStore.currentEditingPlan.timeline_clips[0]);
        return aiEditingStore.currentEditingPlan;
      } else {
        console.log('❌ No AI editing plan found or no clips');
      }
    } catch (error) {
      console.error('❌ Failed to check AI clips:', error);
    }

    return null;
  }

  /**
   * 检查是否有真实的视频文件
   */
  private async checkForRealVideoFiles(ir: TimelineIR): Promise<boolean> {
    const mediaStore = useMediaStore.getState();

    for (const video of ir.video) {
      const mediaItem = mediaStore.mediaItems.find(item =>
        item.url === video.src || item.id === video.id
      );

      if (mediaItem && mediaItem.file) {
        return true; // 找到至少一个真实文件
      }
    }

    return false;
  }

  /**
   * 使用文件上传的流式导出
   */
  private async streamExportWithFiles(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    const formData = new FormData();

    // 添加IR和选项数据
    formData.append('ir', JSON.stringify(ir));
    formData.append('options', JSON.stringify(options));

    // 添加视频文件
    const mediaStore = useMediaStore.getState();

    for (const video of ir.video) {
      const mediaItem = mediaStore.mediaItems.find(item =>
        item.url === video.src || item.id === video.id
      );

      if (mediaItem && mediaItem.file) {
        formData.append(`video_${video.id}`, mediaItem.file);
        console.log(`Added file for video ${video.id}:`, mediaItem.file.name);
      }
    }

    const response = await fetch('/api/export/upload', {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal,
    });

    return this.processStreamResponse(response, options);
  }

  /**
   * 标准流式导出（不上传文件）
   */
  private async streamExportStandard(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    const response = await fetch('/api/export/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ir, options }),
      signal: this.abortController?.signal,
    });

    return this.processStreamResponse(response, options);
  }

  /**
   * AI剪辑快速导出
   */
  private async streamExportAIClips(aiPlan: any, options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🚀 Starting AI clips export...');

      // 生成字幕
      console.log('📝 Generating subtitles...');
      const timelineStore = useTimelineStore.getState();
      const ir = timelineStore.toIR();
      const assContent = ASSGenerator.generateASS(ir);
      console.log('✅ Subtitles generated, length:', assContent.length);

      // 计算总时长
      const totalDuration = ir.duration / 1000; // 转换为秒
      console.log('⏱️ Total duration:', totalDuration, 'seconds');

      // 准备AI剪辑数据
      const requestData = {
        clips: aiPlan.timeline_clips.map((clip: any) => ({
          sequence_clip_id: clip.sequence_clip_id,
          video_url: clip.video_url,
          sequence_start_timecode: clip.sequence_start_timecode,
          source_in_timecode: clip.source_in_timecode,
          source_out_timecode: clip.source_out_timecode,
          clip_duration_in_sequence: clip.clip_duration_in_sequence,
        })),
        subtitles: assContent,
        totalDuration,
        options: {
          quality: options.quality,
          width: 1920,
          height: 1080,
          fps: 30,
        },
      };

      console.log('📦 AI clips export request prepared:', {
        clipsCount: requestData.clips.length,
        totalDuration,
        quality: options.quality,
        firstClipUrl: requestData.clips[0]?.video_url,
      });

      console.log('🌐 Sending request to /api/export/ai-clips...');
      const response = await fetch('/api/export/ai-clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: this.abortController?.signal,
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return this.processStreamResponse(response, options);
    } catch (error) {
      console.error('❌ AI clips export failed:', error);
      throw error;
    }
  }

  /**
   * 处理流式响应
   */
  private async processStreamResponse(response: Response, options?: ExportOptions): Promise<ExportResult> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let downloadUrl = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              await this.handleStreamEvent(data);
              
              if (data.type === 'complete' && data.downloadUrl) {
                downloadUrl = data.downloadUrl;
                console.log('🎯 Received download URL from SSE:', downloadUrl);
              }
            } catch (error) {
              console.warn('Failed to parse SSE data:', line, error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!downloadUrl) {
      throw new Error('No download URL received');
    }

    // 下载最终文件（带重试机制）
    this.updateProgress({
      stage: 'finalizing',
      overall: 0.95,
      message: '下载结果文件...'
    });

    let blob: Blob;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Attempting download (${retryCount + 1}/${maxRetries}):`, downloadUrl);
        const downloadResponse = await fetch(downloadUrl);
        console.log('📥 Download response:', {
          url: downloadUrl,
          status: downloadResponse.status,
          statusText: downloadResponse.statusText,
          ok: downloadResponse.ok,
        });

        if (!downloadResponse.ok) {
          throw new Error(`Download failed with status: ${downloadResponse.status}`);
        }

        blob = await downloadResponse.blob();
        console.log('✅ Blob created successfully:', {
          size: blob.size,
          type: blob.type,
        });
        break; // 成功，退出重试循环
      } catch (error) {
        retryCount++;
        console.warn(`Download attempt ${retryCount}/${maxRetries} failed:`, error);

        if (retryCount >= maxRetries) {
          throw new Error(`Failed to download result file after ${maxRetries} attempts: ${error}`);
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    console.log('🔗 Creating object URL for blob:', {
      blobSize: blob!.size,
      blobType: blob!.type,
    });

    let url: string;
    try {
      url = URL.createObjectURL(blob!);
      console.log('✅ Object URL created:', url);
    } catch (urlError) {
      console.error('❌ Failed to create object URL:', urlError);
      throw new Error(`Failed to create download URL: ${urlError}`);
    }

    this.updateProgress({ overall: 1, message: '导出完成!' });

    const result = {
      success: true,
      blob: blob!,
      url,
      filename: `export_${Date.now()}.mp4`,
      size: blob!.size,
      duration: (Date.now() - this.currentProgress.startTime) / 1000,
      quality: options?.quality || 'medium',
      method: 'backend' as const,
    };

    console.log('🎉 Export result prepared:', {
      success: result.success,
      filename: result.filename,
      size: result.size,
      duration: result.duration,
      method: result.method,
      urlLength: result.url.length,
    });

    return result;
  }

  /**
   * 处理流事件
   */
  private async handleStreamEvent(data: any): Promise<void> {
    switch (data.type) {
      case 'start':
        this.updateProgress({ 
          stage: 'preparing', 
          message: data.message,
          overall: 0,
        });
        break;

      case 'progress':
        this.updateProgress({
          stage: data.stage,
          message: data.message,
          overall: data.progress || this.currentProgress.overall,
          currentFile: data.currentFile,
          processedFrames: data.frames,
        });
        break;

      case 'info':
        // 更新详细信息但不改变主要进度
        if (this.currentProgress.onProgress) {
          this.currentProgress.onProgress({
            ...this.currentProgress,
            message: data.message,
          });
        }
        break;

      case 'complete':
        this.updateProgress({
          stage: 'finalizing',
          message: data.message,
          overall: 0.9,
        });
        break;

      case 'error':
        throw new Error(data.message);

      default:
        console.log('Unknown stream event:', data);
    }
  }

  /**
   * 检查服务器健康状态
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    ffmpeg: boolean;
    message?: string;
  }> {
    try {
      const response = await fetch('/api/export', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: data.status === 'healthy',
          ffmpeg: data.ffmpeg === 'available',
          message: data.status,
        };
      } else {
        return {
          healthy: false,
          ffmpeg: false,
          message: `Server error: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        ffmpeg: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 估算导出时间
   */
  estimateExportTime(ir: TimelineIR, options: ExportOptions): number {
    const durationSeconds = ir.duration / 1000;
    
    // 基础处理时间（实时的0.2-0.5倍，取决于质量）
    let multiplier = 0.3;
    
    switch (options.quality) {
      case 'preview':
        multiplier = 0.2;
        break;
      case 'standard':
        multiplier = 0.3;
        break;
      case 'professional':
        multiplier = 0.5;
        break;
    }

    // GPU加速可以减少时间
    if (options.useGPU) {
      multiplier *= 0.6;
    }

    // 复杂度调整
    const complexity = this.calculateComplexity(ir);
    multiplier *= (1 + complexity / 100);

    return durationSeconds * multiplier;
  }

  /**
   * 计算项目复杂度
   */
  private calculateComplexity(ir: TimelineIR): number {
    let score = 0;
    
    score += ir.video.length * 5;
    score += ir.audio.length * 2;
    score += ir.texts.length * 3;
    score += ir.transitions.length * 10;
    
    // 分辨率复杂度
    const pixelCount = ir.width * ir.height;
    if (pixelCount >= 3840 * 2160) score += 30; // 4K
    else if (pixelCount >= 1920 * 1080) score += 15; // 1080p
    else if (pixelCount >= 1280 * 720) score += 5; // 720p

    return Math.min(100, score);
  }

  /**
   * 更新进度
   */
  private updateProgress(update: Partial<ExportProgress>): void {
    this.currentProgress = {
      ...this.currentProgress,
      ...update,
      elapsedTime: (Date.now() - this.currentProgress.startTime) / 1000,
    };

    if (this.currentProgress.onProgress) {
      this.currentProgress.onProgress(this.currentProgress);
    }
  }

  /**
   * 创建导出错误
   */
  private createExportError(error: any): ExportError {
    return {
      code: 'BACKEND_EXPORT_ERROR',
      message: error.message || '后端导出失败',
      stage: this.currentProgress.stage,
      details: error,
      recoverable: true,
      suggestions: [
        '检查网络连接',
        '尝试前端导出',
        '减少项目复杂度',
        '联系技术支持',
      ],
      context: {
        timeElapsed: this.currentProgress.elapsedTime,
      },
    };
  }

  /**
   * 获取当前进度
   */
  getCurrentProgress(): ExportProgress {
    return { ...this.currentProgress };
  }

  /**
   * 取消导出
   */
  async cancel(): Promise<void> {
    if (!this.isExporting) return;

    if (this.abortController) {
      this.abortController.abort();
    }

    this.isExporting = false;
  }
}
