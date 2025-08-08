// operations/basic-video-ops.ts - 基础视频操作功能

import { initFFmpeg } from '../core/init';
import { getOptimalEncodingSettings, generateCacheKey } from '../core/config';
import { cacheOperations } from '../utils/export-utils';
import type { VideoInfo, ProgressCallback } from '../types/ffmpeg-types';

/**
 * 生成视频缩略图
 */
export const generateThumbnail = async (
  videoFile: File,
  timeInSeconds: number = 1
): Promise<string> => {
  // 检查缓存
  const cacheKey = `${videoFile.name}_${videoFile.size}_${timeInSeconds}`;
  if (cacheOperations.thumbnail.has(cacheKey)) {
    console.log('📸 Using cached thumbnail');
    return cacheOperations.thumbnail.get(cacheKey)!;
  }
  
  const ffmpeg = await initFFmpeg();
  
  const inputName = 'input.mp4';
  const outputName = 'thumbnail.jpg';
  
  try {
    // Write input file
    await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
    
    // Generate thumbnail at specific time with optimized settings
    await ffmpeg.exec([
      '-i', inputName,
      '-ss', timeInSeconds.toString(),
      '-vframes', '1',
      '-vf', 'scale=320:240:flags=fast_bilinear', // 使用快速缩放算法
      '-q:v', '3', // 稍微降低质量以提升速度
      '-y', // 覆盖输出文件
      outputName
    ]);
    
    // Read output file
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    
    // 缓存结果
    cacheOperations.thumbnail.set(cacheKey, url);
    
    // 清理文件
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return url;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
};

/**
 * 极致优化的视频导出函数
 */
export const exportVideo = async (
  videoFile: File,
  format: 'mp4' | 'webm' | 'avi' | 'mov' = 'mp4',
  quality: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: ProgressCallback
): Promise<Blob> => {
  const startTime = performance.now();
  console.log(`🚀 Starting ultra-fast video export: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(2)}MB)`);
  
  // 获取视频信息以优化编码设置
  const videoInfo = await getVideoInfo(videoFile);
  const settings = getOptimalEncodingSettings(videoFile.size, videoInfo.duration, format, quality);
  
  // 检查缓存
  const cacheKey = generateCacheKey(videoFile, format, quality, settings);
  if (cacheOperations.export.has(cacheKey)) {
    console.log('⚡ Using cached export result');
    onProgress?.(100);
    return cacheOperations.export.get(cacheKey)!;
  }
  
  const ffmpeg = await initFFmpeg();
  
  // 动态生成文件名
  const timestamp = Date.now();
  const fileExtension = videoFile.name.split('.').pop() || 'mp4';
  const inputName = `input_${timestamp}.${fileExtension}`;
  const outputName = `output_${timestamp}.${format}`;
  
  try {
    console.log('⚙️ Using optimized encoding settings:', settings);
    
    // 设置进度回调
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }
    
    // 并行写入输入文件
    console.log('📝 Writing input file...');
    const writeStart = performance.now();
    await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
    console.log(`📝 File write completed in ${(performance.now() - writeStart).toFixed(2)}ms`);
    
    // 构建优化的FFmpeg命令
    const command = [
      '-i', inputName,
      '-c:v', settings.videoCodec,
      '-crf', settings.crf,
      '-preset', settings.preset,
      '-tune', settings.tune,
      '-threads', settings.threads,
      '-g', settings.g,
      '-keyint_min', settings.keyint_min,
      '-sc_threshold', settings.sc_threshold,
      '-bf', settings.bf,
      '-refs', settings.refs,
      '-flags', settings.flags,
      '-movflags', settings.movflags
    ];
    
    // 添加格式特定优化
    if (format === 'webm') {
      const webmSettings = settings as any;
      command.push(
        '-deadline', webmSettings.deadline,
        '-cpu-used', webmSettings.cpuUsed,
        '-tile-columns', webmSettings.tileColumns,
        '-frame-parallel', webmSettings.frameParallel,
        '-lag-in-frames', webmSettings.lagInFrames,
        '-auto-alt-ref', webmSettings.autoAltRef,
        '-arnr-maxframes', webmSettings.arnrMaxFrames,
        '-arnr-strength', webmSettings.arnrStrength,
        '-enable-cdef', webmSettings.enableCdef,
        '-enable-restoration', webmSettings.enableRestoration
      );
    }
    
    // 添加音频编码器
    command.push('-c:a', settings.audioCodec);
    
    // 添加输出文件
    command.push('-y', outputName);
    
    console.log('🔧 Executing optimized FFmpeg command:', command);
    const execStart = performance.now();
    const result = await ffmpeg.exec(command);
    console.log(`🔧 FFmpeg execution completed in ${(performance.now() - execStart).toFixed(2)}ms:`, result);
    
    // 读取输出文件
    console.log('📖 Reading output file...');
    const readStart = performance.now();
    const data = await ffmpeg.readFile(outputName);
    const mimeType = format === 'webm' ? 'video/webm' : 
                    format === 'mp4' ? 'video/mp4' :
                    format === 'avi' ? 'video/x-msvideo' :
                    'video/quicktime';
    const blob = new Blob([data], { type: mimeType });
    console.log(`📖 File read completed in ${(performance.now() - readStart).toFixed(2)}ms`);
    
    const totalTime = performance.now() - startTime;
    const speed = (videoFile.size / 1024 / 1024) / (totalTime / 1000); // MB/s
    console.log(`✅ Export completed in ${totalTime.toFixed(2)}ms (${speed.toFixed(2)} MB/s)`);
    console.log(`📊 Input: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB, Output: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    
    // 缓存结果
    cacheOperations.export.set(cacheKey, blob);
    
    // 清理临时文件
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup temporary files:', cleanupError);
    }
    
    return blob;
  } catch (error) {
    console.error('❌ Export failed:', error);
    
    // 清理临时文件
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup temporary files:', cleanupError);
    }
    
    throw error;
  }
};

/**
 * 视频裁剪功能
 */
export const trimVideo = async (
  videoFile: File,
  startTime: number,
  endTime: number,
  onProgress?: ProgressCallback
): Promise<Blob> => {
  const ffmpeg = await initFFmpeg();
  
  // 动态生成文件名
  const timestamp = Date.now();
  const fileExtension = videoFile.name.split('.').pop() || 'mp4';
  const inputName = `input_${timestamp}.${fileExtension}`;
  const outputName = `trimmed_${timestamp}.${fileExtension}`;
  
  try {
    console.log('Starting video trim:', { startTime, endTime });
    
    // Set up progress callback
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }
    
    // Write input file
    await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
    
    // Build FFmpeg command for trimming with optimized settings
    const command = [
      '-i', inputName,
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy', // 使用copy模式，不重新编码，极快
      '-avoid_negative_ts', 'make_zero',
      '-y', // 覆盖输出文件
      outputName
    ];
    
    console.log('Executing trim command:', command);
    const result = await ffmpeg.exec(command);
    console.log('Trim execution completed:', result);
    
    // Read output file
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: videoFile.type });
    
    console.log('Trim successful, blob size:', blob.size);
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return blob;
  } catch (error) {
    console.error('Trim failed:', error);
    
    // Cleanup on error
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Failed to cleanup files:', cleanupError);
    }
    
    throw error;
  }
};

/**
 * 获取视频信息
 */
export const getVideoInfo = async (videoFile: File): Promise<VideoInfo> => {
  const ffmpeg = await initFFmpeg();

  // 动态生成文件名
  const timestamp = Date.now();
  const fileExtension = videoFile.name.split('.').pop() || 'mp4';
  const inputName = `input_${timestamp}.${fileExtension}`;

  // Write input file
  await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));

  // Capture FFmpeg stderr output with a one-time listener pattern
  let ffmpegOutput = '';
  let listening = true;
  const listener = (data: string) => {
    if (listening) ffmpegOutput += data;
  };
  ffmpeg.on('log', ({ message }) => listener(message));

  // Run ffmpeg to get info (stderr will contain the info)
  try {
    await ffmpeg.exec(['-i', inputName, '-f', 'null', '-']);
  } catch (error) {
    listening = false;
    await ffmpeg.deleteFile(inputName);
    console.error('FFmpeg execution failed:', error);
    throw new Error('Failed to extract video info. The file may be corrupted or in an unsupported format.');
  }

  // Disable listener after exec completes
  listening = false;

  // Cleanup
  await ffmpeg.deleteFile(inputName);

  // Parse output for duration, resolution, and fps
  const durationMatch = ffmpegOutput.match(/Duration: (\d+):(\d+):([\d.]+)/);
  let duration = 0;
  if (durationMatch) {
    const [, h, m, s] = durationMatch;
    duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  }

  const videoStreamMatch = ffmpegOutput.match(/Video:.* (\d+)x(\d+)[^,]*, ([\d.]+) fps/);
  let width = 0, height = 0, fps = 0;
  if (videoStreamMatch) {
    width = parseInt(videoStreamMatch[1]);
    height = parseInt(videoStreamMatch[2]);
    fps = parseFloat(videoStreamMatch[3]);
  }

  return { duration, width, height, fps };
};

/**
 * 转换为WebM格式
 */
export const convertToWebM = async (
  videoFile: File,
  onProgress?: ProgressCallback
): Promise<Blob> => {
  const ffmpeg = await initFFmpeg();
  
  // 动态生成文件名，避免冲突
  const timestamp = Date.now();
  const inputName = `input_${timestamp}.${videoFile.name.split('.').pop() || 'mp4'}`;
  const outputName = `output_${timestamp}.webm`;
  
  try {
    console.log('Starting video conversion:', {
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileType: videoFile.type,
      inputName,
      outputName
    });
    
    // Set up progress callback
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }
    
    // Write input file
    console.log('Writing input file...');
    await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
    
    // Convert to WebM with more robust settings
    console.log('Executing FFmpeg conversion...');
    const result = await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libvpx-vp9',
      '-crf', '30',
      '-b:v', '0',
      '-c:a', 'libopus',
      '-preset', 'fast', // 使用快速预设
      '-deadline', 'realtime', // 实时处理
      '-cpu-used', '4', // 更快的编码
      outputName
    ]);
    
    console.log('FFmpeg execution completed:', result);
    
    // Read output file
    console.log('Reading output file...');
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/webm' });
    
    console.log('Conversion successful, blob size:', blob.size);
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return blob;
    
  } catch (error) {
    console.error('Video conversion failed:', error);
    
    // 尝试清理文件
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Failed to cleanup files:', cleanupError);
    }
    
    // 提供更详细的错误信息
    let errorMessage = 'Video conversion failed';
    if (error instanceof Error) {
      if (error.message.includes('FFmpeg')) {
        errorMessage = `FFmpeg processing error: ${error.message}`;
      } else if (error.message.includes('format')) {
        errorMessage = `Unsupported video format: ${videoFile.type || 'unknown'}`;
      } else if (error.message.includes('memory')) {
        errorMessage = 'Insufficient memory for video processing';
      } else if (error.message.includes('codec')) {
        errorMessage = `Codec error: ${error.message}`;
      } else {
        errorMessage = `Conversion error: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 提取音频
 */
export const extractAudio = async (
  videoFile: File,
  format: 'mp3' | 'wav' = 'mp3'
): Promise<Blob> => {
  const ffmpeg = await initFFmpeg();
  
  const inputName = 'input.mp4';
  const outputName = `output.${format}`;
  
  // Write input file
  await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
  
  // Extract audio
  await ffmpeg.exec([
    '-i', inputName,
    '-vn', // Disable video
    '-acodec', format === 'mp3' ? 'libmp3lame' : 'pcm_s16le',
    outputName
  ]);
  
  // Read output file
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data], { type: `audio/${format}` });
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  
  return blob;
}; 