// ai-editing-store.ts - AI剪辑功能状态管理
// 此文件包含 AI剪辑计划和一键剪辑功能 的相关代码
// 文件路径: stores/ai-editing-store.ts
// 最后更新: 2025/1/8

import { create } from "zustand";
import { toast } from "sonner";
import { AIEditingData, AIEditingPlan, MediaElement } from "@/types/timeline";
import { useTimelineStore } from "./timeline-store";
import { useMediaStore } from "./media-store";
import { useProjectStore } from "./project-store";
import { generateAIEditingMockData } from "@/lib/ai-editing-mock-data";



// AI剪辑状态接口定义
interface AIEditingState {
  // 状态数据
  aiEditingData: AIEditingData | null;
  currentEditingPlan: AIEditingPlan | null;
  isExecutingPlan: boolean;
  executionProgress: number;
  isLoadingPlan: boolean;
  currentProcessingClip: string | null;
  
  // 预览状态
  previewClipIndex: number | null;
  isPreviewMode: boolean;
  
  // 操作方法
  loadAIEditingData: (data: AIEditingData) => void;
  setCurrentEditingPlan: (plan: AIEditingPlan) => void;
  executeEditingPlan: () => Promise<void>;
  previewClip: (clipIndex: number) => void;
  stopPreview: () => void;
  clearAIData: () => void;
  
  // Mock数据生成
  generateMockData: (projectId: string) => AIEditingData;
}

// 时间码转换为秒数的工具函数
const timecodeToSeconds = (timecode: string): number => {
  const parts = timecode.split(':');
  if (parts.length === 4) {
    // HH:MM:SS:FF 格式
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    const frames = parseInt(parts[3]);
    return hours * 3600 + minutes * 60 + seconds + frames / 30; // 假设30fps
  } else if (parts.length === 3) {
    // HH:MM:SS 格式
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
};

// 持续时间字符串转换为秒数
const durationToSeconds = (duration: string): number => {
  if (duration.endsWith('s')) {
    return parseFloat(duration.replace('s', ''));
  }
  return parseFloat(duration);
};

// 创建AI剪辑状态管理存储
export const useAIEditingStore = create<AIEditingState>((set, get) => ({
  // 初始状态
  aiEditingData: null,
  currentEditingPlan: null,
  isExecutingPlan: false,
  executionProgress: 0,
  isLoadingPlan: false,
  currentProcessingClip: null,
  previewClipIndex: null,
  isPreviewMode: false,

  // 加载AI剪辑数据
  loadAIEditingData: (data: AIEditingData) => {
    set({ 
      aiEditingData: data,
      currentEditingPlan: data.editing_plan.editing_sequence_plans[0] || null
    });
    toast.success("AI剪辑计划加载成功");
  },

  // 设置当前剪辑计划
  setCurrentEditingPlan: (plan: AIEditingPlan) => {
    set({ currentEditingPlan: plan });
  },

  // 执行剪辑计划
  executeEditingPlan: async () => {
    const { currentEditingPlan } = get();
    if (!currentEditingPlan) {
      toast.error("没有可执行的剪辑计划");
      return;
    }

    set({ isExecutingPlan: true, executionProgress: 0 });
    
    try {
      const timelineStore = useTimelineStore.getState();
      const mediaStore = useMediaStore.getState();
      const projectStore = useProjectStore.getState();
      
      if (!projectStore.activeProject) {
        throw new Error("没有活动项目");
      }

      // 清空现有时间轴
      timelineStore.clearTimeline();
      
      // 创建主轨道
      const mainTrackId = timelineStore.findOrCreateTrack("media");
      
      const totalClips = currentEditingPlan.timeline_clips.length;
      
      // 逐个处理剪辑片段
      for (let i = 0; i < currentEditingPlan.timeline_clips.length; i++) {
        const clip = currentEditingPlan.timeline_clips[i];
        
        // 更新进度
        set({
          executionProgress: (i / totalClips) * 100,
          currentProcessingClip: clip.sequence_clip_id
        });

        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 创建媒体元素
        const startTime = timecodeToSeconds(clip.sequence_start_timecode);
        const duration = durationToSeconds(clip.clip_duration_in_sequence);
        const sourceIn = timecodeToSeconds(clip.source_in_timecode);
        const sourceOut = timecodeToSeconds(clip.source_out_timecode);
        
        // 创建基于video_url的虚拟媒体元素，不依赖本地媒体库
        const virtualMediaId = `ai-clip-${clip.sequence_clip_id}-${Date.now()}`;

        // 直接基于video_url创建媒体元素
        const mediaElement: Omit<MediaElement, "id"> = {
          type: "media",
          name: `AI剪辑-${clip.sequence_clip_id} (${clip.source_clip_id})`,
          mediaId: virtualMediaId, // 使用虚拟ID
          duration: duration,
          startTime: startTime,
          trimStart: sourceIn,
          trimEnd: Math.max(0, sourceOut),
          horizontalFlip: false,
          // 关键：直接使用video_url作为媒体源
          mediaUrl: clip.video_url,
          // 暂时使用视频URL作为缩略图，时间轴组件会处理显示
          thumbnailUrl: clip.video_url,
          mediaType: "video",
          // 添加视频尺寸信息（如果有的话）
          mediaWidth: 1920, // 默认值，实际应该从视频元数据获取
          mediaHeight: 1080,
          mediaFps: 30,
        };

        // 创建虚拟媒体项用于媒体库管理
        const virtualMediaItem = {
          id: virtualMediaId,
          name: `${clip.source_clip_id} (AI剪辑源)`,
          url: clip.video_url,
          type: "video" as const,
          duration: sourceOut - sourceIn,
          size: 0, // 远程文件大小未知
          file: new File([], clip.source_clip_id, { type: 'video/mp4' }), // 创建虚拟文件对象
          createdAt: new Date(),
        };

        // 添加到媒体库以便后续管理和引用
        try {
          await mediaStore.addMediaItem("current-project", virtualMediaItem);
          console.log(`✅ 虚拟媒体项已添加到媒体库: ${virtualMediaItem.name}`);
        } catch (error) {
          console.warn(`⚠️ 添加虚拟媒体项失败，但不影响剪辑执行:`, error);
        }

        // 添加到时间轴
        timelineStore.addElementToTrack(mainTrackId, mediaElement);

        console.log(`✅ 成功添加基于video_url的AI剪辑片段:`);
        console.log(`   片段ID: ${clip.sequence_clip_id}`);
        console.log(`   视频源URL: ${clip.video_url}`);
        console.log(`   源时间段: ${clip.source_in_timecode} - ${clip.source_out_timecode}`);
        console.log(`   时间轴位置: ${startTime}s, 时长: ${duration}s`);
        console.log(`   虚拟媒体ID: ${virtualMediaId}`);
        console.log(`   MediaElement.mediaUrl: ${mediaElement.mediaUrl}`);
        console.log(`   MediaElement.mediaType: ${mediaElement.mediaType}`);
      }
      
      set({ executionProgress: 100 });
      toast.success(`成功应用AI剪辑计划，共处理${totalClips}个片段`);
      
    } catch (error) {
      console.error("执行剪辑计划失败:", error);
      toast.error("执行剪辑计划失败");
    } finally {
      set({
        isExecutingPlan: false,
        executionProgress: 0,
        currentProcessingClip: null
      });
    }
  },

  // 预览片段
  previewClip: (clipIndex: number) => {
    const { currentEditingPlan } = get();
    if (!currentEditingPlan || clipIndex >= currentEditingPlan.timeline_clips.length) {
      return;
    }
    
    set({ 
      previewClipIndex: clipIndex,
      isPreviewMode: true 
    });
    
    // 这里可以添加预览逻辑，比如在预览面板中显示对应的视频片段
    toast.info(`预览片段: ${currentEditingPlan.timeline_clips[clipIndex].sequence_clip_id}`);
  },

  // 停止预览
  stopPreview: () => {
    set({ 
      previewClipIndex: null,
      isPreviewMode: false 
    });
  },

  // 清空AI数据
  clearAIData: () => {
    set({
      aiEditingData: null,
      currentEditingPlan: null,
      previewClipIndex: null,
      isPreviewMode: false,
      executionProgress: 0,
    });
  },

  // 生成Mock数据
  generateMockData: (projectId: string): AIEditingData => {
    return generateAIEditingMockData(projectId);
  },
}));
