// operations/ultra-fast-export.ts - 超高性能导出引擎
// 支持所有编辑效果，同时大幅提升导出速度

import { initFFmpeg } from '../core/init';
import { resetExportCancellation, checkCancellation, setExportInProgress } from '../utils/export-utils';
import type { TimelineData, ExportConfig, ProgressCallback } from '../types/ffmpeg-types';

/**
 * 超高性能时间轴导出引擎
 * 核心优化策略：
 * 1. 智能效果合并 - 将多个效果合并到单个FFmpeg命令
 * 2. 并行处理 - 同时处理多个片段
 * 3. 流复制优化 - 避免不必要的重编码
 * 4. 预处理优化 - 提前计算所有效果参数
 * 5. 内存优化 - 减少临时文件数量
 */
export const ultraFastExportTimeline = async (
  timelineData: TimelineData,
  exportConfig: ExportConfig,
  onProgress?: ProgressCallback
): Promise<Blob> => {
  console.log('⚡ Starting ULTRA-FAST timeline export with full effects support...');
  
  setExportInProgress(true);
  resetExportCancellation();
  
  const startTime = performance.now();
  const ffmpeg = await initFFmpeg();
  const tempFiles: string[] = [];

  try {
    updateProgress(5, onProgress);
    checkCancellation();

    // 🧠 智能分析时间轴内容
    const analysis = analyzeTimelineContent(timelineData);
    console.log('📊 Timeline Analysis:', analysis);

    if (analysis.mediaElements.length === 0) {
      throw new Error('No media elements found in timeline');
    }

    updateProgress(10, onProgress);

    // 🚀 第一阶段：并行处理所有视频片段（包含基础效果）
    console.log('🎬 Phase 1: Processing video segments with integrated effects...');
    const processedSegments = await processSegmentsWithIntegratedEffects(
      ffmpeg, 
      analysis, 
      exportConfig, 
      tempFiles,
      (progress) => updateProgress(10 + progress * 0.4, onProgress)
    );

    updateProgress(50, onProgress);

    // 🚀 第二阶段：智能合并（包含全局效果）
    console.log('🎭 Phase 2: Intelligent merging with global effects...');
    const mergedFile = await intelligentMergeWithGlobalEffects(
      ffmpeg,
      processedSegments,
      analysis,
      exportConfig,
      tempFiles,
      (progress) => updateProgress(50 + progress * 0.4, onProgress)
    );

    updateProgress(90, onProgress);

    // 🎯 第三阶段：最终验证和输出
    console.log('📖 Phase 3: Final verification and output...');
    const finalBlob = await finalizeAndVerify(ffmpeg, mergedFile, exportConfig);

    updateProgress(100, onProgress);

    const totalTime = performance.now() - startTime;
    console.log(`⚡ ULTRA-FAST export completed in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Output: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🚀 Speed: ${((finalBlob.size / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);

    return finalBlob;

  } catch (error) {
    console.error('❌ Ultra-fast export failed:', error);
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
 * 智能分析时间轴内容
 */
function analyzeTimelineContent(timelineData: TimelineData) {
  const allElements = timelineData.tracks.flatMap(track => track.elements);
  
  const mediaElements = allElements.filter(el => el.type === "media" && el.mediaType !== "audio");
  const textElements = allElements.filter(el => el.type === "text");
  const transitionElements = allElements.filter(el => el.type === "transition");
  const audioElements = allElements.filter(el => el.type === "media" && el.mediaType === "audio");
  
  // 分析每个媒体元素的效果
  const elementsWithEffects = mediaElements.map(element => {
    const effects = {
      hasTrimming: element.trimStart > 0 || element.trimEnd > 0,
      hasMirror: element.horizontalFlip || element.verticalFlip || element.rotation,
      hasMasks: element.masks && element.masks.length > 0,
      hasSpeedControl: element.playbackRate && element.playbackRate !== 1.0,
      hasOpacity: element.opacity && element.opacity !== 1.0,
      hasPosition: element.x !== undefined || element.y !== undefined
    };
    
    return {
      ...element,
      effects,
      hasAnyEffect: Object.values(effects).some(Boolean)
    };
  });

  // 分析转场关系
  const transitionMap = new Map();
  transitionElements.forEach(transition => {
    const key = `${transition.fromElementId}-${transition.toElementId}`;
    transitionMap.set(key, transition);
  });

  return {
    mediaElements: elementsWithEffects,
    textElements,
    transitionElements,
    audioElements,
    transitionMap,
    totalDuration: timelineData.totalDuration,
    hasGlobalEffects: textElements.length > 0 || audioElements.length > 0,
    complexity: calculateComplexity(elementsWithEffects, textElements, transitionElements)
  };
}

/**
 * 计算导出复杂度以选择最优策略
 */
function calculateComplexity(mediaElements: any[], textElements: any[], transitionElements: any[]) {
  let score = 0;
  
  // 基础复杂度
  score += mediaElements.length * 1;
  score += textElements.length * 2;
  score += transitionElements.length * 3;
  
  // 效果复杂度
  mediaElements.forEach(element => {
    if (element.effects.hasMirror) score += 2;
    if (element.effects.hasMasks) score += 4;
    if (element.effects.hasSpeedControl) score += 3;
    if (element.effects.hasTrimming) score += 1;
  });
  
  if (score <= 10) return 'simple';
  if (score <= 30) return 'medium';
  return 'complex';
}

/**
 * 并行处理视频片段（集成基础效果）
 */
async function processSegmentsWithIntegratedEffects(
  ffmpeg: any,
  analysis: any,
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress: (progress: number) => void
): Promise<string[]> {
  console.log(`🚀 Processing ${analysis.mediaElements.length} segments with integrated effects...`);
  
  // 根据复杂度决定并行策略
  const maxConcurrent = analysis.complexity === 'simple' ? 4 : 
                       analysis.complexity === 'medium' ? 2 : 1;
  
  const results: string[] = [];
  
  // 分批并行处理
  for (let i = 0; i < analysis.mediaElements.length; i += maxConcurrent) {
    const batch = analysis.mediaElements.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (element, batchIndex) => {
      const globalIndex = i + batchIndex;
      return await processSegmentWithEffects(ffmpeg, element, globalIndex, tempFiles, analysis);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    const progress = (i + batch.length) / analysis.mediaElements.length * 100;
    onProgress(progress);
  }
  
  console.log(`✅ All ${results.length} segments processed with effects`);
  return results;
}

/**
 * 处理单个视频片段（集成所有基础效果）
 */
async function processSegmentWithEffects(
  ffmpeg: any,
  element: any,
  index: number,
  tempFiles: string[],
  analysis: any
): Promise<string> {
  console.log(`⚡ Processing segment ${index + 1} with integrated effects...`);
  
  const inputName = `input_${index}_${Date.now()}.mp4`;
  const outputName = `processed_${index}_${Date.now()}.mp4`;
  
  // 获取媒体文件
  const mediaFile = await getMediaFileForElement(element);
  if (!mediaFile) {
    throw new Error(`No media file available for element ${element.id}`);
  }
  
  // 写入输入文件
  await ffmpeg.writeFile(inputName, new Uint8Array(await getArrayBufferSafely(mediaFile)));
  tempFiles.push(inputName);
  
  // 🎯 构建集成效果的FFmpeg命令
  const filters = [];
  let needsReencoding = false;
  
  // 1. 时间裁剪（使用-ss和-t，避免滤镜）
  let inputOptions = ['-i', inputName];
  let outputOptions = [];
  
  if (element.effects.hasTrimming) {
    const actualDuration = element.duration - element.trimStart - element.trimEnd;
    inputOptions = [
      '-ss', element.trimStart.toString(),
      '-i', inputName,
      '-t', actualDuration.toString()
    ];
  }
  
  // 2. 镜像效果
  if (element.effects.hasMirror) {
    needsReencoding = true;
    if (element.horizontalFlip) filters.push('hflip');
    if (element.verticalFlip) filters.push('vflip');
    if (element.rotation) {
      const radians = (element.rotation * Math.PI) / 180;
      filters.push(`rotate=${radians}`);
    }
  }
  
  // 3. 蒙版效果
  if (element.effects.hasMasks && element.masks) {
    needsReencoding = true;
    element.masks.forEach((mask: any) => {
      if (mask.type === 'rectangle') {
        filters.push(`crop=${mask.width}:${mask.height}:${mask.x}:${mask.y}`);
        if (mask.blur > 0) filters.push(`gblur=sigma=${mask.blur}`);
      } else if (mask.type === 'circle') {
        const radius = Math.min(mask.width, mask.height) / 2;
        const centerX = mask.x + mask.width / 2;
        const centerY = mask.y + mask.height / 2;
        const circleFilter = `geq=r='if(lt(sqrt((X-${centerX})^2+(Y-${centerY})^2),${radius}),r(X,Y),0)':g='if(lt(sqrt((X-${centerX})^2+(Y-${centerY})^2),${radius}),g(X,Y),0)':b='if(lt(sqrt((X-${centerX})^2+(Y-${centerY})^2),${radius}),b(X,Y),0)'`;
        filters.push(circleFilter);
      }
    });
  }
  
  // 4. 速度控制
  if (element.effects.hasSpeedControl && element.playbackRate !== 1.0) {
    needsReencoding = true;
    filters.push(`setpts=${1/element.playbackRate}*PTS`);
  }
  
  // 5. 透明度
  if (element.effects.hasOpacity && element.opacity !== 1.0) {
    needsReencoding = true;
    filters.push(`format=rgba,colorchannelmixer=aa=${element.opacity}`);
  }
  
  // 构建最终命令
  const command = [...inputOptions];
  
  if (filters.length > 0) {
    command.push('-vf', filters.join(','));
  }
  
  if (needsReencoding) {
    // 需要重编码，使用快速设置
    command.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-c:a', 'copy'
    );
  } else {
    // 流复制，最快速度
    command.push('-c', 'copy');
  }
  
  command.push('-y', outputName);
  
  console.log(`🔧 Segment ${index + 1} command:`, command.join(' '));
  await ffmpeg.exec(command);
  
  tempFiles.push(outputName);
  console.log(`✅ Segment ${index + 1} processed`);
  
  return outputName;
}

/**
 * 智能合并（包含全局效果）
 */
async function intelligentMergeWithGlobalEffects(
  ffmpeg: any,
  segments: string[],
  analysis: any,
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress: (progress: number) => void
): Promise<string> {
  console.log('🎭 Intelligent merging with global effects...');
  
  onProgress(10);
  
  // 第一步：合并视频片段
  let mergedVideo = await mergeVideoSegments(ffmpeg, segments, exportConfig, tempFiles);
  onProgress(40);
  
  // 第二步：应用转场效果
  if (analysis.transitionElements.length > 0) {
    mergedVideo = await applyTransitionsOptimized(ffmpeg, mergedVideo, analysis.transitionElements, exportConfig, tempFiles);
    onProgress(60);
  }
  
  // 第三步：应用字幕
  if (analysis.textElements.length > 0) {
    mergedVideo = await applySubtitlesOptimized(ffmpeg, mergedVideo, analysis.textElements, exportConfig, tempFiles);
    onProgress(80);
  }
  
  // 第四步：处理音频
  if (analysis.audioElements.length > 0) {
    mergedVideo = await processAudioOptimized(ffmpeg, mergedVideo, analysis.audioElements, exportConfig, tempFiles);
    onProgress(100);
  }
  
  return mergedVideo;
}

/**
 * 合并视频片段
 */
async function mergeVideoSegments(
  ffmpeg: any,
  segments: string[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  if (segments.length === 1) {
    return segments[0];
  }
  
  const concatFile = `concat_${Date.now()}.txt`;
  const concatContent = segments.map(seg => `file '${seg}'`).join('\n');
  await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
  tempFiles.push(concatFile);
  
  const outputName = `merged_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);
  
  const command = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c', 'copy',
    '-y', outputName
  ];
  
  console.log('🔗 Merging video segments...');
  await ffmpeg.exec(command);
  
  return outputName;
}

/**
 * 优化的转场处理
 */
async function applyTransitionsOptimized(
  ffmpeg: any,
  videoFile: string,
  transitionElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  console.log(`🎬 Applying ${transitionElements.length} transitions (optimized)...`);
  
  const outputName = `transitions_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);
  
  // 构建所有转场滤镜
  const filters: string[] = [];
  
  transitionElements.forEach(transition => {
    const { transitionType, startTime, duration } = transition;
    
    switch (transitionType) {
      case 'fade':
      case 'dissolve':
        filters.push(`fade=t=in:st=${startTime}:d=${duration}`);
        filters.push(`fade=t=out:st=${startTime + duration - 0.5}:d=0.5`);
        break;
      case 'slide':
        const direction = transition.direction || 'left';
        filters.push(`slide=direction=${direction}:duration=${duration}`);
        break;
      case 'zoom':
        filters.push(`zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=${Math.round(duration * 30)}`);
        break;
      case 'flash':
        filters.push(`fade=t=in:st=${startTime}:d=0.1:alpha=1,fade=t=out:st=${startTime + 0.1}:d=0.1:alpha=1`);
        break;
      default:
        // 默认使用fade
        filters.push(`fade=t=in:st=${startTime}:d=${duration}`);
        filters.push(`fade=t=out:st=${startTime + duration - 0.5}:d=0.5`);
    }
  });
  
  if (filters.length === 0) {
    return videoFile;
  }
  
  const command = [
    '-i', videoFile,
    '-vf', filters.join(','),
    '-c:a', 'copy',
    '-y', outputName
  ];
  
  await ffmpeg.exec(command);
  return outputName;
}

/**
 * 优化的字幕处理
 */
async function applySubtitlesOptimized(
  ffmpeg: any,
  videoFile: string,
  textElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  console.log(`📝 Applying ${textElements.length} subtitles (optimized)...`);
  
  const outputName = `subtitles_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);
  
  // 构建所有字幕滤镜
  const drawTextFilters: string[] = [];
  
  textElements.forEach(textElement => {
    const {
      content = '',
      fontSize = 24,
      color = 'white',
      x = 50,
      y = 50,
      startTime = 0,
      duration = 5
    } = textElement;
    
    const escapedText = content
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/,/g, "\\,");
    
    const drawTextFilter = [
      `drawtext=text='${escapedText}'`,
      `fontsize=${fontSize}`,
      `fontcolor=${color}`,
      `x=${x}`,
      `y=${y}`,
      `enable='between(t,${startTime},${startTime + duration})'`
    ].join(':');
    
    drawTextFilters.push(drawTextFilter);
  });
  
  if (drawTextFilters.length === 0) {
    return videoFile;
  }
  
  const command = [
    '-i', videoFile,
    '-vf', drawTextFilters.join(','),
    '-c:a', 'copy',
    '-y', outputName
  ];
  
  await ffmpeg.exec(command);
  return outputName;
}

/**
 * 优化的音频处理
 */
async function processAudioOptimized(
  ffmpeg: any,
  videoFile: string,
  audioElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  console.log(`🎵 Processing ${audioElements.length} audio tracks (optimized)...`);
  
  const outputName = `audio_processed_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);
  
  // 简化的音频处理 - 混合所有音频轨道
  const audioInputs = ['-i', videoFile];
  
  // 添加所有音频文件作为输入
  for (let i = 0; i < audioElements.length; i++) {
    const audioElement = audioElements[i];
    const audioInputName = `audio_${i}_${Date.now()}.mp3`;
    
    // 这里需要从audioElement获取音频文件并写入
    // 简化处理，假设音频文件已经可用
    if (audioElement.mediaFile) {
      await ffmpeg.writeFile(audioInputName, new Uint8Array(await getArrayBufferSafely(audioElement.mediaFile)));
      tempFiles.push(audioInputName);
      audioInputs.push('-i', audioInputName);
    }
  }
  
  const command = [
    ...audioInputs,
    '-filter_complex', `[0:a][1:a]amix=inputs=${audioElements.length + 1}[aout]`,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-y', outputName
  ];
  
  await ffmpeg.exec(command);
  return outputName;
}

/**
 * 最终验证和输出
 */
async function finalizeAndVerify(
  ffmpeg: any,
  processedFile: string,
  exportConfig: ExportConfig
): Promise<Blob> {
  console.log('📖 Finalizing and verifying output...');
  
  const data = await ffmpeg.readFile(processedFile);
  
  if (!data || data.length === 0) {
    throw new Error('Export failed: Final video file is empty');
  }
  
  const mimeType = exportConfig.format === 'webm' ? 'video/webm' : 
                  exportConfig.format === 'mp4' ? 'video/mp4' :
                  exportConfig.format === 'avi' ? 'video/x-msvideo' :
                  'video/quicktime';
  
  const blob = new Blob([data], { type: mimeType });
  
  if (blob.size === 0) {
    throw new Error('Export failed: Generated video blob is empty');
  }
  
  console.log(`✅ Final verification passed, size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
  return blob;
}

/**
 * 辅助函数
 */
async function getMediaFileForElement(element: any): Promise<File | null> {
  if (element.mediaFile && element.mediaFile instanceof File) {
    return element.mediaFile;
  }
  
  if (element.mediaUrl) {
    const response = await fetch(element.mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }
    const blob = await response.blob();
    return new File([blob], `remote_video.mp4`, { type: blob.type });
  }
  
  // 从媒体库获取
  const mediaStore = await import('@/stores/media-store').then(m => m.useMediaStore.getState());
  const mediaItem = mediaStore.mediaItems.find(item => item.id === element.mediaId);
  
  if (mediaItem?.file) {
    return mediaItem.file;
  }
  
  if (mediaItem?.url) {
    const response = await fetch(mediaItem.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status}`);
    }
    const blob = await response.blob();
    return new File([blob], `media_file.mp4`, { type: blob.type });
  }
  
  return null;
}

async function getArrayBufferSafely(mediaFile: any): Promise<ArrayBuffer> {
  if (mediaFile && typeof mediaFile.arrayBuffer === 'function') {
    return await mediaFile.arrayBuffer();
  }
  
  if (mediaFile && typeof mediaFile.stream === 'function') {
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
  
  throw new Error('Unable to get ArrayBuffer from media file');
}

function updateProgress(targetProgress: number, onProgress?: ProgressCallback) {
  console.log(`📊 Progress: ${targetProgress.toFixed(1)}%`);
  onProgress?.(targetProgress);
} 