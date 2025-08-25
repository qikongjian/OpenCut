// transition-preview.ts - 转场预览系统
// 此文件负责在时间轴中生成转场效果的预览
// 文件路径: lib/transition-preview.ts

import { TransitionType, TransitionDirection, TransitionParams } from "@/types/timeline";

/**
 * 转场预览管理器
 */
export class TransitionPreviewManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;
  }

  /**
   * 生成转场预览
   */
  async generateTransitionPreview(
    fromVideoElement: HTMLVideoElement,
    toVideoElement: HTMLVideoElement,
    params: TransitionParams,
    currentTime: number
  ): Promise<void> {
    const { type, duration } = params;
    
    // 计算转场进度 (0-1)
    const progress = Math.min(Math.max(currentTime / duration, 0), 1);

    switch (type) {
      case 'flash':
        await this.renderFlashTransition(fromVideoElement, toVideoElement, params, progress);
        break;
      case 'dissolve':
        await this.renderDissolveTransition(fromVideoElement, toVideoElement, params, progress);
        break;
      default:
        // 默认直接切换
        this.renderDirectCut(fromVideoElement, toVideoElement, progress);
    }
  }

  /**
   * 渲染闪黑/闪白转场
   */
  private async renderFlashTransition(
    fromVideo: HTMLVideoElement,
    toVideo: HTMLVideoElement,
    params: TransitionParams,
    progress: number
  ): Promise<void> {
    const { direction } = params;
    const { width, height } = this.canvas;

    // 清空画布
    this.ctx.clearRect(0, 0, width, height);

    if (progress < 0.5) {
      // 前半段：显示第一个视频并逐渐变暗/变亮
      this.ctx.drawImage(fromVideo, 0, 0, width, height);
      
      // 添加闪光效果
      const flashIntensity = progress * 2; // 0-1
      const flashColor = direction === 'in' ? 'black' : 'white';
      
      this.ctx.fillStyle = flashColor;
      this.ctx.globalAlpha = flashIntensity;
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.globalAlpha = 1;
    } else {
      // 后半段：从闪光中显示第二个视频
      this.ctx.drawImage(toVideo, 0, 0, width, height);
      
      // 添加逐渐消失的闪光效果
      const flashIntensity = (1 - progress) * 2; // 1-0
      const flashColor = direction === 'in' ? 'black' : 'white';
      
      this.ctx.fillStyle = flashColor;
      this.ctx.globalAlpha = flashIntensity;
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.globalAlpha = 1;
    }
  }

  /**
   * 渲染叠化转场
   */
  private async renderDissolveTransition(
    fromVideo: HTMLVideoElement,
    toVideo: HTMLVideoElement,
    params: TransitionParams,
    progress: number
  ): Promise<void> {
    const { width, height } = this.canvas;

    // 清空画布
    this.ctx.clearRect(0, 0, width, height);

    // 绘制第一个视频
    this.ctx.globalAlpha = 1 - progress;
    this.ctx.drawImage(fromVideo, 0, 0, width, height);

    // 绘制第二个视频（叠加）
    this.ctx.globalAlpha = progress;
    this.ctx.drawImage(toVideo, 0, 0, width, height);

    // 重置透明度
    this.ctx.globalAlpha = 1;
  }

  /**
   * 渲染直接切换
   */
  private renderDirectCut(
    fromVideo: HTMLVideoElement,
    toVideo: HTMLVideoElement,
    progress: number
  ): void {
    const { width, height } = this.canvas;
    
    this.ctx.clearRect(0, 0, width, height);
    
    if (progress < 0.5) {
      this.ctx.drawImage(fromVideo, 0, 0, width, height);
    } else {
      this.ctx.drawImage(toVideo, 0, 0, width, height);
    }
  }

  /**
   * 开始动画预览
   */
  startAnimationPreview(
    fromVideo: HTMLVideoElement,
    toVideo: HTMLVideoElement,
    params: TransitionParams,
    onComplete?: () => void
  ): void {
    const startTime = Date.now();
    const { duration } = params;
    const durationMs = duration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      this.generateTransitionPreview(fromVideo, toVideo, params, progress * duration);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.stopAnimationPreview();
        onComplete?.();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * 停止动画预览
   */
  stopAnimationPreview(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopAnimationPreview();
  }
}

/**
 * 转场预览工具函数
 */
export class TransitionPreviewUtils {
  /**
   * 创建视频元素用于预览
   */
  static async createVideoElement(videoUrl: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      video.onloadeddata = () => {
        resolve(video);
      };
      
      video.onerror = () => {
        reject(new Error(`无法加载视频: ${videoUrl}`));
      };
      
      video.src = videoUrl;
    });
  }

  /**
   * 获取视频帧作为Canvas
   */
  static captureVideoFrame(video: HTMLVideoElement, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
    }
    
    return canvas;
  }

  /**
   * 生成转场缩略图
   */
  static async generateTransitionThumbnail(
    fromVideoUrl: string,
    toVideoUrl: string,
    params: TransitionParams,
    width: number = 160,
    height: number = 90
  ): Promise<string> {
    try {
      const fromVideo = await this.createVideoElement(fromVideoUrl);
      const toVideo = await this.createVideoElement(toVideoUrl);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const previewManager = new TransitionPreviewManager(canvas);
      
      // 生成转场中间状态的预览（50%进度）
      await previewManager.generateTransitionPreview(fromVideo, toVideo, params, params.duration * 0.5);
      
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('生成转场缩略图失败:', error);
      return '';
    }
  }
}
