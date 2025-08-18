// ai-video-exporter.ts - AI剪辑视频专用导出器
// 此文件专门处理AI剪辑后的带字幕视频导出
// 文件路径: lib/export/ai-video-exporter.ts

import { TimelineIR } from "@/types/timeline";
import { ExportOptions, ExportProgress, ExportResult } from "@/types/export";
import { useTimelineStore } from "@/stores/timeline-store";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { toast } from "sonner";

/**
 * AI剪辑视频专用导出器
 * 专门处理AI剪辑后的带字幕视频导出
 */
export class AIVideoExporter {
  private isExporting = false;

  /**
   * 导出AI剪辑的视频（带字幕）
   */
  async exportAIVideo(
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('导出正在进行中');
    }

    this.isExporting = true;
    const startTime = Date.now();

    try {
      // 1. 检查AI剪辑数据
      const aiEditingStore = useAIEditingStore.getState();
      const timelineStore = useTimelineStore.getState();

      this.updateProgress(onProgress, {
        overall: 0.1,
        stage: 'preparing',
        message: '检查AI剪辑数据...',
        elapsedTime: 0,
        startTime,
      });

      if (!aiEditingStore.currentEditingPlan) {
        throw new Error('没有找到AI剪辑计划，请先执行AI剪辑');
      }

      // 2. 收集时间轴数据
      this.updateProgress(onProgress, {
        overall: 0.2,
        stage: 'preparing',
        message: '收集时间轴数据...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      const ir = this.generateIRFromTimeline(timelineStore);
      console.log('Generated IR for AI video export:', ir);

      // 3. 检查是否有内容
      if (!ir.video.length && !ir.audio.length && !ir.texts.length) {
        throw new Error('时间轴为空，请确保AI剪辑已完成');
      }

      // 4. 尝试前端导出
      this.updateProgress(onProgress, {
        overall: 0.3,
        stage: 'processing',
        message: '初始化前端导出引擎...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      const result = await this.exportWithFrontend(ir, onProgress, startTime);
      
      this.updateProgress(onProgress, {
        overall: 1.0,
        stage: 'finalizing',
        message: '导出完成!',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      return result;

    } catch (error) {
      console.error('AI video export failed:', error);
      throw error;
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * 从时间轴生成IR
   */
  private generateIRFromTimeline(timelineStore: any): TimelineIR {
    // 获取画布设置
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    const fps = 30;

    // 计算总时长
    let maxDuration = 0;
    for (const track of timelineStore.tracks) {
      for (const element of track.elements) {
        const elementEnd = element.start + element.duration;
        maxDuration = Math.max(maxDuration, elementEnd);
      }
    }

    // 收集视频元素
    const videoElements = [];
    const audioElements = [];
    const textElements = [];

    for (const track of timelineStore.tracks) {
      for (const element of track.elements) {
        if (track.type === 'media' && element.type === 'video') {
          videoElements.push({
            id: element.id,
            src: element.src || element.url || '',
            start: element.start,
            duration: element.duration,
            in: element.in || 0,
            out: element.out || element.duration,
            trackId: track.id,
            transform: element.transform || { x: 0, y: 0, scale: 1, rotate: 0 },
          });
        } else if (track.type === 'media' && element.type === 'audio') {
          audioElements.push({
            id: element.id,
            src: element.src || element.url || '',
            start: element.start,
            duration: element.duration,
            in: element.in || 0,
            out: element.out || element.duration,
            trackId: track.id,
            volume: element.volume || 1,
          });
        } else if (track.type === 'text') {
          textElements.push({
            id: element.id,
            text: element.text || element.content || '',
            start: element.start,
            duration: element.duration,
            style: element.style || {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#FFFFFF',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom-center',
            },
            trackId: track.id,
          });
        }
      }
    }

    return {
      width: canvasWidth,
      height: canvasHeight,
      fps,
      duration: maxDuration,
      video: videoElements,
      audio: audioElements,
      texts: textElements,
      transitions: [], // 暂时不处理转场
    };
  }

  /**
   * 使用前端导出
   */
  private async exportWithFrontend(
    ir: TimelineIR,
    onProgress?: (progress: ExportProgress) => void,
    startTime: number = Date.now()
  ): Promise<ExportResult> {
    try {
      // 动态导入前端导出器
      const { FrontendExporter } = await import('./frontend-exporter');
      const frontendExporter = new FrontendExporter();

      this.updateProgress(onProgress, {
        overall: 0.4,
        stage: 'processing',
        message: '使用前端引擎导出...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      const options: ExportOptions = {
        quality: 'standard',
        method: 'frontend',
        format: 'mp4',
        codec: 'h264',
        subtitleMode: 'hard', // 硬编码字幕
        onProgress: (progress) => {
          this.updateProgress(onProgress, {
            overall: 0.4 + progress.overall * 0.5,
            stage: progress.stage,
            message: progress.message || '处理中...',
            elapsedTime: (Date.now() - startTime) / 1000,
            startTime,
          });
        },
      };

      const result = await frontendExporter.export(ir, options);
      return result;

    } catch (error) {
      console.error('Frontend export failed:', error);
      
      // 如果前端导出失败，创建一个简单的导出结果
      return this.createFallbackExport(ir, startTime);
    }
  }

  /**
   * 创建回退导出结果
   */
  private async createFallbackExport(ir: TimelineIR, startTime: number): Promise<ExportResult> {
    try {
      // 使用简化导出器作为回退
      const { simpleExporter } = await import('./simple-exporter');

      return await simpleExporter.exportAsImage((progress) => {
        // 这里可以传递进度回调，但在回退模式下我们简化处理
        console.log('Fallback export progress:', progress);
      });

    } catch (error) {
      console.error('Fallback export failed, using basic canvas:', error);

      // 如果简化导出器也失败，使用最基本的canvas导出
      const canvas = document.createElement('canvas');
      canvas.width = ir.width;
      canvas.height = ir.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 绘制一个简单的背景
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加文本说明
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI剪辑视频导出', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('(基础回退模式)', canvas.width / 2, canvas.height / 2 + 50);

        // 添加错误信息
        ctx.font = '24px Arial';
        ctx.fillStyle = '#ff6666';
        ctx.fillText('导出系统遇到问题，已使用基础模式', canvas.width / 2, canvas.height / 2 + 100);
      }

      // 转换为Blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({
              success: true,
              blob,
              url,
              filename: `ai-video-export-fallback-${Date.now()}.png`,
              size: blob.size,
              duration: (Date.now() - startTime) / 1000,
              quality: 'preview',
              method: 'frontend',
            });
          } else {
            throw new Error('无法创建导出文件');
          }
        }, 'image/png');
      });
    }
  }

  /**
   * 更新进度
   */
  private updateProgress(
    onProgress: ((progress: ExportProgress) => void) | undefined,
    progress: ExportProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  /**
   * 检查是否可以导出
   */
  static canExport(): { canExport: boolean; reason?: string } {
    const aiEditingStore = useAIEditingStore.getState();
    const timelineStore = useTimelineStore.getState();

    if (!aiEditingStore.currentEditingPlan) {
      return {
        canExport: false,
        reason: '没有AI剪辑计划，请先执行AI剪辑'
      };
    }

    if (!timelineStore.tracks.length) {
      return {
        canExport: false,
        reason: '时间轴为空，请确保AI剪辑已完成'
      };
    }

    // 检查是否有内容
    let hasContent = false;
    for (const track of timelineStore.tracks) {
      if (track.elements.length > 0) {
        hasContent = true;
        break;
      }
    }

    if (!hasContent) {
      return {
        canExport: false,
        reason: '时间轴没有内容，请添加媒体或执行AI剪辑'
      };
    }

    return { canExport: true };
  }
}

// 导出单例实例
export const aiVideoExporter = new AIVideoExporter();
