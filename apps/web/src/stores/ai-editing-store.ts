// ai-editing-store.ts - AI剪辑功能状态管理
// 此文件包含 AI剪辑计划和一键剪辑功能 的相关代码
// 文件路径: stores/ai-editing-store.ts
// 最后更新: 2025/1/8

import { create } from "zustand";
import { toast } from "sonner";
import { AIEditingData, AIEditingPlan, CreateMediaElement } from "@/types/timeline";
import { useTimelineStore } from "./timeline-store";
import { useMediaStore } from "./media-store";
import { useProjectStore } from "./project-store";
import { usePlaybackStore } from "./playback-store";
import { generateAIEditingMockData } from "@/lib/ai-editing-mock-data";
import {
  extractSubtitleDataFromAIEditing,
  createSubtitleTrackWithElements
} from "@/lib/ai-subtitle-integration";
import { parseDialogueTrackToTextElements } from "@/lib/subtitle-parser";
import { storageService } from "@/lib/storage/storage-service";



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

  // 新增：可视化剪辑状态
  isShowingOriginalVideo: boolean;
  originalVideoTrackId: string | null;
  visualEditingState: 'idle' | 'showing-original' | 'executing' | 'completed';
  currentEditingStep: string | null;
  editingSteps: Array<{
    id: string;
    description: string;
    status: 'pending' | 'executing' | 'completed';
    clipIndex?: number;
  }>;
  
  // 操作方法
  loadAIEditingData: (data: AIEditingData) => void;
  setCurrentEditingPlan: (plan: AIEditingPlan) => void;
  executeEditingPlan: () => Promise<void>;
  previewClip: (clipIndex: number) => void;
  stopPreview: () => void;
  clearAIData: () => void;

  // 新增：可视化剪辑方法
  showOriginalVideoInTimeline: () => Promise<void>;
  executeVisualEditingPlan: () => Promise<void>;
  updateEditingStep: (stepId: string, status: 'pending' | 'executing' | 'completed') => void;
  performVisualEditingOnOriginalVideo: () => Promise<void>;
  performDirectVideoEditing: () => Promise<void>;
  addAISubtitles: () => Promise<void>;
  ensureSubtitlesAdded: () => Promise<void>;

  // Mock数据生成
  generateMockData: (projectId: string) => AIEditingData;

  // 高性能视频元数据获取
  getVideoMetadataOptimized: (videoUrl: string, index: number) => Promise<{duration: number, thumbnail: string}>;

  // 内部方法
  adjustTimelineZoomForOriginalVideos: () => number | undefined;
  performVisualEditingAnimation: () => Promise<{success: boolean, type: string}>;
  performOneClickEditingInBackground: () => Promise<any>;
  applyOneClickResultToTimeline: (result: any) => Promise<void>;
}

// 时间码转换为秒数的工具函数
const timecodeToSeconds = (timecode: string): number => {
  if (!timecode) return 0;

  // 处理 SRT 格式的时间码 (HH:MM:SS,mmm)
  if (timecode.includes(',')) {
    const [timePart, millisecondsPart] = timecode.split(',');
    const parts = timePart.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      const milliseconds = parseInt(millisecondsPart || '0');
      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }
  }

  const parts = timecode.split(':');
  if (parts.length === 4) {
    // HH:MM:SS:FF 格式
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    const frames = parseInt(parts[3]);
    return hours * 3600 + minutes * 60 + seconds + frames / 30; // 假设30fps
  } else if (parts.length === 3) {
    // HH:MM:SS.mmm 或 HH:MM:SS 格式
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

// 🚀 新增：从远程URL生成视频缩略图
const generateVideoThumbnailFromUrl = (videoUrl: string, timeInSeconds: number = 1.0): Promise<string> => {
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
    video.crossOrigin = 'anonymous'; // 尝试跨域访问

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
      reject(new Error('远程视频加载失败'));
    };

    // 设置视频源为远程URL
    video.src = videoUrl;
  });
};

// 🚀 新增：生成默认视频缩略图（支持不同颜色）
const generateDefaultVideoThumbnail = (index: number = 0): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VmlkZW88L3RleHQ+Cjwvc3ZnPg==';
  }

  canvas.width = 320;
  canvas.height = 180;

  // 🚀 修复：为每个片段使用不同的颜色
  const colors = [
    '#4a5568', // 灰色
    '#4c51bf', // 紫色
    '#059669', // 绿色
    '#dc2626', // 红色
    '#d97706', // 橙色
    '#0891b2', // 青色
  ];

  const bgColor = colors[index % colors.length];

  // 绘制默认背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制播放图标
  ctx.fillStyle = '#ffffff';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶', canvas.width / 2, canvas.height / 2);

  // 添加文字和片段编号
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.fillText(`AI剪辑 ${index + 1}`, canvas.width / 2, canvas.height / 2 + 40);

  return canvas.toDataURL('image/jpeg', 0.8);
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

  // 新增：可视化剪辑初始状态
  isShowingOriginalVideo: false,
  originalVideoTrackId: null,
  visualEditingState: 'idle',
  currentEditingStep: null,
  editingSteps: [],

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



      const downloadedVideos: Array<{
        clip: any;
        file: File;
        url: string;
        duration: number;
      }> = [];

      // 并行下载所有视频（大幅提升速度）

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

      // 第二阶段：🚀 并行生成视频缩略图并添加到媒体面板
      set({ executionProgress: 65, currentProcessingClip: "并行生成视频缩略图..." });

      console.log(`🚀 开始并行生成 ${downloadedVideos.length} 个视频缩略图...`);

      // 🚀 优化1：并行生成所有缩略图（使用不同时间点确保缩略图差异）
      const thumbnailPromises = downloadedVideos.map(async ({ clip, file, url }, index) => {
        const isRemoteFallback = (file as any)._isRemoteUrlFallback;
        let thumbnailUrl = url;

        // 🚀 修复：为每个片段使用不同的时间点生成缩略图
        const thumbnailTime = 0.5 + (index * 0.3); // 0.5秒, 0.8秒, 1.1秒, 1.4秒...

        try {
          if (!isRemoteFallback && file.type.startsWith('video/')) {
            console.log(`🖼️ [${index + 1}/${downloadedVideos.length}] 生成缩略图 (${thumbnailTime}s): ${clip.sequence_clip_id}`);
            thumbnailUrl = await generateVideoThumbnail(file, thumbnailTime);
            console.log(`✅ [${index + 1}/${downloadedVideos.length}] 缩略图生成成功: ${clip.sequence_clip_id}`);
          } else if (isRemoteFallback) {
            const originalVideoUrl = (file as any)._originalVideoUrl;
            console.log(`🖼️ [${index + 1}/${downloadedVideos.length}] 为远程视频生成缩略图 (${thumbnailTime}s): ${clip.sequence_clip_id}`);
            thumbnailUrl = await generateVideoThumbnailFromUrl(originalVideoUrl, thumbnailTime);
            console.log(`✅ [${index + 1}/${downloadedVideos.length}] 远程视频缩略图生成成功: ${clip.sequence_clip_id}`);
          }
        } catch (error) {
          console.warn(`⚠️ [${index + 1}/${downloadedVideos.length}] 缩略图生成失败: ${clip.sequence_clip_id}`, error);
          // 🚀 修复：为每个片段生成不同的默认缩略图
          thumbnailUrl = isRemoteFallback ? generateDefaultVideoThumbnail(index) : url;
        }

        return { clip, file, url, thumbnailUrl, index };
      });

      // 等待所有缩略图生成完成
      const thumbnailResults = await Promise.allSettled(thumbnailPromises);
      const processedVideos: any[] = [];

      thumbnailResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processedVideos.push(result.value);
        } else {
          console.error(`❌ 缩略图 ${index + 1} 处理失败:`, result.reason);
          // 创建一个回退项
          const { clip, file, url } = downloadedVideos[index];
          const isRemoteFallback = (file as any)._isRemoteUrlFallback;
          processedVideos.push({
            clip, file, url,
            thumbnailUrl: isRemoteFallback ? generateDefaultVideoThumbnail(index) : url,
            index
          });
        }
      });

      // 按原始顺序排序
      processedVideos.sort((a, b) => a.index - b.index);
      console.log(`✅ 所有缩略图处理完成，共 ${processedVideos.length} 个`);

      // 创建媒体项
      set({ executionProgress: 75, currentProcessingClip: "添加媒体项到媒体库..." });
      const addedMediaItems: any[] = []; // 记录成功添加的媒体项

      for (let i = 0; i < processedVideos.length; i++) {
        const { clip, file, url, thumbnailUrl } = processedVideos[i];
        const isRemoteFallback = (file as any)._isRemoteUrlFallback;

        // 🚀 修复2：创建符合MediaItem接口的标准媒体项
        const originalVideoUrl = (file as any)._originalVideoUrl;

        // 🚀 关键修复：确保url和thumbnailUrl都正确设置
        const playbackUrl = isRemoteFallback ? originalVideoUrl : url;
        const finalThumbnailUrl = thumbnailUrl || generateDefaultVideoThumbnail(i);

        const mediaItem = {
          id: `ai-clip-${clip.sequence_clip_id}-${Date.now()}-${i}`,
          name: `AI剪辑-${clip.sequence_clip_id}`,
          type: "video" as const,
          file: isRemoteFallback ? null : file, // 🚀 修复：远程视频不保存文件，避免OPFS错误
          url: playbackUrl, // 🚀 修复：确保播放URL正确
          duration: durationToSeconds(clip.clip_duration_in_sequence),
          width: 1920,
          height: 1080,
          fps: 30,
          thumbnailUrl: finalThumbnailUrl, // 🚀 修复：确保缩略图URL始终存在
        };

        console.log(`🔧 媒体项创建详情:`, {
          clipId: clip.sequence_clip_id,
          isRemoteFallback,
          originalUrl: originalVideoUrl,
          playbackUrl,
          thumbnailUrl: finalThumbnailUrl,
          hasFile: !!mediaItem.file,
          fileType: mediaItem.file?.type || 'remote',
          fileName: mediaItem.file?.name || 'remote-video'
        });

        // 添加到媒体库
        try {
          const actualMediaItem = await mediaStore.addMediaItem(projectStore.activeProject.id, mediaItem);
          addedMediaItems.push(actualMediaItem); // 记录实际的媒体项

          console.log(`✅ 媒体项已添加: ${actualMediaItem.name}`);
          console.log(`   - ID: ${actualMediaItem.id}`);
          console.log(`   - URL: ${actualMediaItem.url}`);
          console.log(`   - 缩略图: ${actualMediaItem.thumbnailUrl ? '✅' : '❌'}`);
          console.log(`   - 文件类型: ${actualMediaItem.file?.type || 'remote'}`);
        } catch (error) {
          console.error(`❌ 添加媒体项失败:`, error);
          // 不抛出错误，继续处理
        }

        set({
          executionProgress: 75 + ((i + 1) / processedVideos.length) * 10,
          currentProcessingClip: `添加媒体 ${i + 1}/${processedVideos.length}`
        });
      }

      console.log(`✅ 所有媒体项添加完成，共 ${addedMediaItems.length} 个`);

      // 第三阶段：创建时间轴元素（确保媒体项已存在）
      set({ executionProgress: 85, currentProcessingClip: "创建时间轴..." });

      let timelinePosition = 0;

      for (let i = 0; i < addedMediaItems.length; i++) {
        const correspondingMediaItem = addedMediaItems[i];
        const { clip } = processedVideos[i]; // 使用处理后的视频数据

        if (!correspondingMediaItem) {
          console.warn(`⚠️ 未找到对应的媒体项: ${clip.sequence_clip_id}`);
          continue;
        }

        // 🚀 修复3：使用与正常拖拽相同的简单逻辑
        const startTime = timelinePosition;
        const actualClipDuration = durationToSeconds(clip.clip_duration_in_sequence);

        timelinePosition += actualClipDuration; // 时间轴位置按实际时长前进

        // 🚀 关键修复：使用与timeline-store.ts addMediaAtTime相同的简单逻辑
        const mediaElement: CreateMediaElement = {
          type: "media",
          name: `AI剪辑-${clip.sequence_clip_id}`,
          mediaId: correspondingMediaItem.id, // 使用已添加的媒体项ID
          duration: correspondingMediaItem.duration || actualClipDuration, // 使用媒体项的实际时长
          startTime: startTime,
          trimStart: 0, // 🚀 关键：使用简单的0开始，就像正常拖拽一样
          trimEnd: 0,   // 🚀 关键：使用简单的0结束，就像正常拖拽一样
          muted: false, // 🚀 关键：添加muted属性，就像正常拖拽一样
          horizontalFlip: false, // 添加必需的horizontalFlip属性
        };

        console.log(`📊 AI剪辑片段信息:`, {
          clipId: clip.sequence_clip_id,
          actualClipDuration: actualClipDuration,
          mediaItemDuration: correspondingMediaItem.duration,
          elementDuration: mediaElement.duration,
          trimStart: mediaElement.trimStart,
          trimEnd: mediaElement.trimEnd,
          startTime: mediaElement.startTime
        });

        // 添加到时间轴
        timelineStore.addElementToTrack(mainTrackId, mediaElement);

        console.log(`✅ 成功添加AI剪辑片段到时间轴:`);
        console.log(`   片段ID: ${clip.sequence_clip_id}`);
        console.log(`   媒体项ID: ${correspondingMediaItem.id}`);
        console.log(`   缩略图: ${correspondingMediaItem.thumbnailUrl ? '✅ 已生成' : '❌ 未生成'}`);
        console.log(`   媒体URL: ${correspondingMediaItem.url}`);
        console.log(`   媒体文件: ${correspondingMediaItem.file ? '✅ 本地文件' : '❌ 远程URL'}`);
        console.log(`   元素时长: ${mediaElement.duration}秒`);
        console.log(`   开始时间: ${mediaElement.startTime}秒`);

        // 🚀 验证媒体项是否在媒体库中
        const mediaInStore = mediaStore.mediaItems.find(m => m.id === correspondingMediaItem.id);
        console.log(`   媒体库验证: ${mediaInStore ? '✅ 存在' : '❌ 不存在'}`);
        if (mediaInStore) {
          console.log(`   媒体库URL: ${mediaInStore.url}`);
          console.log(`   媒体库缩略图: ${mediaInStore.thumbnailUrl ? '✅' : '❌'}`);
        }

        set({
          executionProgress: 85 + ((i + 1) / addedMediaItems.length) * 10,
          currentProcessingClip: `时间轴 ${i + 1}/${addedMediaItems.length}`
        });
      }

      // 第四阶段：处理字幕数据
      set({ executionProgress: 95, currentProcessingClip: "添加AI字幕..." });

      const { aiEditingData } = get();
      let subtitleCount = 0;

      if (aiEditingData) {
        try {
          // 提取字幕数据
          const subtitleData = extractSubtitleDataFromAIEditing(aiEditingData);

          if (subtitleData) {
            console.log('📝 发现AI字幕数据，开始处理...');

            // 解析字幕数据为TextElement数组
            const textElements = parseDialogueTrackToTextElements(subtitleData);

            if (textElements.length > 0) {
              console.log(`📝 生成了 ${textElements.length} 个字幕元素`);

              // 创建字幕轨道并添加字幕
              const subtitleTrackId = createSubtitleTrackWithElements(textElements, "AI字幕");

              if (subtitleTrackId) {
                subtitleCount = textElements.length;
                console.log(`✅ 成功创建字幕轨道并添加 ${subtitleCount} 个字幕`);
              } else {
                console.warn('⚠️ 字幕轨道创建失败');
              }
            } else {
              console.log('📝 没有生成字幕元素');
            }
          } else {
            console.log('📝 AI剪辑数据中没有字幕数据');
          }
        } catch (error) {
          console.error('❌ 处理AI字幕时发生错误:', error);
          // 不抛出错误，字幕失败不应该影响整个剪辑流程
        }
      }

      set({ executionProgress: 100 });

      // 统计下载结果
      const localFiles = downloadedVideos.filter(v => !(v.file as any)._isRemoteUrlFallback).length;
      const remoteUrls = downloadedVideos.filter(v => (v.file as any)._isRemoteUrlFallback).length;

      console.log(`🎉 AI剪辑执行完成! 连续排列，智能处理CORS问题!`);
      console.log(`📊 总时长: ${timelinePosition}秒`);
      console.log(`💾 下载结果: ${localFiles}个本地文件, ${remoteUrls}个远程URL`);
      console.log(`📝 字幕结果: ${subtitleCount}个字幕元素`);

      // 更新成功消息，包含字幕信息
      const subtitleMessage = subtitleCount > 0 ? `，${subtitleCount}个字幕` : '';

      if (remoteUrls > 0) {
        toast.success(`AI剪辑完成! ${localFiles}个视频已下载，${remoteUrls}个使用远程URL（CORS限制），总时长${timelinePosition.toFixed(1)}秒${subtitleMessage}。`);
      } else {
        toast.success(`AI剪辑完成! 已下载${totalClips}个视频到本地并连续排列，总时长${timelinePosition.toFixed(1)}秒${subtitleMessage}。`);
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

  // 🎯 资深工程师新增：自动调整时间轴缩放以适应原视频显示
  adjustTimelineZoomForOriginalVideos: () => {
    const { currentEditingPlan, isShowingOriginalVideo, originalVideoTrackId } = get();
    if (!currentEditingPlan || !isShowingOriginalVideo || !originalVideoTrackId) {
      return;
    }

    // 从时间轴获取实际的视频总时长
    const timelineStore = useTimelineStore.getState();
    const originalTrack = timelineStore.tracks.find(t => t.id === originalVideoTrackId);

    if (!originalTrack || originalTrack.elements.length === 0) {
      console.warn("未找到原视频轨道或元素");
      return;
    }

    // 计算实际的总时长
    const totalDuration = originalTrack.elements.reduce((sum, element) => {
      return sum + element.duration;
    }, 0);

    // 获取时间轴容器的可用宽度
    const timelineContainer = document.querySelector('[data-timeline-container]');
    const availableWidth = timelineContainer ? timelineContainer.clientWidth - 250 : 1200; // 减去左侧轨道标签宽度

    // 🎯 计算合适的缩放级别，让所有视频在一行中占据90%的宽度
    const PIXELS_PER_SECOND = 50; // 来自TIMELINE_CONSTANTS
    const targetWidthRatio = 0.9; // 目标占用90%的可用宽度
    const targetWidth = availableWidth * targetWidthRatio;
    const requiredWidth = totalDuration * PIXELS_PER_SECOND;
    const optimalZoomLevel = Math.max(0.25, Math.min(4, targetWidth / requiredWidth));

    console.log(`🔍 时间轴缩放计算 (90%显示):`, {
      totalClips: originalTrack.elements.length,
      actualTotalDuration: totalDuration.toFixed(1),
      availableWidth,
      targetWidth: targetWidth.toFixed(1),
      targetWidthRatio: `${(targetWidthRatio * 100)}%`,
      requiredWidth: requiredWidth.toFixed(1),
      optimalZoomLevel: optimalZoomLevel.toFixed(2),
      note: "调整为90%宽度显示，保留10%操作空间"
    });

    // 触发缩放调整事件
    const zoomEvent = new CustomEvent('timeline-zoom-adjust', {
      detail: { zoomLevel: optimalZoomLevel }
    });
    window.dispatchEvent(zoomEvent);

    toast.info(`🔍 已调整缩放至 ${optimalZoomLevel.toFixed(2)}x (90%显示)，总时长 ${totalDuration.toFixed(1)}秒`);

    return optimalZoomLevel;
  },

  // 🎬 新增：可视化剪辑过程 - 展示真实的剪辑操作，同时并行执行一键剪辑
  executeVisualEditingPlan: async () => {
    const { currentEditingPlan, isShowingOriginalVideo, originalVideoTrackId } = get();
    if (!currentEditingPlan) {
      toast.error("没有可执行的剪辑计划");
      return;
    }

    set({ isExecutingPlan: true, executionProgress: 0 });

    try {
      const timelineStore = useTimelineStore.getState();
      const playbackStore = usePlaybackStore.getState();
      const mediaStore = useMediaStore.getState();
      const projectStore = useProjectStore.getState();

      if (!projectStore.activeProject) {
        throw new Error("没有活动项目");
      }

      // 🎯 第一步：调整时间轴缩放以适应原视频显示
      set({ executionProgress: 5, currentProcessingClip: "调整时间轴视图至90%显示..." });
      if (isShowingOriginalVideo) {
        get().adjustTimelineZoomForOriginalVideos();
        await new Promise(resolve => setTimeout(resolve, 2000)); // 给用户更多时间观察缩放变化
      }

      // 🎬 第二步：启动并行处理
      set({ executionProgress: 10, currentProcessingClip: "启动并行剪辑处理..." });

      // 🚀 关键创新：并行执行可视化动画和一键剪辑逻辑
      const [visualResult, oneClickResult] = await Promise.all([
        // 可视化剪辑动画（用于展示）
        get().performVisualEditingAnimation(),
        // 一键剪辑逻辑（生成最终结果）
        get().performOneClickEditingInBackground()
      ]);

      // 🎯 第三步：用一键剪辑的结果替换时间轴
      set({ executionProgress: 95, currentProcessingClip: "应用最终剪辑结果..." });
      await get().applyOneClickResultToTimeline(oneClickResult);

      // 🎯 修复：移除额外的字幕保障机制，避免重复添加
      // 字幕已在applyOneClickResultToTimeline中添加，无需额外保障

      set({ executionProgress: 100, currentProcessingClip: "剪辑完成!" });
      toast.success("🎉 可视化剪辑完成！已应用一键剪辑结果和字幕");

    } catch (error) {
      console.error("可视化剪辑失败:", error);
      toast.error("可视化剪辑失败");
    } finally {
      set({
        isExecutingPlan: false,
        executionProgress: 0,
        currentProcessingClip: null
      });
    }
  },

  // 🎬 可视化剪辑动画（仅用于展示效果）
  performVisualEditingAnimation: async () => {
    const { currentEditingPlan, isShowingOriginalVideo, originalVideoTrackId } = get();
    if (!currentEditingPlan) return { success: false, type: 'visual' };

    console.log("🎭 开始可视化剪辑动画展示");

    // 如果有原视频在时间轴，执行可视化动画
    if (originalVideoTrackId && isShowingOriginalVideo) {
      await get().performVisualEditingOnOriginalVideo();
    } else {
      // 否则执行简化的动画效果
      for (let i = 0; i < currentEditingPlan.timeline_clips.length; i++) {
        const clip = currentEditingPlan.timeline_clips[i];
        set({
          executionProgress: 15 + (i / currentEditingPlan.timeline_clips.length) * 70,
          currentProcessingClip: `可视化处理片段 ${i + 1}/${currentEditingPlan.timeline_clips.length}: ${clip.sequence_clip_id}`
        });
        await new Promise(resolve => setTimeout(resolve, 500)); // 动画延迟
      }
    }

    console.log("✅ 可视化剪辑动画完成");
    return { success: true, type: 'visual' };
  },

  // 🚀 后台执行一键剪辑逻辑（生成最终结果）
  performOneClickEditingInBackground: async () => {
    const { currentEditingPlan } = get();
    if (!currentEditingPlan) return null;

    console.log("🚀 开始后台一键剪辑处理");

    const timelineStore = useTimelineStore.getState();
    const mediaStore = useMediaStore.getState();
    const projectStore = useProjectStore.getState();

    // 创建临时的时间轴状态（不影响当前显示）
    const tempTimelineState = {
      tracks: [],
      elements: [] as any[]
    };

    // 清空临时时间轴
    const mainTrackId = "temp-main-track";
    let currentPosition = 0;

    // 🎬 快速处理所有视频片段
    for (let i = 0; i < currentEditingPlan.timeline_clips.length; i++) {
      const clip = currentEditingPlan.timeline_clips[i];

      try {
        // 🎬 快速下载视频
        console.log(`🚀 后台下载视频: ${clip.sequence_clip_id}`);
        const response = await fetch(clip.video_url);
        const blob = await response.blob();
        const file = new File([blob], `${clip.sequence_clip_id}.mp4`, { type: "video/mp4" });

        // 🎬 生成缩略图
        let thumbnailUrl: string | undefined;
        try {
          const { generateVideoThumbnail } = await import('@/stores/media-store');
          const thumbnailData = await generateVideoThumbnail(file);
          thumbnailUrl = thumbnailData.thumbnailUrl;
        } catch (error) {
          console.warn(`⚠️ 生成缩略图失败: ${clip.sequence_clip_id}`, error);
        }

        // 🎬 添加到媒体库
        if (!projectStore.activeProject) {
          throw new Error("没有活动项目");
        }

        const mediaItem = await mediaStore.addMediaItem(projectStore.activeProject.id, {
          name: `一键剪辑-${clip.sequence_clip_id}`,
          type: "video" as const,
          file: file,
          url: clip.video_url,
          thumbnailUrl: thumbnailUrl,
          duration: durationToSeconds(clip.clip_duration_in_sequence),
          width: 1920,
          height: 1080,
        });

        // 🎬 添加到临时时间轴
        const sequenceStartSeconds = timecodeToSeconds(clip.sequence_start_timecode);
        tempTimelineState.elements.push({
          id: `temp-element-${i}`,
          type: "media",
          name: `一键剪辑-${clip.sequence_clip_id}`,
          mediaId: mediaItem.id,
          duration: durationToSeconds(clip.clip_duration_in_sequence),
          startTime: sequenceStartSeconds,
          trimStart: 0,
          trimEnd: 0,
          muted: false,
          horizontalFlip: false,
        });

        currentPosition = Math.max(currentPosition, sequenceStartSeconds + durationToSeconds(clip.clip_duration_in_sequence));

      } catch (error) {
        console.error(`❌ 后台处理片段失败: ${clip.sequence_clip_id}`, error);
      }
    }

    console.log("✅ 后台一键剪辑处理完成");
    return {
      success: true,
      type: 'oneclick',
      elements: tempTimelineState.elements,
      totalDuration: currentPosition
    };
  },

  // 🎯 将一键剪辑结果应用到时间轴
  applyOneClickResultToTimeline: async (oneClickResult: any) => {
    if (!oneClickResult || !oneClickResult.success) {
      console.warn("⚠️ 一键剪辑结果无效，跳过应用");
      return;
    }

    console.log("🎯 开始应用一键剪辑结果到时间轴");

    const timelineStore = useTimelineStore.getState();

    // 清空当前时间轴
    timelineStore.clearTimeline();

    // 创建新的主轨道
    const mainTrackId = timelineStore.findOrCreateTrack("media");

    // 添加所有一键剪辑的元素
    oneClickResult.elements.forEach((element: any, index: number) => {
      try {
        timelineStore.addElementToTrack(mainTrackId, element);
        console.log(`✅ 应用元素 ${index + 1}: ${element.name}`);
      } catch (error) {
        console.error(`❌ 应用元素失败 ${index + 1}:`, error);
      }
    });

    // 添加字幕
    console.log("🎯 开始添加AI字幕到最终时间轴...");
    await get().addAISubtitles();

    // 验证字幕是否成功添加
    const finalTracks = useTimelineStore.getState().tracks;
    const textTracks = finalTracks.filter(track => track.type === "text");
    const totalSubtitles = textTracks.reduce((sum, track) => sum + track.elements.length, 0);
    console.log(`🔍 字幕添加验证: 找到 ${textTracks.length} 个文本轨道，共 ${totalSubtitles} 个字幕元素`);

    // 🎯 修复：简化字幕验证，如果失败就记录日志，不再尝试备用方案避免重复添加
    if (totalSubtitles === 0) {
      console.warn("⚠️ 字幕添加失败，请检查AI数据中是否包含字幕信息");
    } else {
      console.log(`✅ 字幕添加成功: ${totalSubtitles} 个字幕元素`);
    }

    console.log("✅ 一键剪辑结果已成功应用到时间轴");
  },

  // 🎬 在原视频上执行可视化剪辑操作
  performVisualEditingOnOriginalVideo: async () => {
    const { currentEditingPlan, originalVideoTrackId } = get();
    if (!currentEditingPlan || !originalVideoTrackId) return;

    const timelineStore = useTimelineStore.getState();
    const playbackStore = usePlaybackStore.getState();

    // 获取原视频轨道和元素
    const originalTrack = timelineStore.tracks.find(t => t.id === originalVideoTrackId);
    if (!originalTrack || originalTrack.elements.length === 0) {
      console.warn("未找到原视频轨道或元素");
      await get().performDirectVideoEditing();
      return;
    }

    console.log("🎬 开始在原视频上执行可视化剪辑");

    // 创建新的剪辑轨道
    const editTrackId = timelineStore.findOrCreateTrack("media");
    let currentEditPosition = 0;

    // 🎬 逐个处理剪辑片段
    for (let i = 0; i < currentEditingPlan.timeline_clips.length; i++) {
      const clip = currentEditingPlan.timeline_clips[i];
      const clipDuration = durationToSeconds(clip.clip_duration_in_sequence);

      // 🎯 从AI计划中提取时间码信息
      const sourceInSeconds = timecodeToSeconds(clip.source_in_timecode);
      const sourceOutSeconds = timecodeToSeconds(clip.source_out_timecode);
      const sequenceStartSeconds = timecodeToSeconds(clip.sequence_start_timecode);

      set({
        executionProgress: 15 + (i / currentEditingPlan.timeline_clips.length) * 70,
        currentProcessingClip: `剪辑片段 ${i + 1}/${currentEditingPlan.timeline_clips.length}: ${clip.sequence_clip_id}`
      });

      // 🎬 优化：快速执行剪辑操作，减少延迟
      const startTime = i * clipDuration; // 简化：假设片段连续
      console.log(`🎯 处理片段 ${i + 1}: ${startTime.toFixed(2)}秒 - ${(startTime + clipDuration).toFixed(2)}秒`);
      console.log(`   源时间码: ${clip.source_in_timecode} - ${clip.source_out_timecode}`);
      console.log(`   序列时间码: ${clip.sequence_start_timecode}`);

      // 🎬 快速移动播放头
      playbackStore.seek(startTime);

      // 🎬 选择原视频元素
      const currentElement = originalTrack.elements[0];
      timelineStore.selectElement(originalVideoTrackId, currentElement.id);

      // 🎬 执行剪切操作
      const endTime = startTime + clipDuration;

      // 起始剪切
      if (startTime > currentElement.startTime && startTime < currentElement.startTime + currentElement.duration) {
        const newElementId = timelineStore.splitElement(originalVideoTrackId, currentElement.id, startTime);
        if (newElementId) {
          console.log(`✅ 起始剪切成功，新元素ID: ${newElementId}`);
        }
      }

      // 结束剪切
      const updatedTrack = timelineStore.tracks.find(t => t.id === originalVideoTrackId);
      const elementAtPosition = updatedTrack?.elements.find(el =>
        endTime > el.startTime && endTime < el.startTime + el.duration
      );
      if (elementAtPosition) {
        timelineStore.splitElement(originalVideoTrackId, elementAtPosition.id, endTime);
        console.log(`✅ 结束剪切成功`);
      }

      // 🎬 移动片段到剪辑轨道
      const finalTrack = timelineStore.tracks.find(t => t.id === originalVideoTrackId);
      const targetElement = finalTrack?.elements.find(el =>
        Math.abs(el.startTime - startTime) < 0.5 && // 找到起始时间匹配的元素
        (el.startTime + el.duration - el.trimStart - el.trimEnd) <= endTime + 0.5
      );

      if (targetElement) {
        console.log(`📦 移动片段到剪辑轨道: ${clip.sequence_clip_id}`);
        console.log(`   源时间范围: ${sourceInSeconds.toFixed(2)}s - ${sourceOutSeconds.toFixed(2)}s`);
        console.log(`   目标序列位置: ${sequenceStartSeconds.toFixed(2)}s`);

        // 🎯 计算正确的裁剪参数（相对于原始媒体文件）
        const trimStart = sourceInSeconds;
        const trimEnd = Math.max(0, targetElement.duration - sourceOutSeconds);

        // 复制元素到新轨道，使用AI计划中的精确位置
        timelineStore.addElementToTrack(editTrackId, {
          type: "media",
          name: `AI剪辑-${clip.sequence_clip_id}`,
          mediaId: (targetElement as any).mediaId,
          duration: clipDuration, // 使用AI计划中的片段时长
          startTime: sequenceStartSeconds, // 🎯 使用AI计划中指定的序列位置，不是累加位置
          trimStart: trimStart, // 正确的开始裁剪位置
          trimEnd: trimEnd,     // 正确的结束裁剪位置
          muted: false,
          horizontalFlip: false,
        });

        // 从原轨道删除已使用的片段
        timelineStore.removeElementFromTrack(originalVideoTrackId, targetElement.id);

        // 更新当前位置
        currentEditPosition = Math.max(currentEditPosition, sequenceStartSeconds + clipDuration);
      }

      // 🚀 优化：只保留必要的UI更新延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log(`✅ 片段 ${i + 1} 处理完成`);
    }

    // 🎬 快速清理剩余的原视频片段
    console.log("🧹 清理剩余原视频片段");

    // 🎯 修复：移除可视化动画中的字幕添加，字幕将在最终的applyOneClickResultToTimeline中统一添加
    console.log("📝 可视化动画完成，字幕将在最终结果应用时添加");
  },

  // 🎬 直接视频剪辑（当没有原视频时）
  performDirectVideoEditing: async () => {
    const { currentEditingPlan } = get();
    if (!currentEditingPlan) return;

    const timelineStore = useTimelineStore.getState();
    const mediaStore = useMediaStore.getState();
    const projectStore = useProjectStore.getState();

    // 清空时间轴
    timelineStore.clearTimeline();

    // 创建主轨道
    const mainTrackId = timelineStore.findOrCreateTrack("media");
    let directEditingPosition = 0;

    // 🎬 优化：快速处理视频片段，减少不必要延迟
    for (let i = 0; i < currentEditingPlan.timeline_clips.length; i++) {
      const clip = currentEditingPlan.timeline_clips[i];

      set({
        executionProgress: 15 + (i / currentEditingPlan.timeline_clips.length) * 70,
        currentProcessingClip: `处理片段 ${i + 1}/${currentEditingPlan.timeline_clips.length}: ${clip.sequence_clip_id}`
      });

      try {
        // 🎬 步骤1：快速下载视频
        console.log(`📥 下载视频: ${clip.sequence_clip_id}`);

        const response = await fetch(clip.video_url);
        const blob = await response.blob();
        const file = new File([blob], `${clip.sequence_clip_id}.mp4`, { type: "video/mp4" });

        // 🎬 步骤2：添加到媒体库
        console.log(`📚 添加到媒体库: ${clip.sequence_clip_id}`);

        if (!projectStore.activeProject) {
          throw new Error("没有活动项目");
        }

        const mediaItem = await mediaStore.addMediaItem(projectStore.activeProject.id, {
          name: `AI剪辑-${clip.sequence_clip_id}`,
          type: "video" as const,
          file: file,
          duration: durationToSeconds(clip.clip_duration_in_sequence),
          width: 1920,
          height: 1080,
        });

        // 🎬 步骤3：添加到时间轴
        console.log(`🎬 添加到时间轴: ${clip.sequence_clip_id}`);

        const clipDuration = durationToSeconds(clip.clip_duration_in_sequence);

        timelineStore.addElementToTrack(mainTrackId, {
          type: "media",
          name: `AI剪辑-${clip.sequence_clip_id}`,
          mediaId: mediaItem.id,
          duration: mediaItem.duration || clipDuration,
          startTime: directEditingPosition,
          trimStart: 0,
          trimEnd: 0,
          muted: false,
          horizontalFlip: false,
        });

        directEditingPosition += clipDuration;

        // 🚀 优化：减少延迟，只保留必要的UI更新时间
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ 处理片段失败: ${clip.sequence_clip_id}`, error);
        // 继续处理下一个片段
      }
    }

    // 🎯 修复：移除直接剪辑中的字幕添加，字幕将在最终的applyOneClickResultToTimeline中统一添加
    console.log("📝 直接剪辑完成，字幕将在最终结果应用时添加");
  },

  // 🎬 添加AI字幕
  addAISubtitles: async () => {
    set({ executionProgress: 90, currentProcessingClip: "添加AI字幕..." });

    const { aiEditingData, currentEditingPlan } = get();

    console.log("🔍 检查字幕添加条件:");
    console.log("  - aiEditingData存在:", !!aiEditingData);
    console.log("  - finalized_dialogue_track存在:", !!aiEditingData?.editing_plan?.finalized_dialogue_track);
    console.log("  - currentEditingPlan存在:", !!currentEditingPlan);

    // 🎯 修复：放宽条件判断，优先检查字幕数据是否存在
    if (aiEditingData?.editing_plan?.finalized_dialogue_track) {
      try {
        const subtitleData = extractSubtitleDataFromAIEditing(aiEditingData);
        if (subtitleData) {
          console.log("📝 发现字幕数据，开始处理...");

          const { parseDialogueTrackToTextElements } = await import('@/lib/subtitle-parser');
          const originalTextElements = parseDialogueTrackToTextElements(subtitleData);

          if (originalTextElements && originalTextElements.length > 0) {
            console.log(`📝 解析出 ${originalTextElements.length} 个原始字幕元素`);

            let finalTextElements = originalTextElements;

            // 🎯 修复：对于可视化剪辑，直接使用原始字幕时间码，不进行调整
            // 因为一键剪辑结果已经按照AI计划的时间码排列了视频片段
            console.log("📝 使用原始字幕时间码，不进行时间码调整（适配一键剪辑结果）");
            // 注释掉时间码调整逻辑，避免字幕与视频不匹配
            // if (currentEditingPlan) {
            //   finalTextElements = get().adjustSubtitleTimingForEditingPlan(originalTextElements, currentEditingPlan);
            // }

            const { createSubtitleTrackWithElements } = await import('@/lib/ai-subtitle-integration');
            const trackId = createSubtitleTrackWithElements(finalTextElements, "AI字幕");

            if (trackId) {
              console.log(`✅ AI字幕已成功添加到时间轴，共 ${finalTextElements.length} 条字幕`);
              toast.success(`成功添加 ${finalTextElements.length} 条AI字幕到时间轴`);
            } else {
              console.error("❌ 字幕轨道创建失败");
              toast.error("字幕轨道创建失败");
            }
          } else {
            console.warn("⚠️ 没有解析出有效的字幕元素");
          }
        } else {
          console.warn("⚠️ 无法提取字幕数据");
        }
      } catch (error) {
        console.error("❌ 添加AI字幕失败:", error);
        toast.error("添加AI字幕失败");
      }
    } else {
      console.warn("⚠️ AI剪辑数据中没有字幕数据");
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  },

  // 🎯 确保字幕已添加（额外保障机制）
  ensureSubtitlesAdded: async () => {
    console.log("🔍 备用方案：强制重新添加字幕...");

    const { aiEditingData } = get();
    if (aiEditingData?.editing_plan?.finalized_dialogue_track) {
      try {
        const { addAISubtitlesToTimeline } = await import('@/lib/ai-subtitle-integration');
        const success = addAISubtitlesToTimeline(aiEditingData);

        if (success) {
          console.log("✅ 字幕重新添加成功");
        } else {
          console.warn("⚠️ 字幕重新添加失败");
        }
      } catch (error) {
        console.error("❌ 字幕重新添加过程中出错:", error);
      }
    } else {
      console.warn("⚠️ 没有可用的字幕数据");
    }
  },

  // 🎯 新增：根据剪辑计划调整字幕时间码
  adjustSubtitleTimingForEditingPlan: (textElements: any[], editingPlan: any) => {
    console.log(`🎬 开始调整字幕时间码，原始字幕数量: ${textElements.length}`);

    // 打印剪辑计划的时间范围信息用于调试
    console.log("📊 剪辑计划片段时间范围:");
    editingPlan.timeline_clips.forEach((clip: any, index: number) => {
      const sourceInSeconds = timecodeToSeconds(clip.source_in_timecode);
      const sourceOutSeconds = timecodeToSeconds(clip.source_out_timecode);
      const sequenceStartSeconds = timecodeToSeconds(clip.sequence_start_timecode);
      console.log(`  片段 ${index + 1}: 源时间 ${sourceInSeconds.toFixed(2)}s-${sourceOutSeconds.toFixed(2)}s -> 序列时间 ${sequenceStartSeconds.toFixed(2)}s`);
    });

    const adjustedElements = textElements.map(element => {
      console.log(`🔍 处理字幕: "${element.content.substring(0, 30)}..." 时间: ${element.startTime.toFixed(2)}s`);

      // 找到包含这个字幕时间的视频片段
      const containingClip = editingPlan.timeline_clips.find((clip: any) => {
        const sourceInSeconds = timecodeToSeconds(clip.source_in_timecode);
        const sourceOutSeconds = timecodeToSeconds(clip.source_out_timecode);

        // 检查字幕是否在这个片段的源时间范围内
        const isInRange = element.startTime >= sourceInSeconds && element.startTime < sourceOutSeconds;

        if (isInRange) {
          console.log(`  ✅ 找到匹配片段: ${sourceInSeconds.toFixed(2)}s-${sourceOutSeconds.toFixed(2)}s`);
        }

        return isInRange;
      });

      if (containingClip) {
        // 计算字幕在源视频中的相对位置
        const sourceInSeconds = timecodeToSeconds(containingClip.source_in_timecode);
        const sequenceStartSeconds = timecodeToSeconds(containingClip.sequence_start_timecode);

        // 计算字幕在源片段中的偏移量
        const offsetInClip = element.startTime - sourceInSeconds;

        // 计算字幕在最终序列中的新时间
        const newStartTime = sequenceStartSeconds + offsetInClip;

        console.log(`📝 调整字幕: "${element.content.substring(0, 30)}..." 从 ${element.startTime.toFixed(2)}s 调整到 ${newStartTime.toFixed(2)}s`);

        return {
          ...element,
          startTime: newStartTime
        };
      } else {
        // 如果找不到对应的片段，可能这个字幕不在剪辑计划中，跳过
        console.warn(`⚠️ 字幕 "${element.content.substring(0, 30)}..." 在时间 ${element.startTime.toFixed(2)}s 找不到对应的视频片段，跳过`);
        return null;
      }
    }).filter(element => element !== null);

    console.log(`✅ 字幕时间码调整完成，调整后字幕数量: ${adjustedElements.length}`);
    return adjustedElements;
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
      isShowingOriginalVideo: false,
      originalVideoTrackId: null,
      visualEditingState: 'idle',
      currentEditingStep: null,
      editingSteps: [],
    });
  },

  // 新增：在时间轴显示所有原始视频（高性能并行版本）
  showOriginalVideoInTimeline: async () => {
    const { currentEditingPlan } = get();
    if (!currentEditingPlan) {
      toast.error("没有可用的剪辑计划");
      return;
    }

    set({ visualEditingState: 'showing-original' });

    try {
      const timelineStore = useTimelineStore.getState();
      const mediaStore = useMediaStore.getState();

      // 清空现有时间轴
      timelineStore.clearTimeline();

      // 创建原始视频轨道
      const originalTrackId = timelineStore.findOrCreateTrack("media");

      const allClips = currentEditingPlan.timeline_clips;
      console.log(`🚀 开始并行处理 ${allClips.length} 个视频片段`);

      if (allClips.length === 0) {
        toast.error("没有找到视频片段");
        return;
      }

      // 🚀 性能优化1：并行处理所有视频的元数据获取
      console.log(`⚡ 并行获取 ${allClips.length} 个视频的元数据...`);

      const videoProcessingPromises = allClips.map(async (clip, index) => {
        try {
          const { duration, thumbnail } = await get().getVideoMetadataOptimized(clip.video_url, index);
          return {
            clip,
            index,
            duration,
            thumbnail,
            success: true
          };
        } catch (error) {
          console.warn(`⚠️ 视频 ${index + 1} 元数据获取失败:`, error);
          return {
            clip,
            index,
            duration: 120, // 默认时长
            thumbnail: generateDefaultVideoThumbnail(index),
            success: false
          };
        }
      });

      // 等待所有视频元数据并行获取完成
      const videoResults = await Promise.all(videoProcessingPromises);
      console.log(`✅ 所有视频元数据获取完成，成功: ${videoResults.filter(r => r.success).length}/${videoResults.length}`);

      // 🚀 性能优化2：批量创建媒体项和时间轴元素
      const mediaItems: any[] = [];
      const timelineElements: any[] = [];
      let currentTimelinePosition = 0;

      videoResults.forEach(({ clip, index, duration, thumbnail }) => {
        // 创建媒体项
        const mediaItem = {
          id: `original-video-${clip.sequence_clip_id}-${Date.now()}-${index}`,
          name: `原视频-${clip.sequence_clip_id} (${clip.source_clip_id})`,
          type: "video" as const,
          url: clip.video_url,
          duration: duration,
          width: 1920,
          height: 1080,
          fps: 30,
          thumbnailUrl: thumbnail,
          file: null,
        };

        mediaItems.push(mediaItem);

        // 创建时间轴元素
        const timelineElement = {
          type: "media",
          name: mediaItem.name,
          mediaId: mediaItem.id,
          duration: duration,
          startTime: currentTimelinePosition,
          trimStart: 0,
          trimEnd: 0,
          muted: false,
          horizontalFlip: false,
        };

        timelineElements.push(timelineElement);
        currentTimelinePosition += duration;

        console.log(`📋 准备视频 ${index + 1}: ${clip.sequence_clip_id}, 时长: ${duration.toFixed(1)}s`);
      });

      // 🚀 性能优化3：批量添加媒体项到store并保存到持久化存储
      console.log(`⚡ 批量添加 ${mediaItems.length} 个媒体项到媒体库...`);

      const { activeProject } = useProjectStore.getState();
      if (!activeProject) {
        throw new Error("没有活动项目");
      }

      // 并行保存所有媒体项到持久化存储
      const savePromises = mediaItems.map(async (mediaItem) => {
        try {
          // 先添加到本地状态
          mediaStore.addMediaItemDirect(mediaItem);
          // 然后保存到持久化存储
          await storageService.saveMediaItem(activeProject.id, mediaItem);
          console.log(`✅ 媒体项已保存: ${mediaItem.name}`);
          return mediaItem;
        } catch (error) {
          console.error(`❌ 保存媒体项失败: ${mediaItem.name}`, error);
          // 如果保存失败，从本地状态移除
          const currentItems = mediaStore.mediaItems.filter(item => item.id !== mediaItem.id);
          mediaStore.clearAllMedia();
          currentItems.forEach(item => mediaStore.addMediaItemDirect(item));
          return null;
        }
      });

      const savedMediaItems = await Promise.all(savePromises);
      const successfulItems = savedMediaItems.filter(item => item !== null);
      console.log(`✅ 成功保存 ${successfulItems.length}/${mediaItems.length} 个媒体项`);

      // 🚀 性能优化4：批量添加时间轴元素（一次性更新，避免多次重新渲染）
      console.log(`⚡ 批量添加 ${timelineElements.length} 个元素到时间轴...`);
      timelineStore.addElementsToTrackBatch(originalTrackId, timelineElements);

      console.log(`🎉 高性能并行处理完成！总时长: ${currentTimelinePosition.toFixed(1)}秒`);

      set({
        isShowingOriginalVideo: true,
        originalVideoTrackId: originalTrackId,
        visualEditingState: 'idle' // 🔧 修复：完成后重置状态
      });

      // 🎯 统计信息
      const uniqueUrls = new Set(allClips.map(clip => clip.video_url)).size;
      const totalAIPlanDuration = allClips.reduce((sum, clip) => sum + durationToSeconds(clip.clip_duration_in_sequence), 0);

      console.log(`📊 原视频显示统计:`, {
        totalClips: allClips.length,
        uniqueVideos: uniqueUrls,
        duplicateClips: allClips.length - uniqueUrls,
        originalVideosTotalDuration: currentTimelinePosition.toFixed(1),
        aiPlanTotalDuration: totalAIPlanDuration.toFixed(1),
        note: "显示的是完整原视频，不是剪辑后的片段"
      });

      toast.success(`✅ 已显示所有 ${mediaItems.length} 个完整原视频 (${uniqueUrls} 个不同视频，原视频总时长: ${currentTimelinePosition.toFixed(1)}秒)`);

    } catch (error) {
      console.error("显示原始视频失败:", error);
      toast.error(`显示原始视频失败: ${error instanceof Error ? error.message : '未知错误'}`);
      set({
        visualEditingState: 'idle',
        isShowingOriginalVideo: false // 🔧 修复：出错时也要重置状态
      });
    }
  },



  // 新增：更新剪辑步骤状态
  updateEditingStep: (stepId: string, status: 'pending' | 'executing' | 'completed') => {
    set((state) => ({
      editingSteps: state.editingSteps.map(step =>
        step.id === stepId ? { ...step, status } : step
      ),
      currentEditingStep: status === 'executing' ? stepId : state.currentEditingStep
    }));
  },

  // 生成Mock数据
  generateMockData: (projectId: string): AIEditingData => {
    return generateAIEditingMockData(projectId);
  },

  // 🚀 高性能视频元数据获取（优化版本）
  getVideoMetadataOptimized: async (videoUrl: string, index: number) => {
    return new Promise<{duration: number, thumbnail: string}>((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        video.remove();
        canvas.remove();
        reject(new Error('视频加载超时'));
      }, 8000); // 8秒超时，比原来更短

      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true; // 静音以避免音频问题

      video.onloadedmetadata = () => {
        try {
          clearTimeout(timeoutId);
          const duration = video.duration;

          // 设置canvas尺寸
          canvas.width = 320;
          canvas.height = 180;

          // 跳转到指定时间生成缩略图
          const thumbnailTime = Math.min(1 + (index * 0.2), duration - 0.1);
          video.currentTime = thumbnailTime;

          video.onseeked = () => {
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

              // 清理
              video.remove();
              canvas.remove();

              resolve({ duration, thumbnail });
            } catch (error) {
              clearTimeout(timeoutId);
              video.remove();
              canvas.remove();
              reject(error);
            }
          };
        } catch (error) {
          clearTimeout(timeoutId);
          video.remove();
          canvas.remove();
          reject(error);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        video.remove();
        canvas.remove();
        reject(new Error('视频加载失败'));
      };

      video.src = videoUrl;
    });
  },
}));
