// operations/fast-export.ts - 高性能快速导出

import { initFFmpeg } from '../core/init';
import { ULTRA_FAST_CONFIG, getOptimalConfig } from '../core/performance-config';
import { resetExportCancellation, checkCancellation, setExportInProgress } from '../utils/export-utils';
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
    return mediaFile.buffer.slice(0) as ArrayBuffer;
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
 * 超快速时间轴导出 - 专门针对性能优化
 */
export const fastExportTimeline = async (
  timelineData: TimelineData,
  exportConfig: ExportConfig,
  onProgress?: ProgressCallback
): Promise<Blob> => {
  console.log('⚡ Starting ULTRA-FAST timeline export...');
  
  // 🐛 详细调试信息
  console.log('🔍 Timeline data analysis:');
  const allElements = timelineData.tracks.flatMap(track => track.elements);
  const mediaElements = allElements.filter(el => el.type === "media" && el.mediaType !== "audio");
  
  console.log(`📊 Total elements: ${allElements.length}`);
  console.log(`📹 Media elements: ${mediaElements.length}`);
  
  // 详细检查每个媒体元素
  mediaElements.forEach((element, index) => {
    console.log(`🔍 Media element ${index + 1}:`, {
      id: element.id,
      name: element.name,
      mediaId: element.mediaId,
      hasMediaFile: !!element.mediaFile,
      hasMediaUrl: !!element.mediaUrl,
      mediaUrl: element.mediaUrl ? element.mediaUrl.substring(0, 50) + '...' : 'none',
      mediaFileType: element.mediaFile ? typeof element.mediaFile : 'undefined',
      mediaFileConstructor: element.mediaFile ? element.mediaFile.constructor?.name : 'undefined',
      startTime: element.startTime,
      duration: element.duration,
      trimStart: element.trimStart,
      trimEnd: element.trimEnd
    });
  });
  
  setExportInProgress(true);
  resetExportCancellation();
  
  const startTime = performance.now();
  const ffmpeg = await initFFmpeg();
  const tempFiles: string[] = [];

  try {
    updateProgress(5, onProgress);
    checkCancellation();

    if (mediaElements.length === 0) {
      throw new Error('No media elements found in timeline');
    }

    console.log(`📊 Processing ${mediaElements.length} media elements...`);

    // 🚀 智能配置选择
    const totalSize = mediaElements.reduce((sum, el) => sum + (el.mediaFile?.size || 0), 0);
    const hasEffects = allElements.some(el => el.type === 'text' || el.type === 'transition');
    
    const config = getOptimalConfig(
      totalSize,
      timelineData.totalDuration,
      exportConfig.quality,
      hasEffects
    );

    console.log('⚙️ Using config:', config);

    updateProgress(10, onProgress);

    // 🚀 并行处理所有片段
    const segmentPromises = mediaElements.map(async (element, index) => {
      return await processSegmentUltraFast(ffmpeg, element, index, tempFiles);
    });

    const segments = await Promise.all(segmentPromises);
    updateProgress(50, onProgress);

    // 🚀 快速合并
    const finalFile = await mergeSegmentsUltraFast(ffmpeg, segments, exportConfig, tempFiles, config);
    updateProgress(90, onProgress);

    // 读取结果
    const data = await ffmpeg.readFile(finalFile);
    const mimeType = exportConfig.format === 'webm' ? 'video/webm' : 
                    exportConfig.format === 'mp4' ? 'video/mp4' :
                    exportConfig.format === 'avi' ? 'video/x-msvideo' :
                    'video/quicktime';
    const blob = new Blob([data], { type: mimeType });

    updateProgress(100, onProgress);

    const totalTime = performance.now() - startTime;
    console.log(`⚡ ULTRA-FAST export completed in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Output: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🚀 Speed: ${((blob.size / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);

    return blob;

  } catch (error) {
    console.error('❌ Fast export failed:', error);
    throw error;
  } finally {
    // 清理
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
 * 超快速片段处理
 */
async function processSegmentUltraFast(
  ffmpeg: any,
  element: any,
  index: number,
  tempFiles: string[]
): Promise<string> {
  console.log(`⚡ Processing segment ${index + 1}: ${element.name || element.id}`);
  console.log(`🔍 Element details:`, {
    mediaId: element.mediaId,
    hasMediaFile: !!element.mediaFile,
    hasMediaUrl: !!element.mediaUrl,
    mediaUrl: element.mediaUrl ? element.mediaUrl.substring(0, 50) + '...' : 'none'
  });
  
  const inputName = `input_${index}_${Date.now()}.mp4`;
  
  // 获取媒体文件 - 改进的逻辑
  let mediaFile: File;
  
  // 1. 优先使用元素中的媒体文件
  if (element.mediaFile && element.mediaFile instanceof File) {
    console.log(`✅ Using element's media file for ${element.id}`);
    mediaFile = element.mediaFile;
  }
  // 2. 其次使用元素中的媒体URL
  else if (element.mediaUrl) {
    console.log(`📥 Fetching remote video ${index + 1} from: ${element.mediaUrl.substring(0, 50)}...`);
    try {
      const response = await fetch(element.mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      mediaFile = new File([blob], `remote_${index}.mp4`, { type: blob.type });
      console.log(`✅ Successfully fetched remote video, size: ${mediaFile.size} bytes`);
    } catch (error) {
      console.error(`❌ Failed to fetch remote video:`, error);
      throw new Error(`Failed to fetch remote video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  // 3. 从媒体库获取
  else {
    console.log(`🔍 Looking up media in store for element ${element.id}...`);
    const mediaStore = await import('@/stores/media-store').then(m => m.useMediaStore.getState());
    const mediaItem = mediaStore.mediaItems.find(item => item.id === element.mediaId);
    
    console.log(`🔍 Media store lookup result:`, {
      found: !!mediaItem,
      hasFile: mediaItem ? !!mediaItem.file : false,
      hasUrl: mediaItem ? !!mediaItem.url : false,
      totalItemsInStore: mediaStore.mediaItems.length
    });
    
    if (mediaItem?.file) {
      console.log(`✅ Found media file in store for element ${element.id}`);
      mediaFile = mediaItem.file;
    } else if (mediaItem?.url) {
      console.log(`📥 Found media URL in store for element ${element.id}`);
      try {
        const response = await fetch(mediaItem.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        mediaFile = new File([blob], `media_${index}.mp4`, { type: blob.type });
        console.log(`✅ Successfully fetched media from store, size: ${mediaFile.size} bytes`);
      } catch (error) {
        console.error(`❌ Failed to fetch media from store:`, error);
        throw new Error(`Failed to fetch media from store: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      const availableMediaIds = mediaStore.mediaItems.map(item => item.id);
      throw new Error(`❌ No media file available for element ${element.id}. Element mediaId: ${element.mediaId}, found in store: ${!!mediaItem}, available media IDs: [${availableMediaIds.join(', ')}]`);
    }
  }

  if (!mediaFile) {
    throw new Error(`❌ Failed to get media file for element ${element.id}`);
  }

  console.log(`✅ Successfully got media file for element ${element.id}, size: ${mediaFile.size} bytes`);

  // 写入文件
  console.log(`📝 Writing input file ${inputName}...`);
  await ffmpeg.writeFile(inputName, new Uint8Array(await getArrayBufferSafely(mediaFile)));
  tempFiles.push(inputName);
  console.log(`✅ Input file written successfully`);

  // 如果需要裁剪，使用流复制
  if (element.trimStart > 0 || element.trimEnd > 0) {
    console.log(`✂️ Trimming segment ${index + 1}...`);
    const trimmedName = `trimmed_${index}_${Date.now()}.mp4`;
    
    // 🚀 计算正确的裁剪时长：原始时长减去开头和结尾的裁剪
    const actualDuration = element.duration - element.trimStart - element.trimEnd;
    
    const trimCommand = [
      '-i', inputName,
      '-ss', element.trimStart.toString(),
      '-t', actualDuration.toString(), // 修复：使用实际时长而不是原始时长
      '-c', 'copy', // 关键：流复制，不重编码
      '-avoid_negative_ts', 'make_zero',
      '-y', trimmedName
    ];
    
    console.log(`✂️ Trim command (duration: ${actualDuration}s):`, trimCommand);
    await ffmpeg.exec(trimCommand);
    tempFiles.push(trimmedName);
    console.log(`✅ Trim completed for segment ${index + 1}`);
    return trimmedName;
  }

  return inputName;
}

/**
 * 超快速片段合并
 */
async function mergeSegmentsUltraFast(
  ffmpeg: any,
  segments: string[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  config: any
): Promise<string> {
  console.log(`🔗 Merging ${segments.length} segments ultra-fast...`);
  
  if (segments.length === 1) {
    return segments[0];
  }

  const concatFile = `concat_${Date.now()}.txt`;
  const concatContent = segments.map(seg => `file '${seg}'`).join('\n');
  await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
  tempFiles.push(concatFile);

  const outputName = `fast_output.${exportConfig.format}`;
  tempFiles.push(outputName);

  // 🚀 使用流复制进行超快速合并
  const concatCommand = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c', 'copy', // 关键：流复制，不重编码
    '-y', outputName
  ];

  console.log('⚡ Executing ultra-fast concat...');
  await ffmpeg.exec(concatCommand);

  return outputName;
}

/**
 * 进度更新函数
 */
function updateProgress(targetProgress: number, onProgress?: ProgressCallback) {
  console.log(`📊 Progress: ${targetProgress}%`);
  onProgress?.(targetProgress);
} 