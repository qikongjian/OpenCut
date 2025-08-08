// operations/timeline-export.ts - 时间轴导出核心功能

import { initFFmpeg } from '../core/init';
import { resetExportCancellation, checkCancellation, setExportInProgress } from '../utils/export-utils';
import { processAudioTracks } from './audio-ops';
import { applyTransitionEffects, applyMirrorEffects, applyMaskEffects, renderSubtitlesToVideo } from '../effects/video-effects';
import type { TimelineData, ExportConfig, ProgressCallback } from '../types/ffmpeg-types';

/**
 * 安全获取ArrayBuffer的辅助函数
 */
const getArrayBufferSafely = async (mediaFile: any): Promise<ArrayBuffer> => {
  console.log('🔍 Getting ArrayBuffer from media file:', {
    type: typeof mediaFile,
    constructor: mediaFile?.constructor?.name,
    hasArrayBuffer: typeof mediaFile?.arrayBuffer === 'function',
    hasStream: typeof mediaFile?.stream === 'function',
    size: mediaFile?.size,
    name: mediaFile?.name
  });

  // 如果是标准的File/Blob对象，直接调用arrayBuffer
  if (mediaFile && typeof mediaFile.arrayBuffer === 'function') {
    console.log('✅ Using standard arrayBuffer() method');
    return await mediaFile.arrayBuffer();
  }
  
  // 如果是Blob但没有arrayBuffer方法，尝试使用stream
  if (mediaFile && typeof mediaFile.stream === 'function') {
    console.log('✅ Using stream() method to get ArrayBuffer');
    const reader = mediaFile.stream().getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }
    
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  }
  
  // 如果有blob方法，说明可能是Response对象
  if (mediaFile && typeof mediaFile.blob === 'function') {
    console.log('✅ Converting Response to Blob first');
    const blob = await mediaFile.blob();
    return await blob.arrayBuffer();
  }
  
  // 如果是ArrayBuffer，直接返回
  if (mediaFile instanceof ArrayBuffer) {
    console.log('✅ Already an ArrayBuffer');
    return mediaFile;
  }
  
  // 如果是Uint8Array，返回其buffer的副本
  if (mediaFile instanceof Uint8Array) {
    console.log('✅ Converting Uint8Array to ArrayBuffer');
    return mediaFile.buffer.slice(0);
  }
  
  // 最后尝试：如果对象有size属性，尝试作为File处理
  if (mediaFile && mediaFile.size !== undefined) {
    console.log('⚠️ Attempting to treat as File-like object');
    try {
      const blob = new Blob([mediaFile]);
      return await blob.arrayBuffer();
    } catch (error) {
      console.error('Failed to create Blob from object:', error);
    }
  }
  
  console.error('❌ Cannot convert media file to ArrayBuffer:', mediaFile);
  throw new Error(`Cannot convert media file to ArrayBuffer. Type: ${typeof mediaFile}, Constructor: ${mediaFile?.constructor?.name}`);
};

/**
 * 获取媒体文件的通用函数
 */
const getMediaFileForElement = async (element: any): Promise<File> => {
  console.log(`🔍 Getting media file for element ${element.id}:`, {
    mediaId: element.mediaId,
    hasMediaFile: !!element.mediaFile,
    hasMediaUrl: !!element.mediaUrl,
    mediaType: element.mediaType
  });

  let mediaFile: File | null = null;

  // 优先使用元素中的媒体文件
  if (element.mediaFile) {
    console.log(`✅ Using element's media file for ${element.id}`);
    mediaFile = element.mediaFile;
  }
  // 其次使用元素中的媒体URL
  else if (element.mediaUrl) {
    console.log(`📥 Fetching media from URL for ${element.id}: ${element.mediaUrl.substring(0, 50)}...`);
    const response = await fetch(element.mediaUrl);
    const blob = await response.blob();
    mediaFile = new File([blob], `media.mp4`, { type: blob.type });
  }
  // 最后回退到媒体库中查找
  else {
    console.warn(`⚠️ Element ${element.id} missing media file, attempting to find in media store`);
    const mediaStore = await import('@/stores/media-store').then(m => m.useMediaStore.getState());
    const mediaItem = mediaStore.mediaItems.find(item => item.id === element.mediaId);

    console.log(`🔍 Media store lookup for ${element.mediaId}:`, {
      found: !!mediaItem,
      hasFile: mediaItem ? !!mediaItem.file : false,
      hasUrl: mediaItem ? !!mediaItem.url : false,
      totalItemsInStore: mediaStore.mediaItems.length
    });

    if (mediaItem && mediaItem.file) {
      console.log(`✅ Found media file in store for element ${element.id}`);
      mediaFile = mediaItem.file;
    } else if (mediaItem && mediaItem.url) {
      console.log(`📥 Found media URL in store for element ${element.id}`);
      const response = await fetch(mediaItem.url);
      const blob = await response.blob();
      mediaFile = new File([blob], `media.mp4`, { type: blob.type });
    } else {
      const availableMediaIds = mediaStore.mediaItems.map(item => item.id);
      throw new Error(`❌ No media file available for element ${element.id}. Element mediaId: ${element.mediaId}, found in store: ${!!mediaItem}, available media IDs: [${availableMediaIds.join(', ')}]`);
    }
  }

  if (!mediaFile) {
    throw new Error(`❌ Failed to get media file for element ${element.id}`);
  }

  console.log(`✅ Successfully got media file for element ${element.id}, size: ${mediaFile.size} bytes`);
  return mediaFile;
};

/**
 * 智能检测是否可以使用超快模式
 */
const canUseUltraFastMode = (timelineData: TimelineData, exportConfig: ExportConfig): boolean => {
  console.log('🔍 检测是否可以使用超快导出模式...');

  // 检查导出设置是否为默认值
  const hasCustomSettings =
    exportConfig.resolution !== '720p' ||
    exportConfig.quality !== 'medium' ||
    exportConfig.frameRate !== '30' ||
    exportConfig.format !== 'mp4';

  if (hasCustomSettings) {
    console.log('❌ 有自定义导出设置，无法使用超快模式');
    return false;
  }

  // 检查是否有特效元素
  const allElements = timelineData.tracks.flatMap((track: any) => track.elements);

  const hasTransitions = allElements.some((el: any) => el.type === 'transition');
  const hasTextElements = allElements.some((el: any) => el.type === 'text');
  const hasAudioElements = allElements.some((el: any) => el.type === 'media' && el.mediaType === 'audio');
  const hasMirrorEffects = allElements.some((el: any) => el.horizontalFlip || el.verticalFlip || el.rotation);
  const hasMaskEffects = allElements.some((el: any) => el.masks && el.masks.length > 0);
  const hasTrimming = allElements.some((el: any) => el.trimStart > 0 || el.trimEnd > 0);

  if (hasTransitions || hasTextElements || hasAudioElements || hasMirrorEffects || hasMaskEffects || hasTrimming) {
    console.log('❌ 检测到特效元素，无法使用超快模式:', {
      hasTransitions,
      hasTextElements,
      hasAudioElements,
      hasMirrorEffects,
      hasMaskEffects,
      hasTrimming
    });
    return false;
  }

  // 检查视频元素数量
  const videoElements = allElements.filter((el: any) => el.type === 'media' && el.mediaType === 'video');

  if (videoElements.length < 2) {
    console.log('❌ 视频数量少于2个，使用常规模式');
    return false;
  }

  console.log(`✅ 可以使用超快模式！检测到${videoElements.length}个纯视频元素`);
  return true;
};

/**
 * 高性能时间轴导出 - 优化版本
 */
export const exportTimeline = async (
  timelineData: TimelineData,
  exportConfig: ExportConfig,
  onProgress?: ProgressCallback
): Promise<Blob> => {
  console.log('🚀 Starting HIGH-PERFORMANCE timeline export...');
  
  // 检查是否已有导出进程在运行
  setExportInProgress(true);
  
  // 重置取消状态并开始新的导出
  resetExportCancellation();
  
  const startTime = performance.now();

  // 🧠 智能模式选择
  const allElements = timelineData.tracks.flatMap(track => track.elements);
  const mediaElements = allElements.filter(el => el.type === "media" && el.mediaType !== "audio");
  const textElements = allElements.filter(el => el.type === "text");
  const transitionElements = allElements.filter(el => el.type === "transition");
  const audioElements = allElements.filter(el => el.type === "media" && el.mediaType === "audio");

  // 详细分析AI剪辑元素
  const aiClipElements = mediaElements.filter(el => el.name && el.name.includes('AI剪辑'));
  const normalElements = mediaElements.filter(el => !el.name || !el.name.includes('AI剪辑'));
  
  console.log('📊 Performance Analysis:', {
    totalElements: allElements.length,
    mediaElements: mediaElements.length,
    aiClipElements: aiClipElements.length,
    normalElements: normalElements.length,
    hasEffects: textElements.length + transitionElements.length + audioElements.length > 0
  });

  // 🚀 智能处理策略选择
  const processingStrategy = determineProcessingStrategy(mediaElements, exportConfig);
  console.log('🎯 Processing Strategy:', processingStrategy);

  const ffmpeg = await initFFmpeg();
  const tempFiles: string[] = [];

  try {
    updateProgress(5);
    checkCancellation();

    // 如果没有媒体元素，直接返回错误
    if (mediaElements.length === 0) {
      throw new Error('No media elements found in timeline');
    }

    updateProgress(10);

    // 🚀 高性能视频处理
    let finalVideoFile = await processVideoSegmentsOptimized(
      ffmpeg, 
      mediaElements, 
      exportConfig, 
      tempFiles, 
      updateProgress,
      processingStrategy
    );
    
    console.log('✅ Video processing completed');

    // 🎬 特效处理（仅在需要时）
    if (processingStrategy.includeEffects) {
      finalVideoFile = await applyEffectsOptimized(
        ffmpeg,
        finalVideoFile,
        { textElements, transitionElements, audioElements },
        exportConfig,
        tempFiles,
        updateProgress
      );
    }

    updateProgress(95);

    // 📖 读取最终文件
    console.log('📖 Reading final output file...');
    const data = await ffmpeg.readFile(finalVideoFile);
    const mimeType = exportConfig.format === 'webm' ? 'video/webm' : 
                    exportConfig.format === 'mp4' ? 'video/mp4' :
                    exportConfig.format === 'avi' ? 'video/x-msvideo' :
                    'video/quicktime';
    const blob = new Blob([data], { type: mimeType });

    updateProgress(100);

    const totalTime = performance.now() - startTime;
    console.log(`✅ HIGH-PERFORMANCE export completed in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Output: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`⚡ Speed: ${((blob.size / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);

    return blob;

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    // 清理临时文件
    for (const file of tempFiles) {
      try {
        await ffmpeg.deleteFile(file);
      } catch (cleanupError) {
        console.warn(`Failed to delete temp file ${file}:`, cleanupError);
      }
    }
    
    setExportInProgress(false);
  }
};

/**
 * 智能处理策略选择
 */
function determineProcessingStrategy(mediaElements: any[], exportConfig: ExportConfig) {
  const hasTrimming = mediaElements.some(el => el.trimStart > 0 || el.trimEnd > 0);
  const hasRemoteUrls = mediaElements.some(el => el.mediaUrl && el.mediaUrl.startsWith('http'));
  const isSimpleCase = mediaElements.length === 1 && !hasTrimming && !hasRemoteUrls;
  
  if (isSimpleCase) {
    return {
      mode: 'ULTRA_FAST',
      includeEffects: false,
      useStreamCopy: true,
      parallelProcessing: false
    };
  }
  
  if (hasRemoteUrls) {
    return {
      mode: 'REMOTE_OPTIMIZED',
      includeEffects: true,
      useStreamCopy: false,
      parallelProcessing: true
    };
  }
  
  if (hasTrimming) {
    return {
      mode: 'TRIMMING_OPTIMIZED',
      includeEffects: true,
      useStreamCopy: false,
      parallelProcessing: true
    };
  }
  
  return {
    mode: 'STANDARD',
    includeEffects: true,
    useStreamCopy: false,
    parallelProcessing: true
  };
}

/**
 * 优化的视频片段处理
 */
async function processVideoSegmentsOptimized(
  ffmpeg: any,
  mediaElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  updateProgress: (progress: number) => void,
  strategy: any
): Promise<string> {
  console.log(`🎬 Processing ${mediaElements.length} segments with ${strategy.mode} strategy...`);
  
  const segments: string[] = [];
  const sortedElements = mediaElements.sort((a, b) => a.startTime - b.startTime);
  
  // 🚀 并行处理（如果策略允许）
  if (strategy.parallelProcessing && mediaElements.length > 1) {
    console.log('🚀 Using parallel processing...');
    const segmentPromises = sortedElements.map(async (element, index) => {
      return await processSingleSegment(ffmpeg, element, index, tempFiles, strategy);
    });
    
    const processedSegments = await Promise.all(segmentPromises);
    segments.push(...processedSegments);
  } else {
    // 串行处理
    for (let i = 0; i < sortedElements.length; i++) {
      const segment = await processSingleSegment(ffmpeg, sortedElements[i], i, tempFiles, strategy);
      segments.push(segment);
      
      const progress = 10 + (40 * (i + 1) / sortedElements.length);
      updateProgress(progress);
    }
  }
  
  updateProgress(50);
  
  // 🚀 智能合并策略
  if (segments.length === 1) {
    return segments[0];
  } else {
    return await concatenateSegmentsOptimized(ffmpeg, segments, exportConfig, tempFiles, strategy);
  }
}

/**
 * 处理单个视频片段
 */
async function processSingleSegment(
  ffmpeg: any,
  element: any,
  index: number,
  tempFiles: string[],
  strategy: any
): Promise<string> {
  console.log(`📹 Processing segment ${index + 1}: ${element.name || element.id}`);
  
  const inputName = `input_${index}_${Date.now()}.mp4`;
  
  // 🚀 智能文件获取
  const mediaFile = await getMediaFileOptimized(element);
  
  // 写入输入文件
  await ffmpeg.writeFile(inputName, new Uint8Array(await getArrayBufferSafely(mediaFile)));
  tempFiles.push(inputName);
  
  // 🚀 智能裁剪策略
  if (element.trimStart > 0 || element.trimEnd > 0) {
    return await trimSegmentOptimized(ffmpeg, inputName, element, index, tempFiles, strategy);
  } else {
    return inputName;
  }
}

/**
 * 优化的文件获取
 */
async function getMediaFileOptimized(element: any): Promise<File> {
  // 优先使用本地文件
  if (element.mediaFile) {
    return element.mediaFile;
  }
  
  // 远程URL处理
  if (element.mediaUrl) {
    console.log(`📥 Fetching remote video: ${element.mediaUrl.substring(0, 50)}...`);
    const response = await fetch(element.mediaUrl);
    const blob = await response.blob();
    return new File([blob], `remote_${Date.now()}.mp4`, { type: blob.type });
  }
  
  // 回退到媒体库
  const mediaStore = await import('@/stores/media-store').then(m => m.useMediaStore.getState());
  const mediaItem = mediaStore.mediaItems.find(item => item.id === element.mediaId);
  
  if (mediaItem?.file) {
    return mediaItem.file;
  }
  
  if (mediaItem?.url) {
    const response = await fetch(mediaItem.url);
    const blob = await response.blob();
    return new File([blob], `media_${Date.now()}.mp4`, { type: blob.type });
  }
  
  throw new Error(`No media file available for element ${element.id}`);
}

/**
 * 优化的片段裁剪
 */
async function trimSegmentOptimized(
  ffmpeg: any,
  inputName: string,
  element: any,
  index: number,
  tempFiles: string[],
  strategy: any
): Promise<string> {
  const trimmedName = `trimmed_${index}_${Date.now()}.mp4`;
  
  // 🚀 使用流复制进行快速裁剪
  const trimCommand = [
    '-i', inputName,
    '-ss', element.trimStart.toString(),
    '-t', element.duration.toString(),
    '-c', 'copy', // 关键：使用流复制，不重编码
    '-avoid_negative_ts', 'make_zero',
    '-y', trimmedName
  ];
  
  console.log(`✂️ Fast trimming segment ${index + 1}...`);
  await ffmpeg.exec(trimCommand);
  tempFiles.push(trimmedName);
  
  return trimmedName;
}

/**
 * 优化的片段合并
 */
async function concatenateSegmentsOptimized(
  ffmpeg: any,
  segments: string[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  strategy: any
): Promise<string> {
  console.log(`🔗 Concatenating ${segments.length} segments with ${strategy.mode}...`);
  
  const concatFile = `concat_${Date.now()}.txt`;
  const concatContent = segments.map(seg => `file '${seg}'`).join('\n');
  await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
  tempFiles.push(concatFile);
  
  const outputName = `timeline_output.${exportConfig.format}`;
  tempFiles.push(outputName);
  
  // 🚀 智能合并策略
  let concatCommand: string[];
  
  if (strategy.useStreamCopy) {
    // 超快速流复制合并
    concatCommand = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c', 'copy', // 关键：不重编码
      '-y', outputName
    ];
  } else {
    // 标准合并（需要重编码）
    const resolutionMap: { [key: string]: string } = {
      '480p': '854:480',
      '720p': '1280:720', 
      '1080p': '1920:1080',
      '4k': '3840:2160'
    };
    const outputResolution = resolutionMap[exportConfig.resolution] || '1280:720';
    
    concatCommand = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c:v', 'libx264',
      '-crf', '23', // 平衡质量和速度
      '-preset', 'fast', // 快速预设
      '-c:a', 'aac',
      '-b:a', '128k',
      '-s', outputResolution,
      '-y', outputName
    ];
  }
  
  console.log('🔧 Executing optimized concat...');
  await ffmpeg.exec(concatCommand);
  
  return outputName;
}

/**
 * 优化的特效应用
 */
async function applyEffectsOptimized(
  ffmpeg: any,
  videoFile: string,
  effects: any,
  exportConfig: ExportConfig,
  tempFiles: string[],
  updateProgress: (progress: number) => void
): Promise<string> {
  console.log('🎬 Applying effects optimized...');
  
  let currentFile = videoFile;
  
  // 应用各种特效（简化版本）
  if (effects.textElements.length > 0) {
    console.log('📝 Applying subtitles...');
    currentFile = await renderSubtitlesToVideo(ffmpeg, currentFile, effects.textElements, exportConfig, tempFiles, updateProgress);
  }
  
  if (effects.transitionElements.length > 0) {
    console.log('🎬 Applying transitions...');
    currentFile = await applyTransitionEffects(ffmpeg, currentFile, effects.transitionElements, exportConfig, tempFiles, updateProgress);
  }
  
  if (effects.audioElements.length > 0) {
    console.log('🎵 Processing audio...');
    currentFile = await processAudioTracks(ffmpeg, currentFile, effects.audioElements, exportConfig, tempFiles, updateProgress);
  }
  
  return currentFile;
} 