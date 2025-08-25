// frontend-exporter.ts - 前端导出引擎
// 此文件负责在浏览器中使用FFmpeg.wasm进行视频导出
// 文件路径: lib/export/frontend-exporter.ts

import { TimelineIR } from "@/types/timeline";
import { 
  ExportOptions, 
  ExportProgress, 
  ExportResult, 
  ExportError,
  TimelineSegment 
} from "@/types/export";
import { ffmpegManager, FFmpegCommandBuilder } from "./ffmpeg-manager";
import { ASSGenerator } from "./ass-generator";

/**
 * 前端导出引擎
 */
export class FrontendExporter {
  private isExporting = false;
  private currentProgress: ExportProgress = {
    overall: 0,
    stage: 'preparing',
    elapsedTime: 0,
    startTime: Date.now(),
  };

  /**
   * 导出视频
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
      // 初始化FFmpeg
      await this.initializeFFmpeg();

      // 验证输入
      this.validateInput(ir, options);

      // 生成分段
      const segments = this.generateSegments(ir, options);

      // 执行导出
      const result = await this.executeExport(ir, segments, options);

      return result;
    } catch (error) {
      throw this.createExportError(error);
    } finally {
      this.isExporting = false;
      await this.cleanup();
    }
  }

  /**
   * 初始化FFmpeg
   */
  private async initializeFFmpeg(): Promise<void> {
    this.updateProgress({ stage: 'preparing', message: '初始化FFmpeg...' });
    
    if (!ffmpegManager.isReady()) {
      await ffmpegManager.initialize();
    }
  }

  /**
   * 验证输入
   */
  private validateInput(ir: TimelineIR, options: ExportOptions): void {
    if (!ir.video.length && !ir.audio.length && !ir.texts.length) {
      throw new Error('项目为空，无法导出');
    }

    if (ir.duration <= 0) {
      throw new Error('项目时长无效');
    }

    // 检查内存限制
    const estimatedMemory = ffmpegManager.estimateMemoryUsage(
      ir.width, 
      ir.height, 
      ir.duration / 1000
    );

    if (!ffmpegManager.checkMemoryLimit(estimatedMemory)) {
      throw new Error('项目过大，可能超出浏览器内存限制');
    }
  }

  /**
   * 生成导出分段
   */
  private generateSegments(ir: TimelineIR, options: ExportOptions): TimelineSegment[] {
    const segmentDuration = (options.segmentDuration || 30) * 1000; // 转换为毫秒
    const segments: TimelineSegment[] = [];
    
    let currentTime = 0;
    let segmentIndex = 0;

    while (currentTime < ir.duration) {
      const endTime = Math.min(currentTime + segmentDuration, ir.duration);
      
      const segment: TimelineSegment = {
        id: `segment_${segmentIndex}`,
        startTime: currentTime,
        endTime: endTime,
        duration: endTime - currentTime,
        videoElements: [],
        audioElements: [],
        textElements: [],
        transitions: [],
        hasComplexEffects: false,
        estimatedMemoryUsage: 0,
        priority: 1,
      };

      // 查找在此时间段内的元素
      this.populateSegmentElements(ir, segment);
      
      segments.push(segment);
      currentTime = endTime;
      segmentIndex++;
    }

    return segments;
  }

  /**
   * 填充分段元素
   */
  private populateSegmentElements(ir: TimelineIR, segment: TimelineSegment): void {
    // 查找视频元素
    for (const video of ir.video) {
      if (video.start < segment.endTime && video.start + (video.out - video.in) > segment.startTime) {
        segment.videoElements.push(video.id);
      }
    }

    // 查找音频元素
    for (const audio of ir.audio) {
      if (audio.start < segment.endTime && audio.start + (audio.out - audio.in) > segment.startTime) {
        segment.audioElements.push(audio.id);
      }
    }

    // 查找文本元素
    for (const text of ir.texts) {
      if (text.start < segment.endTime && text.end > segment.startTime) {
        segment.textElements.push(text.id);
        segment.hasComplexEffects = true; // 文本需要特殊处理
      }
    }

    // 🎯 查找转场 - 精确匹配转场时间范围
    for (const transition of ir.transitions) {
      // 找到转场涉及的元素
      const fromElement = ir.video.find(v => v.id === transition.between[0]);
      const toElement = ir.video.find(v => v.id === transition.between[1]);

      if (fromElement && toElement) {
        const fromEnd = fromElement.start + (fromElement.out - fromElement.in);
        const toStart = toElement.start;

        // 转场的实际时间范围
        const transitionStart = Math.max(fromEnd - transition.duration, toStart);
        const transitionEnd = Math.min(fromEnd, toStart + transition.duration);

        // 检查转场是否在当前分段内
        if (transitionStart < segment.endTime && transitionEnd > segment.startTime) {
          segment.transitions.push(transition.id);
          segment.hasComplexEffects = true; // 转场需要特殊处理
        }
      }
    }

    // 估算内存使用
    segment.estimatedMemoryUsage = this.estimateSegmentMemory(segment, ir);
  }

  /**
   * 估算分段内存使用
   */
  private estimateSegmentMemory(segment: TimelineSegment, ir: TimelineIR): number {
    const frameSize = ir.width * ir.height * 4; // RGBA
    const durationSeconds = segment.duration / 1000;
    const fps = 30; // 假设30fps
    
    return frameSize * fps * durationSeconds * (segment.videoElements.length + 1);
  }

  /**
   * 执行导出
   */
  private async executeExport(
    ir: TimelineIR, 
    segments: TimelineSegment[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    this.updateProgress({ 
      stage: 'processing', 
      message: '开始处理视频...',
      totalSegments: segments.length,
      currentSegment: 0,
    });

    const segmentFiles: string[] = [];

    // 处理每个分段
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      this.updateProgress({
        currentSegment: i + 1,
        message: `处理分段 ${i + 1}/${segments.length}...`,
      });

      const segmentFile = await this.processSegment(ir, segment, options, i);
      segmentFiles.push(segmentFile);

      // 更新总体进度
      const segmentProgress = (i + 1) / segments.length;
      this.updateProgress({ overall: segmentProgress * 0.8 }); // 80%用于分段处理
    }

    // 合并分段
    this.updateProgress({ 
      stage: 'finalizing', 
      message: '合并视频分段...',
      overall: 0.8,
    });

    const finalFile = await this.mergeSegments(segmentFiles, options);

    // 读取最终文件
    const outputData = await ffmpegManager.readFile(finalFile);
    const blob = new Blob([outputData], { type: 'video/mp4' });

    this.updateProgress({ overall: 1, message: '导出完成!' });

    return {
      success: true,
      blob,
      url: URL.createObjectURL(blob),
      filename: `export_${Date.now()}.mp4`,
      size: blob.size,
      duration: (Date.now() - this.currentProgress.startTime) / 1000,
      quality: options.quality,
      method: 'frontend',
      stats: {
        totalFrames: Math.ceil((ir.duration / 1000) * (ir.fps || 30)),
        processedFrames: Math.ceil((ir.duration / 1000) * (ir.fps || 30)),
        averageSpeed: 1.0,
        peakMemoryUsage: 0,
        finalFileSize: blob.size,
      },
    };
  }

  /**
   * 处理单个分段
   */
  private async processSegment(
    ir: TimelineIR,
    segment: TimelineSegment,
    options: ExportOptions,
    index: number
  ): Promise<string> {
    const outputFile = `segment_${index}.mp4`;

    // 准备输入文件
    await this.prepareSegmentInputs(ir, segment);

    // 生成字幕文件（如果需要）
    if (segment.textElements.length > 0) {
      await this.generateSegmentSubtitles(ir, segment);
    }

    // 构建FFmpeg命令
    const command = this.buildSegmentCommand(ir, segment, options, outputFile);

    // 执行命令
    await ffmpegManager.exec(command);

    return outputFile;
  }

  /**
   * 准备分段输入文件
   */
  private async prepareSegmentInputs(ir: TimelineIR, segment: TimelineSegment): Promise<void> {
    // 这里需要实际的文件数据，暂时跳过
    // 在实际实现中，需要从媒体存储中获取文件数据
    console.log('Preparing segment inputs for:', segment.id);
  }

  /**
   * 生成分段字幕
   */
  private async generateSegmentSubtitles(ir: TimelineIR, segment: TimelineSegment): Promise<void> {
    // 过滤出当前分段的文本
    const segmentTexts = ir.texts.filter(text => 
      segment.textElements.includes(text.id)
    );

    if (segmentTexts.length === 0) return;

    // 调整时间偏移
    const adjustedTexts = segmentTexts.map(text => ({
      ...text,
      start: Math.max(0, text.start - segment.startTime),
      end: Math.min(segment.duration, text.end - segment.startTime),
    }));

    // 生成ASS字幕
    const segmentIR = { ...ir, texts: adjustedTexts };
    const assContent = ASSGenerator.generateASS(segmentIR);

    // 写入字幕文件
    await ffmpegManager.writeFile('segment.ass', new TextEncoder().encode(assContent));
  }

  /**
   * 构建分段命令 - 支持转场
   */
  private buildSegmentCommand(
    ir: TimelineIR,
    segment: TimelineSegment,
    options: ExportOptions,
    outputFile: string
  ): string[] {
    const builder = new FFmpegCommandBuilder();

    // 🎯 添加输入文件
    const inputFiles: string[] = [];

    // 添加视频输入
    for (const videoId of segment.videoElements) {
      const video = ir.video.find(v => v.id === videoId);
      if (video) {
        const filename = `video_${videoId}.mp4`; // 假设文件已准备好
        builder.input(filename);
        inputFiles.push(filename);
      }
    }

    // 基础设置
    builder
      .overwrite()
      .videoCodec('libx264')
      .audioCodec('aac')
      .preset('veryfast')
      .pixelFormat('yuv420p')
      .fps(ir.fps || 30)
      .resolution(ir.width, ir.height);

    // 质量设置
    switch (options.quality) {
      case 'preview':
        builder.crf(28).videoBitrate('2M').audioBitrate('128k');
        break;
      case 'standard':
        builder.crf(23).videoBitrate('5M').audioBitrate('192k');
        break;
      case 'professional':
        builder.crf(18).videoBitrate('10M').audioBitrate('320k');
        break;
    }

    // 🎯 处理视频变换（镜像、旋转等）
    this.buildVideoTransforms(ir, segment, builder);

    // 🎯 处理转场
    if (segment.transitions.length > 0) {
      this.buildTransitionFilters(ir, segment, builder);
    } else if (segment.videoElements.length > 1) {
      // 多个视频但无转场，使用简单拼接
      this.buildConcatenationFilters(ir, segment, builder);
    }

    // 如果有字幕，添加字幕滤镜
    if (segment.textElements.length > 0) {
      builder.filter('subtitles=segment.ass');
    }

    builder.output(outputFile);

    return builder.build();
  }

  /**
   * 构建视频变换滤镜（镜像、旋转等）
   */
  private buildVideoTransforms(ir: TimelineIR, segment: TimelineSegment, builder: FFmpegCommandBuilder): void {
    // 🪞 处理每个视频元素的变换
    for (let i = 0; i < segment.videoElements.length; i++) {
      const videoId = segment.videoElements[i];
      const video = ir.video.find(v => v.id === videoId);

      if (video && video.transform) {
        const { horizontalFlip, verticalFlip, rotate, scale } = video.transform;

        // 检查是否需要应用变换
        const needsTransform = horizontalFlip || verticalFlip ||
                              (rotate && rotate !== 0) ||
                              (scale && scale !== 1);

        if (needsTransform) {
          // 为单个输入应用变换
          builder.videoTransform({
            horizontalFlip: horizontalFlip || false,
            verticalFlip: verticalFlip || false,
            rotate: rotate || 0,
            scale: scale || 1,
          });

          console.log(`🪞 应用视频变换到 ${videoId}:`, {
            horizontalFlip: horizontalFlip || false,
            verticalFlip: verticalFlip || false,
            rotate: rotate || 0,
            scale: scale || 1,
          });
        }
      }
    }
  }

  /**
   * 构建转场滤镜
   */
  private buildTransitionFilters(ir: TimelineIR, segment: TimelineSegment, builder: FFmpegCommandBuilder): void {
    // 🎯 处理转场的核心逻辑
    for (const transitionId of segment.transitions) {
      const transition = ir.transitions.find(t => t.id === transitionId);
      if (!transition) continue;

      const fromElement = ir.video.find(v => v.id === transition.between[0]);
      const toElement = ir.video.find(v => v.id === transition.between[1]);

      if (!fromElement || !toElement) continue;

      // 找到输入索引
      const fromIndex = segment.videoElements.indexOf(fromElement.id);
      const toIndex = segment.videoElements.indexOf(toElement.id);

      if (fromIndex >= 0 && toIndex >= 0) {
        // 添加转场滤镜
        builder.transition(
          fromIndex,
          toIndex,
          transition.kind,
          transition.duration / 1000, // 转换为秒
          transition.direction
        );
      }
    }
  }

  /**
   * 构建拼接滤镜
   */
  private buildConcatenationFilters(_ir: TimelineIR, segment: TimelineSegment, builder: FFmpegCommandBuilder): void {
    // 简单的视频拼接，无转场效果
    if (segment.videoElements.length > 1) {
      const concatFilter = segment.videoElements
        .map((_: string, index: number) => `[${index}:v]`)
        .join('') + `concat=n=${segment.videoElements.length}:v=1:a=0[v]`;

      builder.complexFilter(concatFilter);
    }
  }

  /**
   * 合并分段
   */
  private async mergeSegments(segmentFiles: string[], options: ExportOptions): Promise<string> {
    const outputFile = 'final_output.mp4';

    // 创建concat文件列表
    const concatList = segmentFiles.map(file => `file '${file}'`).join('\n');
    await ffmpegManager.writeFile('concat_list.txt', new TextEncoder().encode(concatList));

    // 执行合并
    const command = new FFmpegCommandBuilder()
      .custom('-f', 'concat', '-safe', '0', '-i', 'concat_list.txt')
      .custom('-c', 'copy')
      .overwrite()
      .output(outputFile)
      .build();

    await ffmpegManager.exec(command);

    return outputFile;
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
   * 清理临时文件
   */
  private async cleanup(): Promise<void> {
    try {
      await ffmpegManager.cleanup();
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * 创建导出错误
   */
  private createExportError(error: any): ExportError {
    return {
      code: 'FRONTEND_EXPORT_ERROR',
      message: error.message || '导出失败',
      stage: this.currentProgress.stage,
      details: error,
      recoverable: true,
      suggestions: [
        '尝试降低导出质量',
        '减少项目复杂度',
        '使用后端导出',
      ],
      context: {
        currentSegment: this.currentProgress.currentSegment,
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

    this.isExporting = false;
    await this.cleanup();
  }
}
