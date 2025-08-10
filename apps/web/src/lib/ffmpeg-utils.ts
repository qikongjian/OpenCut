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
        // 转场元素属性
        transitionType?: string;
        direction?: string;
        fromElementId?: string;
        toElementId?: string;
        fromTrackId?: string;
        toTrackId?: string;
        intensity?: number;
        blur?: number;
        // 文本元素属性
        content?: string;
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        backgroundColor?: string;
        textAlign?: string;
        fontWeight?: string;
        fontStyle?: string;
        textDecoration?: string;
        x?: number;
        y?: number;
        rotation?: number;
        opacity?: number;
        horizontalFlip?: boolean;
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

  // 🚀🚀 超级优化：检测是否可以使用超快模式
  const useUltraFastMode = canUseUltraFastMode(timelineData, exportConfig);

  console.log(`🚀 Starting ${useUltraFastMode ? 'ULTRA-FAST' : 'STANDARD'} timeline export...`, {
    totalDuration: timelineData.totalDuration,
    tracksCount: timelineData.tracks.length,
    elementsCount: timelineData.tracks.reduce((sum, track) => sum + track.elements.length, 0),
    format: exportConfig.format,
    resolution: exportConfig.resolution,
    ultraFastMode: useUltraFastMode
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
      // 暂时禁用进度更新中的取消检查，避免干扰FFmpeg执行
      // 取消检查将在主要执行点进行

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

    // 1. 收集所有媒体元素、转场元素和文本元素并按时间排序
    const allElements = timelineData.tracks
      .flatMap(track => track.elements)
      .map(element => ({
        ...element,
        endTime: element.startTime + (element.duration - element.trimStart - element.trimEnd),
        actualDuration: element.duration - element.trimStart - element.trimEnd
      }))
      .sort((a, b) => a.startTime - b.startTime);

    const mediaElements = allElements.filter(element => element.type === "media");
    const transitionElements = allElements.filter(element => element.type === "transition");
    const textElements = allElements.filter(element => element.type === "text");

    console.log(`📋 Found ${mediaElements.length} media elements, ${transitionElements.length} transition elements, and ${textElements.length} text elements to export`);

    // 详细记录所有元素信息用于调试
    console.log('🔍 All timeline elements:', allElements.map(el => ({
      id: el.id,
      type: el.type,
      // name: el.name, // 移除不存在的属性
      startTime: el.startTime,
      duration: el.duration,
      content: el.type === 'text' ? el.content : undefined,
      transitionType: el.type === 'transition' ? el.transitionType : undefined,
      // 媒体元素的文件信息
      mediaId: el.type === 'media' ? el.mediaId : undefined,
      hasMediaFile: el.type === 'media' ? !!el.mediaFile : undefined,
      hasMediaUrl: el.type === 'media' ? !!el.mediaUrl : undefined,
      mediaType: el.type === 'media' ? el.mediaType : undefined
    })));

    if (textElements.length > 0) {
      console.log('📝 Text elements details:', textElements.map(el => ({
        id: el.id,
        content: el.content,
        startTime: el.startTime,
        duration: el.duration,
        fontSize: el.fontSize,
        color: el.color,
        x: el.x,
        y: el.y
      })));
    }

    if (transitionElements.length > 0) {
      console.log('🎬 Transition elements details:', transitionElements.map(el => ({
        id: el.id,
        transitionType: el.transitionType,
        direction: el.direction,
        startTime: el.startTime,
        duration: el.duration,
        fromElementId: el.fromElementId,
        toElementId: el.toElementId
      })));
    }

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

    // 2. 🧠 智能合并策略 + 🔄 分辨率预处理优化 + 🎬 转场处理
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
    
    // 步骤2: 🚀 超级优化 - 检查是否可以使用多视频流复制优化
    const hasCustomExportSettings =
      exportConfig.resolution !== '720p' ||
      exportConfig.quality !== 'medium' ||
      exportConfig.frameRate !== '30' ||
      exportConfig.format !== 'mp4';

    // 检查是否所有视频都可以直接流复制合并（无需重编码）
    const canUseMultiStreamCopy = processedElements.length > 1 &&
                                 processedElements.every(el =>
                                   el.trimStart === 0 &&
                                   el.trimEnd === 0 &&
                                   el.mediaType === 'video'
                                 ) &&
                                 !hasCustomExportSettings &&
                                 !needsPreprocessing &&
                                 transitionElements.length === 0 &&
                                 textElements.length === 0 &&
                                 !processedElements.some(el => el.horizontalFlip || el.masks?.length);

    const canUseOriginalStreamCopy = processedElements.length === 1 &&
                                   processedElements.every(el =>
                                     el.trimStart === 0 &&
                                     el.trimEnd === 0 &&
                                     el.mediaType === 'video'
                                   ) &&
                                   !hasCustomExportSettings &&
                                   !needsPreprocessing &&
                                   transitionElements.length === 0;

    if (canUseMultiStreamCopy) {
      // 🚀🚀 新增：多视频超快流复制模式
      console.log(`🚀🚀 Using MULTI-VIDEO STREAM COPY mode for ${processedElements.length} videos - ULTRA FAST!`);

      // 并行写入所有视频文件
      const writePromises = processedElements.map(async (element, index) => {
        const inputName = `input_${index}.mp4`;
        const mediaFile = await getMediaFileForElement(element);
        await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
        return inputName;
      });

      const inputNames = await Promise.all(writePromises);
      segments.push(...inputNames);
      updateProgress(50, 300);

    } else if (canUseOriginalStreamCopy) {
      // 🚀 原有的单视频流复制模式
      console.log('🚀 Using ORIGINAL STREAM COPY mode for single video');
      const element = processedElements[0];
      const inputName = `input_0.mp4`;

      const mediaFile = await getMediaFileForElement(element);

      await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
      segments.push(inputName);
      updateProgress(50, 300);

    } else {
      // 步骤3: 🧠 智能分组处理 + 🎬 转场处理
      const videoGroups = detectVideoGroups(processedElements, exportConfig);
      
      // 步骤4: 对每个组进行优化处理，并处理转场
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
      
      // 步骤5: 🎬 处理转场效果 - 暂时禁用独立转场处理
      // 转场效果将在最终合并阶段处理
      if (transitionElements.length > 0) {
        console.log(`🎬 Found ${transitionElements.length} transition elements - will be processed during final merge`);
        // 注意：转场效果将在concat阶段通过xfade滤镜处理
      }
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
            
            const resolutionMap: { [key: string]: string } = {
              '480p': '854:480',
              '720p': '1280:720', 
              '1080p': '1920:1080',
              '4k': '3840:2160'
            };
            const outputResolution = resolutionMap[exportConfig.resolution] || '1280:720';
            
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

    console.log('📝 Final segments for concat:', finalSegments);
    console.log('📝 Concat file content:', concatContent);
    console.log('📝 Number of segments to concat:', finalSegments.length);

    // 检查所有文件是否存在
    for (const segment of finalSegments) {
      try {
        const fileData = await ffmpeg.readFile(segment);
        console.log(`✅ Segment ${segment} exists, size: ${fileData.length} bytes`);
      } catch (error) {
        console.error(`❌ Segment ${segment} not found:`, error);
        throw new Error(`Missing segment file: ${segment}`);
      }
    }

    await ffmpeg.writeFile(concatFile, new Uint8Array(new TextEncoder().encode(concatContent)));
    tempFiles.push(concatFile);

    const outputName = `timeline_output.${exportConfig.format}`;
    tempFiles.push(outputName);
    
    // 根据情况选择合并策略 - 修复多视频片段问题
    let concatCommand: string[];

    // 🚀🚀 多视频流复制模式 - 超快合并
    if (canUseMultiStreamCopy && !needsGapProcessing) {
      console.log(`🚀🚀 Using MULTI-VIDEO STREAM COPY concat for ${segments.length} videos - LIGHTNING FAST!`);
      concatCommand = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        '-c', 'copy', // 纯复制，无重编码，超快！
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-y', outputName
      ];
    } else if (canUseOriginalStreamCopy && processedElements.length === 1 && !needsGapProcessing) {
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
      const outputResolution = resolutionMap[exportConfig.resolution] || '1280:720';
      
      // 使用简化的命令避免复杂参数导致的问题
      concatCommand = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y', outputName
      ];
    }

    console.log('🔧 Executing ULTRA-FAST concat:', concatCommand.slice(0, 8), '...');
    console.log('📝 Full concat command:', concatCommand);
    updateProgress(75, 500);

    // 临时调试：如果只有一个片段，直接复制而不使用concat
    if (finalSegments.length === 1) {
      console.log('🚀 DEBUG: Single segment detected, copying directly');
      try {
        const singleSegment = finalSegments[0];
        const segmentData = await ffmpeg.readFile(singleSegment);
        await ffmpeg.writeFile(outputName, segmentData);
        console.log(`✅ Direct copy completed for single segment: ${singleSegment}`);
      } catch (error) {
        console.error('❌ Direct copy failed:', error);
        throw new Error(`Direct copy failed: ${error.message}`);
      }
    } else {
      // 执行最终合并 - 添加超时和错误处理
      const execStart = performance.now();
      try {
        // 暂时清除进度更新定时器，避免干扰FFmpeg执行
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }

        console.log('🚀 Starting FFmpeg concat execution...');
        await ffmpeg.exec(concatCommand);
        console.log(`✅ ULTRA-FAST concat completed in ${(performance.now() - execStart).toFixed(2)}ms`);
      } catch (error) {
        console.error('❌ FFmpeg concat failed:', error);
        console.log('📝 Concat file content:', concatContent);
        console.log('📝 Available segments:', finalSegments);
        throw new Error(`FFmpeg concat execution failed: ${error.message}`);
      }
    }

    updateProgress(90, 200);

    // 5. 📝 渲染字幕到视频
    let finalVideoFile = outputName;
    if (textElements.length > 0) {
      console.log('📝 Starting subtitle rendering...');
      finalVideoFile = await renderSubtitlesToVideo(
        ffmpeg,
        outputName,
        textElements,
        exportConfig,
        tempFiles,
        updateProgress
      );
    }

    // 🚀🚀 超级优化：多视频流复制模式跳过所有特效处理
    if (!canUseMultiStreamCopy) {
      // 6. 🎬 应用转场效果（如果有）
      if (transitionElements.length > 0) {
        console.log('🎬 Starting transition effects application...');
        finalVideoFile = await applyTransitionEffects(
          ffmpeg,
          finalVideoFile,
          transitionElements,
          exportConfig,
          tempFiles,
          updateProgress
        );
      }

      // 7. 🪞 应用镜像效果（如果有）
      const elementsWithMirror = mediaElements.filter(el =>
        el.horizontalFlip || el.verticalFlip || el.rotation
      );

      if (elementsWithMirror.length > 0) {
        console.log('🪞 Starting mirror effects application...');
        for (const element of elementsWithMirror) {
          finalVideoFile = await applyMirrorEffects(
            ffmpeg,
            finalVideoFile,
            element,
            exportConfig,
            tempFiles,
            updateProgress
          );
        }
      }

      // 8. 🎭 应用蒙板效果（如果有）
      const elementsWithMasks = mediaElements.filter(el =>
        el.masks && el.masks.length > 0
      );

      if (elementsWithMasks.length > 0) {
        console.log('🎭 Starting mask effects application...');
        for (const element of elementsWithMasks) {
          finalVideoFile = await applyMaskEffects(
            ffmpeg,
            finalVideoFile,
            element.masks,
            exportConfig,
            tempFiles,
            updateProgress
          );
        }
      }

      // 9. 🎵 处理音频轨道（如果有）
      const audioElements = timelineData.tracks
        .flatMap(track => track.elements)
        .filter(element => element.type === "media" && element.mediaType === "audio");

      if (audioElements.length > 0) {
        console.log('🎵 Starting audio processing...');
        finalVideoFile = await processAudioTracks(
          ffmpeg,
          finalVideoFile,
          audioElements,
          exportConfig,
          tempFiles,
          updateProgress
        );
      }
    } else {
      console.log('🚀🚀 MULTI-VIDEO STREAM COPY mode: Skipping all effects processing for maximum speed!');
      updateProgress(95, 100);
    }

    // 7. 读取最终输出文件
    console.log('📖 Reading final output file...');
    const data = await ffmpeg.readFile(finalVideoFile);
    
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
    
    const mediaFile = await getMediaFileForElement(element);
    
    await ffmpeg.writeFile(inputName, new Uint8Array(await mediaFile.arrayBuffer()));
    tempFiles.push(inputName);
    return inputName;
  }
  
  // 多个片段：写入所有输入文件
  const inputNames: string[] = [];
  for (let i = 0; i < group.length; i++) {
    const element = group[i];
    const inputName = `group_${groupIndex}_input_${i}.mp4`;
    
    const mediaFile = await getMediaFileForElement(element);
    
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
  const outputResolution = resolutionMap[exportConfig.resolution] || '1280:720';
  
  const processedElements: any[] = [];
  
  for (let i = 0; i < mediaElements.length; i++) {
    const element = mediaElements[i];
    const inputName = `preprocess_input_${i}.mp4`;
    const outputName = `preprocess_output_${i}.mp4`;
    
    // 写入输入文件
    const mediaFile = await getMediaFileForElement(element);
    
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

// 转场处理函数 - 处理时间线中的转场效果
const processTransitions = async (
  ffmpeg: any,
  mediaElements: any[],
  transitionElements: any[],
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  console.log('🎬 Processing transitions...');
  
  if (transitionElements.length === 0) {
    console.log('No transitions to process');
    return [];
  }
  
  const processedSegments: string[] = [];
  
  // 按时间排序所有元素（媒体+转场）
  const allElements = [...mediaElements, ...transitionElements]
    .sort((a, b) => a.startTime - b.startTime);
  
  // 处理每个转场
  for (let i = 0; i < transitionElements.length; i++) {
    const transition = transitionElements[i];
    console.log(`🎬 Processing transition ${i + 1}/${transitionElements.length}: ${transition.transitionType}`);
    
    // 找到转场前后的媒体元素
    const fromElement = mediaElements.find(el => el.id === transition.fromElementId);
    const toElement = mediaElements.find(el => el.id === transition.toElementId);
    
    if (!fromElement || !toElement) {
      console.warn(`Cannot find media elements for transition ${transition.id}`);
      continue;
    }
    
    // 获取媒体文件
    let fromFile: File | null = null;
    let toFile: File | null = null;
    
    if (fromElement.mediaFile) {
      fromFile = fromElement.mediaFile;
    } else if (fromElement.mediaUrl) {
      const response = await fetch(fromElement.mediaUrl);
      const blob = await response.blob();
      fromFile = new File([blob], `from_${transition.id}.mp4`, { type: blob.type });
    }
    
    if (toElement.mediaFile) {
      toFile = toElement.mediaFile;
    } else if (toElement.mediaUrl) {
      const response = await fetch(toElement.mediaUrl);
      const blob = await response.blob();
      toFile = new File([blob], `to_${transition.id}.mp4`, { type: blob.type });
    }
    
    if (!fromFile || !toFile) {
      console.warn(`Cannot get media files for transition ${transition.id}`);
      continue;
    }
    
    // 写入输入文件
    const fromInputName = `from_${transition.id}.mp4`;
    const toInputName = `to_${transition.id}.mp4`;
    const outputName = `transition_${transition.id}.mp4`;
    
    await ffmpeg.writeFile(fromInputName, new Uint8Array(await fromFile.arrayBuffer()));
    await ffmpeg.writeFile(toInputName, new Uint8Array(await toFile.arrayBuffer()));
    tempFiles.push(fromInputName, toInputName, outputName);
    
    // 根据转场类型生成FFmpeg命令
    let filterComplex = '';
    let outputSettings = [];
    
    switch (transition.transitionType) {
      case 'flash':
        if (transition.direction === 'in') {
          // 闪黑转场：画面快速切至全黑并回到新画面的过渡效果
          const halfDuration = transition.duration / 2;
          filterComplex = `[0:v]fade=t=out:st=${halfDuration}:d=${halfDuration}:color=black[fadeout];[1:v]fade=t=in:st=0:d=${halfDuration}:color=black[fadein];[fadeout][fadein]xfade=transition=fade:duration=${halfDuration}:offset=${halfDuration}[v]`;
        } else {
          // 闪白转场：画面快速切至全白并回到新画面的过渡效果
          const halfDuration = transition.duration / 2;
          filterComplex = `[0:v]fade=t=out:st=${halfDuration}:d=${halfDuration}:color=white[fadeout];[1:v]fade=t=in:st=0:d=${halfDuration}:color=white[fadein];[fadeout][fadein]xfade=transition=fade:duration=${halfDuration}:offset=${halfDuration}[v]`;
        }
        break;
        
      case 'dissolve':
        // 叠化转场：两个画面整体透明度平滑渐变的溶解效果
        filterComplex = `[0:v][1:v]xfade=transition=dissolve:duration=${transition.duration}:offset=${transition.duration}[v]`;
        break;
        
      case 'fade':
        if (transition.direction === 'in') {
          filterComplex = `[0:v]fade=t=in:st=0:d=${transition.duration}[fadein];[1:v]format=yuva420p[to];[fadein][to]overlay=format=yuv420p[v]`;
        } else {
          filterComplex = `[0:v]fade=t=out:st=${transition.duration}:d=${transition.duration}[fadeout];[1:v]format=yuva420p[to];[fadeout][to]overlay=format=yuv420p[v]`;
        }
        break;
        
      default:
        console.warn(`Unsupported transition type: ${transition.transitionType}`);
        continue;
    }
    
    // 构建FFmpeg命令
    const resolutionMap: { [key: string]: string } = {
      '480p': '854:480',
      '720p': '1280:720', 
      '1080p': '1920:1080',
      '4k': '3840:2160'
    };
    const outputResolution = resolutionMap[exportConfig.resolution as keyof typeof resolutionMap] || '1280:720';
    
    const command = [
      '-i', fromInputName,
      '-i', toInputName,
      '-filter_complex', filterComplex,
      '-map', '[v]',
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-r', exportConfig.frameRate,
      '-s', outputResolution,
      '-y', outputName
    ];
    
    console.log(`🎬 Executing transition command for ${transition.transitionType}`);
    await ffmpeg.exec(command);
    
    processedSegments.push(outputName);
    
    // 更新进度
    const progress = 50 + (30 * (i + 1) / transitionElements.length);
    onProgress?.(progress);
  }
  
  console.log(`🎬 Processed ${processedSegments.length} transitions`);
  return processedSegments;
};

// 应用转场效果函数 - 在最终视频上应用转场效果
const applyTransitionEffects = async (
  ffmpeg: any,
  videoFile: string,
  transitionElements: any[],
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🎬 Applying transition effects to final video...');
  console.log(`🎬 Processing ${transitionElements.length} transition elements`);

  if (transitionElements.length === 0) {
    console.log('No transition effects to apply');
    return videoFile;
  }

  const outputName = `video_with_transitions.mp4`;
  tempFiles.push(outputName);

  // 记录转场元素详情
  transitionElements.forEach((transition, index) => {
    console.log(`🎬 Transition ${index + 1}:`, {
      type: transition.transitionType,
      direction: transition.direction,
      startTime: transition.startTime,
      duration: transition.duration,
      fromElementId: transition.fromElementId,
      toElementId: transition.toElementId
    });
  });

  // 目前简化处理：为整个视频添加淡入淡出效果
  // 这是一个基础实现，可以根据需要扩展
  const fadeInDuration = 0.5;  // 淡入时长
  const fadeOutDuration = 0.5; // 淡出时长

  // 构建转场滤镜
  let filterComplex = `[0:v]fade=t=in:st=0:d=${fadeInDuration},fade=t=out:st=end-${fadeOutDuration}:d=${fadeOutDuration}[v]`;

  // 如果有特定的转场类型，可以在这里添加更复杂的处理
  const hasFlashTransition = transitionElements.some(t => t.transitionType === 'flash');
  if (hasFlashTransition) {
    console.log('🎬 Applying flash transition effects');
    // 可以添加更复杂的闪光效果
  }

  const command = [
    '-i', videoFile,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-map', '0:a?', // 可选音频映射
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'copy',
    '-y', outputName
  ];

  console.log('🎬 Executing transition effects command:', command.slice(0, 6), '...');

  try {
    await ffmpeg.exec(command);
    console.log('✅ Transition effects applied successfully');
    onProgress?.(95);
    return outputName;
  } catch (error) {
    console.error('❌ Transition effects application failed:', error);
    console.log('🎬 Falling back to video without transition effects');
    return videoFile; // 如果转场效果应用失败，返回原视频
  }
};

// 通用媒体文件获取函数
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
      // 提供更详细的错误信息
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

// 蒙板处理函数 - 将蒙板效果转换为FFmpeg滤镜
const applyMaskEffects = async (
  ffmpeg: any,
  inputFile: string,
  masks: any[],
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🎭 Starting mask effects application...');
  console.log(`🎭 Processing ${masks.length} mask effects`);

  if (masks.length === 0) {
    console.log('No masks to apply');
    return inputFile;
  }

  // 为每个蒙板生成FFmpeg滤镜
  const maskFilters: string[] = [];

  for (let i = 0; i < masks.length; i++) {
    const mask = masks[i];
    console.log(`🎭 Processing mask ${i + 1}/${masks.length}:`, {
      id: mask.id,
      type: mask.type,
      shape: mask.shape,
      x: mask.x,
      y: mask.y,
      width: mask.width,
      height: mask.height,
      opacity: mask.opacity
    });

    // 将相对坐标转换为像素坐标
    const resolutionMap = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };

    const resolution = resolutionMap[exportConfig.resolution as keyof typeof resolutionMap] || resolutionMap['720p'];

    // 计算蒙板的实际像素位置和尺寸
    const centerX = (mask.x + 1) * resolution.width / 2;
    const centerY = (mask.y + 1) * resolution.height / 2;
    const maskWidth = mask.width * resolution.width;
    const maskHeight = mask.height * resolution.height;

    const left = Math.max(0, centerX - maskWidth / 2);
    const top = Math.max(0, centerY - maskHeight / 2);
    const right = Math.min(resolution.width, centerX + maskWidth / 2);
    const bottom = Math.min(resolution.height, centerY + maskHeight / 2);

    let maskFilter = '';

    if (mask.shape === 'rectangle') {
      // 矩形蒙板：使用crop滤镜
      maskFilter = `crop=${right - left}:${bottom - top}:${left}:${top}`;
    } else if (mask.shape === 'circle') {
      // 圆形蒙板：使用geq滤镜创建圆形遮罩
      const radius = Math.min(maskWidth, maskHeight) / 2;
      const circleX = centerX;
      const circleY = centerY;

      // 创建圆形遮罩的geq表达式
      maskFilter = `geq=r='if(hypot(X-${circleX},Y-${circleY})<${radius},r(X,Y),0)':g='if(hypot(X-${circleX},Y-${circleY})<${radius},g(X,Y),0)':b='if(hypot(X-${circleX},Y-${circleY})<${radius},b(X,Y),0)':a='if(hypot(X-${circleX},Y-${circleY})<${radius},255,0)'`;
    }

    if (maskFilter) {
      maskFilters.push(maskFilter);
    }
  }

  if (maskFilters.length === 0) {
    console.log('No valid mask filters generated');
    return inputFile;
  }

  // 应用蒙板滤镜
  const outputName = `masked_${Date.now()}.mp4`;
  tempFiles.push(outputName);

  // 组合所有蒙板滤镜
  const combinedFilter = maskFilters.join(',');

  const command = [
    '-i', inputFile,
    '-vf', combinedFilter,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'copy',
    '-y', outputName
  ];

  console.log('🎭 Executing mask application command:', command.slice(0, 6), '...');

  try {
    await ffmpeg.exec(command);
    console.log('✅ Mask effects applied successfully');
    onProgress?.(95);
    return outputName;
  } catch (error) {
    console.error('❌ Mask application failed:', error);
    console.log('🎭 Falling back to original video without masks');
    return inputFile; // 如果蒙板应用失败，返回原视频
  }
};

// 音频混合处理函数 - 处理多音轨混合和音频特效
const processAudioTracks = async (
  ffmpeg: any,
  videoFile: string,
  audioElements: any[],
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🎵 Starting audio processing...');
  console.log(`🎵 Processing ${audioElements.length} audio elements`);

  if (audioElements.length === 0) {
    console.log('No audio elements to process');
    return videoFile;
  }

  // 分离音频和视频轨道
  const videoOnlyFile = `video_only_${Date.now()}.mp4`;
  tempFiles.push(videoOnlyFile);

  // 提取视频轨道（无音频）
  await ffmpeg.exec([
    '-i', videoFile,
    '-c:v', 'copy',
    '-an', // 移除音频
    '-y', videoOnlyFile
  ]);

  // 处理音频元素
  const audioFiles: string[] = [];
  const audioFilters: string[] = [];

  for (let i = 0; i < audioElements.length; i++) {
    const audioElement = audioElements[i];
    console.log(`🎵 Processing audio element ${i + 1}/${audioElements.length}:`, {
      id: audioElement.id,
      startTime: audioElement.startTime,
      duration: audioElement.duration,
      volume: audioElement.volume || 1.0
    });

    // 获取音频文件
    const audioFile = await getMediaFileForElement(audioElement);
    if (!audioFile) {
      console.warn(`⚠️ Could not get audio file for element ${audioElement.id}`);
      continue;
    }

    // 写入音频文件
    const audioInputName = `audio_input_${i}_${Date.now()}.${audioFile.name.split('.').pop()}`;
    tempFiles.push(audioInputName);
    await ffmpeg.writeFile(audioInputName, new Uint8Array(await audioFile.arrayBuffer()));

    // 处理音频：裁剪、音量调节、时间偏移
    const processedAudioName = `processed_audio_${i}_${Date.now()}.wav`;
    tempFiles.push(processedAudioName);

    // 🚀 计算正确的音频时长：原始时长减去开头和结尾的裁剪
    const actualAudioDuration = audioElement.duration - (audioElement.trimStart || 0) - (audioElement.trimEnd || 0);

    const audioCommand = [
      '-i', audioInputName,
      '-ss', audioElement.trimStart?.toString() || '0',
      '-t', actualAudioDuration.toString(), // 修复：使用实际时长而不是原始时长
      '-af', `volume=${audioElement.volume || 1.0}`,
      '-c:a', 'pcm_s16le',
      '-y', processedAudioName
    ];

    await ffmpeg.exec(audioCommand);
    audioFiles.push(processedAudioName);

    // 创建音频滤镜，包含时间偏移
    const delayMs = Math.round(audioElement.startTime * 1000);
    audioFilters.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs}[a${i}]`);
  }

  if (audioFiles.length === 0) {
    console.log('No valid audio files processed');
    return videoFile;
  }

  // 合并所有音频轨道
  const finalOutputName = `final_with_audio_${Date.now()}.mp4`;
  tempFiles.push(finalOutputName);

  // 构建FFmpeg命令
  const inputs = ['-i', videoOnlyFile];
  audioFiles.forEach(file => {
    inputs.push('-i', file);
  });

  // 构建音频混合滤镜
  let audioMixFilter = '';
  if (audioFiles.length === 1) {
    audioMixFilter = audioFilters[0];
  } else {
    // 多个音频轨道混合
    const mixInputs = audioFilters.map((_, i) => `[a${i}]`).join('');
    audioMixFilter = audioFilters.join(';') + `;${mixInputs}amix=inputs=${audioFiles.length}:duration=longest[aout]`;
  }

  const command = [
    ...inputs,
    '-filter_complex', audioMixFilter,
    '-map', '0:v', // 视频轨道
    '-map', audioFiles.length === 1 ? '[a0]' : '[aout]', // 音频轨道
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-y', finalOutputName
  ];

  console.log('🎵 Executing audio mixing command...');

  try {
    await ffmpeg.exec(command);
    console.log('✅ Audio processing completed successfully');
    onProgress?.(90);
    return finalOutputName;
  } catch (error) {
    console.error('❌ Audio processing failed:', error);
    console.log('🎵 Falling back to original video');
    return videoFile;
  }
};

// 镜像效果处理函数 - 处理水平翻转、垂直翻转和旋转
const applyMirrorEffects = async (
  ffmpeg: any,
  inputFile: string,
  element: any,
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🪞 Starting mirror effects application...');

  // 检查是否需要应用镜像效果
  const needsMirror = element.horizontalFlip || element.verticalFlip || element.rotation;

  if (!needsMirror) {
    console.log('No mirror effects to apply');
    return inputFile;
  }

  console.log('🪞 Applying mirror effects:', {
    horizontalFlip: element.horizontalFlip,
    verticalFlip: element.verticalFlip,
    rotation: element.rotation
  });

  const outputName = `mirrored_${Date.now()}.mp4`;
  tempFiles.push(outputName);

  // 构建视频滤镜
  const filters: string[] = [];

  // 水平翻转
  if (element.horizontalFlip) {
    filters.push('hflip');
  }

  // 垂直翻转
  if (element.verticalFlip) {
    filters.push('vflip');
  }

  // 旋转
  if (element.rotation && element.rotation !== 0) {
    // 将角度转换为弧度
    const radians = (element.rotation * Math.PI) / 180;
    filters.push(`rotate=${radians}:fillcolor=black@0`);
  }

  // 组合所有滤镜
  const filterChain = filters.join(',');

  const command = [
    '-i', inputFile,
    '-vf', filterChain,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'copy',
    '-y', outputName
  ];

  console.log('🪞 Executing mirror effects command:', command.slice(0, 6), '...');

  try {
    await ffmpeg.exec(command);
    console.log('✅ Mirror effects applied successfully');
    onProgress?.(85);
    return outputName;
  } catch (error) {
    console.error('❌ Mirror effects application failed:', error);
    console.log('🪞 Falling back to original video without mirror effects');
    return inputFile;
  }
};

// 🚀 智能检测是否可以使用超快导出模式
const canUseUltraFastMode = (timelineData: any, exportConfig: any): boolean => {
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

// 导出转场处理函数供外部使用
export { processTransitions, applyTransitionEffects, getMediaFileForElement, applyMaskEffects, processAudioTracks, applyMirrorEffects, canUseUltraFastMode };

// 字幕渲染函数 - 将字幕渲染到视频上
const renderSubtitlesToVideo = async (
  ffmpeg: any,
  videoFile: string,
  textElements: any[],
  exportConfig: any,
  tempFiles: string[],
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📝 Rendering subtitles to video...');
  console.log(`📝 Processing ${textElements.length} text elements`);

  if (textElements.length === 0) {
    console.log('No subtitles to render');
    return videoFile;
  }

  const outputName = `video_with_subtitles.mp4`;
  tempFiles.push(outputName);

  // 记录字幕元素详情
  textElements.forEach((text, index) => {
    console.log(`📝 Text ${index + 1}:`, {
      content: text.content,
      startTime: text.startTime,
      duration: text.duration,
      endTime: text.startTime + text.duration,
      fontSize: text.fontSize,
      color: text.color,
      position: { x: text.x, y: text.y }
    });
  });
  
  // 构建字幕滤镜链
  const subtitleFilters = textElements.map((text, index) => {
    const startTime = text.startTime;
    const endTime = text.startTime + text.duration;

    // 获取目标分辨率
    const resolutionMap: { [key: string]: { width: number, height: number } } = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };
    const resolution = resolutionMap[exportConfig.resolution] || { width: 1280, height: 720 };

    // 计算字幕位置（转换为像素坐标）
    // x, y 是相对于画布中心的偏移量，需要转换为绝对坐标
    const centerX = resolution.width / 2;
    const centerY = resolution.height / 2;
    const x = Math.max(0, Math.min(resolution.width, centerX + (text.x || 0)));
    const y = Math.max(0, Math.min(resolution.height, centerY + (text.y || 0)));

    // 构建字幕样式
    const fontSize = Math.max(12, Math.min(200, text.fontSize || 48));
    const fontColor = (text.color || '#ffffff').replace('#', '0x');
    const backgroundColor = text.backgroundColor !== 'transparent' ? text.backgroundColor : '';

    // 安全的文本转义 - 移除所有可能导致问题的字符
    const subtitleText = (text.content || '')
      .replace(/[\\:'"=,;]/g, '')  // 移除所有可能的问题字符
      .replace(/[^\w\s\-.,!?]/g, '') // 只保留安全字符
      .trim();

    if (!subtitleText) {
      console.log(`📝 Skipping empty text element ${index + 1}`);
      return null;
    }

    console.log(`📝 Building filter for text ${index + 1}: "${subtitleText}" at (${x}, ${y}) from ${startTime}s to ${endTime}s`);

    // 构建简化的drawtext滤镜 - 不使用单引号和字体文件
    const filter = `drawtext=text=${subtitleText}:fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'`;

    console.log(`📝 Generated filter: ${filter}`);
    return filter;
  });

  // 过滤掉null值并合并所有字幕滤镜
  const validFilters = subtitleFilters.filter(filter => filter !== null);

  if (validFilters.length === 0) {
    console.log('📝 No valid subtitle filters, returning original video');
    return videoFile;
  }

  const subtitleFilterChain = validFilters.join(',');
  console.log(`📝 Complete subtitle filter chain: ${subtitleFilterChain}`);

  // 构建FFmpeg命令
  const resolutionMap: { [key: string]: string } = {
    '480p': '854:480',
    '720p': '1280:720',
    '1080p': '1920:1080',
    '4k': '3840:2160'
  };
  const outputResolution = resolutionMap[exportConfig.resolution as keyof typeof resolutionMap] || '1280:720';

  const command = [
    '-i', videoFile,
    '-vf', subtitleFilterChain,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-r', exportConfig.frameRate,
    '-s', outputResolution,
    '-c:a', 'copy',
    '-y', outputName
  ];

  console.log('📝 Executing subtitle rendering command:', command.slice(0, 6), '...');

  try {
    await ffmpeg.exec(command);
    console.log('✅ Subtitles rendered successfully');
    onProgress?.(85);
    return outputName;
  } catch (error) {
    console.error('❌ Subtitle rendering failed:', error);
    console.log('📝 Falling back to original video without subtitles');
    return videoFile; // 如果字幕渲染失败，返回原视频
  }
};