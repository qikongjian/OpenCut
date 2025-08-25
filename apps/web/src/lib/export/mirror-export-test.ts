// mirror-export-test.ts - 镜像导出测试系统
// 此文件测试视频镜像翻转功能的导出
// 文件路径: lib/export/mirror-export-test.ts

import { useTimelineStore } from "@/stores/timeline-store";
import { ExportManager } from "./export-manager";
import { IRGenerator } from "./ir-generator";
import { TimelineIR } from "@/types/timeline";

/**
 * 镜像导出测试类
 */
export class MirrorExportTest {
  private exportManager: ExportManager;

  constructor() {
    this.exportManager = ExportManager.getInstance();
  }

  /**
   * 测试镜像功能的导出
   */
  async testMirrorExport(): Promise<{
    success: boolean;
    message: string;
    exportBlob?: Blob;
    mirrorInfo?: {
      totalVideos: number;
      horizontalFlipped: number;
      verticalFlipped: number;
      bothFlipped: number;
    };
  }> {
    try {
      console.log("🪞 开始镜像导出测试");

      // 步骤1：检查时间轴中是否有视频元素
      const timelineStore = useTimelineStore.getState();
      const videoTracks = timelineStore.tracks.filter(track => track.type === 'media');
      const videoElements = videoTracks.flatMap(track => 
        track.elements.filter(element => element.type === 'media')
      );

      if (videoElements.length === 0) {
        return {
          success: false,
          message: "时间轴中没有视频元素，请先添加视频"
        };
      }

      // 步骤2：自动应用镜像效果到部分视频
      const mirrorInfo = await this.applyMirrorEffects(videoElements);
      
      if (mirrorInfo.horizontalFlipped === 0 && mirrorInfo.verticalFlipped === 0) {
        return {
          success: false,
          message: "没有应用任何镜像效果，请手动设置镜像或重新运行测试"
        };
      }

      console.log(`✅ 应用镜像效果完成:`, mirrorInfo);

      // 步骤3：生成IR并检查镜像信息
      const ir = IRGenerator.generateIR();
      const mirrorVideos = ir.video.filter(v => 
        v.transform?.horizontalFlip || v.transform?.verticalFlip
      );

      console.log("📊 生成的IR信息:");
      console.log(`   视频元素: ${ir.video.length}个`);
      console.log(`   镜像视频: ${mirrorVideos.length}个`);
      console.log(`   总时长: ${(ir.duration / 1000).toFixed(2)}秒`);

      if (mirrorVideos.length === 0) {
        return {
          success: false,
          message: "IR中没有镜像信息，镜像状态可能没有正确保存"
        };
      }

      // 步骤4：导出带镜像效果的视频
      console.log("🎬 开始导出带镜像效果的视频...");
      
      const exportOptions = {
        quality: 'standard' as const,
        format: 'mp4' as const,
        codec: 'h264' as const,
        subtitleMode: 'none' as const,
        segmentDuration: 30,
        onProgress: (progress: any) => {
          console.log(`导出进度: ${Math.round(progress.overall * 100)}% - ${progress.message}`);
        }
      };

      const result = await this.exportManager.export(ir, exportOptions);

      if (result.success && result.blob) {
        console.log(`✅ 导出成功! 文件大小: ${(result.blob.size / 1024 / 1024).toFixed(2)}MB`);
        
        return {
          success: true,
          message: `成功导出带镜像效果的视频 (${mirrorVideos.length}个镜像视频)`,
          exportBlob: result.blob,
          mirrorInfo
        };
      } else {
        return {
          success: false,
          message: "导出失败: " + (result.error || "未知错误")
        };
      }

    } catch (error) {
      console.error("❌ 镜像导出测试失败:", error);
      return {
        success: false,
        message: `测试失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }

  /**
   * 自动应用镜像效果到视频元素
   */
  private async applyMirrorEffects(videoElements: any[]): Promise<{
    totalVideos: number;
    horizontalFlipped: number;
    verticalFlipped: number;
    bothFlipped: number;
  }> {
    const timelineStore = useTimelineStore.getState();
    let horizontalFlipped = 0;
    let verticalFlipped = 0;
    let bothFlipped = 0;

    // 为不同的视频应用不同的镜像效果
    for (let i = 0; i < videoElements.length; i++) {
      const element = videoElements[i];
      
      try {
        switch (i % 4) {
          case 0:
            // 第1、5、9...个视频：水平翻转
            timelineStore.updateElement(element.id, { horizontalFlip: true });
            horizontalFlipped++;
            console.log(`🪞 应用水平翻转到视频: ${element.name}`);
            break;
            
          case 1:
            // 第2、6、10...个视频：垂直翻转
            timelineStore.updateElement(element.id, { verticalFlip: true });
            verticalFlipped++;
            console.log(`🪞 应用垂直翻转到视频: ${element.name}`);
            break;
            
          case 2:
            // 第3、7、11...个视频：双向翻转
            timelineStore.updateElement(element.id, { 
              horizontalFlip: true, 
              verticalFlip: true 
            });
            bothFlipped++;
            console.log(`🪞 应用双向翻转到视频: ${element.name}`);
            break;
            
          case 3:
            // 第4、8、12...个视频：不翻转（作为对比）
            console.log(`📹 保持原状的视频: ${element.name}`);
            break;
        }
        
        // 添加小延迟，避免UI卡顿
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ 应用镜像效果失败 ${element.name}:`, error);
      }
    }

    return {
      totalVideos: videoElements.length,
      horizontalFlipped,
      verticalFlipped,
      bothFlipped
    };
  }

  /**
   * 创建镜像演示项目
   */
  createMirrorDemo(): TimelineIR {
    return {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 12000, // 12秒

      // 四个视频片段，展示不同的镜像效果
      video: [
        {
          id: "video1",
          src: "demo_video1.mp4",
          in: 0,
          out: 3000,
          start: 0,
          trackId: "track1",
          transform: {
            x: 0, y: 0, scale: 1, rotate: 0,
            horizontalFlip: false, // 原始
            verticalFlip: false,
          }
        },
        {
          id: "video2",
          src: "demo_video2.mp4",
          in: 0,
          out: 3000,
          start: 3000,
          trackId: "track1",
          transform: {
            x: 0, y: 0, scale: 1, rotate: 0,
            horizontalFlip: true, // 水平翻转
            verticalFlip: false,
          }
        },
        {
          id: "video3",
          src: "demo_video3.mp4",
          in: 0,
          out: 3000,
          start: 6000,
          trackId: "track1",
          transform: {
            x: 0, y: 0, scale: 1, rotate: 0,
            horizontalFlip: false,
            verticalFlip: true, // 垂直翻转
          }
        },
        {
          id: "video4",
          src: "demo_video4.mp4",
          in: 0,
          out: 3000,
          start: 9000,
          trackId: "track1",
          transform: {
            x: 0, y: 0, scale: 1, rotate: 0,
            horizontalFlip: true, // 双向翻转
            verticalFlip: true,
          }
        }
      ],

      audio: [],
      texts: [],
      transitions: []
    };
  }

  /**
   * 导出镜像演示
   */
  async exportMirrorDemo(): Promise<Blob> {
    const ir = this.createMirrorDemo();
    
    const options = {
      quality: 'standard' as const,
      format: 'mp4' as const,
      codec: 'h264' as const,
      subtitleMode: 'none' as const,
      segmentDuration: 30,
      onProgress: (progress: any) => {
        console.log(`镜像演示导出进度: ${Math.round(progress.overall * 100)}%`);
      }
    };

    const result = await this.exportManager.export(ir, options);
    
    if (result.success && result.blob) {
      return result.blob;
    } else {
      throw new Error('镜像演示导出失败');
    }
  }

  /**
   * 下载测试结果
   */
  downloadTestResult(blob: Blob, filename: string = 'mirror_test_export.mp4'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📥 开始下载: ${filename}`);
  }

  /**
   * 获取当前镜像状态报告
   */
  getMirrorReport(): {
    totalVideos: number;
    horizontalFlipped: number;
    verticalFlipped: number;
    bothFlipped: number;
    hasMirrorEffects: boolean;
  } {
    const ir = IRGenerator.generateIR();
    
    let horizontalFlipped = 0;
    let verticalFlipped = 0;
    let bothFlipped = 0;
    
    ir.video.forEach(video => {
      const hFlip = video.transform?.horizontalFlip || false;
      const vFlip = video.transform?.verticalFlip || false;
      
      if (hFlip && vFlip) {
        bothFlipped++;
      } else if (hFlip) {
        horizontalFlipped++;
      } else if (vFlip) {
        verticalFlipped++;
      }
    });

    return {
      totalVideos: ir.video.length,
      horizontalFlipped,
      verticalFlipped,
      bothFlipped,
      hasMirrorEffects: horizontalFlipped > 0 || verticalFlipped > 0 || bothFlipped > 0,
    };
  }
}

/**
 * 快速测试函数 - 在浏览器控制台中使用
 */
export async function testMirrorExport() {
  const tester = new MirrorExportTest();
  
  console.log("🧪 开始镜像导出测试...");
  
  // 获取当前状态
  const report = tester.getMirrorReport();
  console.log("📊 当前镜像状态:", report);
  
  if (report.totalVideos === 0) {
    console.warn("⚠️ 请先添加视频到时间轴");
    return;
  }
  
  // 执行测试
  const result = await tester.testMirrorExport();
  
  if (result.success && result.exportBlob) {
    console.log("🎉 镜像测试成功!", result.message);
    console.log("🪞 镜像信息:", result.mirrorInfo);
    tester.downloadTestResult(result.exportBlob);
  } else {
    console.error("❌ 镜像测试失败:", result.message);
  }
}

// 在浏览器环境中注册全局函数
if (typeof window !== 'undefined') {
  (window as any).testMirrorExport = testMirrorExport;
  console.log('💡 在控制台运行 testMirrorExport() 来测试镜像导出功能');
}
