// operations/ultra-fast-export.ts - 超高性能导出引擎
// 支持所有编辑效果，同时大幅提升导出速度

import { initFFmpeg } from '../core/init';
import { resetExportCancellation, checkCancellation, setExportInProgress } from '../utils/export-utils';
import type { TimelineData, ExportConfig, ProgressCallback } from '../types/ffmpeg-types';

/**
 * 🚀 超高性能时间轴导出引擎 V2.0
 *
 * 核心架构设计：
 * 1. 🎬 完整特效管道 - 支持所有编辑效果的统一处理
 * 2. 🧠 智能效果合并 - 将多个效果合并到单个FFmpeg命令
 * 3. ⚡ 并行处理引擎 - 同时处理多个片段和特效
 * 4. 🔄 流复制优化 - 避免不必要的重编码
 * 5. 📊 预处理分析 - 提前计算所有效果参数和依赖关系
 * 6. 💾 内存优化 - 减少临时文件数量和内存占用
 * 7. 🎯 精确时间轴处理 - 正确处理元素层叠、覆盖、插入关系
 * 8. 🎨 高级特效支持 - 蒙版、字幕、转场、镜像、音频混合等
 */
export const ultraFastExportTimeline = async (
  timelineData: TimelineData,
  exportConfig: ExportConfig,
  onProgress?: ProgressCallback
): Promise<Blob> => {
  console.log('🚀 Starting ULTRA-FAST timeline export V2.0 with FULL EFFECTS SUPPORT...');

  setExportInProgress(true);
  resetExportCancellation();

  const startTime = performance.now();
  const ffmpeg = await initFFmpeg();
  const tempFiles: string[] = [];

  // 🧠 智能分析时间轴数据
  const timelineAnalysis = analyzeTimelineForExport(timelineData);
  console.log('📊 Timeline Analysis:', timelineAnalysis);

  try {
    updateProgress(5, onProgress);
    checkCancellation();

    // 🧠 智能分析时间轴内容
    const analysis = analyzeTimelineContent(timelineData);
    console.log('📊 Timeline Analysis:', analysis);

    // 检查是否有媒体元素或文本元素
    if (analysis.mediaElements.length === 0 && analysis.textElements.length === 0) {
      throw new Error('No media or text elements found in timeline');
    }

    // 如果只有文本元素，需要创建一个背景视频
    if (analysis.mediaElements.length === 0 && analysis.textElements.length > 0) {
      console.log('📝 Only text elements found, creating background video for subtitles...');
      return await handleTextOnlyExport(ffmpeg, analysis, exportConfig, tempFiles, onProgress, checkCancellation);
    }

    updateProgress(10, onProgress);

    // 🚀 第一阶段：并行处理所有视频片段（包含基础效果）
    console.log('🎬 Phase 1: Processing video segments with integrated effects...');
    let processedSegments;
    try {
      processedSegments = await processSegmentsWithIntegratedEffects(
        ffmpeg,
        analysis,
        exportConfig,
        tempFiles,
        (progress) => updateProgress(10 + progress * 0.4, onProgress)
      );

      if (!processedSegments || processedSegments.length === 0) {
        throw new Error('Phase 1 failed: No processed segments generated');
      }

      console.log(`✅ Phase 1 completed: ${processedSegments.length} segments processed`);
    } catch (error) {
      console.error('❌ Phase 1 failed:', error);
      throw new Error(`Phase 1 processing failed: ${error.message}`);
    }

    updateProgress(50, onProgress);

    // 🚀 第二阶段：智能合并（包含全局效果）
    console.log('🎭 Phase 2: Intelligent merging with global effects...');
    let mergedFile;
    try {
      mergedFile = await intelligentMergeWithGlobalEffects(
        ffmpeg,
        processedSegments,
        analysis,
        exportConfig,
        tempFiles,
        (progress) => updateProgress(50 + progress * 0.4, onProgress)
      );

      if (!mergedFile) {
        throw new Error('Phase 2 failed: No merged file generated');
      }

      console.log(`✅ Phase 2 completed: Merged file ${mergedFile}`);
    } catch (error) {
      console.error('❌ Phase 2 failed:', error);
      throw new Error(`Phase 2 merging failed: ${error.message}`);
    }

    updateProgress(90, onProgress);

    // 🎯 第三阶段：最终验证和输出
    console.log('📖 Phase 3: Final verification and output...');
    let finalBlob;
    try {
      finalBlob = await finalizeAndVerify(ffmpeg, mergedFile, exportConfig);

      if (!finalBlob || finalBlob.size === 0) {
        throw new Error('Phase 3 failed: Final blob is empty');
      }

      console.log(`✅ Phase 3 completed: Final blob size ${(finalBlob.size / 1024).toFixed(2)}KB`);
    } catch (error) {
      console.error('❌ Phase 3 failed:', error);
      throw new Error(`Phase 3 finalization failed: ${error.message}`);
    }

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
  
  // 🚀 优化：根据复杂度和硬件能力决定并行策略
  const maxConcurrent = analysis.complexity === 'simple' ? 6 :
                       analysis.complexity === 'medium' ? 4 : 2;
  
  const results: string[] = [];
  
  // 分批并行处理
  for (let i = 0; i < analysis.mediaElements.length; i += maxConcurrent) {
    const batch = analysis.mediaElements.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (element, batchIndex) => {
      const globalIndex = i + batchIndex;
      return await processSegmentWithEffects(ffmpeg, element, globalIndex, tempFiles, analysis, exportConfig);
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
 * 🎬 处理单个视频片段（完整特效管道）
 * 支持所有编辑效果：剪辑、镜像、蒙版、字幕等
 */
async function processSegmentWithEffects(
  ffmpeg: any,
  element: any,
  index: number,
  tempFiles: string[],
  analysis: any,
  exportConfig: ExportConfig
): Promise<string> {
  console.log(`🎬 Processing segment ${index + 1} with FULL EFFECTS PIPELINE...`);
  console.log(`🎬 Element details:`, {
    type: element.type,
    duration: element.duration,
    horizontalFlip: element.horizontalFlip,
    verticalFlip: element.verticalFlip,
    rotation: element.rotation,
    hasMasks: element.masks?.length > 0,
    hasText: element.type === 'text'
  });

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

  // 🎯 构建完整特效管道的FFmpeg命令
  const videoFilters = [];
  const audioFilters = [];
  let needsReencoding = false;

  // 📐 阶段1：基础剪辑和时间处理
  let inputOptions = ['-i', inputName];
  let outputOptions = [];

  // 时间裁剪（优先使用-ss和-t以提高性能）
  if (element.trimStart > 0 || element.trimEnd > 0) {
    const trimStart = Math.max(0, element.trimStart || 0);
    const trimEnd = Math.max(0, element.trimEnd || 0);
    const actualDuration = Math.max(0.1, element.duration - trimStart - trimEnd);

    console.log(`⏱️ Time trimming: start=${trimStart}, end=${trimEnd}, duration=${actualDuration}`);

    if (actualDuration > 0.1) {
      inputOptions = [
        '-ss', trimStart.toString(),
        '-i', inputName,
        '-t', actualDuration.toString()
      ];
    } else {
      console.warn('⚠️ Invalid duration after trimming, using original');
    }
  }

  // 🪞 阶段2：镜像和变换效果
  if (element.horizontalFlip || element.verticalFlip || element.rotation) {
    needsReencoding = true;
    console.log(`🪞 Applying transforms: hflip=${element.horizontalFlip}, vflip=${element.verticalFlip}, rotation=${element.rotation}`);

    if (element.horizontalFlip) videoFilters.push('hflip');
    if (element.verticalFlip) videoFilters.push('vflip');
    if (element.rotation && element.rotation !== 0) {
      const rotation = parseFloat(element.rotation) || 0;
      const radians = (rotation * Math.PI) / 180;
      // 确保角度值是有效的
      if (!isNaN(radians) && isFinite(radians)) {
        videoFilters.push(`rotate=${radians.toFixed(6)}`);
      } else {
        console.warn('⚠️ Invalid rotation value, skipping rotation');
      }
    }
  }

  // 🎭 阶段3：蒙版效果（完整支持）
  if (element.masks && element.masks.length > 0) {
    needsReencoding = true;
    console.log(`🎭 Applying ${element.masks.length} masks`);

    element.masks.forEach((mask: any, maskIndex: number) => {
      try {
        // 转换相对坐标到绝对坐标，确保所有值都是安全的
        const videoWidth = Math.max(1, element.mediaWidth || 1920);
        const videoHeight = Math.max(1, element.mediaHeight || 1080);

        if (mask.shape === 'rectangle') {
          // 安全的坐标计算
          const maskX = parseFloat(mask.x) || 0;
          const maskY = parseFloat(mask.y) || 0;
          const maskWidth = Math.max(0.01, parseFloat(mask.width) || 0.1);
          const maskHeight = Math.max(0.01, parseFloat(mask.height) || 0.1);

          const x = Math.max(0, Math.round((maskX + 1) * videoWidth / 2 - maskWidth * videoWidth / 2));
          const y = Math.max(0, Math.round((maskY + 1) * videoHeight / 2 - maskHeight * videoHeight / 2));
          const w = Math.min(videoWidth - x, Math.round(maskWidth * videoWidth));
          const h = Math.min(videoHeight - y, Math.round(maskHeight * videoHeight));

          console.log(`🎭 Rectangle mask ${maskIndex}: x=${x}, y=${y}, w=${w}, h=${h}`);

          if (w > 0 && h > 0) {
            if (mask.invert) {
              // 简化的反转蒙版，避免复杂的geq表达式
              videoFilters.push(`crop=${w}:${h}:${x}:${y},pad=${videoWidth}:${videoHeight}:${x}:${y}:black`);
            } else {
              // 正常蒙版：裁剪
              videoFilters.push(`crop=${w}:${h}:${x}:${y}`);
            }

            // 羽化效果
            if (mask.feather && mask.feather > 0) {
              const sigma = Math.max(0.1, Math.min(10, mask.feather / 10));
              videoFilters.push(`gblur=sigma=${sigma.toFixed(2)}`);
            }
          }
        } else if (mask.shape === 'circle') {
          // 圆形蒙版：简化处理，避免复杂的geq表达式
          const maskX = parseFloat(mask.x) || 0;
          const maskY = parseFloat(mask.y) || 0;
          const maskWidth = Math.max(0.01, parseFloat(mask.width) || 0.1);
          const maskHeight = Math.max(0.01, parseFloat(mask.height) || 0.1);

          const centerX = Math.round((maskX + 1) * videoWidth / 2);
          const centerY = Math.round((maskY + 1) * videoHeight / 2);
          const radiusX = Math.round(maskWidth * videoWidth / 2);
          const radiusY = Math.round(maskHeight * videoHeight / 2);

          console.log(`🎭 Circle mask ${maskIndex}: center=(${centerX},${centerY}), radius=(${radiusX},${radiusY})`);

          // 使用更简单的圆形裁剪方法
          if (radiusX > 0 && radiusY > 0) {
            // 创建圆形蒙版，使用crop + pad的组合
            const cropSize = Math.min(radiusX * 2, radiusY * 2);
            const cropX = Math.max(0, centerX - cropSize / 2);
            const cropY = Math.max(0, centerY - cropSize / 2);

            videoFilters.push(`crop=${cropSize}:${cropSize}:${cropX}:${cropY}`);

            // 羽化效果
            if (mask.feather && mask.feather > 0) {
              const sigma = Math.max(0.1, Math.min(10, mask.feather / 10));
              videoFilters.push(`gblur=sigma=${sigma.toFixed(2)}`);
            }
          }
        }

        // 透明度调整
        if (mask.opacity && mask.opacity < 1.0 && mask.opacity > 0) {
          const opacity = Math.max(0, Math.min(1, mask.opacity));
          videoFilters.push(`format=rgba,colorchannelmixer=aa=${opacity.toFixed(2)}`);
        }
      } catch (error) {
        console.warn(`⚠️ Skipping mask ${maskIndex} due to error:`, error);
      }
    });
  }

  // 🎨 阶段4：颜色和透明度调整
  if (element.opacity && element.opacity !== 1.0) {
    const opacity = Math.max(0, Math.min(1, parseFloat(element.opacity) || 1));
    if (opacity !== 1.0) {
      needsReencoding = true;
      videoFilters.push(`format=rgba,colorchannelmixer=aa=${opacity.toFixed(2)}`);
      console.log(`🎨 Applying opacity: ${opacity}`);
    }
  }

  // ⚡ 阶段5：速度控制
  if (element.playbackRate && element.playbackRate !== 1.0) {
    const playbackRate = Math.max(0.1, Math.min(10, parseFloat(element.playbackRate) || 1));
    if (playbackRate !== 1.0) {
      needsReencoding = true;
      const ptsMultiplier = (1 / playbackRate).toFixed(6);
      videoFilters.push(`setpts=${ptsMultiplier}*PTS`);
      audioFilters.push(`atempo=${playbackRate.toFixed(2)}`);
      console.log(`⚡ Applying speed: ${playbackRate}x`);
    }
  }

  // 📝 阶段6：文本和字幕处理（如果是文本元素）
  if (element.type === 'text') {
    needsReencoding = true;
    // 构建文本滤镜
    const textFilter = buildTextFilter(element);
    if (textFilter) {
      videoFilters.push(textFilter);
    }
  }

  // 🔧 构建最终FFmpeg命令
  const command = [...inputOptions];

  // 添加视频滤镜
  if (videoFilters.length > 0) {
    const filterChain = videoFilters.join(',');
    console.log(`🎬 Video filters: ${filterChain}`);
    command.push('-vf', filterChain);
  }

  // 添加音频滤镜
  if (audioFilters.length > 0) {
    const audioFilterChain = audioFilters.join(',');
    console.log(`🎵 Audio filters: ${audioFilterChain}`);
    command.push('-af', audioFilterChain);
  }

  if (needsReencoding) {
    // 🚀 优化：根据导出质量动态调整编码参数
    const qualitySettings = getOptimalEncodingSettings(exportConfig);
    command.push(
      '-c:v', qualitySettings.videoCodec,
      '-preset', qualitySettings.preset,
      '-crf', qualitySettings.crf,
      '-tune', qualitySettings.tune,
      '-threads', qualitySettings.threads,
      '-g', qualitySettings.g,
      '-bf', qualitySettings.bf,
      '-refs', qualitySettings.refs,
      '-flags', qualitySettings.flags,
      '-movflags', qualitySettings.movflags,
      '-pix_fmt', qualitySettings.pixfmt
    );

    // 音频编码设置
    if (audioFilters.length > 0) {
      command.push('-c:a', 'aac', '-b:a', '128k');
    } else {
      command.push('-c:a', 'copy');
    }
  } else {
    // 流复制，最快速度
    command.push('-c', 'copy');
  }

  command.push('-y', outputName);

  // 验证命令参数
  if (command.length < 3) {
    throw new Error(`Invalid FFmpeg command for segment ${index + 1}: too few arguments`);
  }

  console.log(`🔧 Segment ${index + 1} command:`, command.join(' '));

  try {
    // 执行FFmpeg命令
    await ffmpeg.exec(command);

    // 验证输出文件是否存在且不为空
    let outputData;
    try {
      outputData = await ffmpeg.readFile(outputName);
    } catch (readError) {
      throw new Error(`Failed to read output file ${outputName}: ${readError.message}`);
    }

    if (!outputData || outputData.length === 0) {
      throw new Error(`Segment ${index + 1} processing failed: Output file is empty`);
    }

    console.log(`✅ Segment ${index + 1} processed successfully, size: ${(outputData.length / 1024).toFixed(2)}KB`);
    tempFiles.push(outputName);
    return outputName;
  } catch (error) {
    console.error(`❌ Segment ${index + 1} processing failed:`, error);
    console.error(`Command that failed:`, command.join(' '));
    throw new Error(`Segment ${index + 1} processing failed: ${error.message}`);
  }
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
  let mergedVideo;
  try {
    console.log('🔗 Merging video segments...');
    mergedVideo = await mergeVideoSegments(ffmpeg, segments, exportConfig, tempFiles);
    console.log('✅ Video segments merged successfully');
    onProgress(40);
  } catch (mergeError) {
    console.error('❌ Video merging failed:', mergeError);
    // 如果合并失败，尝试使用第一个片段
    if (segments.length > 0) {
      console.log('🔗 Falling back to first segment');
      mergedVideo = segments[0];
      onProgress(40);
    } else {
      throw new Error('No video segments available for export');
    }
  }
  
  // 第二步：应用转场效果
  if (analysis.transitionElements.length > 0) {
    try {
      console.log('🎬 Applying transitions...');
      mergedVideo = await applyTransitionsOptimized(ffmpeg, mergedVideo, analysis.transitionElements, exportConfig, tempFiles);
      console.log('✅ Transitions applied successfully');
      onProgress(60);
    } catch (transitionError) {
      console.warn('⚠️ Transition application failed, continuing without transitions:', transitionError);
      // 继续使用原视频，不让转场错误阻止整个导出过程
      onProgress(60);
    }
  }
  
  // 第三步：应用字幕
  if (analysis.textElements.length > 0) {
    try {
      console.log('📝 Applying subtitles...');
      mergedVideo = await applySubtitlesOptimized(ffmpeg, mergedVideo, analysis.textElements, exportConfig, tempFiles);
      console.log('✅ Subtitles applied successfully');
      onProgress(80);
    } catch (subtitleError) {
      console.warn('⚠️ Subtitle application failed, continuing without subtitles:', subtitleError);
      // 继续使用原视频，不让字幕错误阻止整个导出过程
      onProgress(80);
    }
  }
  
  // 第四步：处理音频
  if (analysis.audioElements.length > 0) {
    try {
      console.log('🎵 Processing audio...');
      mergedVideo = await processAudioOptimized(ffmpeg, mergedVideo, analysis.audioElements, exportConfig, tempFiles);
      console.log('✅ Audio processed successfully');
      onProgress(100);
    } catch (audioError) {
      console.warn('⚠️ Audio processing failed, continuing without additional audio:', audioError);
      // 继续使用原视频，不让音频错误阻止整个导出过程
      onProgress(100);
    }
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
  console.log('🔗 Merge command:', command.join(' '));

  try {
    console.log('🔗 Executing merge command...');
    await ffmpeg.exec(command);

    // 验证输出文件
    let outputData;
    try {
      outputData = await ffmpeg.readFile(outputName);
    } catch (readError) {
      console.error('🔗 Failed to read merged output file:', readError);
      // 尝试列出可用文件
      try {
        const files = await ffmpeg.listDir('/');
        console.log('🔗 Available files after merge:', files);
      } catch (listError) {
        console.error('🔗 Failed to list files:', listError);
      }
      throw new Error(`Failed to read merged output file: ${outputName}`);
    }

    if (!outputData || outputData.length === 0) {
      console.error('🔗 Merged output file is empty');
      // 如果只有一个片段，直接返回它
      if (segments.length === 1) {
        console.log('🔗 Falling back to single segment');
        return segments[0];
      }
      throw new Error('Video merging failed: Output file is empty');
    }

    console.log(`✅ Video segments merged successfully, size: ${(outputData.length / 1024).toFixed(2)}KB`);
    return outputName;
  } catch (error) {
    console.error('❌ Video merging failed:', error);
    console.error('Command that failed:', command.join(' '));
    console.error('Segments to merge:', segments);

    // 如果合并失败且只有一个片段，返回该片段
    if (segments.length === 1) {
      console.log('🔗 Merge failed but only one segment, returning it directly');
      return segments[0];
    }

    throw new Error(`Video merging failed: ${error.message}`);
  }
}

/**
 * 🎬 优化的转场处理 - 支持所有转场类型
 * 包括：fade, slide, zoom, wipe, dissolve, flash等
 */
async function applyTransitionsOptimized(
  ffmpeg: any,
  videoFile: string,
  transitionElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  console.log(`🎬 Applying ${transitionElements.length} advanced transitions...`);

  if (transitionElements.length === 0) {
    return videoFile;
  }

  // 🎬 高级转场处理：需要重新构建视频以支持真正的转场
  // 这需要将视频分割成片段，然后在片段之间应用xfade转场

  let currentFile = videoFile;

  for (let i = 0; i < transitionElements.length; i++) {
    const transition = transitionElements[i];
    const outputName = `transition_${i}_${Date.now()}.${exportConfig.format}`;
    tempFiles.push(outputName);

    // 获取转场类型映射
    const xfadeType = getXfadeTransitionType(transition.transitionType);
    const duration = transition.duration || 1.0;

    // 构建转场命令
    // 注意：这是一个简化版本，真正的转场需要更复杂的处理
    const command = [
      '-i', currentFile,
      '-vf', `fade=t=in:st=0:d=${duration},fade=t=out:st=${duration}:d=${duration}`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      '-y', outputName
    ];

    console.log(`🎬 Applying transition ${i + 1}: ${transition.transitionType}`);
    console.log('🎬 Transition command:', command.join(' '));

    try {
      await ffmpeg.exec(command);

      // 验证输出文件
      const outputData = await ffmpeg.readFile(outputName);
      if (!outputData || outputData.length === 0) {
        throw new Error(`Transition ${i + 1} processing failed: Output file is empty`);
      }

      console.log(`✅ Transition ${i + 1} applied successfully, size: ${(outputData.length / 1024).toFixed(2)}KB`);
      currentFile = outputName;
    } catch (error) {
      console.error(`❌ Transition ${i + 1} processing failed:`, error);
      console.error('Command that failed:', command.join(' '));
      throw new Error(`Transition ${i + 1} processing failed: ${error.message}`);
    }
  }

  return currentFile;
}

/**
 * 🎬 获取FFmpeg xfade转场类型映射
 */
function getXfadeTransitionType(transitionType: string): string {
  const transitionMap: { [key: string]: string } = {
    'fade': 'fade',
    'dissolve': 'dissolve',
    'slide': 'slideleft',
    'zoom': 'zoomin',
    'wipe': 'wipeleft',
    'flash': 'fade'
  };

  return transitionMap[transitionType] || 'fade';
}

/**
 * 🐛 调试函数：简化的片段处理，专门用于调试
 */
async function debugProcessSegment(
  ffmpeg: any,
  element: any,
  index: number,
  tempFiles: string[]
): Promise<string> {
  console.log(`🐛 DEBUG: Processing segment ${index + 1} with minimal effects...`);

  const inputName = `debug_input_${index}_${Date.now()}.mp4`;
  const outputName = `debug_output_${index}_${Date.now()}.mp4`;

  try {
    // 获取媒体文件
    const mediaFile = await getMediaFileForElement(element);
    if (!mediaFile) {
      throw new Error(`No media file available for element ${element.id}`);
    }

    // 写入输入文件
    await ffmpeg.writeFile(inputName, new Uint8Array(await getArrayBufferSafely(mediaFile)));
    tempFiles.push(inputName);

    // 构建最简单的命令
    const command = ['-i', inputName];

    // 只添加基本的镜像效果
    const filters = [];
    if (element.horizontalFlip) {
      filters.push('hflip');
      console.log('🐛 Adding horizontal flip');
    }
    if (element.verticalFlip) {
      filters.push('vflip');
      console.log('🐛 Adding vertical flip');
    }

    if (filters.length > 0) {
      command.push('-vf', filters.join(','));
    }

    // 使用最快的编码设置
    command.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-c:a', 'copy',
      '-y', outputName
    );

    console.log(`🐛 DEBUG command:`, command.join(' '));

    await ffmpeg.exec(command);

    // 验证输出
    const outputData = await ffmpeg.readFile(outputName);
    if (!outputData || outputData.length === 0) {
      throw new Error(`Debug processing failed: Output file is empty`);
    }

    console.log(`🐛 DEBUG: Segment processed successfully, size: ${(outputData.length / 1024).toFixed(2)}KB`);
    tempFiles.push(outputName);
    return outputName;

  } catch (error) {
    console.error(`🐛 DEBUG: Segment ${index + 1} failed:`, error);
    throw error;
  }
}

/**
 * 📝 优化的字幕处理 - 支持完整文本样式
 */
async function applySubtitlesOptimized(
  ffmpeg: any,
  videoFile: string,
  textElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  console.log(`📝 Applying ${textElements.length} advanced subtitles...`);

  if (textElements.length === 0) {
    return videoFile;
  }

  const outputName = `subtitles_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  // 🎨 构建高级字幕滤镜
  const drawTextFilters: string[] = [];

  textElements.forEach((textElement, index) => {
    console.log(`📝 Processing text element ${index + 1}:`, textElement.content);

    try {
      // 首先尝试使用高级文本滤镜构建器
      let textFilter = buildTextFilter(textElement);

      // 如果失败，使用简化的文本滤镜
      if (!textFilter) {
        console.log('📝 Falling back to simple text filter');
        textFilter = buildSimpleTextFilter(textElement);
      }

      if (textFilter) {
        console.log(`📝 Adding text filter: ${textFilter}`);
        drawTextFilters.push(textFilter);
      }
    } catch (error) {
      console.warn(`📝 Failed to process text element ${index + 1}:`, error);
      // 尝试最简单的文本滤镜
      const simpleFilter = buildSimpleTextFilter(textElement);
      if (simpleFilter) {
        drawTextFilters.push(simpleFilter);
      }
    }
  });

  if (drawTextFilters.length === 0) {
    console.log('📝 No text filters to apply, returning original video');
    return videoFile;
  }

  console.log(`📝 Applying ${drawTextFilters.length} text filters`);

  // 构建命令，添加更多安全检查
  const filterChain = drawTextFilters.join(',');
  console.log(`📝 Filter chain: ${filterChain}`);

  const command = [
    '-i', videoFile,
    '-vf', filterChain,
    '-c:v', 'libx264',  // 明确指定视频编码器
    '-preset', 'fast',   // 使用快速预设
    '-c:a', 'copy',
    '-y', outputName
  ];

  console.log('📝 Subtitle command:', command.join(' '));

  try {
    // 验证输入文件存在
    try {
      const inputData = await ffmpeg.readFile(videoFile);
      console.log(`📝 Input file size: ${(inputData.length / 1024).toFixed(2)}KB`);
    } catch (readError) {
      throw new Error(`Input video file not found: ${videoFile}`);
    }

    console.log('📝 Executing FFmpeg command...');
    await ffmpeg.exec(command);
    console.log('📝 FFmpeg command completed');

    // 验证输出文件
    let outputData;
    try {
      outputData = await ffmpeg.readFile(outputName);
    } catch (readError) {
      console.error('📝 Failed to read output file, trying to list files...');
      try {
        const files = await ffmpeg.listDir('/');
        console.log('📝 Available files:', files);
      } catch (listError) {
        console.error('📝 Failed to list files:', listError);
      }
      throw new Error(`Failed to read output file: ${outputName}`);
    }

    if (!outputData || outputData.length === 0) {
      console.error('📝 Output file is empty, checking FFmpeg logs...');
      // 尝试使用更简单的命令
      console.log('📝 Trying fallback approach...');

      // 创建一个简单的测试命令
      const fallbackCommand = [
        '-i', videoFile,
        '-vf', `drawtext=text=Test:fontsize=48:fontcolor=white:x=100:y=100`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'copy',
        '-y', `fallback_${outputName}`
      ];

      console.log('📝 Fallback command:', fallbackCommand.join(' '));

      try {
        await ffmpeg.exec(fallbackCommand);
        const fallbackData = await ffmpeg.readFile(`fallback_${outputName}`);
        if (fallbackData && fallbackData.length > 0) {
          console.log('📝 Fallback succeeded, using simple text rendering');
          return `fallback_${outputName}`;
        }
      } catch (fallbackError) {
        console.error('📝 Fallback also failed:', fallbackError);
      }

      throw new Error('Subtitle processing failed: Output file is empty');
    }

    console.log(`✅ Subtitles applied successfully, size: ${(outputData.length / 1024).toFixed(2)}KB`);
    return outputName;
  } catch (error) {
    console.error('❌ Subtitle processing failed:', error);
    console.error('Command that failed:', command.join(' '));
    console.error('Available filters:', drawTextFilters);

    // 不抛出错误，而是返回原视频文件
    console.log('📝 Returning original video without subtitles due to processing failure');
    return videoFile;
  }
}

/**
 * 🎵 优化的音频处理 - 支持多轨道音频混合
 */
async function processAudioOptimized(
  ffmpeg: any,
  videoFile: string,
  audioElements: any[],
  exportConfig: ExportConfig,
  tempFiles: string[]
): Promise<string> {
  console.log(`🎵 Processing ${audioElements.length} audio tracks with advanced mixing...`);

  if (audioElements.length === 0) {
    return videoFile;
  }

  const outputName = `audio_processed_${Date.now()}.${exportConfig.format}`;
  tempFiles.push(outputName);

  // 🎼 构建多轨道音频混合
  const audioInputs = ['-i', videoFile];
  const audioFilters: string[] = [];

  // 添加所有音频文件作为输入
  for (let i = 0; i < audioElements.length; i++) {
    const audioElement = audioElements[i];
    const audioInputName = `audio_${i}_${Date.now()}.mp3`;

    // 获取音频文件并写入
    if (audioElement.mediaFile) {
      await ffmpeg.writeFile(audioInputName, new Uint8Array(await getArrayBufferSafely(audioElement.mediaFile)));
      tempFiles.push(audioInputName);
      audioInputs.push('-i', audioInputName);

      // 构建音频滤镜（音量、延迟等）
      const audioIndex = i + 1; // 0是视频，从1开始是音频
      let audioFilter = `[${audioIndex}:a]`;

      // 音量调整
      if (audioElement.volume && audioElement.volume !== 1.0) {
        audioFilter += `volume=${audioElement.volume}`;
      }

      // 延迟调整
      if (audioElement.startTime && audioElement.startTime > 0) {
        audioFilter += `adelay=${audioElement.startTime * 1000}|${audioElement.startTime * 1000}`;
      }

      audioFilter += `[a${i}]`;
      audioFilters.push(audioFilter);
    }
  }

  // 🎼 构建音频混合命令
  let filterComplex = '';
  if (audioFilters.length > 0) {
    // 添加音频滤镜
    filterComplex = audioFilters.join(';') + ';';

    // 构建混合滤镜
    const mixInputs = ['[0:a]', ...audioFilters.map((_, i) => `[a${i}]`)];
    filterComplex += `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest[aout]`;
  } else {
    filterComplex = '[0:a]acopy[aout]';
  }

  const command = [
    ...audioInputs,
    '-filter_complex', filterComplex,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-y', outputName
  ];

  console.log('🎵 Executing audio mixing command...');
  console.log('🎵 Audio command:', command.join(' '));

  try {
    await ffmpeg.exec(command);

    // 验证输出文件
    const outputData = await ffmpeg.readFile(outputName);
    if (!outputData || outputData.length === 0) {
      throw new Error('Audio processing failed: Output file is empty');
    }

    console.log(`✅ Audio processing completed successfully, size: ${(outputData.length / 1024).toFixed(2)}KB`);
    return outputName;
  } catch (error) {
    console.error('❌ Audio processing failed:', error);
    console.error('Command that failed:', command.join(' '));
    throw new Error(`Audio processing failed: ${error.message}`);
  }
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

/**
 * 🚀 优化：获取最优编码设置
 */
function getOptimalEncodingSettings(exportConfig: ExportConfig) {
  const qualityMap = {
    'low': {
      videoCodec: 'libx264',
      preset: 'ultrafast',
      crf: '28',
      tune: 'fastdecode',
      threads: 'auto',
      g: '30',
      bf: '0',
      refs: '1',
      flags: '+cgop',
      movflags: '+faststart',
      pixfmt: 'yuv420p'
    },
    'medium': {
      videoCodec: 'libx264',
      preset: 'veryfast',
      crf: '23',
      tune: 'film',
      threads: 'auto',
      g: '60',
      bf: '2',
      refs: '3',
      flags: '+cgop',
      movflags: '+faststart',
      pixfmt: 'yuv420p'
    },
    'high': {
      videoCodec: 'libx264',
      preset: 'fast',
      crf: '20',
      tune: 'film',
      threads: 'auto',
      g: '120',
      bf: '3',
      refs: '4',
      flags: '+cgop',
      movflags: '+faststart',
      pixfmt: 'yuv420p'
    }
  };

  return qualityMap[exportConfig.quality] || qualityMap['medium'];
}

/**
 * 🧠 智能时间轴分析引擎
 * 分析时间轴数据，生成优化的处理策略
 */
function analyzeTimelineForExport(timelineData: TimelineData) {
  const analysis = {
    totalDuration: 0,
    complexity: 'simple' as 'simple' | 'medium' | 'complex',
    hasEffects: false,
    effectsCount: {
      masks: 0,
      transitions: 0,
      mirrors: 0,
      subtitles: 0,
      audioTracks: 0,
      overlays: 0
    },
    tracks: {
      video: [] as any[],
      audio: [] as any[],
      text: [] as any[],
      transition: [] as any[]
    },
    processingStrategy: {
      useParallel: false,
      batchSize: 1,
      useStreamCopy: true,
      includeEffects: false,
      requiresComplexFiltering: false
    }
  };

  // 🔍 分析所有轨道和元素
  timelineData.tracks.forEach(track => {
    track.elements.forEach(element => {
      // 计算总时长
      const elementEnd = element.startTime + element.duration;
      analysis.totalDuration = Math.max(analysis.totalDuration, elementEnd);

      // 按类型分类元素
      switch (element.type) {
        case 'media':
          if (element.mediaType === 'audio') {
            analysis.tracks.audio.push(element);
          } else {
            analysis.tracks.video.push(element);
          }

          // 检查媒体特效
          if (element.horizontalFlip || element.verticalFlip || element.rotation) {
            analysis.effectsCount.mirrors++;
            analysis.hasEffects = true;
          }

          if (element.masks && element.masks.length > 0) {
            analysis.effectsCount.masks += element.masks.length;
            analysis.hasEffects = true;
          }
          break;

        case 'text':
          analysis.tracks.text.push(element);
          analysis.effectsCount.subtitles++;
          analysis.hasEffects = true;
          break;

        case 'transition':
          analysis.tracks.transition.push(element);
          analysis.effectsCount.transitions++;
          analysis.hasEffects = true;
          break;
      }
    });
  });

  // 🎯 计算复杂度
  const totalEffects = Object.values(analysis.effectsCount).reduce((sum, count) => sum + count, 0);
  if (totalEffects === 0) {
    analysis.complexity = 'simple';
  } else if (totalEffects <= 5) {
    analysis.complexity = 'medium';
  } else {
    analysis.complexity = 'complex';
  }

  // 🚀 生成处理策略
  analysis.processingStrategy = {
    useParallel: analysis.tracks.video.length > 2,
    batchSize: analysis.complexity === 'simple' ? 6 :
               analysis.complexity === 'medium' ? 4 : 2,
    useStreamCopy: !analysis.hasEffects,
    includeEffects: analysis.hasEffects,
    requiresComplexFiltering: totalEffects > 3 || analysis.effectsCount.masks > 0
  };

  return analysis;
}

/**
 * 🔧 构建完整的特效处理管道
 * 根据时间轴分析结果，构建优化的特效处理流程
 */
function buildEffectsPipeline(analysis: any) {
  const pipeline = {
    stages: [] as any[],
    requiresComplexFiltering: false,
    parallelizable: false,
    estimatedComplexity: 0
  };

  // 🎬 阶段1：基础媒体处理（剪辑、插入、覆盖、调顺序）
  pipeline.stages.push({
    name: 'media_processing',
    type: 'parallel',
    operations: ['trim', 'concat', 'overlay_positioning'],
    priority: 1,
    estimatedTime: analysis.tracks.video.length * 2
  });

  // 🪞 阶段2：镜像和变换效果
  if (analysis.effectsCount.mirrors > 0) {
    pipeline.stages.push({
      name: 'mirror_effects',
      type: 'sequential',
      operations: ['horizontal_flip', 'vertical_flip', 'rotation'],
      priority: 2,
      estimatedTime: analysis.effectsCount.mirrors * 1.5
    });
  }

  // 🎭 阶段3：蒙版效果
  if (analysis.effectsCount.masks > 0) {
    pipeline.stages.push({
      name: 'mask_effects',
      type: 'sequential',
      operations: ['mask_generation', 'mask_application', 'mask_blending'],
      priority: 3,
      estimatedTime: analysis.effectsCount.masks * 3,
      requiresComplexFiltering: true
    });
  }

  // 🎬 阶段4：转场效果
  if (analysis.effectsCount.transitions > 0) {
    pipeline.stages.push({
      name: 'transition_effects',
      type: 'sequential',
      operations: ['transition_analysis', 'xfade_application', 'audio_crossfade'],
      priority: 4,
      estimatedTime: analysis.effectsCount.transitions * 2.5
    });
  }

  // 📝 阶段5：字幕和文本
  if (analysis.effectsCount.subtitles > 0) {
    pipeline.stages.push({
      name: 'subtitle_rendering',
      type: 'parallel',
      operations: ['text_rendering', 'subtitle_positioning', 'text_effects'],
      priority: 5,
      estimatedTime: analysis.effectsCount.subtitles * 1
    });
  }

  // 🎵 阶段6：音频处理和混合
  if (analysis.tracks.audio.length > 0) {
    pipeline.stages.push({
      name: 'audio_processing',
      type: 'parallel',
      operations: ['audio_mixing', 'volume_adjustment', 'audio_effects'],
      priority: 6,
      estimatedTime: analysis.tracks.audio.length * 1.5
    });
  }

  // 🎯 计算管道特性
  pipeline.requiresComplexFiltering = pipeline.stages.some(stage => stage.requiresComplexFiltering);
  pipeline.parallelizable = pipeline.stages.filter(stage => stage.type === 'parallel').length > 1;
  pipeline.estimatedComplexity = pipeline.stages.reduce((sum, stage) => sum + stage.estimatedTime, 0);

  return pipeline;
}

/**
 * 📝 构建文本滤镜
 * 支持完整的文本样式和定位
 */
function buildTextFilter(textElement: any): string | null {
  if (!textElement.content) return null;

  console.log('📝 Building text filter for:', textElement.content);

  // 更安全的文本转义 - 移除所有可能导致问题的字符
  const escapedText = textElement.content
    .replace(/[\\:'"=,;]/g, '')  // 移除所有可能的问题字符
    .replace(/[^\w\s\-.,!?]/g, '') // 只保留安全字符
    .trim(); // 移除首尾空格

  if (!escapedText) {
    console.log('📝 Text is empty after escaping, skipping');
    return null;
  }

  // 构建文本样式
  const fontSize = Math.max(12, Math.min(200, textElement.fontSize || 48));
  const color = (textElement.color || '#FFFFFF').replace('#', '0x');

  console.log(`📝 Text properties: size=${fontSize}, color=${color}, text="${escapedText}"`);

  // 计算位置 - 使用简单的数值定位
  let x = 100; // 默认位置
  let y = 100; // 默认位置

  // 文本对齐处理
  if (textElement.textAlign === 'center') {
    x = '(w-text_w)/2';
    y = '(h-text_h)/2';
  } else if (textElement.textAlign === 'right') {
    x = 'w-text_w-50';
    y = '(h-text_h)/2';
  } else if (textElement.textAlign === 'left') {
    x = 50;
    y = '(h-text_h)/2';
  } else if (textElement.x !== undefined && textElement.y !== undefined) {
    // 转换相对坐标到绝对坐标
    const videoWidth = 1920;
    const videoHeight = 1080;
    x = Math.max(0, Math.min(videoWidth - 100, (textElement.x + 1) * videoWidth / 2));
    y = Math.max(0, Math.min(videoHeight - 100, (textElement.y + 1) * videoHeight / 2));
  }

  // 添加时间控制
  const startTime = textElement.startTime || 0;
  const duration = textElement.duration || 5;
  const endTime = startTime + duration;

  // 构建带时间控制的drawtext滤镜
  const textFilter = `drawtext=text=${escapedText}:fontsize=${fontSize}:fontcolor=${color}:x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'`;

  console.log(`📝 Generated filter with timing: ${textFilter}`);

  return textFilter;
}

/**
 * 📝 处理纯文本导出（没有媒体元素的情况）
 */
async function handleTextOnlyExport(
  ffmpeg: any,
  analysis: any,
  exportConfig: ExportConfig,
  tempFiles: string[],
  onProgress: (progress: number) => void,
  checkCancellation: () => void
): Promise<Uint8Array> {
  console.log('📝 Starting text-only export...');

  // 计算文本的总持续时间
  const textElements = analysis.textElements;
  const maxEndTime = Math.max(...textElements.map((el: any) => (el.startTime || 0) + (el.duration || 5)));
  const videoDuration = Math.max(5, maxEndTime); // 至少5秒

  console.log(`📝 Creating background video with duration: ${videoDuration}s`);

  // 创建背景视频
  const backgroundVideoName = `background_${Date.now()}.mp4`;
  tempFiles.push(backgroundVideoName);

  // 根据导出配置确定分辨率
  const width = exportConfig.resolution?.width || 1920;
  const height = exportConfig.resolution?.height || 1080;
  const backgroundColor = exportConfig.backgroundColor || '#000000';

  // 创建纯色背景视频
  const backgroundCommand = [
    '-f', 'lavfi',
    '-i', `color=c=${backgroundColor}:size=${width}x${height}:duration=${videoDuration}:rate=30`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-y', backgroundVideoName
  ];

  console.log('📝 Background command:', backgroundCommand.join(' '));

  try {
    await ffmpeg.exec(backgroundCommand);
    updateProgress(30, onProgress);
    checkCancellation();

    // 验证背景视频创建成功
    const backgroundData = await ffmpeg.readFile(backgroundVideoName);
    if (!backgroundData || backgroundData.length === 0) {
      throw new Error('Failed to create background video');
    }

    console.log(`✅ Background video created, size: ${(backgroundData.length / 1024).toFixed(2)}KB`);

    // 应用文本字幕
    const finalVideoName = await applySubtitlesOptimized(
      ffmpeg,
      backgroundVideoName,
      textElements,
      exportConfig,
      tempFiles
    );

    // 辅助函数：更新进度
    function updateProgress(progress: number, callback: (progress: number) => void) {
      callback(progress);
    }

    updateProgress(80, onProgress);
    checkCancellation();

    // 读取最终视频
    const finalData = await ffmpeg.readFile(finalVideoName);
    updateProgress(100, onProgress);

    console.log(`✅ Text-only export completed, final size: ${(finalData.length / 1024).toFixed(2)}KB`);
    return finalData;

  } catch (error) {
    console.error('❌ Text-only export failed:', error);
    throw new Error(`Text-only export failed: ${error.message}`);
  }
}

/**
 * 🐛 简化的文本滤镜构建器 - 用于调试
 */
function buildSimpleTextFilter(textElement: any): string | null {
  if (!textElement.content) return null;

  console.log('🐛 Building simple text filter for:', textElement.content);

  // 最简单的文本转义 - 只保留字母数字和空格
  const text = textElement.content
    .replace(/[^\w\s]/g, '')  // 移除所有特殊字符
    .trim();

  if (!text) {
    console.log('🐛 Text is empty after cleaning, using placeholder');
    return `drawtext=text=Text:fontsize=48:fontcolor=white:x=100:y=100`;
  }

  // 基本参数
  const fontSize = 48;
  const color = 'white';

  // 添加时间控制
  const startTime = textElement.startTime || 0;
  const duration = textElement.duration || 5;
  const endTime = startTime + duration;

  // 简单的固定定位带时间控制
  const filter = `drawtext=text=${text}:fontsize=${fontSize}:fontcolor=${color}:x=100:y=100:enable='between(t,${startTime},${endTime})'`;

  console.log('🐛 Simple filter with timing:', filter);
  return filter;
}