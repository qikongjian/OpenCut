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
  const transitionElements = allElements.filter(el => el.type === "transition");
  
  console.log(`📊 Total elements: ${allElements.length}`);
  console.log(`📹 Media elements: ${mediaElements.length}`);
  console.log(`🎬 Transition elements: ${transitionElements.length}`);
  
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

  // 详细检查转场元素
  transitionElements.forEach((element, index) => {
    console.log(`🎬 Transition element ${index + 1}:`, {
      id: element.id,
      type: element.transitionType,
      startTime: element.startTime,
      duration: element.duration,
      fromElementId: element.fromElementId,
      toElementId: element.toElementId
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

    // 🎬 关键修复：如果有转场，使用带转场的合并方式；否则使用快速合并
    let finalFile: string;
    
    if (transitionElements.length > 0) {
      console.log('🎬 Using transition-aware merging...');
      finalFile = await mergeSegmentsWithTransitions(ffmpeg, mediaElements, transitionElements, exportConfig, tempFiles, config, onProgress);
    } else {
      console.log('⚡ Using fast merging without transitions...');
      // 🚀 智能并行处理所有片段
      const maxConcurrent = Math.min(4, Math.max(1, Math.floor(mediaElements.length / 2))); // 动态调整并发数
      console.log(`🚀 Using ${maxConcurrent} concurrent processes for ${mediaElements.length} segments`);
      
      const segments: string[] = [];
      
      // 分批并行处理，避免内存溢出
      for (let i = 0; i < mediaElements.length; i += maxConcurrent) {
        const batch = mediaElements.slice(i, i + maxConcurrent);
        console.log(`🔄 Processing batch ${Math.floor(i/maxConcurrent) + 1}/${Math.ceil(mediaElements.length/maxConcurrent)}`);
        
        const batchPromises = batch.map(async (element, batchIndex) => {
          const globalIndex = i + batchIndex;
          return await processSegmentUltraFast(ffmpeg, element, globalIndex, tempFiles);
        });
        
        const batchSegments = await Promise.all(batchPromises);
        segments.push(...batchSegments);
        
        // 更新进度
        const progress = 10 + (40 * (i + batch.length) / mediaElements.length);
        updateProgress(progress, onProgress);
      }

      // 🚀 快速合并
      finalFile = await mergeSegmentsUltraFast(ffmpeg, segments, exportConfig, tempFiles, config);
    }
    
    updateProgress(70, onProgress);

    // 🎬 应用其他特效（字幕、蒙版、音频）
    let processedFile = finalFile;
    const textElements = allElements.filter(el => el.type === "text");
    const audioElements = allElements.filter(el => el.type === "media" && el.mediaType === "audio");
    
    // 收集所有蒙版效果
    const elementsWithMasks = allElements.filter(el => el.masks && el.masks.length > 0);
    const allMasks = elementsWithMasks.flatMap(el => el.masks || []);
    
    console.log(`📊 Other effects found:`, {
      textElements: textElements.length,
      audioElements: audioElements.length,
      masks: allMasks.length
    });

    // 验证基础文件存在且有效
    try {
      const baseData = await ffmpeg.readFile(processedFile);
      if (!baseData || baseData.length === 0) {
        console.error('❌ Base video file is empty before applying effects');
        throw new Error('Base video file is empty, cannot apply effects');
      }
      console.log(`✅ Base video file verified, size: ${(baseData.length / 1024 / 1024).toFixed(2)}MB`);
    } catch (verifyError) {
      console.error('❌ Failed to verify base video file:', verifyError);
      throw new Error('Base video file verification failed');
    }

    // 应用字幕
    if (textElements.length > 0) {
      try {
        console.log('📝 Applying subtitles...');
        const { renderSubtitlesToVideo } = await import('../effects/video-effects');
        const newFile = await renderSubtitlesToVideo(ffmpeg, processedFile, textElements, exportConfig, tempFiles);
        if (newFile !== processedFile) {
          processedFile = newFile;
          console.log('✅ Subtitles applied successfully');
        }
      } catch (subtitleError) {
        console.warn('⚠️ Subtitle application failed, continuing with original video:', subtitleError);
      }
    }

    // 应用蒙版效果
    if (allMasks.length > 0) {
      try {
        console.log('🎭 Applying masks...');
        const { applyMaskEffects } = await import('../effects/video-effects');
        const newFile = await applyMaskEffects(ffmpeg, processedFile, allMasks, exportConfig, tempFiles);
        if (newFile !== processedFile) {
          processedFile = newFile;
          console.log('✅ Masks applied successfully');
        }
      } catch (maskError) {
        console.warn('⚠️ Mask application failed, continuing with original video:', maskError);
      }
    }

    // 处理音频轨道
    if (audioElements.length > 0) {
      try {
        console.log('🎵 Processing audio...');
        const { processAudioTracks } = await import('./audio-ops');
        const newFile = await processAudioTracks(ffmpeg, processedFile, audioElements, exportConfig, tempFiles);
        if (newFile !== processedFile) {
          processedFile = newFile;
          console.log('✅ Audio processing completed successfully');
        }
      } catch (audioError) {
        console.warn('⚠️ Audio processing failed, continuing with original video:', audioError);
      }
    }
    
    console.log('✅ Effects processing completed');

    updateProgress(90, onProgress);

    // 读取结果并验证
    console.log(`📖 Reading final processed file: ${processedFile}`);
    
    // 首先检查文件是否存在
    try {
      const data = await ffmpeg.readFile(processedFile);
      
      if (!data || data.length === 0) {
        console.error('❌ Final processed file is empty, this indicates a processing failure');
        throw new Error('Export failed: Final video file is empty. This usually means video processing or effects application failed.');
      }
      
      console.log(`✅ Successfully read final file, size: ${data.length} bytes (${(data.length / 1024 / 1024).toFixed(2)}MB)`);
      
      const mimeType = exportConfig.format === 'webm' ? 'video/webm' : 
                      exportConfig.format === 'mp4' ? 'video/mp4' :
                      exportConfig.format === 'avi' ? 'video/x-msvideo' :
                      'video/quicktime';
      const blob = new Blob([data], { type: mimeType });
      
      // 再次验证blob
      if (blob.size === 0) {
        console.error('❌ Created blob is empty');
        throw new Error('Export failed: Generated video blob is empty');
      }
      
      console.log(`✅ Final blob created successfully, size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      
      updateProgress(100, onProgress);

      const totalTime = performance.now() - startTime;
      console.log(`⚡ ULTRA-FAST export completed in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Output: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`🚀 Speed: ${((blob.size / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);

      return blob;
      
    } catch (fileReadError) {
      console.error('❌ Failed to read final processed file:', fileReadError);
      throw new Error(`Export failed: Unable to read final video file - ${fileReadError instanceof Error ? fileReadError.message : 'Unknown error'}`);
    }

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
 * 🎬 新增：带转场的视频片段合并
 */
async function mergeSegmentsWithTransitions(
  ffmpeg: any,
  mediaElements: any[],
  transitionElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[],
  config: any,
  onProgress?: ProgressCallback
): Promise<string> {
  console.log('🎬 Merging segments with transitions...');
  
  // 1. 按时间顺序排序媒体元素
  const sortedMediaElements = [...mediaElements].sort((a, b) => a.startTime - b.startTime);
  
  // 2. 准备所有视频片段
  const segments: string[] = [];
  for (let i = 0; i < sortedMediaElements.length; i++) {
    const segment = await processSegmentUltraFast(ffmpeg, sortedMediaElements[i], i, tempFiles);
    segments.push(segment);
    
    const progress = 10 + (30 * (i + 1) / sortedMediaElements.length);
    updateProgress(progress, onProgress);
  }
  
  console.log(`✅ Prepared ${segments.length} video segments`);
  
  // 3. 构建带转场的FFmpeg滤镜图
  const outputName = `transitions_merged.${exportConfig.format}`;
  tempFiles.push(outputName);
  
  if (segments.length === 1) {
    // 只有一个视频，直接返回
    return segments[0];
  }
  
  if (transitionElements.length === 0) {
    // 没有转场，使用快速合并
    return await mergeSegmentsUltraFast(ffmpeg, segments, exportConfig, tempFiles, config);
  }
  
  // 🎯 根据导出配置动态选择质量设置
  const getQualitySettings = (quality: string) => {
    switch (quality) {
      case 'high':
        return {
          preset: 'slow',
          crf: '16',           // 非常高质量
          profile: 'high',
          level: '4.1'
        };
      case 'medium':
        return {
          preset: 'medium',
          crf: '20',           // 中等质量
          profile: 'main',
          level: '4.0'
        };
      case 'low':
        return {
          preset: 'fast',
          crf: '26',           // 较低质量但速度快
          profile: 'baseline',
          level: '3.1'
        };
      default:
        return {
          preset: 'medium',
          crf: '20',
          profile: 'main',
          level: '4.0'
        };
    }
  };
  
  const qualitySettings = getQualitySettings(exportConfig.quality);
  console.log(`🎯 Using quality settings for "${exportConfig.quality}":`, qualitySettings);
  
  // 4. 构建复杂滤镜图处理转场 - 使用正确的FFmpeg语法
  const inputs = segments.map(segment => ['-i', segment]).flat();
  
  if (segments.length === 2 && transitionElements.length === 1) {
    // 简单的两个视频转场情况
    const transition = transitionElements[0];
    const offset = getTransitionOffset(sortedMediaElements[0], transition);
    
    console.log(`🎬 Simple two-segment transition: ${transition.transitionType}, offset: ${offset}s, duration: ${transition.duration}s`);
    
    const command = [
      ...inputs,
      '-filter_complex', 
      `[0:v][1:v]xfade=transition=${getXfadeTransition(transition.transitionType)}:duration=${transition.duration}:offset=${offset}[outv];[0:a][1:a]acrossfade=d=${transition.duration}[outa]`,
      '-map', '[outv]',
      '-map', '[outa]',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'medium',        // 使用更稳定的预设避免噪点
      '-crf', '18',               // 使用固定的高质量设置
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'high',
      '-level', '4.0',
      '-b:a', '192k',             // 音频比特率
      '-ar', '44100',             // 音频采样率
      '-movflags', '+faststart',
      '-y', outputName
    ];
    
    console.log('🎬 Executing simple transition command:', command.join(' '));
    await ffmpeg.exec(command);
    
    console.log('✅ Simple transition merged successfully');
    return outputName;
  }
  
  // 多个视频片段的复杂转场处理
  console.log('🎬 Processing complex multi-segment transitions...');
  
  // 对于多个片段，我们需要逐步应用转场
  let currentFile = segments[0];
  
  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i];
    const transition = findTransitionBetweenSegments(transitionElements, sortedMediaElements[i-1], sortedMediaElements[i]);
    
    const tempOutputName = `temp_transition_${i}_${Date.now()}.${exportConfig.format}`;
    tempFiles.push(tempOutputName);
    
    if (transition) {
      console.log(`🎬 Applying transition ${i}: ${transition.transitionType} between segment ${i-1} and ${i}`);
      
      const offset = getTransitionOffset(sortedMediaElements[i-1], transition);
      
      const command = [
        '-i', currentFile,
        '-i', nextSegment,
        '-filter_complex', 
        `[0:v][1:v]xfade=transition=${getXfadeTransition(transition.transitionType)}:duration=${transition.duration}:offset=${offset}[outv];[0:a][1:a]acrossfade=d=${transition.duration}[outa]`,
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'medium',        // 使用更稳定的预设避免噪点
        '-crf', '18',               // 使用固定的高质量设置
        '-pix_fmt', 'yuv420p',
        '-profile:v', 'high',
        '-level', '4.0',
        '-b:a', '192k',             // 音频比特率
        '-ar', '44100',             // 音频采样率
        '-movflags', '+faststart',
        '-y', tempOutputName
      ];
      
      console.log(`🎬 Executing transition ${i} command:`, command.join(' '));
      await ffmpeg.exec(command);
      
      currentFile = tempOutputName;
    } else {
      // 没有转场，直接连接
      console.log(`🔗 Concatenating segment ${i-1} and ${i} without transition`);
      
      const concatListName = `concat_temp_${i}.txt`;
      const concatContent = `file '${currentFile}'\nfile '${nextSegment}'`;
      await ffmpeg.writeFile(concatListName, new Uint8Array(new TextEncoder().encode(concatContent)));
      tempFiles.push(concatListName);
      
      const command = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListName,
        '-c', 'copy',
        '-y', tempOutputName
      ];
      
      console.log(`🔗 Executing concat ${i} command:`, command.join(' '));
      await ffmpeg.exec(command);
      
      currentFile = tempOutputName;
    }
  }
  
  // 将最终结果重命名为输出文件名
  const finalCommand = ['-i', currentFile, '-c', 'copy', '-y', outputName];
  console.log('🎬 Executing final rename command:', finalCommand.join(' '));
  await ffmpeg.exec(finalCommand);
  
  console.log('✅ Complex transitions merged successfully');
  return outputName;
}

/**
 * 查找两个视频片段之间的转场
 */
function findTransitionBetweenSegments(transitionElements: any[], fromElement: any, toElement: any): any | null {
  return transitionElements.find(t => 
    t.fromElementId === fromElement.id && t.toElementId === toElement.id
  ) || null;
}

/**
 * 获取FFmpeg xfade滤镜支持的转场类型
 */
function getXfadeTransition(transitionType: string): string {
  const xfadeMap: { [key: string]: string } = {
    'fade': 'fade',
    'dissolve': 'dissolve',
    'slide': 'slideleft',
    'zoom': 'fade', // xfade没有zoom，使用fade替代
    'flash': 'fade'
  };
  
  return xfadeMap[transitionType] || 'fade';
}

/**
 * 计算转场偏移时间
 */
function getTransitionOffset(fromElement: any, transition: any): number {
  // 转场开始时间相对于第一个视频的偏移
  const fromElementDuration = fromElement.duration - fromElement.trimStart - fromElement.trimEnd;
  return fromElementDuration - (transition.duration / 2);
}

/**
 * 进度更新函数
 */
function updateProgress(targetProgress: number, onProgress?: ProgressCallback) {
  console.log(`📊 Progress: ${targetProgress}%`);
  onProgress?.(targetProgress);
} 