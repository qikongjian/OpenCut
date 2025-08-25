// ai-transition-test.ts - AI剪辑转场导出测试
// 此文件测试AI剪辑完成后添加转场并导出的完整流程
// 文件路径: lib/export/ai-transition-test.ts

import { useTimelineStore } from "@/stores/timeline-store";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { ExportManager } from "./export-manager";
import { IRGenerator } from "./ir-generator";

/**
 * AI剪辑转场导出测试类
 */
export class AITransitionExportTest {
  private exportManager: ExportManager;

  constructor() {
    this.exportManager = ExportManager.getInstance();
  }

  /**
   * 测试AI剪辑后添加转场并导出
   */
  async testAIEditingWithTransitions(): Promise<{
    success: boolean;
    message: string;
    exportBlob?: Blob;
  }> {
    try {
      console.log("🚀 开始AI剪辑转场导出测试");

      // 步骤1：检查AI剪辑是否完成
      const aiEditingStore = useAIEditingStore.getState();
      const timelineStore = useTimelineStore.getState();

      if (!aiEditingStore.currentEditingPlan) {
        return {
          success: false,
          message: "请先完成AI剪辑，然后再测试转场导出"
        };
      }

      // 步骤2：检查时间轴中是否有视频元素
      const videoTracks = timelineStore.tracks.filter(track => track.type === 'media');
      const videoElements = videoTracks.flatMap(track => 
        track.elements.filter(element => element.type === 'media')
      );

      if (videoElements.length < 2) {
        return {
          success: false,
          message: `时间轴中只有${videoElements.length}个视频元素，至少需要2个才能添加转场`
        };
      }

      console.log(`✅ 找到${videoElements.length}个视频元素，可以添加转场`);

      // 步骤3：自动添加转场
      const transitionsAdded = await this.addTransitionsBetweenVideos(videoElements, videoTracks);
      
      if (transitionsAdded === 0) {
        return {
          success: false,
          message: "无法添加转场，请检查视频元素的时间安排"
        };
      }

      console.log(`✅ 成功添加${transitionsAdded}个转场`);

      // 步骤4：生成IR并检查转场
      const ir = IRGenerator.generateIR();
      console.log("📊 生成的IR信息:");
      console.log(`   视频元素: ${ir.video.length}个`);
      console.log(`   转场效果: ${ir.transitions.length}个`);
      console.log(`   总时长: ${(ir.duration / 1000).toFixed(2)}秒`);

      if (ir.transitions.length === 0) {
        return {
          success: false,
          message: "IR中没有转场信息，转场可能没有正确添加到时间轴"
        };
      }

      // 步骤5：导出带转场的视频
      console.log("🎬 开始导出带转场效果的视频...");
      
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
          message: `成功导出带${ir.transitions.length}个转场效果的视频`,
          exportBlob: result.blob
        };
      } else {
        return {
          success: false,
          message: "导出失败: " + (result.error || "未知错误")
        };
      }

    } catch (error) {
      console.error("❌ AI剪辑转场导出测试失败:", error);
      return {
        success: false,
        message: `测试失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }

  /**
   * 在视频元素之间自动添加转场
   */
  private async addTransitionsBetweenVideos(
    videoElements: any[],
    videoTracks: any[]
  ): Promise<number> {
    const timelineStore = useTimelineStore.getState();
    let transitionsAdded = 0;

    // 按开始时间排序视频元素
    const sortedElements = videoElements.sort((a, b) => a.startTime - b.startTime);

    // 定义转场类型循环
    const transitionTypes = [
      { type: 'flash', direction: 'in', duration: 0.2 },    // 闪黑
      { type: 'dissolve', direction: 'in', duration: 0.8 }, // 叠化
      { type: 'flash', direction: 'out', duration: 0.2 },   // 闪白
    ];

    for (let i = 0; i < sortedElements.length - 1; i++) {
      const fromElement = sortedElements[i];
      const toElement = sortedElements[i + 1];

      // 找到元素所在的轨道
      const fromTrack = videoTracks.find(track => 
        track.elements.some((el: any) => el.id === fromElement.id)
      );
      const toTrack = videoTracks.find(track => 
        track.elements.some((el: any) => el.id === toElement.id)
      );

      if (!fromTrack || !toTrack) {
        console.warn(`跳过转场 ${i + 1}: 找不到元素所在轨道`);
        continue;
      }

      // 检查元素是否相邻或重叠
      const fromEnd = fromElement.startTime + fromElement.duration;
      const toStart = toElement.startTime;
      const gap = toStart - fromEnd;

      if (gap > 1.0) {
        console.warn(`跳过转场 ${i + 1}: 元素间隔过大 (${gap.toFixed(2)}秒)`);
        continue;
      }

      // 选择转场类型
      const transitionTemplate = transitionTypes[i % transitionTypes.length];

      try {
        const transitionId = timelineStore.addTransitionBetweenElements(
          fromTrack.id,
          fromElement.id,
          toTrack.id,
          toElement.id,
          transitionTemplate.type as any,
          {
            direction: transitionTemplate.direction as any,
            duration: transitionTemplate.duration,
            easing: "ease-in-out",
            intensity: 1.0,
            blur: 0.0,
          }
        );

        if (transitionId) {
          transitionsAdded++;
          console.log(`✅ 添加转场 ${i + 1}: ${transitionTemplate.type} (${fromElement.name} → ${toElement.name})`);
        } else {
          console.warn(`❌ 转场添加失败 ${i + 1}: ${fromElement.name} → ${toElement.name}`);
        }
      } catch (error) {
        console.error(`❌ 转场添加异常 ${i + 1}:`, error);
      }

      // 添加小延迟，避免UI卡顿
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return transitionsAdded;
  }

  /**
   * 下载测试结果
   */
  downloadTestResult(blob: Blob, filename: string = 'ai_editing_with_transitions.mp4'): void {
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
   * 获取当前时间轴状态报告
   */
  getTimelineReport(): {
    videoCount: number;
    transitionCount: number;
    totalDuration: number;
    hasTransitions: boolean;
  } {
    const timelineStore = useTimelineStore.getState();
    const ir = IRGenerator.generateIR();

    return {
      videoCount: ir.video.length,
      transitionCount: ir.transitions.length,
      totalDuration: ir.duration / 1000,
      hasTransitions: ir.transitions.length > 0,
    };
  }
}

/**
 * 快速测试函数 - 在浏览器控制台中使用
 */
export async function testAITransitionExport() {
  const tester = new AITransitionExportTest();
  
  console.log("🧪 开始AI剪辑转场导出测试...");
  
  // 获取当前状态
  const report = tester.getTimelineReport();
  console.log("📊 当前时间轴状态:", report);
  
  if (report.videoCount < 2) {
    console.warn("⚠️ 请先完成AI剪辑，确保时间轴中有至少2个视频片段");
    return;
  }
  
  // 执行测试
  const result = await tester.testAIEditingWithTransitions();
  
  if (result.success && result.exportBlob) {
    console.log("🎉 测试成功!", result.message);
    tester.downloadTestResult(result.exportBlob);
  } else {
    console.error("❌ 测试失败:", result.message);
  }
}

// 在浏览器环境中注册全局函数
if (typeof window !== 'undefined') {
  (window as any).testAITransitionExport = testAITransitionExport;
  console.log('💡 在控制台运行 testAITransitionExport() 来测试AI剪辑转场导出功能');
}
