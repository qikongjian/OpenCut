// backend-exporter.ts - 后端导出客户端
// 此文件负责与后端导出API通信
// 文件路径: lib/export/backend-exporter.ts

import { TimelineIR } from "@/types/timeline";
import {
  ExportOptions,
  ExportProgress,
  ExportResult,
  ExportError
} from "@/types/export";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { useMediaStore } from "@/stores/media-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { ASSGenerator } from "@/lib/export/ass-generator";

/**
 * 后端导出客户端
 */
export class BackendExporter {
  private isExporting = false;
  private currentProgress: ExportProgress = {
    overall: 0,
    stage: 'preparing',
    elapsedTime: 0,
    startTime: Date.now(),
  };
  private abortController: AbortController | null = null;

  /**
   * 导出视频（简单模式）
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
      this.updateProgress({ message: '连接到服务器...' });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ir, options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      this.updateProgress({ 
        stage: 'finalizing', 
        overall: 0.9, 
        message: '下载结果文件...' 
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      this.updateProgress({ overall: 1, message: '导出完成!' });

      return {
        success: true,
        blob,
        url,
        filename: `export_${Date.now()}.mp4`,
        size: blob.size,
        duration: (Date.now() - this.currentProgress.startTime) / 1000,
        quality: options.quality,
        method: 'backend',
      };

    } catch (error) {
      throw this.createExportError(error);
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * 流式导出（支持实时进度）
   */
  async exportWithProgress(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    this.isExporting = true;
    this.abortController = new AbortController();
    
    this.currentProgress = {
      overall: 0,
      stage: 'preparing',
      elapsedTime: 0,
      startTime: Date.now(),
    };

    try {
      return await this.streamExport(ir, options);
    } catch (error) {
      throw this.createExportError(error);
    } finally {
      this.isExporting = false;
      this.abortController = null;
    }
  }

  /**
   * 执行流式导出
   */
  private async streamExport(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🚀 Starting export process...');
      console.log('IR:', { videoCount: ir.video.length, duration: ir.duration, textCount: ir.texts.length });

      // 🚀 优先检查是否可以使用增量导出（利用本地已处理的视频）
      const aiClipsData = await this.checkForAIClips();
      if (aiClipsData) {
        console.log('🔍 Found AI clips data, checking for incremental export opportunity...');

        try {
          // 检查时间轴是否有本地处理的视频文件
          const timelineStore = useTimelineStore.getState();
          const mediaStore = useMediaStore.getState();

          console.log('🔍 Starting media data collection...');
          const processedMediaData = await this.collectProcessedMediaData(ir, mediaStore);
          const localFilesCount = processedMediaData.filter(m => m.hasLocalFile && m.type === 'video').length;

          console.log('📊 Local files analysis:', {
            totalVideoElements: ir.video.length,
            localFilesCount,
            processedDataLength: processedMediaData.length,
            canUseIncremental: localFilesCount > 0
          });

          // 如果有本地文件，优先使用增量导出
          if (localFilesCount > 0) {
            console.log('⚡ Using incremental AI export (local files detected)');
            return this.streamExportIncrementalAI(aiClipsData, options);
          } else {
            console.log('🌐 Using standard AI clips export (no local files)');
            return this.streamExportAIClips(aiClipsData, options);
          }
        } catch (error) {
          console.error('❌ Error during media data collection:', error);
          console.log('🔄 Falling back to standard AI clips export');
          return this.streamExportAIClips(aiClipsData, options);
        }
      }

      // 其次尝试使用文件上传API来获取真实视频内容
      const hasRealVideoFiles = await this.checkForRealVideoFiles(ir);
      if (hasRealVideoFiles) {
        console.log('✅ Using upload API for real video files');
        return this.streamExportWithFiles(ir, options);
      } else {
        console.log('✅ Using standard API (test videos)');
        return this.streamExportStandard(ir, options);
      }
    } catch (error) {
      console.error('❌ Export process failed:', error);
      throw error;
    }
  }

  /**
   * 检查是否为AI剪辑（优先级最高）
   * 增强版：同时检查时间轴状态，优化导出策略
   */
  private async checkForAIClips(): Promise<any | null> {
    try {
      console.log('🔍 Checking for AI clips...');
      const aiEditingStore = useAIEditingStore.getState();
      const timelineStore = useTimelineStore.getState();

      console.log('AI editing store state:', {
        hasCurrentEditingPlan: !!aiEditingStore.currentEditingPlan,
        planKeys: aiEditingStore.currentEditingPlan ? Object.keys(aiEditingStore.currentEditingPlan) : []
      });

      // 检查是否有AI剪辑计划数据
      if (aiEditingStore.currentEditingPlan &&
          aiEditingStore.currentEditingPlan.timeline_clips &&
          aiEditingStore.currentEditingPlan.timeline_clips.length > 0) {

        console.log('✅ Found AI editing plan with', aiEditingStore.currentEditingPlan.timeline_clips.length, 'clips');

        // 🚀 新增：检查时间轴是否已有处理好的内容
        const timelineAnalysis = this.analyzeTimelineContent(timelineStore);
        console.log('📊 Timeline analysis:', timelineAnalysis);

        // 增强AI剪辑数据，包含时间轴状态
        const enhancedAIData = {
          ...aiEditingStore.currentEditingPlan,
          timelineState: timelineAnalysis,
          optimizationHints: {
            hasProcessedClips: timelineAnalysis.hasVideoElements,
            hasSubtitles: timelineAnalysis.hasTextElements,
            canUseIncrementalExport: timelineAnalysis.hasVideoElements && timelineAnalysis.hasTextElements,
            estimatedSpeedupFactor: timelineAnalysis.hasVideoElements ? 3.5 : 1.0
          }
        };

        console.log('🎯 Enhanced AI data with timeline optimization hints');
        return enhancedAIData;
      } else {
        console.log('❌ No AI editing plan found or no clips');
      }
    } catch (error) {
      console.error('❌ Failed to check AI clips:', error);
    }

    return null;
  }

  /**
   * 分析时间轴内容，为导出优化提供数据
   */
  private analyzeTimelineContent(timelineStore: any): {
    hasVideoElements: boolean;
    hasTextElements: boolean;
    hasAudioElements: boolean;
    totalElements: number;
    videoDuration: number;
    textDuration: number;
    canOptimize: boolean;
  } {
    let hasVideoElements = false;
    let hasTextElements = false;
    let hasAudioElements = false;
    let totalElements = 0;
    let videoDuration = 0;
    let textDuration = 0;

    for (const track of timelineStore.tracks) {
      totalElements += track.elements.length;

      for (const element of track.elements) {
        if (element.type === 'video' || element.type === 'media') {
          hasVideoElements = true;
          videoDuration += element.duration || 0;
        } else if (element.type === 'text') {
          hasTextElements = true;
          textDuration += element.duration || 0;
        } else if (element.type === 'audio') {
          hasAudioElements = true;
        }
      }
    }

    return {
      hasVideoElements,
      hasTextElements,
      hasAudioElements,
      totalElements,
      videoDuration,
      textDuration,
      canOptimize: hasVideoElements && totalElements > 0
    };
  }

  /**
   * 增量导出：利用时间轴已处理的内容
   * 这是性能优化的核心方法
   */
  private async streamExportIncrementalAI(aiPlan: any, options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('⚡ Starting incremental AI export...');

      const timelineStore = useTimelineStore.getState();
      const mediaStore = useMediaStore.getState();

      // 生成增强的IR，包含时间轴状态
      const ir = timelineStore.toIR();
      const assContent = ASSGenerator.generateASS(ir);

      // 🚀 关键优化：收集已处理的媒体数据
      const processedMediaData = await this.collectProcessedMediaData(ir, mediaStore);

      console.log('📊 Processed media analysis:', {
        totalVideoElements: ir.video.length,
        totalTextElements: ir.texts.length,
        processedFilesCount: processedMediaData.length,
        canSkipDownload: processedMediaData.filter(m => m.hasLocalFile).length
      });

      // 准备增量导出请求
      const incrementalRequestData = {
        exportType: 'incremental',
        timeline: {
          ir: ir,
          subtitles: assContent,
          totalDuration: ir.duration / 1000,
        },
        processedMedia: processedMediaData,
        aiPlan: {
          clips: aiPlan.timeline_clips,
          optimizationHints: aiPlan.optimizationHints
        },
        options: {
          quality: options.quality,
          width: ir.width || 1920,
          height: ir.height || 1080,
          fps: ir.fps || 30,
        },
      };

      console.log('🎯 Incremental export request prepared');

      // 使用 FormData 来传输文件和数据
      const formData = new FormData();

      // 添加基本数据（不包含文件）
      const requestDataWithoutFiles = {
        ...incrementalRequestData,
        processedMedia: incrementalRequestData.processedMedia.map(item => ({
          ...item,
          fileData: undefined // 移除文件数据，单独传输
        }))
      };

      formData.append('requestData', JSON.stringify(requestDataWithoutFiles));

      // 单独添加文件
      for (let i = 0; i < processedMediaData.length; i++) {
        const mediaItem = processedMediaData[i];
        if (mediaItem.hasLocalFile && mediaItem.fileData) {
          // 从 Base64 转换回 Blob
          const binaryString = atob(mediaItem.fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          const blob = new Blob([bytes], { type: 'video/mp4' });
          formData.append(`file_${mediaItem.elementId}`, blob, `${mediaItem.elementId}.mp4`);
        }
      }

      // 调用增量导出API
      const response = await fetch('/api/export/incremental', {
        method: 'POST',
        body: formData,
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        console.warn('⚠️ Incremental export failed, falling back to standard export');
        const timelineStore = useTimelineStore.getState();
        return this.streamExportStandard(timelineStore.toIR(), options);
      }

      return this.handleStreamResponseInternal(response);

    } catch (error) {
      console.error('❌ Incremental export failed:', error);
      console.log('🔄 Falling back to standard AI clips export');

      // 回退到标准导出
      const timelineStore = useTimelineStore.getState();
      return this.streamExportStandard(timelineStore.toIR(), options);
    }
  }

  /**
   * 收集已处理的媒体数据
   */
  private async collectProcessedMediaData(ir: TimelineIR, mediaStore: any): Promise<Array<{
    elementId: string;
    type: 'video' | 'audio' | 'text';
    hasLocalFile: boolean;
    isRemoteVideo?: boolean; // 标识是否为远程视频
    fileData?: string; // Base64 编码的文件数据
    metadata: any;
    timelinePosition: {
      start: number;
      duration: number;
      trackId: string;
    };
  }>> {
    console.log('🔍 collectProcessedMediaData started:', {
      videoElementsCount: ir.video.length,
      mediaItemsCount: mediaStore.mediaItems?.length || 0
    });

    const processedData: any[] = [];

    // 处理视频元素
    for (const videoElement of ir.video) {
      const mediaItem = mediaStore.mediaItems.find((item: any) =>
        item.url === videoElement.src || item.id === videoElement.id
      );

      console.log(`🔍 Processing video element ${videoElement.id}:`, {
        mediaItemFound: !!mediaItem,
        hasFile: !!mediaItem?.file,
        hasUrl: !!mediaItem?.url,
        url: mediaItem?.url,
        urlType: mediaItem?.url ? (
          mediaItem.url.startsWith('blob:') ? 'blob' :
          mediaItem.url.startsWith('http') ? 'remote' : 'other'
        ) : 'none'
      });

      let fileData: string | undefined;
      let isRemoteVideo = false;
      let hasValidFileData = false;

      // 🚀 修复1：优先处理blob URL（一键剪辑生成的本地文件）
      if (mediaItem?.url && mediaItem.url.startsWith('blob:')) {
        try {
          console.log(`📥 Fetching blob URL for ${videoElement.id}: ${mediaItem.url}`);
          const response = await fetch(mediaItem.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // 🚀 修复：避免Maximum call stack size exceeded
          // 分块处理大文件，避免展开操作符导致的栈溢出
          let binaryString = '';
          const chunkSize = 8192; // 8KB chunks
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          fileData = btoa(binaryString);
          hasValidFileData = true;
          console.log(`✅ Converted blob to Base64 for ${videoElement.id}: ${fileData.length} chars`);
        } catch (error) {
          console.warn(`⚠️ Failed to fetch blob URL for ${videoElement.id}:`, error);
        }
      }

      // 🚀 修复2：如果blob失败，尝试本地文件
      if (!hasValidFileData && mediaItem?.file) {
        try {
          console.log(`📁 Processing local file for ${videoElement.id}: ${mediaItem.file.name}`);
          const arrayBuffer = await mediaItem.file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // 🚀 修复：避免Maximum call stack size exceeded
          // 分块处理大文件，避免展开操作符导致的栈溢出
          let binaryString = '';
          const chunkSize = 8192; // 8KB chunks
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          fileData = btoa(binaryString);
          hasValidFileData = true;
          console.log(`✅ Converted local file to Base64 for ${videoElement.id}: ${fileData.length} chars`);
        } catch (error) {
          console.warn(`⚠️ Failed to convert file to Base64 for ${videoElement.id}:`, error);
        }
      }

      // 🚀 修复3：如果都失败，尝试远程URL
      if (!hasValidFileData && mediaItem?.url && mediaItem.url.startsWith('http')) {
        isRemoteVideo = true;
        try {
          console.log(`📥 Downloading remote video for ${videoElement.id}: ${mediaItem.url}`);
          const response = await fetch(mediaItem.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // 🚀 修复：避免Maximum call stack size exceeded
          // 分块处理大文件，避免展开操作符导致的栈溢出
          let binaryString = '';
          const chunkSize = 8192; // 8KB chunks
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          fileData = btoa(binaryString);
          hasValidFileData = true;
          console.log(`✅ Downloaded and converted remote video to Base64 for ${videoElement.id}: ${fileData.length} chars`);
        } catch (error) {
          console.warn(`⚠️ Failed to download and convert remote video for ${videoElement.id}:`, error);
          // 远程视频下载失败时，仍然传递URL给后端处理
          console.log(`🔄 Will pass remote URL to backend for ${videoElement.id}: ${mediaItem.url}`);
        }
      }

      // 🚀 修复4：智能判断文件类型和可用性
      const hasLocalFile = hasValidFileData || !!(mediaItem?.file) || (mediaItem?.url && mediaItem.url.startsWith('blob:'));
      const remoteUrl = isRemoteVideo ? mediaItem?.url : undefined;

      console.log(`📊 Video element ${videoElement.id} processing result:`, {
        hasLocalFile,
        hasValidFileData,
        isRemoteVideo,
        hasRemoteUrl: !!remoteUrl,
        fileDataLength: fileData?.length || 0
      });

      processedData.push({
        elementId: videoElement.id,
        type: 'video',
        hasLocalFile,
        isRemoteVideo,
        fileData,
        metadata: {
          src: videoElement.src,
          remoteUrl, // 添加远程URL
          in: videoElement.in,
          out: videoElement.out,
          transform: videoElement.transform,
          muted: videoElement.muted,
          width: mediaItem?.width,
          height: mediaItem?.height,
          duration: mediaItem?.duration,
          thumbnailUrl: mediaItem?.thumbnailUrl
        },
        timelinePosition: {
          start: videoElement.start,
          duration: (videoElement.out || 0) - (videoElement.in || 0),
          trackId: videoElement.trackId
        }
      });
    }

    // 处理音频元素
    for (const audioElement of ir.audio) {
      const mediaItem = mediaStore.mediaItems.find((item: any) =>
        item.url === audioElement.src || item.id === audioElement.id
      );

      let fileData: string | undefined;
      let isRemoteAudio = false;

      if (mediaItem?.file) {
        // 本地文件：转换为Base64
        try {
          const arrayBuffer = await mediaItem.file.arrayBuffer();
          // 转换为 Base64 字符串以便 JSON 序列化
          const uint8Array = new Uint8Array(arrayBuffer);

          // 🚀 修复：避免Maximum call stack size exceeded
          // 分块处理大文件，避免展开操作符导致的栈溢出
          let binaryString = '';
          const chunkSize = 8192; // 8KB chunks
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          fileData = btoa(binaryString);
          console.log(`✅ Converted local audio file to Base64 for ${audioElement.id}: ${fileData.length} chars`);
        } catch (error) {
          console.warn(`⚠️ Failed to convert audio file to Base64 for ${audioElement.id}:`, error);
        }
      } else if (mediaItem?.url && (mediaItem.url.startsWith('http') || mediaItem.url.startsWith('blob:'))) {
        // 远程音频：下载并转换为Base64
        isRemoteAudio = true;
        try {
          console.log(`📥 Downloading remote audio for ${audioElement.id}: ${mediaItem.url}`);
          const response = await fetch(mediaItem.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // 🚀 修复：避免Maximum call stack size exceeded
          // 分块处理大文件，避免展开操作符导致的栈溢出
          let binaryString = '';
          const chunkSize = 8192; // 8KB chunks
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          fileData = btoa(binaryString);
          console.log(`✅ Downloaded and converted remote audio to Base64 for ${audioElement.id}: ${fileData.length} chars`);
        } catch (error) {
          console.warn(`⚠️ Failed to download and convert remote audio for ${audioElement.id}:`, error);
          // 远程音频下载失败时，仍然传递URL给后端处理
          console.log(`🔄 Will pass remote URL to backend for ${audioElement.id}: ${mediaItem.url}`);
        }
      }

      processedData.push({
        elementId: audioElement.id,
        type: 'audio',
        hasLocalFile: !!(mediaItem?.file),
        isRemoteVideo: isRemoteAudio, // 复用字段名保持一致性
        fileData,
        metadata: {
          src: audioElement.src,
          remoteUrl: isRemoteAudio ? mediaItem?.url : undefined, // 添加远程URL
          in: audioElement.in,
          out: audioElement.out,
          gain: audioElement.gain
        },
        timelinePosition: {
          start: audioElement.start,
          duration: (audioElement.out || 0) - (audioElement.in || 0),
          trackId: audioElement.trackId
        }
      });
    }

    // 处理文本元素（字幕）
    for (const textElement of ir.texts) {
      processedData.push({
        elementId: textElement.id,
        type: 'text',
        hasLocalFile: true, // 文本总是"本地"的
        metadata: {
          text: textElement.text,
          style: textElement.style
        },
        timelinePosition: {
          start: textElement.start,
          duration: textElement.end - textElement.start,
          trackId: 'text'
        }
      });
    }

    return processedData;
  }

  /**
   * 处理流式响应（内部方法）
   */
  private async handleStreamResponseInternal(response: Response): Promise<ExportResult> {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let downloadUrl = '';
    let fileSize = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('📡 Received stream event:', data);

              this.handleStreamEvent(data);

              if (data.type === 'complete') {
                downloadUrl = data.downloadUrl;
                fileSize = data.fileSize;
                console.log('✅ Received complete event with download URL:', downloadUrl);
              }
            } catch (error) {
              console.warn('❌ Failed to parse stream data:', line, error);
            }
          }
        }
      }

      if (!downloadUrl) {
        throw new Error('No download URL received');
      }

      return {
        success: true,
        url: downloadUrl,
        size: fileSize,
        filename: `export_${Date.now()}.mp4`,
        format: 'mp4'
      };

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 检查是否有真实的视频文件
   */
  private async checkForRealVideoFiles(ir: TimelineIR): Promise<boolean> {
    const mediaStore = useMediaStore.getState();

    for (const video of ir.video) {
      const mediaItem = mediaStore.mediaItems.find(item =>
        item.url === video.src || item.id === video.id
      );

      if (mediaItem && mediaItem.file) {
        return true; // 找到至少一个真实文件
      }
    }

    return false;
  }

  /**
   * 使用文件上传的流式导出
   */
  private async streamExportWithFiles(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    const formData = new FormData();

    // 添加IR和选项数据
    formData.append('ir', JSON.stringify(ir));
    formData.append('options', JSON.stringify(options));

    // 添加视频文件
    const mediaStore = useMediaStore.getState();

    for (const video of ir.video) {
      const mediaItem = mediaStore.mediaItems.find(item =>
        item.url === video.src || item.id === video.id
      );

      if (mediaItem && mediaItem.file) {
        formData.append(`video_${video.id}`, mediaItem.file);
        console.log(`Added file for video ${video.id}:`, mediaItem.file.name);
      }
    }

    // 获取当前项目ID
    const currentProjectId = this.getCurrentProjectId();
    const uploadUrl = currentProjectId 
      ? `/api/export/upload?project_id=${currentProjectId}`
      : '/api/export/upload';
    
    console.log('📤 调用导出API:', uploadUrl);
    console.log('  - 项目ID:', currentProjectId || '未获取到');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal,
    });

    return this.processStreamResponse(response, options);
  }

  /**
   * 标准流式导出（不上传文件）
   */
  private async streamExportStandard(ir: TimelineIR, options: ExportOptions): Promise<ExportResult> {
    const response = await fetch('/api/export/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ir, options }),
      signal: this.abortController?.signal,
    });

    return this.processStreamResponse(response, options);
  }

  /**
   * AI剪辑快速导出 - 增强版
   * 支持增量导出和时间轴优化
   */
  private async streamExportAIClips(aiPlan: any, options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🚀 Starting enhanced AI clips export...');

      // 检查是否可以使用增量导出优化
      const canUseIncrementalExport = aiPlan.optimizationHints?.canUseIncrementalExport;
      const speedupFactor = aiPlan.optimizationHints?.estimatedSpeedupFactor || 1.0;

      console.log('🎯 Export optimization analysis:', {
        canUseIncremental: canUseIncrementalExport,
        speedupFactor,
        hasProcessedClips: aiPlan.optimizationHints?.hasProcessedClips,
        hasSubtitles: aiPlan.optimizationHints?.hasSubtitles
      });

      if (canUseIncrementalExport) {
        console.log('⚡ Using incremental export optimization');
        return this.streamExportIncrementalAI(aiPlan, options);
      }

      // 回退到标准AI剪辑导出
      console.log('📝 Generating subtitles...');
      const timelineStore = useTimelineStore.getState();
      const ir = timelineStore.toIR();
      const assContent = ASSGenerator.generateASS(ir);
      console.log('✅ Subtitles generated, length:', assContent.length);

      // 🚀 修复：从AI剪辑计划直接计算总时长，而不是依赖可能不准确的IR时长
      const totalDuration = aiPlan.timeline_clips.reduce((total: number, clip: any) => {
        // 使用source_in_timecode和source_out_timecode计算精确时长
        const startSeconds = this.timecodeToSeconds(clip.source_in_timecode);
        const endSeconds = this.timecodeToSeconds(clip.source_out_timecode);
        const clipDuration = endSeconds - startSeconds;
        console.log(`Clip ${clip.sequence_clip_id}: ${clipDuration.toFixed(3)}s (${clip.source_in_timecode} -> ${clip.source_out_timecode})`);
        return total + clipDuration;
      }, 0);

      console.log('⏱️ AI计划总时长:', totalDuration.toFixed(3), 'seconds');
      console.log('⏱️ IR计算时长:', (ir.duration / 1000).toFixed(3), 'seconds');
      console.log('⏱️ 时长差异:', Math.abs(totalDuration - ir.duration / 1000).toFixed(3), 'seconds');

      // 准备AI剪辑数据
      const requestData = {
        clips: aiPlan.timeline_clips.map((clip: any) => ({
          sequence_clip_id: clip.sequence_clip_id,
          video_url: clip.video_url,
          sequence_start_timecode: clip.sequence_start_timecode,
          source_in_timecode: clip.source_in_timecode,
          source_out_timecode: clip.source_out_timecode,
          clip_duration_in_sequence: clip.clip_duration_in_sequence,
        })),
        subtitles: assContent,
        totalDuration,
        options: {
          quality: options.quality,
          width: 1920,
          height: 1080,
          fps: 30,
        },
      };

      console.log('📦 AI clips export request prepared:', {
        clipsCount: requestData.clips.length,
        totalDuration,
        quality: options.quality,
        firstClipUrl: requestData.clips[0]?.video_url,
      });

      console.log('🌐 Sending request to /api/export/ai-clips...');
      const response = await fetch('/api/export/ai-clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: this.abortController?.signal,
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return this.processStreamResponse(response, options);
    } catch (error) {
      console.error('❌ AI clips export failed:', error);
      throw error;
    }
  }

  /**
   * 处理流式响应
   */
  private async processStreamResponse(response: Response, options?: ExportOptions): Promise<ExportResult> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let downloadUrl = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              await this.handleStreamEvent(data);
              
              if (data.type === 'complete' && data.downloadUrl) {
                downloadUrl = data.downloadUrl;
                console.log('🎯 Received download URL from SSE:', downloadUrl);
              }
            } catch (error) {
              console.warn('Failed to parse SSE data:', line, error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!downloadUrl) {
      throw new Error('No download URL received');
    }

    // 下载最终文件（带重试机制）
    this.updateProgress({
      stage: 'finalizing',
      overall: 0.95,
      message: '下载结果文件...'
    });

    let blob: Blob;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Attempting download (${retryCount + 1}/${maxRetries}):`, downloadUrl);
        const downloadResponse = await fetch(downloadUrl);
        console.log('📥 Download response:', {
          url: downloadUrl,
          status: downloadResponse.status,
          statusText: downloadResponse.statusText,
          ok: downloadResponse.ok,
        });

        if (!downloadResponse.ok) {
          throw new Error(`Download failed with status: ${downloadResponse.status}`);
        }

        blob = await downloadResponse.blob();
        console.log('✅ Blob created successfully:', {
          size: blob.size,
          type: blob.type,
        });
        break; // 成功，退出重试循环
      } catch (error) {
        retryCount++;
        console.warn(`Download attempt ${retryCount}/${maxRetries} failed:`, error);

        if (retryCount >= maxRetries) {
          throw new Error(`Failed to download result file after ${maxRetries} attempts: ${error}`);
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    console.log('🔗 Creating object URL for blob:', {
      blobSize: blob!.size,
      blobType: blob!.type,
    });

    let url: string;
    try {
      url = URL.createObjectURL(blob!);
      console.log('✅ Object URL created:', url);
    } catch (urlError) {
      console.error('❌ Failed to create object URL:', urlError);
      throw new Error(`Failed to create download URL: ${urlError}`);
    }

    this.updateProgress({ overall: 1, message: '导出完成!' });

    const result = {
      success: true,
      blob: blob!,
      url,
      filename: `export_${Date.now()}.mp4`,
      size: blob!.size,
      duration: (Date.now() - this.currentProgress.startTime) / 1000,
      quality: options?.quality || 'medium',
      method: 'backend' as const,
    };

    console.log('🎉 Export result prepared:', {
      success: result.success,
      filename: result.filename,
      size: result.size,
      duration: result.duration,
      method: result.method,
      urlLength: result.url.length,
    });

    return result;
  }

  /**
   * 处理流事件
   */
  private async handleStreamEvent(data: any): Promise<void> {
    switch (data.type) {
      case 'start':
        this.updateProgress({ 
          stage: 'preparing', 
          message: data.message,
          overall: 0,
        });
        break;

      case 'progress':
        this.updateProgress({
          stage: data.stage,
          message: data.message,
          overall: data.progress || this.currentProgress.overall,
          currentFile: data.currentFile,
          processedFrames: data.frames,
        });
        break;

      case 'info':
        // 更新详细信息但不改变主要进度
        if (this.currentProgress.onProgress) {
          this.currentProgress.onProgress({
            ...this.currentProgress,
            message: data.message,
          });
        }
        break;

      case 'complete':
        this.updateProgress({
          stage: 'finalizing',
          message: data.message,
          overall: 0.9,
        });
        break;

      case 'error':
        throw new Error(data.message || 'Unknown export error');

      default:
        console.log('Unknown stream event:', data);
    }
  }

  /**
   * 检查服务器健康状态
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    ffmpeg: boolean;
    message?: string;
  }> {
    try {
      const response = await fetch('/api/export', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: data.status === 'healthy',
          ffmpeg: data.ffmpeg === 'available',
          message: data.status,
        };
      } else {
        return {
          healthy: false,
          ffmpeg: false,
          message: `Server error: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        ffmpeg: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 估算导出时间
   */
  estimateExportTime(ir: TimelineIR, options: ExportOptions): number {
    const durationSeconds = ir.duration / 1000;
    
    // 基础处理时间（实时的0.2-0.5倍，取决于质量）
    let multiplier = 0.3;
    
    switch (options.quality) {
      case 'preview':
        multiplier = 0.2;
        break;
      case 'standard':
        multiplier = 0.3;
        break;
      case 'professional':
        multiplier = 0.5;
        break;
    }

    // GPU加速可以减少时间
    if (options.useGPU) {
      multiplier *= 0.6;
    }

    // 复杂度调整
    const complexity = this.calculateComplexity(ir);
    multiplier *= (1 + complexity / 100);

    return durationSeconds * multiplier;
  }

  /**
   * 计算项目复杂度
   */
  private calculateComplexity(ir: TimelineIR): number {
    let score = 0;
    
    score += ir.video.length * 5;
    score += ir.audio.length * 2;
    score += ir.texts.length * 3;
    score += ir.transitions.length * 10;
    
    // 分辨率复杂度
    const pixelCount = ir.width * ir.height;
    if (pixelCount >= 3840 * 2160) score += 30; // 4K
    else if (pixelCount >= 1920 * 1080) score += 15; // 1080p
    else if (pixelCount >= 1280 * 720) score += 5; // 720p

    return Math.min(100, score);
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
   * 创建导出错误
   */
  private createExportError(error: any): ExportError {
    return {
      code: 'BACKEND_EXPORT_ERROR',
      message: error.message || '后端导出失败',
      stage: this.currentProgress.stage,
      details: error,
      recoverable: true,
      suggestions: [
        '检查网络连接',
        '尝试前端导出',
        '减少项目复杂度',
        '联系技术支持',
      ],
      context: {
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

    if (this.abortController) {
      this.abortController.abort();
    }

    this.isExporting = false;
  }

  /**
   * 时间码转换为秒数
   */
  private timecodeToSeconds(timecode: string): number {
    if (!timecode || typeof timecode !== 'string') {
      console.warn('⚠️ 无效的时间码:', timecode);
      return 0;
    }

    try {
      const parts = timecode.split(':');

      if (parts.length === 3) {
        // HH:MM:SS.mmm 格式
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseFloat(parts[2]) || 0;

        // 验证数值范围
        if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
          console.warn('⚠️ 时间码数值超出有效范围:', timecode);
          return 0;
        }

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // 检测异常长的时间码（超过24小时）
        if (totalSeconds > 86400) {
          console.error('❌ 检测到异常长的时间码:', timecode, '转换结果:', totalSeconds, '秒');
          return 0;
        }

        return totalSeconds;
      } else {
        console.warn('⚠️ 不支持的时间码格式:', timecode);
        return 0;
      }
    } catch (error) {
      console.error('❌ 时间码转换失败:', timecode, error);
      return 0;
    }
  }

  /**
   * 获取当前项目ID
   */
  private getCurrentProjectId(): string | null {
    try {
      // 方法1: 从URL中获取项目ID
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        // 修复：同时支持 /editor/ 和 /ai-editor/ 路径
        const projectIdMatch = pathname.match(/\/(?:editor|ai-editor)\/([^\/]+)/);
        if (projectIdMatch) {
          const projectId = projectIdMatch[1];
          console.log('🔍 从URL获取项目ID:', projectId);
          return projectId;
        }
      }

      // 方法2: 从AI编辑store中获取项目ID
      try {
        const aiEditingStore = useAIEditingStore.getState();
        if (aiEditingStore.aiEditingData?.project_id) {
          const projectId = aiEditingStore.aiEditingData.project_id;
          console.log('🔍 从AI编辑store获取项目ID:', projectId);
          return projectId;
        }
      } catch (error) {
        console.warn('⚠️ 无法从AI编辑store获取项目ID:', error);
      }

      // 方法3: 从时间轴store中获取项目ID
      try {
        const timelineStore = useTimelineStore.getState();
        if (timelineStore.projectId) {
          console.log('🔍 从时间轴store获取项目ID:', timelineStore.projectId);
          return timelineStore.projectId;
        }
      } catch (error) {
        console.warn('⚠️ 无法从时间轴store获取项目ID:', error);
      }

      console.warn('⚠️ 无法获取项目ID，将使用导出ID作为替代');
      return null;
    } catch (error) {
      console.error('❌ 获取项目ID失败:', error);
      return null;
    }
  }
}
