// ffmpeg-utils.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/ffmpeg-utils.ts
// 最后更新: 2025/7/23

// ffmpeg-utils.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 FFmpeg 视频处理库
import { FFmpeg } from '@ffmpeg/ffmpeg';
// 导入 FFmpeg 视频处理库
import { toBlobURL, fetchFile } from '@ffmpeg/util';

// 变量定义 - 可修改的值
let ffmpeg: FFmpeg | null = null;
let ffmpegInitializing = false;
let ffmpegInitPromise: Promise<FFmpeg> | null = null;

// 缓存系统 - 极致优化
const exportCache = new Map<string, Blob>();
const thumbnailCache = new Map<string, string>();

// 性能优化配置 - 极致速度预设
const PERFORMANCE_CONFIG = {
  // 超快速预设 - 小文件专用，极速导出
  ULTRA_FAST: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '35',           // 高压缩比，极快编码
    preset: 'ultrafast', // 最快预设
    tune: 'fastdecode',  // 优化解码速度
    threads: 'auto',     // 自动线程数
    g: '30',            // 小GOP，快速编码
    keyint_min: '15',   // 最小关键帧间隔
    sc_threshold: '0',  // 禁用场景切换检测
    bf: '0',           // 无B帧，最快编码
    refs: '1',         // 最少参考帧
    flags: '+cgop',    // 优化GOP结构
    movflags: '+faststart' // 快速启动
  },
  
  // 快速预设 - 平衡选择
  FAST: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '28',
    preset: 'veryfast',
    tune: 'fastdecode',
    threads: 'auto',
    g: '60',
    keyint_min: '30',
    sc_threshold: '0',
    bf: '2',
    refs: '3',
    flags: '+cgop',
    movflags: '+faststart'
  },
  
  // 质量预设 - 大文件优化
  QUALITY: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '23',
    preset: 'fast',
    tune: 'fastdecode',
    threads: 'auto',
    g: '120',
    keyint_min: '60',
    sc_threshold: '40',
    bf: '3',
    refs: '6',
    flags: '+cgop',
    movflags: '+faststart'
  }
};

// 智能编码预设选择器 - 根据文件特征自动选择最优参数
const getOptimalEncodingSettings = (
  fileSize: number,
  duration: number,
  format: string,
  quality: string
) => {
  // 文件大小阈值 (MB)
  const SMALL_FILE = 5 * 1024 * 1024; // 5MB
  const MEDIUM_FILE = 50 * 1024 * 1024; // 50MB
  
  // 时长阈值 (秒)
  const SHORT_VIDEO = 30; // 30秒
  const MEDIUM_VIDEO = 300; // 5分钟
  
  // 智能选择预设
  let preset = PERFORMANCE_CONFIG.FAST;
  
  if (fileSize < SMALL_FILE || duration < SHORT_VIDEO) {
    // 小文件或短视频使用超快速预设
    preset = PERFORMANCE_CONFIG.ULTRA_FAST;
  } else if (fileSize > MEDIUM_FILE || duration > MEDIUM_VIDEO) {
    // 大文件或长视频使用质量预设
    preset = PERFORMANCE_CONFIG.QUALITY;
  }
  
  // 根据质量调整CRF值
  const qualityAdjustments = {
    low: 8,      // 增加CRF值，更快编码
    medium: 0,   // 保持默认
    high: -5     // 减少CRF值，更好质量
  };
  
  const crfAdjustment = qualityAdjustments[quality as keyof typeof qualityAdjustments] || 0;
  const baseCRF = parseInt(preset.crf);
  preset.crf = Math.max(18, Math.min(40, baseCRF + crfAdjustment)).toString();
  
  // 格式特定优化
  if (format === 'webm') {
    return {
      ...preset,
      videoCodec: 'libvpx-vp9',
      audioCodec: 'libopus',
      deadline: 'realtime',      // 实时编码
      cpuUsed: '8',             // 最大CPU使用率
      tileColumns: '2',         // 并行编码
      frameParallel: '1',       // 帧并行
      lagInFrames: '0',         // 无延迟
      autoAltRef: '0',          // 禁用自动参考帧
      arnrMaxFrames: '0',       // 禁用ARNR
      arnrStrength: '0',        // 禁用ARNR强度
      enableCdef: '0',          // 禁用CDEF
      enableRestoration: '0'    // 禁用恢复
    };
  }
  
  return preset;
};

// 缓存键生成器
const generateCacheKey = (file: File, format: string, quality: string, settings: any): string => {
  const fileHash = `${file.name}_${file.size}_${file.lastModified}`;
  const settingsHash = JSON.stringify(settings);
  return `${fileHash}_${format}_${quality}_${settingsHash}`;
};

// 导出常量 - 固定的配置值
export const initFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;
  
  // 防止重复初始化
  if (ffmpegInitializing && ffmpegInitPromise) {
    return ffmpegInitPromise;
  }
  
  ffmpegInitializing = true;
  ffmpegInitPromise = (async () => {
    try {
      console.log('🚀 Initializing FFmpeg with performance optimizations...');
      
      // 创建FFmpeg实例
      ffmpeg = new FFmpeg();
      
      // 检查FFmpeg对象是否正确创建
      if (!ffmpeg) {
        throw new Error('Failed to create FFmpeg instance');
      }
      
      console.log('📦 Loading FFmpeg core files...');
      
      // 使用最简单的加载方式
      await ffmpeg.load();
      
      console.log('✅ FFmpeg initialized successfully with optimizations');
      return ffmpeg;
    } catch (error) {
      console.error('❌ Failed to initialize FFmpeg:', error);
      ffmpeg = null;
      
      // 提供更详细的错误信息
      let errorMessage = 'FFmpeg initialization failed';
      if (error instanceof Error) {
        if (error.message.includes('setLogger')) {
          errorMessage = 'FFmpeg library version incompatible - please update @ffmpeg/ffmpeg to latest version';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Failed to load FFmpeg core files - check network connection';
        } else if (error.message.includes('wasm')) {
          errorMessage = 'WebAssembly not supported or failed to load';
        } else if (error.message.includes('load method not found')) {
          errorMessage = 'FFmpeg API incompatible - please check library version';
        } else {
          errorMessage = `FFmpeg initialization failed: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      ffmpegInitializing = false;
    }
  })();
  
  return ffmpegInitPromise;
};

// 导出常量 - 固定的配置值
export const generateThumbnail = async (
  videoFile: File,
  timeInSeconds: number = 1
): Promise<string> => {
  // 检查缓存
  const cacheKey = `${videoFile.name}_${videoFile.size}_${timeInSeconds}`;
  if (thumbnailCache.has(cacheKey)) {
    console.log('📸 Using cached thumbnail');
    return thumbnailCache.get(cacheKey)!;
  }
  
  const ffmpeg = await initFFmpeg();
  
  // 常量定义 - 不可变的值
  const inputName = 'input.mp4';
  // 常量定义 - 不可变的值
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
    // 常量定义 - 不可变的值
    const data = await ffmpeg.readFile(outputName);
    // 常量定义 - 不可变的值
    const blob = new Blob([data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    
    // 缓存结果
    thumbnailCache.set(cacheKey, url);
    
    // 清理文件
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return url;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
};

// 极致优化的视频导出函数
export const exportVideo = async (
  videoFile: File,
  format: 'mp4' | 'webm' | 'avi' | 'mov' = 'mp4',
  quality: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const startTime = performance.now();
  console.log(`🚀 Starting ultra-fast video export: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(2)}MB)`);
  
  // 获取视频信息以优化编码设置
  const videoInfo = await getVideoInfo(videoFile);
  const settings = getOptimalEncodingSettings(videoFile.size, videoInfo.duration, format, quality);
  
  // 检查缓存
  const cacheKey = generateCacheKey(videoFile, format, quality, settings);
  if (exportCache.has(cacheKey)) {
    console.log('⚡ Using cached export result');
    onProgress?.(100);
    return exportCache.get(cacheKey)!;
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
      command.push(
        '-deadline', settings.deadline,
        '-cpu-used', settings.cpuUsed,
        '-tile-columns', settings.tileColumns,
        '-frame-parallel', settings.frameParallel,
        '-lag-in-frames', settings.lagInFrames,
        '-auto-alt-ref', settings.autoAltRef,
        '-arnr-maxframes', settings.arnrMaxFrames,
        '-arnr-strength', settings.arnrStrength,
        '-enable-cdef', settings.enableCdef,
        '-enable-restoration', settings.enableRestoration
      );
    }
    
    // 添加音频编码器
    command.push('-c:a', settings.audioCodec);
    
    // 添加输出文件
    command.push('-y', outputName); // -y 覆盖输出文件
    
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
    exportCache.set(cacheKey, blob);
    
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

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const trimVideo = async (
  videoFile: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
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

export const getVideoInfo = async (videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
}> => {
  const ffmpeg = await initFFmpeg();

  // 动态生成文件名
  const timestamp = Date.now();
  const fileExtension = videoFile.name.split('.').pop() || 'mp4';
  const inputName = `input_${timestamp}.${fileExtension}`;

  // Write input file
  await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));

  // Capture FFmpeg stderr output with a one-time listener pattern
  // 变量定义 - 可修改的值
  let ffmpegOutput = '';
  // 变量定义 - 可修改的值
  let listening = true;
// listener 函数
  // 常量定义 - 不可变的值
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
  // Example: Duration: 00:00:10.00, start: 0.000000, bitrate: 1234 kb/s
  // Example: Stream #0:0: Video: h264 (High), yuv420p(progressive), 1920x1080 [SAR 1:1 DAR 16:9], 30 fps, 30 tbr, 90k tbn, 60 tbc

  // 常量定义 - 不可变的值

// 常量定义 - 模块内部使用的固定值
  const durationMatch = ffmpegOutput.match(/Duration: (\d+):(\d+):([\d.]+)/);
  // 变量定义 - 可修改的值
  let duration = 0;
  if (durationMatch) {
    const [, h, m, s] = durationMatch;
    duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  }

  // 常量定义 - 不可变的值

// 常量定义 - 模块内部使用的固定值
  const videoStreamMatch = ffmpegOutput.match(/Video:.* (\d+)x(\d+)[^,]*, ([\d.]+) fps/);
  // 变量定义 - 可修改的值
  let width = 0, height = 0, fps = 0;
  if (videoStreamMatch) {
    width = parseInt(videoStreamMatch[1]);
    height = parseInt(videoStreamMatch[2]);
    fps = parseFloat(videoStreamMatch[3]);
  }

  return { duration, width, height, fps };
};

export const convertToWebM = async (
  videoFile: File,
  onProgress?: (progress: number) => void
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

export const extractAudio = async (
  videoFile: File,
  format: 'mp3' | 'wav' = 'mp3'
): Promise<Blob> => {
  const ffmpeg = await initFFmpeg();
  
  // 常量定义 - 不可变的值
  
// 常量定义 - 模块内部使用的固定值
  const inputName = 'input.mp4';
  // 常量定义 - 不可变的值
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
  // 常量定义 - 不可变的值
  const data = await ffmpeg.readFile(outputName);
  // 常量定义 - 不可变的值
  const blob = new Blob([data], { type: `audio/${format}` });
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  
  return blob;
};

// 清理缓存函数
export const clearExportCache = () => {
  exportCache.clear();
  thumbnailCache.clear();
  console.log('🧹 Export cache cleared');
};

// 获取缓存统计信息
export const getCacheStats = () => {
  return {
    exportCacheSize: exportCache.size,
    thumbnailCacheSize: thumbnailCache.size,
    exportCacheKeys: Array.from(exportCache.keys()),
    thumbnailCacheKeys: Array.from(thumbnailCache.keys())
  };
};

export const testFFmpeg = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing FFmpeg functionality...');
    
    const ffmpeg = await initFFmpeg();
    
    // Test basic functionality
    const testInput = 'test_input.txt';
    const testOutput = 'test_output.txt';
    
    // Write a simple test file
    await ffmpeg.writeFile(testInput, new TextEncoder().encode('Hello FFmpeg!'));
    
    // Execute a simple command
    await ffmpeg.exec(['-i', testInput, testOutput]);
    
    // Read the output
    const data = await ffmpeg.readFile(testOutput);
    const result = new TextDecoder().decode(data);
    
    // Cleanup
    await ffmpeg.deleteFile(testInput);
    await ffmpeg.deleteFile(testOutput);
    
    console.log('FFmpeg test successful:', result);
    return { success: true };
  } catch (error) {
    console.error('FFmpeg test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};