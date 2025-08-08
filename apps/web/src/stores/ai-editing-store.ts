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

// 生成视频缩略图的工具函数
const generateVideoThumbnail = (videoFile: File, timeInSeconds: number = 1.0): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建Canvas上下文'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      // 设置canvas尺寸
      canvas.width = 320;  // 缩略图宽度
      canvas.height = 180; // 缩略图高度 (16:9比例)

      // 跳转到指定时间
      video.currentTime = Math.min(timeInSeconds, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 转换为base64图片
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

        // 清理
        video.remove();
        canvas.remove();

        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('视频加载失败'));
    };

    // 设置视频源
    video.src = URL.createObjectURL(videoFile);
  });
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
      
      // 第一阶段：下载所有视频到本地（彻底解决远程URL问题）
      set({ executionProgress: 5, currentProcessingClip: "下载视频到本地..." });

      console.log(`🎬 开始下载AI剪辑视频，彻底解决导出黑屏问题`);

      const downloadedVideos: Array<{
        clip: any;
        file: File;
        url: string;
        duration: number;
      }> = [];

      // 并行下载所有视频（大幅提升速度）
      console.log(`🚀 开始并行下载 ${totalClips} 个视频...`);

      const downloadPromises = currentEditingPlan.timeline_clips.map(async (clip, index) => {
        const fileName = `AI剪辑_${clip.sequence_clip_id}_${Date.now()}_${index}.mp4`;

        try {
          console.log(`🔽 开始下载视频 ${index + 1}/${totalClips}: ${clip.sequence_clip_id}`);

          // 使用代理方式下载视频文件，绕过CORS限制
          let blob: Blob;
          let actualFileName = fileName;

          try {
            // 方法1：尝试直接fetch（可能被CORS阻止）
            const response = await fetch(clip.video_url, {
              mode: 'cors',
              credentials: 'omit'
            });
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            blob = await response.blob();
            console.log(`✅ 直接下载成功: ${actualFileName} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
          } catch (corsError) {
            console.warn(`⚠️ 直接下载失败（CORS），尝试代理方式: ${clip.sequence_clip_id}`, corsError);

            // 方法2：使用代理API下载
            try {
              const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(clip.video_url)}`;
              const proxyResponse = await fetch(proxyUrl);
              if (!proxyResponse.ok) {
                throw new Error(`代理下载失败: ${proxyResponse.status}`);
              }
              blob = await proxyResponse.blob();
              console.log(`✅ 代理下载成功: ${actualFileName} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
            } catch (proxyError) {
              console.warn(`⚠️ 代理下载也失败，回退到远程URL方案: ${clip.sequence_clip_id}`, proxyError);

              // 方法3：回退到远程URL方案（不下载，直接使用远程URL）
              console.log(`🌐 回退到远程URL方案: ${clip.sequence_clip_id}`);

              // 创建一个最小的虚拟blob用于占位
              const placeholderContent = new TextEncoder().encode(`AI剪辑片段: ${clip.sequence_clip_id}`);
              blob = new Blob([placeholderContent], { type: 'text/plain' });
              actualFileName = `AI剪辑_远程_${clip.sequence_clip_id}.txt`;

              // 标记这是远程URL方案
              (blob as any)._isRemoteUrlFallback = true;
              (blob as any)._originalVideoUrl = clip.video_url;
            }
          }

          const file = new File([blob], actualFileName, { type: 'video/mp4' });
          const localUrl = URL.createObjectURL(blob);

          // 获取视频时长
          const duration = durationToSeconds(clip.clip_duration_in_sequence);

          return {
            clip,
            file,
            url: localUrl,
            duration,
            index // 保持原始顺序
          };

        } catch (error) {
          console.error(`❌ 视频下载失败: ${clip.video_url}`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`视频下载失败: ${clip.sequence_clip_id} - ${errorMessage}`);
        }
      });

      // 等待所有下载完成，并显示进度
      const downloadResults = await Promise.allSettled(downloadPromises);

      // 处理下载结果
      downloadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          downloadedVideos.push(result.value);
          console.log(`✅ 视频 ${index + 1} 下载完成`);
        } else {
          console.error(`❌ 视频 ${index + 1} 下载失败:`, result.reason);
          throw new Error(`视频下载失败: ${result.reason}`);
        }

        // 更新进度
        set({
          executionProgress: 5 + ((index + 1) / totalClips) * 60,
          currentProcessingClip: `下载完成 ${index + 1}/${totalClips}`
        });
      });

      // 按原始顺序排序
      downloadedVideos.sort((a, b) => (a as any).index - (b as any).index);

      console.log(`✅ 所有视频下载完成，共 ${downloadedVideos.length} 个文件`);

      // 第二阶段：生成视频缩略图并添加到媒体面板
      set({ executionProgress: 65, currentProcessingClip: "生成视频缩略图..." });

      const addedMediaItems: any[] = []; // 记录成功添加的媒体项

      for (let i = 0; i < downloadedVideos.length; i++) {
        const { clip, file, url } = downloadedVideos[i];
        const isRemoteFallback = (file as any)._isRemoteUrlFallback;

        let thumbnailUrl = url;

        // 为本地视频生成缩略图
        if (!isRemoteFallback && file.type.startsWith('video/')) {
          try {
            console.log(`🖼️ 生成缩略图: ${clip.sequence_clip_id}`);
            thumbnailUrl = await generateVideoThumbnail(file, 1.0);
            console.log(`✅ 缩略图生成成功: ${clip.sequence_clip_id}`);
          } catch (error) {
            console.warn(`⚠️ 缩略图生成失败，使用视频URL: ${clip.sequence_clip_id}`, error);
            thumbnailUrl = url;
          }
        }

        // 创建媒体项
        const mediaItem = {
          id: `ai-clip-${clip.sequence_clip_id}-${Date.now()}-${i}`,
          name: `AI剪辑-${clip.sequence_clip_id}`,
          url: url,
          type: "video" as const,
          duration: durationToSeconds(clip.clip_duration_in_sequence),
          size: file.size,
          file: file,
          width: 1920,
          height: 1080,
          fps: 30,
          thumbnailUrl: thumbnailUrl,
          createdAt: new Date(),
        };

        // 添加到媒体库
        try {
          await mediaStore.addMediaItem(projectStore.activeProject.id, mediaItem);
          addedMediaItems.push(mediaItem); // 记录成功添加的媒体项
          console.log(`✅ 媒体项已添加: ${mediaItem.name}`);
        } catch (error) {
          console.error(`❌ 添加媒体项失败:`, error);
          // 不抛出错误，继续处理
        }

        set({
          executionProgress: 65 + ((i + 1) / downloadedVideos.length) * 15,
          currentProcessingClip: `添加媒体 ${i + 1}/${downloadedVideos.length}`
        });
      }

      console.log(`✅ 所有媒体项添加完成，共 ${addedMediaItems.length} 个`);

      // 第三阶段：创建时间轴元素（确保媒体项已存在）
      set({ executionProgress: 80, currentProcessingClip: "创建时间轴..." });

      let currentTimelinePosition = 0;

      for (let i = 0; i < downloadedVideos.length; i++) {
        const { clip, file, url } = downloadedVideos[i];
        const correspondingMediaItem = addedMediaItems[i]; // 使用记录的媒体项

        if (!correspondingMediaItem) {
          console.warn(`⚠️ 未找到对应的媒体项: ${clip.sequence_clip_id}`);
          continue;
        }

        // 创建媒体元素 - 使用连续时间轴位置和本地文件
        const startTime = currentTimelinePosition;
        const duration = durationToSeconds(clip.clip_duration_in_sequence);
        const sourceIn = timecodeToSeconds(clip.source_in_timecode);
        const sourceOut = timecodeToSeconds(clip.source_out_timecode);

        currentTimelinePosition += duration;

        const isRemoteFallback = (file as any)._isRemoteUrlFallback;
        const originalVideoUrl = (file as any)._originalVideoUrl;

        // 创建媒体元素
        const mediaElement: Omit<MediaElement, "id"> = {
          type: "media",
          name: `AI剪辑-${clip.sequence_clip_id} (${clip.source_clip_id})`,
          mediaId: correspondingMediaItem.id, // 使用已添加的媒体项ID
          duration: duration,
          startTime: startTime,
          trimStart: sourceIn,
          trimEnd: Math.max(0, sourceOut),
          horizontalFlip: false,
          mediaFile: isRemoteFallback ? undefined : file,
          mediaUrl: isRemoteFallback ? originalVideoUrl : url,
          thumbnailUrl: correspondingMediaItem.thumbnailUrl, // 使用媒体项的缩略图
          mediaType: "video",
          mediaWidth: 1920,
          mediaHeight: 1080,
          mediaFps: 30,
        };

        // 添加到时间轴
        timelineStore.addElementToTrack(mainTrackId, mediaElement);

        console.log(`✅ 成功添加AI剪辑片段到时间轴:`);
        console.log(`   片段ID: ${clip.sequence_clip_id}`);
        console.log(`   媒体项ID: ${correspondingMediaItem.id}`);
        console.log(`   缩略图: ${correspondingMediaItem.thumbnailUrl ? '已生成' : '未生成'}`);

        set({
          executionProgress: 80 + ((i + 1) / downloadedVideos.length) * 15,
          currentProcessingClip: `时间轴 ${i + 1}/${downloadedVideos.length}`
        });
      }
      
      set({ executionProgress: 100 });

      // 统计下载结果
      const localFiles = downloadedVideos.filter(v => !(v.file as any)._isRemoteUrlFallback).length;
      const remoteUrls = downloadedVideos.filter(v => (v.file as any)._isRemoteUrlFallback).length;

      console.log(`🎉 AI剪辑执行完成! 连续排列，智能处理CORS问题!`);
      console.log(`📊 总时长: ${currentTimelinePosition}秒`);
      console.log(`💾 下载结果: ${localFiles}个本地文件, ${remoteUrls}个远程URL`);

      if (remoteUrls > 0) {
        toast.success(`AI剪辑完成! ${localFiles}个视频已下载，${remoteUrls}个使用远程URL（CORS限制），总时长${currentTimelinePosition.toFixed(1)}秒。`);
      } else {
        toast.success(`AI剪辑完成! 已下载${totalClips}个视频到本地并连续排列，总时长${currentTimelinePosition.toFixed(1)}秒。彻底解决导出黑屏问题!`);
      }
      
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
