// simple-exporter.ts - 简化导出器
// 当FFmpeg不可用时的回退导出解决方案
// 文件路径: lib/export/simple-exporter.ts

import { TimelineIR } from "@/types/timeline";
import { ExportOptions, ExportProgress, ExportResult } from "@/types/export";
import { useTimelineStore } from "@/stores/timeline-store";
import { useAIEditingStore } from "@/stores/ai-editing-store";

/**
 * 简化导出器 - 当FFmpeg不可用时的回退方案
 */
export class SimpleExporter {
  /**
   * 导出为图片序列或静态图片
   */
  async exportAsImage(
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // 1. 获取时间轴数据
      this.updateProgress(onProgress, {
        overall: 0.1,
        stage: 'preparing',
        message: '收集时间轴数据...',
        elapsedTime: 0,
        startTime,
      });

      const timelineStore = useTimelineStore.getState();
      const aiEditingStore = useAIEditingStore.getState();

      // 2. 创建画布
      this.updateProgress(onProgress, {
        overall: 0.2,
        stage: 'preparing',
        message: '创建画布...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('无法创建画布上下文');
      }

      // 3. 绘制背景
      this.updateProgress(onProgress, {
        overall: 0.3,
        stage: 'processing',
        message: '绘制背景...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. 添加标题
      this.updateProgress(onProgress, {
        overall: 0.4,
        stage: 'processing',
        message: '添加标题...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('OpenCut AI剪辑视频', canvas.width / 2, canvas.height / 2 - 200);

      // 5. 添加AI剪辑信息
      this.updateProgress(onProgress, {
        overall: 0.5,
        stage: 'processing',
        message: '添加AI剪辑信息...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      if (aiEditingStore.currentEditingPlan) {
        ctx.font = '36px Arial';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('✓ AI剪辑已完成', canvas.width / 2, canvas.height / 2 - 100);

        // 显示剪辑计划信息
        const plan = aiEditingStore.currentEditingPlan;
        ctx.font = '24px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(`剪辑片段: ${plan.clips?.length || 0}个`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(`总时长: ${Math.round((plan.totalDuration || 0) / 1000)}秒`, canvas.width / 2, canvas.height / 2 - 20);
      }

      // 6. 添加时间轴统计
      this.updateProgress(onProgress, {
        overall: 0.6,
        stage: 'processing',
        message: '添加时间轴统计...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      let videoCount = 0;
      let audioCount = 0;
      let textCount = 0;

      for (const track of timelineStore.tracks) {
        for (const element of track.elements) {
          if (track.type === 'media' && element.type === 'video') {
            videoCount++;
          } else if (track.type === 'media' && element.type === 'audio') {
            audioCount++;
          } else if (track.type === 'text') {
            textCount++;
          }
        }
      }

      ctx.font = '28px Arial';
      ctx.fillStyle = '#888888';
      ctx.fillText(`视频片段: ${videoCount}`, canvas.width / 2 - 200, canvas.height / 2 + 50);
      ctx.fillText(`音频片段: ${audioCount}`, canvas.width / 2, canvas.height / 2 + 50);
      ctx.fillText(`字幕片段: ${textCount}`, canvas.width / 2 + 200, canvas.height / 2 + 50);

      // 7. 添加字幕示例
      this.updateProgress(onProgress, {
        overall: 0.7,
        stage: 'processing',
        message: '添加字幕示例...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      // 绘制字幕区域
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

      // 添加字幕文本
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      
      if (textCount > 0) {
        ctx.fillText('这是AI生成的字幕效果预览', canvas.width / 2, canvas.height - 80);
        ctx.font = '28px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('This is an AI-generated subtitle preview', canvas.width / 2, canvas.height - 40);
      } else {
        ctx.fillText('暂无字幕内容', canvas.width / 2, canvas.height - 80);
        ctx.font = '28px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('No subtitle content available', canvas.width / 2, canvas.height - 40);
      }

      // 8. 添加时间戳和版本信息
      this.updateProgress(onProgress, {
        overall: 0.8,
        stage: 'processing',
        message: '添加元数据...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      ctx.font = '20px Arial';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'left';
      ctx.fillText(`导出时间: ${new Date().toLocaleString()}`, 50, 50);
      ctx.fillText('OpenCut v1.0 - AI视频编辑器', 50, 80);
      
      ctx.textAlign = 'right';
      ctx.fillText('简化导出模式', canvas.width - 50, 50);
      ctx.fillText('FFmpeg.wasm 回退方案', canvas.width - 50, 80);

      // 9. 转换为Blob
      this.updateProgress(onProgress, {
        overall: 0.9,
        stage: 'finalizing',
        message: '生成导出文件...',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('无法生成图片文件'));
          }
        }, 'image/png', 0.9);
      });

      const url = URL.createObjectURL(blob);
      const filename = `opencut-ai-export-${Date.now()}.png`;

      this.updateProgress(onProgress, {
        overall: 1.0,
        stage: 'finalizing',
        message: '导出完成!',
        elapsedTime: (Date.now() - startTime) / 1000,
        startTime,
      });

      return {
        success: true,
        blob,
        url,
        filename,
        size: blob.size,
        duration: (Date.now() - startTime) / 1000,
        quality: 'preview',
        method: 'frontend',
      };

    } catch (error) {
      console.error('Simple export failed:', error);
      throw error;
    }
  }

  /**
   * 导出项目信息为JSON
   */
  async exportProjectInfo(): Promise<ExportResult> {
    const timelineStore = useTimelineStore.getState();
    const aiEditingStore = useAIEditingStore.getState();

    const projectInfo = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      aiEditing: {
        hasEditingPlan: !!aiEditingStore.currentEditingPlan,
        planInfo: aiEditingStore.currentEditingPlan ? {
          clipsCount: aiEditingStore.currentEditingPlan.clips?.length || 0,
          totalDuration: aiEditingStore.currentEditingPlan.totalDuration || 0,
        } : null,
      },
      timeline: {
        tracksCount: timelineStore.tracks.length,
        elements: timelineStore.tracks.map(track => ({
          trackId: track.id,
          trackType: track.type,
          elementsCount: track.elements.length,
          elements: track.elements.map(element => ({
            id: element.id,
            type: element.type,
            start: element.start,
            duration: element.duration,
            text: element.text || element.content || undefined,
          })),
        })),
      },
    };

    const jsonString = JSON.stringify(projectInfo, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `opencut-project-${Date.now()}.json`;

    return {
      success: true,
      blob,
      url,
      filename,
      size: blob.size,
      duration: 0,
      quality: 'standard',
      method: 'frontend',
    };
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
}

// 导出单例实例
export const simpleExporter = new SimpleExporter();
