// ir-generator.ts - 中间表示生成器
// 此文件负责从Timeline Store生成标准化的中间表示(IR)
// 文件路径: lib/export/ir-generator.ts

import { TimelineIR } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { ASSGenerator } from "./ass-generator";

/**
 * IR生成器类
 */
export class IRGenerator {
  /**
   * 从当前时间轴状态生成IR
   */
  static generateIR(): TimelineIR {
    const timelineStore = useTimelineStore.getState();
    const mediaStore = useMediaStore.getState();

    // 获取基础IR
    const baseIR = timelineStore.toIR();

    // 确保包含AI剪辑生成的字幕数据
    const enhancedIR = this.enhanceIRWithAIData(baseIR, timelineStore, mediaStore);

    console.log('Generated IR for export:', enhancedIR);
    return enhancedIR;
  }

  /**
   * 增强IR数据，包含AI剪辑的字幕和媒体信息
   */
  private static enhanceIRWithAIData(
    baseIR: TimelineIR,
    timelineStore: any,
    mediaStore: any
  ): TimelineIR {
    // 收集所有文本轨道的字幕数据
    const allTexts = [];

    for (const track of timelineStore.tracks) {
      if (track.type === 'text') {
        for (const element of track.elements) {
          allTexts.push({
            id: element.id,
            text: element.text || element.content || '',
            start: element.start,
            end: element.start + element.duration,
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

    // 收集媒体文件的实际路径和元数据
    const enhancedVideo = baseIR.video.map(video => ({
      ...video,
      actualPath: this.resolveMediaPath(video.src, mediaStore.mediaItems),
      metadata: this.getMediaMetadata(video.src, mediaStore.mediaItems),
    }));

    const enhancedAudio = baseIR.audio.map(audio => ({
      ...audio,
      actualPath: this.resolveMediaPath(audio.src, mediaStore.mediaItems),
      metadata: this.getMediaMetadata(audio.src, mediaStore.mediaItems),
    }));

    return {
      ...baseIR,
      video: enhancedVideo,
      audio: enhancedAudio,
      texts: allTexts,
    };
  }

  /**
   * 解析媒体文件的实际路径
   */
  private static resolveMediaPath(src: string, mediaItems: any[]): string {
    const mediaItem = mediaItems.find(item =>
      item.url === src || item.id === src || item.src === src
    );

    if (mediaItem) {
      // 如果是Blob URL，返回原始URL
      if (mediaItem.url && mediaItem.url.startsWith('blob:')) {
        return mediaItem.url;
      }
      // 如果是文件对象，返回文件路径
      if (mediaItem.file) {
        return mediaItem.file.name;
      }
      // 返回URL
      return mediaItem.url || src;
    }

    return src;
  }

  /**
   * 获取媒体文件元数据
   */
  private static getMediaMetadata(src: string, mediaItems: any[]): any {
    const mediaItem = mediaItems.find(item =>
      item.url === src || item.id === src || item.src === src
    );

    return mediaItem ? {
      size: mediaItem.size || 0,
      duration: mediaItem.duration || 0,
      width: mediaItem.width,
      height: mediaItem.height,
      fps: mediaItem.fps,
      type: mediaItem.type,
    } : null;
  }

  /**
   * 生成ASS字幕文件
   */
  static generateASS(ir?: TimelineIR): string {
    const targetIR = ir || this.generateIR();
    return ASSGenerator.generateASS(targetIR);
  }

  /**
   * 生成完整的导出数据包
   */
  static generateExportPackage(): {
    ir: TimelineIR;
    ass: string;
    metadata: ExportMetadata;
  } {
    const ir = this.generateIR();
    const ass = this.generateASS(ir);
    const metadata = this.generateMetadata(ir);

    return { ir, ass, metadata };
  }

  /**
   * 生成导出元数据
   */
  static generateMetadata(ir: TimelineIR): ExportMetadata {
    const timelineStore = useTimelineStore.getState();
    const mediaStore = useMediaStore.getState();

    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      projectInfo: {
        totalDuration: ir.duration,
        videoCount: ir.video.length,
        audioCount: ir.audio.length,
        textCount: ir.texts.length,
        transitionCount: ir.transitions.length,
      },
      resolution: {
        width: ir.width,
        height: ir.height,
        fps: ir.fps,
      },
      mediaFiles: this.collectMediaFiles(ir, mediaStore.mediaItems),
      complexity: this.calculateComplexity(ir),
    };
  }

  /**
   * 收集媒体文件信息
   */
  private static collectMediaFiles(ir: TimelineIR, mediaItems: any[]): MediaFileInfo[] {
    const mediaFiles: MediaFileInfo[] = [];
    const processedFiles = new Set<string>();

    // 收集视频文件
    for (const video of ir.video) {
      if (!processedFiles.has(video.src)) {
        processedFiles.add(video.src);
        const mediaItem = mediaItems.find(m => m.url === video.src || m.id === video.id);
        
        if (mediaItem) {
          mediaFiles.push({
            id: mediaItem.id,
            src: video.src,
            type: "video",
            size: mediaItem.size || 0,
            duration: mediaItem.duration || 0,
            width: mediaItem.width,
            height: mediaItem.height,
            fps: mediaItem.fps,
          });
        }
      }
    }

    // 收集音频文件
    for (const audio of ir.audio) {
      if (!processedFiles.has(audio.src)) {
        processedFiles.add(audio.src);
        const mediaItem = mediaItems.find(m => m.url === audio.src || m.id === audio.id);
        
        if (mediaItem) {
          mediaFiles.push({
            id: mediaItem.id,
            src: audio.src,
            type: "audio",
            size: mediaItem.size || 0,
            duration: mediaItem.duration || 0,
          });
        }
      }
    }

    return mediaFiles;
  }

  /**
   * 计算项目复杂度
   */
  private static calculateComplexity(ir: TimelineIR): ComplexityInfo {
    let score = 0;
    const factors: string[] = [];

    // 基础复杂度
    score += ir.video.length * 2;
    score += ir.audio.length;
    score += ir.texts.length;

    // 时长复杂度
    const durationMinutes = ir.duration / (1000 * 60);
    score += durationMinutes * 2;

    // 转场复杂度
    score += ir.transitions.length * 5;
    if (ir.transitions.some(t => t.kind !== "cross" && t.kind !== "fade")) {
      score += 10;
      factors.push("复杂转场效果");
    }

    // 变换复杂度
    const hasTransforms = ir.video.some(v => 
      v.transform && (
        v.transform.x !== 0 || 
        v.transform.y !== 0 || 
        v.transform.scale !== 1 || 
        v.transform.rotate !== 0
      )
    );
    if (hasTransforms) {
      score += 15;
      factors.push("视频变换效果");
    }

    // 文本效果复杂度
    const hasComplexText = ir.texts.some(t => 
      t.style.shadow || 
      t.style.rotation || 
      t.style.opacity !== 1
    );
    if (hasComplexText) {
      score += 10;
      factors.push("复杂文本效果");
    }

    // 分辨率复杂度
    const pixelCount = ir.width * ir.height;
    if (pixelCount >= 3840 * 2160) {
      score += 20;
      factors.push("4K分辨率");
    } else if (pixelCount >= 1920 * 1080) {
      score += 10;
      factors.push("1080p分辨率");
    }

    // 多轨道复杂度
    const videoTracks = new Set(ir.video.map(v => v.trackId));
    const audioTracks = new Set(ir.audio.map(a => a.trackId));
    if (videoTracks.size > 1 || audioTracks.size > 1) {
      score += 15;
      factors.push("多轨道编辑");
    }

    return {
      score: Math.min(100, score),
      level: score > 70 ? "high" : score > 40 ? "medium" : "low",
      factors,
    };
  }

  /**
   * 验证IR完整性
   */
  static validateIR(ir: TimelineIR): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本验证
    if (!ir.width || !ir.height || !ir.fps) {
      errors.push("缺少基本项目设置（分辨率或帧率）");
    }

    if (ir.duration <= 0) {
      errors.push("项目时长无效");
    }

    // 媒体文件验证
    for (const video of ir.video) {
      if (!video.src) {
        errors.push(`视频元素 ${video.id} 缺少源文件`);
      }
      if (video.start < 0 || video.in < 0 || video.out <= video.in) {
        errors.push(`视频元素 ${video.id} 时间参数无效`);
      }
    }

    for (const audio of ir.audio) {
      if (!audio.src) {
        errors.push(`音频元素 ${audio.id} 缺少源文件`);
      }
      if (audio.start < 0 || audio.in < 0 || audio.out <= audio.in) {
        errors.push(`音频元素 ${audio.id} 时间参数无效`);
      }
    }

    // 文本验证
    for (const text of ir.texts) {
      if (!text.text.trim()) {
        warnings.push(`文本元素 ${text.id} 内容为空`);
      }
      if (text.start < 0 || text.end <= text.start) {
        errors.push(`文本元素 ${text.id} 时间参数无效`);
      }
    }

    // 转场验证
    for (const transition of ir.transitions) {
      if (!transition.between || transition.between.length !== 2) {
        errors.push(`转场 ${transition.id} 缺少有效的连接元素`);
      }
      if (transition.duration <= 0) {
        errors.push(`转场 ${transition.id} 持续时间无效`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 优化IR（移除冗余数据，优化性能）
   */
  static optimizeIR(ir: TimelineIR): TimelineIR {
    const optimizedIR = JSON.parse(JSON.stringify(ir)); // 深拷贝

    // 移除空的文本元素
    optimizedIR.texts = optimizedIR.texts.filter(t => t.text.trim());

    // 合并相邻的相同样式文本
    optimizedIR.texts = this.mergeAdjacentTexts(optimizedIR.texts);

    // 移除无效的转场
    optimizedIR.transitions = optimizedIR.transitions.filter(t => 
      t.duration > 0 && t.between.length === 2
    );

    // 优化媒体元素顺序
    optimizedIR.video.sort((a, b) => a.start - b.start);
    optimizedIR.audio.sort((a, b) => a.start - b.start);
    optimizedIR.texts.sort((a, b) => a.start - b.start);

    return optimizedIR;
  }

  /**
   * 合并相邻的相同样式文本
   */
  private static mergeAdjacentTexts(texts: any[]): any[] {
    if (texts.length <= 1) return texts;

    const merged: any[] = [];
    let current = texts[0];

    for (let i = 1; i < texts.length; i++) {
      const next = texts[i];
      
      // 检查是否可以合并
      if (
        current.end === next.start &&
        JSON.stringify(current.style) === JSON.stringify(next.style) &&
        current.text === next.text
      ) {
        // 合并文本
        current.end = next.end;
      } else {
        // 不能合并，保存当前文本并开始新的
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }
}

// 类型定义
interface ExportMetadata {
  version: string;
  timestamp: string;
  projectInfo: {
    totalDuration: number;
    videoCount: number;
    audioCount: number;
    textCount: number;
    transitionCount: number;
  };
  resolution: {
    width: number;
    height: number;
    fps: number;
  };
  mediaFiles: MediaFileInfo[];
  complexity: ComplexityInfo;
}

interface MediaFileInfo {
  id: string;
  src: string;
  type: "video" | "audio";
  size: number;
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
}

interface ComplexityInfo {
  score: number;
  level: "low" | "medium" | "high";
  factors: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
