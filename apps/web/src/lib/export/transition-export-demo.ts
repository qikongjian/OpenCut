// transition-export-demo.ts - 转场导出演示
// 此文件演示如何使用集成的转场导出功能
// 文件路径: lib/export/transition-export-demo.ts

import { TimelineIR } from "@/types/timeline";
import { ExportManager } from "./export-manager";

/**
 * 转场导出演示类
 */
export class TransitionExportDemo {
  private exportManager: ExportManager;

  constructor() {
    this.exportManager = ExportManager.getInstance();
  }

  /**
   * 创建带转场的演示项目
   */
  createDemoProject(): TimelineIR {
    return {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 10000, // 10秒

      // 两个视频片段
      video: [
        {
          id: "video1",
          src: "demo_video1.mp4",
          in: 0,
          out: 5000,
          start: 0,
          trackId: "track1",
        },
        {
          id: "video2", 
          src: "demo_video2.mp4",
          in: 0,
          out: 5000,
          start: 4500, // 与第一个视频有0.5秒重叠
          trackId: "track1",
        }
      ],

      audio: [],
      texts: [],

      // 三种转场效果演示
      transitions: [
        {
          id: "transition1",
          between: ["video1", "video2"],
          kind: "flash", // 闪黑转场
          duration: 500, // 0.5秒
          direction: "in", // 闪黑
          intensity: 1.0,
        }
      ]
    };
  }

  /**
   * 创建叠化转场演示
   */
  createDissolveDemo(): TimelineIR {
    return {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 12000, // 12秒

      video: [
        {
          id: "video1",
          src: "demo_video1.mp4",
          in: 0,
          out: 6000,
          start: 0,
          trackId: "track1",
        },
        {
          id: "video2",
          src: "demo_video2.mp4", 
          in: 0,
          out: 6000,
          start: 5000, // 1秒重叠用于叠化
          trackId: "track1",
        }
      ],

      audio: [],
      texts: [],

      transitions: [
        {
          id: "dissolve1",
          between: ["video1", "video2"],
          kind: "dissolve", // 叠化转场
          duration: 1000, // 1秒
          intensity: 1.0,
        }
      ]
    };
  }

  /**
   * 创建闪白转场演示
   */
  createFlashWhiteDemo(): TimelineIR {
    return {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 8000, // 8秒

      video: [
        {
          id: "video1",
          src: "demo_video1.mp4",
          in: 0,
          out: 4000,
          start: 0,
          trackId: "track1",
        },
        {
          id: "video2",
          src: "demo_video2.mp4",
          in: 0,
          out: 4000,
          start: 3800, // 0.2秒重叠
          trackId: "track1",
        }
      ],

      audio: [],
      texts: [],

      transitions: [
        {
          id: "flash_white",
          between: ["video1", "video2"],
          kind: "flash", // 闪白转场
          duration: 200, // 0.2秒
          direction: "out", // 闪白
          intensity: 1.0,
        }
      ]
    };
  }

  /**
   * 导出带转场的视频
   */
  async exportWithTransitions(
    demoType: 'flash_black' | 'dissolve' | 'flash_white' = 'flash_black',
    quality: 'preview' | 'standard' | 'professional' = 'standard'
  ): Promise<Blob> {
    // 选择演示项目
    let ir: TimelineIR;
    switch (demoType) {
      case 'flash_black':
        ir = this.createDemoProject();
        break;
      case 'dissolve':
        ir = this.createDissolveDemo();
        break;
      case 'flash_white':
        ir = this.createFlashWhiteDemo();
        break;
    }

    // 导出选项
    const options = {
      quality,
      format: 'mp4' as const,
      codec: 'h264' as const,
      subtitleMode: 'none' as const,
      segmentDuration: 30,
      onProgress: (progress: any) => {
        console.log(`导出进度: ${Math.round(progress.overall * 100)}% - ${progress.message}`);
      }
    };

    try {
      console.log(`🎬 开始导出${demoType}转场演示...`);
      const result = await this.exportManager.export(ir, options);
      
      if (result.success && result.blob) {
        console.log(`✅ 导出成功! 文件大小: ${(result.blob.size / 1024 / 1024).toFixed(2)}MB`);
        return result.blob;
      } else {
        throw new Error('导出失败');
      }
    } catch (error) {
      console.error('❌ 转场导出失败:', error);
      throw error;
    }
  }

  /**
   * 批量导出所有转场演示
   */
  async exportAllDemos(): Promise<{
    flashBlack: Blob;
    dissolve: Blob;
    flashWhite: Blob;
  }> {
    console.log('🚀 开始批量导出所有转场演示...');

    const results = await Promise.all([
      this.exportWithTransitions('flash_black'),
      this.exportWithTransitions('dissolve'),
      this.exportWithTransitions('flash_white'),
    ]);

    return {
      flashBlack: results[0],
      dissolve: results[1],
      flashWhite: results[2],
    };
  }

  /**
   * 下载演示文件
   */
  downloadDemo(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * 使用示例
 */
export async function runTransitionDemo() {
  const demo = new TransitionExportDemo();

  try {
    // 导出闪黑转场演示
    const flashBlackVideo = await demo.exportWithTransitions('flash_black', 'standard');
    demo.downloadDemo(flashBlackVideo, 'flash_black_transition_demo.mp4');

    // 导出叠化转场演示
    const dissolveVideo = await demo.exportWithTransitions('dissolve', 'standard');
    demo.downloadDemo(dissolveVideo, 'dissolve_transition_demo.mp4');

    // 导出闪白转场演示
    const flashWhiteVideo = await demo.exportWithTransitions('flash_white', 'standard');
    demo.downloadDemo(flashWhiteVideo, 'flash_white_transition_demo.mp4');

    console.log('🎉 所有转场演示导出完成!');
  } catch (error) {
    console.error('演示导出失败:', error);
  }
}

// 在浏览器控制台中运行演示
if (typeof window !== 'undefined') {
  (window as any).runTransitionDemo = runTransitionDemo;
  console.log('💡 在控制台运行 runTransitionDemo() 来测试转场导出功能');
}
