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

// 全局变量
let ffmpeg: FFmpeg | null = null;
let ffmpegInitializing = false;
let ffmpegInitPromise: Promise<FFmpeg> | null = null;

// 导出取消控制
let exportCancelled = false;
let currentExportController: AbortController | null = null;

// 全局导出状态锁定
let isExportInProgress = false;

// 重置导出取消状态
export const resetExportCancellation = () => {
  exportCancelled = false;
  if (currentExportController) {
    currentExportController.abort();
  }
  currentExportController = new AbortController();
};

// 取消当前导出
export const cancelCurrentExport = () => {
  console.log('🛑 Cancelling current export...');
  exportCancelled = true;
  if (currentExportController) {
    currentExportController.abort();
  }
  // 重置导出锁定状态
  isExportInProgress = false;
};

// 检查是否已取消
const checkCancellation = () => {
  if (exportCancelled || currentExportController?.signal.aborted) {
    throw new Error('Export cancelled by user');
  }
};

// 缓存系统 - 极致优化
const exportCache = new Map<string, Blob>();
const thumbnailCache = new Map<string, string>();

// 性能优化配置 - 修复视频卡顿问题
const PERFORMANCE_CONFIG = {
  // 超快速预设 - 优化质量和流畅度平衡
  ULTRA_FAST: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '23',           // 降低CRF提升质量 (原35改为23)
    preset: 'veryfast',  // 改为veryfast以提升质量 (原ultrafast)
    tune: 'film',        // 改为film优化视频质量 (原fastdecode)
    threads: 'auto',     // 自动线程数
    g: '60',            // 增加GOP大小提高效率 (原30改为60)
    keyint_min: '30',   // 增加最小关键帧间隔 (原15改为30)
    sc_threshold: '40', // 启用场景切换检测 (原0改为40)
    bf: '2',           // 添加B帧提升流畅度 (原0改为2)
    refs: '3',         // 增加参考帧数量 (原1改为3)
    flags: '+cgop',    // 优化GOP结构
    movflags: '+faststart', // 快速启动
    pixfmt: 'yuv420p'  // 确保兼容性
  },
  
  // 快速预设 - 平衡选择
  FAST: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '20',         // 更好的质量
    preset: 'fast',    // 平衡速度和质量
    tune: 'film',      // 视频优化
    threads: 'auto',
    g: '120',          // 更大的GOP
    keyint_min: '60',
    sc_threshold: '40',
    bf: '3',
    refs: '4',
    flags: '+cgop',
    movflags: '+faststart',
    pixfmt: 'yuv420p'
  },
  
  // 质量预设 - 大文件优化
  QUALITY: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '18',         // 高质量
    preset: 'medium',  // 更好的压缩
    tune: 'film',
    threads: 'auto',
    g: '250',          // 大GOP
    keyint_min: '25',
    sc_threshold: '40',
    bf: '3',
    refs: '6',
    flags: '+cgop',
    movflags: '+faststart',
    pixfmt: 'yuv420p'
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
      const webmSettings = settings as any; // 类型断言，因为WebM设置包含额外属性
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
    const testData = new Uint8Array(new TextEncoder().encode('Hello FFmpeg!'));
    await ffmpeg.writeFile(testInput, testData as any);
    
    // Execute a simple command
    await ffmpeg.exec(['-i', testInput, testOutput]);
    
    // Read the output
    const data = await ffmpeg.readFile(testOutput);
    const result = new TextDecoder().decode(data as Uint8Array);
    
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

// 时间线导出函数 - 导出整个时间轴的内容
export const exportTimeline = async (
  timelineData: {
    tracks: Array<{
      id: string;
      type: string;
      elements: Array<{
        id: string;
        type: string;
        startTime: number;
        duration: number;
        trimStart: number;
        trimEnd: number;
        mediaId?: string;
        mediaFile?: File;
        mediaUrl?: string;
        mediaType?: string;
        mediaWidth?: number;
        mediaHeight?: number;
        mediaFps?: number;
        thumbnailUrl?: string;
      }>;
    }>;
    totalDuration: number;
  },
  exportConfig: {
    format: 'mp4' | 'webm' | 'avi' | 'mov';
    resolution: '480p' | '720p' | '1080p' | '4k';
    quality: 'low' | 'medium' | 'high';
    frameRate: string;
  },
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // 检查是否已有导出进程在运行
  if (isExportInProgress) {
    console.log('🚫 Export already in progress, ignoring duplicate request');
    throw new Error('Export already in progress');
  }
  
  // 设置导出锁定状态
  isExportInProgress = true;
  
  // 重置取消状态并开始新的导出
  resetExportCancellation();
  
  const startTime = performance.now();
  console.log(`🚀 Starting ULTRA-FAST timeline export...`, {
    totalDuration: timelineData.totalDuration,
    tracksCount: timelineData.tracks.length,
    elementsCount: timelineData.tracks.reduce((sum, track) => sum + track.elements.length, 0),
    format: exportConfig.format,
    resolution: exportConfig.resolution
  });

  const ffmpeg = await initFFmpeg();
  const inputNames: string[] = [];
  const tempFiles: string[] = [];

  // 进度管理
  let currentProgress = 0;
  let progressInterval: NodeJS.Timeout | null = null;
  
  const updateProgress = (targetProgress: number, duration: number = 500) => {
    // 检查是否已取消
    checkCancellation();
    
    if (!onProgress) return;
    
    const startProgress = currentProgress;
    const progressDiff = targetProgress - startProgress;
    const startTimestamp = performance.now();
    
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(() => {
      // 在进度更新中也检查取消状态
      try {
        checkCancellation();
      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        return;
      }
      
      const elapsed = performance.now() - startTimestamp;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数让进度更平滑
      const easedRatio = 1 - Math.pow(1 - progressRatio, 3); // easeOutCubic
      const newProgress = startProgress + (progressDiff * easedRatio);
      
      currentProgress = newProgress;
      onProgress(Math.min(newProgress, targetProgress));
      
      if (progressRatio >= 1) {
        clearInterval(progressInterval!);
        progressInterval = null;
      }
    }, 50); // 每50ms更新一次，提供流畅体验
  };

  try {
    // 初始化进度
    updateProgress(5, 100);

    // 1. 收集所有媒体元素并按时间排序
    const mediaElements = timelineData.tracks
      .flatMap(track => track.elements)
      .filter(element => element.type === "media")
      .map(element => ({
        ...element,
        endTime: element.startTime + (element.duration - element.trimStart - element.trimEnd),
        actualDuration: element.duration - element.trimStart - element.trimEnd
      }))
      .sort((a, b) => a.startTime - b.startTime);

    console.log(`📋 Found ${mediaElements.length} media elements to export`);

    if (mediaElements.length === 0) {
      throw new Error("No media elements found in timeline");
    }

    // 获取智能编码设置
    const totalFileSize = mediaElements.reduce((sum, el) => {
      return sum + (el.mediaFile?.size || 0);
    }, 0);
    
    const encodingSettings = getOptimalEncodingSettings(
      totalFileSize, 
      timelineData.totalDuration, 
      exportConfig.format, 
      exportConfig.quality
    );
    
    console.log('⚡ Using ULTRA-FAST encoding settings:', encodingSettings);

    updateProgress(10, 200);

    // 2. 🧠 智能合并策略 + 🔄 分辨率预处理优化
    let processedElements = mediaElements;
    const segments: string[] = [];
    
    // 检查取消状态
    checkCancellation();
    
    // 步骤1: 检查是否需要分辨率预处理
    const { needsPreprocessing } = needsResolutionPreprocessing(mediaElements, exportConfig);
    
    if (needsPreprocessing && mediaElements.length > 1) {
      // 🔄 执行分辨率预处理：统一所有视频到目标分辨率
      console.log('🚀 启用分辨率预处理优化');
      processedElements = await preprocessResolution(
        ffmpeg, 
        mediaElements, 
        exportConfig, 
        tempFiles, 
        updateProgress
      );
      updateProgress(35, 200);
    } else {
      updateProgress(10, 100);
    }
    
    // 步骤2: 检查是否可以使用原有的单视频流复制优化
    const hasCustomExportSettings = 
      exportConfig.resolution !== '720p' ||
      exportConfig.quality !== 'medium' ||   
      exportConfig.frameRate !== '30' ||     
      exportConfig.format !== 'mp4';
    
    const canUseOriginalStreamCopy = processedElements.length === 1 && 
                                   processedElements.every(el => 
                                     el.trimStart === 0 && 
                                     el.trimEnd === 0 && 
                                     el.mediaType === 'video'
                                   ) &&
                                   !hasCustomExportSettings && 
                                   !needsPreprocessing;

    if (canUseOriginalStreamCopy) {
      // 🚀 原有的单视频流复制模式
      console.log('🚀 Using ORIGINAL STREAM COPY mode for single video');
      const element = processedElements[0];
      const inputName = `input_0.mp4`;
      
      let mediaFile: File | null = null;
      if (element.mediaFile) {
        mediaFile = element.mediaFile;
      } else if (element.mediaUrl) {
        const response = await fetch(element.mediaUrl);
        const blob = await response.blob();
        mediaFile = new File([blob], `media.mp4`, { type: blob.type });
      } else {
        throw new Error(`No media file available for element ${element.id}`);
      }

      await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
      segments.push(inputName);
      updateProgress(50, 300);
      
    } else {
      // 步骤3: 🧠 智能分组处理
      const videoGroups = detectVideoGroups(processedElements, exportConfig);
      
      // 步骤4: 对每个组进行优化处理
      for (let groupIndex = 0; groupIndex < videoGroups.length; groupIndex++) {
        const group = videoGroups[groupIndex];
        checkCancellation();
        
        // 计算进度：35-70%用于组处理
        const groupProgress = 35 + (35 * (groupIndex + 1) / videoGroups.length);
        updateProgress(groupProgress, 300);
        
        if (needsPreprocessing) {
          // 🚀 预处理后的智能流复制合并
          console.log(`🚀 对预处理组 ${groupIndex + 1} 使用智能流复制`);
          
          if (group.length === 1) {
            // 单个预处理片段
            segments.push(group[0].preprocessedFile);
          } else {
            // 多个预处理片段：使用流复制合并（因为已经统一格式）
            const inputNames = group.map(el => el.preprocessedFile);
            const concatFile = `final_group_${groupIndex}_concat.txt`;
            const concatContent = inputNames.map(name => `file '${name}'`).join('\n');
            await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
            tempFiles.push(concatFile);
            
            const groupOutputName = `final_group_${groupIndex}.mp4`;
            await ffmpeg.exec([
              '-f', 'concat',
              '-safe', '0',
              '-i', concatFile,
              '-c', 'copy',  // 预处理后可以安全使用流复制
              '-y', groupOutputName
            ]);
            
            tempFiles.push(groupOutputName);
            segments.push(groupOutputName);
          }
        } else {
          // 🔄 标准智能合并（无预处理）
          const groupOutput = await smartStreamCopyMerge(ffmpeg, group, groupIndex, tempFiles);
          segments.push(groupOutput);
        }
      }
      
      updateProgress(70, 200);
    }

    // 3. 🕳️ 智能间隔处理 - 适配新的分组结构
    const finalSegments: string[] = [];
    let needsGapProcessing = false;
    
    // 重建元素到segment的映射关系 
    let elementIndex = 0;
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      
      // 找到当前segment对应的第一个元素
      while (elementIndex < processedElements.length) {
        const currentElement = processedElements[elementIndex];
        
        // 检查是否需要插入间隔（相对于前一个元素）
        if (elementIndex > 0) {
          const prevElement = processedElements[elementIndex - 1];
          const gap = currentElement.startTime - prevElement.endTime;
          
          if (gap > 0.5) { // 只对大于0.5秒的间隔处理
            needsGapProcessing = true;
            const blackSegmentName = `gap_${segmentIndex}_${elementIndex}.mp4`;
            tempFiles.push(blackSegmentName);
            
            console.log(`⚫ 创建 ${gap.toFixed(1)}s 间隔 (优化模式)`);
            
            const resolutionMap = {
              '480p': '854:480',
              '720p': '1280:720', 
              '1080p': '1920:1080',
              '4k': '3840:2160'
            };
            const outputResolution = resolutionMap[exportConfig.resolution];
            
            // 超快速黑屏生成
            await ffmpeg.exec([
              '-f', 'lavfi',
              '-i', `color=black:size=${outputResolution}:duration=${gap}:rate=${exportConfig.frameRate}`,
              '-f', 'lavfi',
              '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`,
              '-c:v', encodingSettings.videoCodec,
              '-c:a', encodingSettings.audioCodec,
              '-crf', '40', // 高压缩比，黑屏不需要质量
              '-preset', 'ultrafast',
              '-tune', 'fastdecode',
              '-shortest',
              '-y', blackSegmentName
            ]);
            
            finalSegments.push(blackSegmentName);
          }
        }
        
        // 跳过到当前segment对应的最后一个元素
        elementIndex++;
        // 简化处理：假设每个segment对应一个或多个连续元素
        break;
      }
      
      finalSegments.push(segments[segmentIndex]);
    }

    updateProgress(75, 200);

    // 4. 超高速合并
    const concatFile = 'concat.txt';
    const concatContent = finalSegments.map(name => `file '${name}'`).join('\n');
    
    console.log('📝 Writing concat file:', concatContent);
    await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
    tempFiles.push(concatFile);

    const outputName = `timeline_output.${exportConfig.format}`;
    
    // 根据情况选择合并策略 - 修复多视频片段问题
    let concatCommand: string[];
    
    // 只有单个视频且无间隔时才使用流复制
    if (canUseOriginalStreamCopy && processedElements.length === 1 && !needsGapProcessing) {
      // 单视频流复制模式
      console.log('🚀 Using STREAM COPY concat for single video!');
      concatCommand = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        '-c', 'copy', // 纯复制，无重编码
        '-y', outputName
      ];
    } else {
      // 多视频重编码合并模式 - 修复画面静止问题
      console.log('⚡ Using OPTIMIZED RE-ENCODE concat for multiple videos');
      
      // 获取分辨率映射
      const resolutionMap: { [key: string]: string } = {
        '480p': '854:480',
        '720p': '1280:720', 
        '1080p': '1920:1080',
        '4k': '3840:2160'
      };
      const outputResolution = resolutionMap[exportConfig.resolution];
      
      concatCommand = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        
        // 视频编码 - 统一参数
        '-c:v', encodingSettings.videoCodec,
        '-crf', encodingSettings.crf,
        '-preset', encodingSettings.preset,
        '-tune', encodingSettings.tune,
        '-pix_fmt', encodingSettings.pixfmt, // 统一像素格式
        
        // 关键修复：统一输出参数
        '-r', exportConfig.frameRate,      // 统一帧率
        '-s', outputResolution,            // 统一分辨率
        '-vsync', 'cfr',                   // 恒定帧率，防止画面静止
        
        // 音频编码统一
        '-c:a', encodingSettings.audioCodec,
        '-b:a', '128k',
        '-ar', '44100',
        
        // GOP和帧结构统一
        '-g', encodingSettings.g,
        '-keyint_min', encodingSettings.keyint_min,
        '-bf', encodingSettings.bf,
        '-refs', encodingSettings.refs,
        
        // 时间戳和同步修复
        '-avoid_negative_ts', 'make_zero', // 避免负时间戳
        '-fflags', '+genpts',              // 重新生成时间戳
        '-movflags', '+faststart',
        '-y', outputName
      ];
    }

    console.log('🔧 Executing ULTRA-FAST concat:', concatCommand.slice(0, 8), '...');
    updateProgress(75, 500);

    // 执行最终合并
    const execStart = performance.now();
    await ffmpeg.exec(concatCommand);
    console.log(`🔧 ULTRA-FAST concat completed in ${(performance.now() - execStart).toFixed(2)}ms`);

    updateProgress(90, 200);

    // 5. 读取输出文件
    console.log('📖 Reading output file...');
    const data = await ffmpeg.readFile(outputName);
    
    const mimeType = exportConfig.format === 'webm' ? 'video/webm' : 
                    exportConfig.format === 'mp4' ? 'video/mp4' :
                    exportConfig.format === 'avi' ? 'video/x-msvideo' :
                    'video/quicktime';
    
    const blob = new Blob([data], { type: mimeType });

    updateProgress(95, 100);

    const totalTime = performance.now() - startTime;
    console.log(`✅ ULTRA-FAST timeline export completed in ${totalTime.toFixed(2)}ms`);
    console.log(`📊 Output size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`⚡ Speed: ${((blob.size / 1024 / 1024) / (totalTime / 1000)).toFixed(2)} MB/s`);

    // 6. 清理临时文件
    try {
      for (const fileName of tempFiles) {
        try {
          await ffmpeg.deleteFile(fileName);
        } catch (deleteError) {
          console.warn(`Warning: Failed to delete ${fileName}:`, deleteError);
        }
      }
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup temporary files:', cleanupError);
    }

    // 清理进度定时器
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // 所有处理完成，设置最终进度
    if (onProgress) {
      onProgress(100);
    }

    // 重置导出锁定状态
    isExportInProgress = false;

    return blob;

  } catch (error) {
    console.error('❌ ULTRA-FAST timeline export failed:', error);
    
    // 清理进度定时器
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // 清理临时文件
    try {
      for (const fileName of tempFiles) {
        try {
          await ffmpeg.deleteFile(fileName);
        } catch (deleteError) {
          // 忽略删除错误
        }
      }
      await ffmpeg.deleteFile(`timeline_output.${exportConfig.format}`);
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup temporary files:', cleanupError);
    }
    
    // 重置导出锁定状态
    isExportInProgress = false;
    
    throw error;
  }
};

// 智能合并策略：检测连续的相同格式视频片段
const detectVideoGroups = (mediaElements: any[], exportConfig: any) => {
  const groups: any[][] = [];
  let currentGroup: any[] = [];
  
  for (let i = 0; i < mediaElements.length; i++) {
    const element = mediaElements[i];
    
    if (currentGroup.length === 0) {
      // 开始新组
      currentGroup.push(element);
    } else {
      const lastElement = currentGroup[currentGroup.length - 1];
      const isConsecutive = Math.abs(element.startTime - lastElement.endTime) < 0.1; // 允许0.1秒误差
      const isSameFormat = element.mediaType === lastElement.mediaType;
      
      // 检查是否可以合并（相同格式且连续）
      if (isConsecutive && isSameFormat && 
          element.trimStart === 0 && element.trimEnd === 0 &&
          lastElement.trimStart === 0 && lastElement.trimEnd === 0) {
        currentGroup.push(element);
      } else {
        // 结束当前组，开始新组
        groups.push([...currentGroup]);
        currentGroup = [element];
      }
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  console.log(`🧠 智能分组完成: ${groups.length} 个组，平均每组 ${(mediaElements.length / groups.length).toFixed(1)} 个片段`);
  groups.forEach((group, index) => {
    console.log(`   组 ${index + 1}: ${group.length} 个片段 (${group[0].startTime.toFixed(1)}s - ${group[group.length-1].endTime.toFixed(1)}s)`);
  });
  
  return groups;
};

// 分辨率预处理：检查是否需要统一分辨率
const needsResolutionPreprocessing = (mediaElements: any[], exportConfig: any) => {
  const targetResolution = exportConfig.resolution as string;
  const resolutionMap: { [key: string]: { width: number; height: number } } = {
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 }, 
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 }
  };
  
  const target = resolutionMap[targetResolution];
  
  // 检查是否所有视频都需要分辨率转换
  let needsPreprocessing = false;
  for (const element of mediaElements) {
    // 这里简化处理，实际应该获取视频的真实分辨率
    // 暂时假设如果设置了非默认分辨率就需要预处理
    if (targetResolution !== '720p') {
      needsPreprocessing = true;
      break;
    }
  }
  
  console.log(`🔍 分辨率预处理检查: ${needsPreprocessing ? '需要' : '不需要'} (目标: ${targetResolution})`);
  return { needsPreprocessing, target };
};

// 智能流复制合并：对相同格式的连续片段使用流复制
const smartStreamCopyMerge = async (
  ffmpeg: any, 
  group: any[], 
  groupIndex: number, 
  tempFiles: string[]
): Promise<string> => {
  console.log(`🚀 对组 ${groupIndex + 1} 使用智能流复制合并 (${group.length} 个片段)`);
  
  if (group.length === 1) {
    // 单个片段直接返回
    const element = group[0];
    const inputName = `group_${groupIndex}_input.mp4`;
    
    let mediaFile: File | null = null;
    if (element.mediaFile) {
      mediaFile = element.mediaFile;
    } else if (element.mediaUrl) {
      const response = await fetch(element.mediaUrl);
      const blob = await response.blob();
      mediaFile = new File([blob], `media.mp4`, { type: blob.type });
    } else {
      throw new Error(`No media file available for element ${element.id}`);
    }
    
    if (!mediaFile) {
      throw new Error(`Failed to get media file for element ${element.id}`);
    }
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
    tempFiles.push(inputName);
    return inputName;
  }
  
  // 多个片段：写入所有输入文件
  const inputNames: string[] = [];
  for (let i = 0; i < group.length; i++) {
    const element = group[i];
    const inputName = `group_${groupIndex}_input_${i}.mp4`;
    
    let mediaFile: File | null = null;
    if (element.mediaFile) {
      mediaFile = element.mediaFile;
    } else if (element.mediaUrl) {
      const response = await fetch(element.mediaUrl);
      const blob = await response.blob();
      mediaFile = new File([blob], `media.mp4`, { type: blob.type });
    } else {
      throw new Error(`No media file available for element ${element.id}`);
    }
    
    if (!mediaFile) {
      throw new Error(`Failed to get media file for element ${element.id}`);
    }
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
    inputNames.push(inputName);
    tempFiles.push(inputName);
  }
  
  // 创建concat文件
  const concatFile = `group_${groupIndex}_concat.txt`;
  const concatContent = inputNames.map(name => `file '${name}'`).join('\n');
  await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
  tempFiles.push(concatFile);
  
  // 使用流复制合并
  const outputName = `group_${groupIndex}_merged.mp4`;
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0', 
    '-i', concatFile,
    '-c', 'copy',  // 关键：使用流复制，超快！
    '-y', outputName
  ]);
  
  tempFiles.push(outputName);
  console.log(`✅ 组 ${groupIndex + 1} 流复制合并完成`);
  return outputName;
};

// 分辨率预处理：批量处理到目标分辨率
const preprocessResolution = async (
  ffmpeg: any,
  mediaElements: any[],
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<any[]> => {
  console.log('🔄 开始分辨率预处理...');
  
  const resolutionMap = {
    '480p': '854:480',
    '720p': '1280:720', 
    '1080p': '1920:1080',
    '4k': '3840:2160'
  };
  const outputResolution = resolutionMap[exportConfig.resolution];
  
  const processedElements: any[] = [];
  
  for (let i = 0; i < mediaElements.length; i++) {
    const element = mediaElements[i];
    const inputName = `preprocess_input_${i}.mp4`;
    const outputName = `preprocess_output_${i}.mp4`;
    
    // 写入输入文件
    let mediaFile: File | null = null;
    if (element.mediaFile) {
      mediaFile = element.mediaFile;
    } else if (element.mediaUrl) {
      const response = await fetch(element.mediaUrl);
      const blob = await response.blob();
      mediaFile = new File([blob], `media.mp4`, { type: blob.type });
    } else {
      throw new Error(`No media file available for element ${element.id}`);
    }
    
    if (!mediaFile) {
      throw new Error(`Failed to get media file for element ${element.id}`);
    }
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
    tempFiles.push(inputName, outputName);
    
    // 批量预处理命令 - 使用快速预设
    const preprocessCommand = [
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'veryfast',  // 快速预设
      '-crf', '23',          // 合理质量
      '-s', outputResolution, // 目标分辨率
      '-r', exportConfig.frameRate,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-y', outputName
    ];
    
    console.log(`⚡ 预处理片段 ${i + 1}/${mediaElements.length} 到 ${exportConfig.resolution}`);
    await ffmpeg.exec(preprocessCommand);
    
    // 更新进度
    if (onProgress) {
      const progress = 5 + (30 * (i + 1) / mediaElements.length); // 5-35%用于预处理
      onProgress(progress);
    }
    
    // 创建新的element引用预处理后的文件
    processedElements.push({
      ...element,
      preprocessedFile: outputName
    });
  }
  
  console.log('✅ 分辨率预处理完成，现在所有片段都是统一分辨率');
  return processedElements;
};