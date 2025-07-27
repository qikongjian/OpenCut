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

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const initFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  try {
    console.log('Initializing FFmpeg...');
    
    // 创建FFmpeg实例
    ffmpeg = new FFmpeg();
    
    // 检查FFmpeg对象是否正确创建
    if (!ffmpeg) {
      throw new Error('Failed to create FFmpeg instance');
    }
    
    console.log('Loading FFmpeg core files...');
    
    // 使用最简单的加载方式
    await ffmpeg.load();
    
    console.log('FFmpeg initialized successfully');
    return ffmpeg;
  } catch (error) {
    console.error('Failed to initialize FFmpeg:', error);
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
  }
};

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const generateThumbnail = async (
  videoFile: File,
  timeInSeconds: number = 1
): Promise<string> => {
  // 常量定义 - 不可变的值
  const ffmpeg = await initFFmpeg();
  
  // 常量定义 - 不可变的值
  
// 常量定义 - 模块内部使用的固定值
  const inputName = 'input.mp4';
  // 常量定义 - 不可变的值
  const outputName = 'thumbnail.jpg';
  
  // Write input file
  await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
  
  // Generate thumbnail at specific time
  await ffmpeg.exec([
    '-i', inputName,
    '-ss', timeInSeconds.toString(),
    '-vframes', '1',
    '-vf', 'scale=320:240',
    '-q:v', '2',
    outputName
  ]);
  
  // Read output file
  // 常量定义 - 不可变的值
  const data = await ffmpeg.readFile(outputName);
  // 常量定义 - 不可变的值
  const blob = new Blob([data], { type: 'image/jpeg' });
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  
  return URL.createObjectURL(blob);
};

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const trimVideo = async (
  videoFile: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // 常量定义 - 不可变的值
  const ffmpeg = await initFFmpeg();
  
  // 常量定义 - 不可变的值
  
// 常量定义 - 模块内部使用的固定值
  const inputName = 'input.mp4';
  // 常量定义 - 不可变的值
  const outputName = 'output.mp4';
  
  // Set up progress callback
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });
  }
  
  // Write input file
  await ffmpeg.writeFile(inputName, new Uint8Array(await videoFile.arrayBuffer()));
  
  // 常量定义 - 不可变的值
  
// 常量定义 - 模块内部使用的固定值
  const duration = endTime - startTime;
  
  // Trim video
  await ffmpeg.exec([
    '-i', inputName,
    '-ss', startTime.toString(),
    '-t', duration.toString(),
    '-c', 'copy', // Use stream copy for faster processing
    outputName
  ]);
  
  // Read output file
  // 常量定义 - 不可变的值
  const data = await ffmpeg.readFile(outputName);
  // 常量定义 - 不可变的值
  const blob = new Blob([data], { type: 'video/mp4' });
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  
  return blob;
};

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const getVideoInfo = async (videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
}> => {
  // 常量定义 - 不可变的值
  const ffmpeg = await initFFmpeg();

  // 常量定义 - 不可变的值

// 常量定义 - 模块内部使用的固定值
  const inputName = 'input.mp4';

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
    // 常量定义 - 不可变的值
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

  return {
    duration,
    width,
    height,
    fps
  };
};

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const convertToWebM = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // 常量定义 - 不可变的值
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
    console.error('FFmpeg conversion failed:', error);
    
    // 尝试清理文件
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Failed to cleanup files:', cleanupError);
    }
    
    // 提供更详细的错误信息
    let errorMessage = 'Video processing failed';
    if (error instanceof Error) {
      if (error.message.includes('FFmpeg')) {
        errorMessage = `FFmpeg error: ${error.message}`;
      } else if (error.message.includes('format')) {
        errorMessage = `Unsupported video format: ${videoFile.type || 'unknown'}`;
      } else if (error.message.includes('memory')) {
        errorMessage = 'Insufficient memory for video processing';
      } else {
        errorMessage = `Processing error: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// 导出常量 - 固定的配置值

// 导出常量对象 - 包含多个相关常量的对象
export const extractAudio = async (
  videoFile: File,
  format: 'mp3' | 'wav' = 'mp3'
): Promise<Blob> => {
  // 常量定义 - 不可变的值
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

// 导出常量对象 - 包含多个相关常量的对象
export const exportVideo = async (
  videoFile: File,
  format: 'mp4' | 'webm' | 'avi' | 'mov' = 'mp4',
  quality: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const ffmpeg = await initFFmpeg();
  
  // 动态生成文件名
  const timestamp = Date.now();
  const fileExtension = videoFile.name.split('.').pop() || 'mp4';
  const inputName = `input_${timestamp}.${fileExtension}`;
  const outputName = `output_${timestamp}.${format}`;
  
  // 根据格式和质量设置编码参数
  const getEncodingSettings = () => {
    switch (format) {
      case 'webm':
        return {
          videoCodec: 'libvpx-vp9',
          audioCodec: 'libopus',
          crf: quality === 'high' ? '20' : quality === 'medium' ? '30' : '40',
          preset: 'fast',
          deadline: 'realtime',
          cpuUsed: '4'
        };
      case 'mp4':
        return {
          videoCodec: 'libx264',
          audioCodec: 'aac',
          crf: quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
          preset: 'fast'
        };
      case 'avi':
        return {
          videoCodec: 'libx264',
          audioCodec: 'mp3',
          crf: quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
          preset: 'fast'
        };
      case 'mov':
        return {
          videoCodec: 'libx264',
          audioCodec: 'aac',
          crf: quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
          preset: 'fast'
        };
      default:
        return {
          videoCodec: 'libx264',
          audioCodec: 'aac',
          crf: '23',
          preset: 'fast'
        };
    }
  };
  
  const settings = getEncodingSettings();
  
  try {
    console.log('Starting video export:', {
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileType: videoFile.type,
      format,
      quality,
      inputName,
      outputName,
      settings
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
    
    // Build FFmpeg command
    const command = [
      '-i', inputName,
      '-c:v', settings.videoCodec,
      '-crf', settings.crf,
      '-preset', settings.preset
    ];
    
    // Add format-specific options
    if (format === 'webm' && settings.deadline && settings.cpuUsed) {
      command.push('-deadline', settings.deadline, '-cpu-used', settings.cpuUsed);
    }
    
    // Add audio codec
    command.push('-c:a', settings.audioCodec);
    
    // Add output file
    command.push(outputName);
    
    console.log('Executing FFmpeg command:', command);
    const result = await ffmpeg.exec(command);
    
    console.log('FFmpeg execution completed:', result);
    
    // Read output file
    console.log('Reading output file...');
    const data = await ffmpeg.readFile(outputName);
    const mimeType = format === 'webm' ? 'video/webm' : 
                    format === 'mp4' ? 'video/mp4' :
                    format === 'avi' ? 'video/x-msvideo' :
                    'video/quicktime';
    const blob = new Blob([data], { type: mimeType });
    
    console.log('Export successful, blob size:', blob.size);
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    return blob;
    
  } catch (error) {
    console.error('Video export failed:', error);
    
    // 尝试清理文件
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Failed to cleanup files:', cleanupError);
    }
    
    // 提供更详细的错误信息
    let errorMessage = 'Video export failed';
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
        errorMessage = `Export error: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// 测试函数 - 验证FFmpeg是否能正确初始化
export const testFFmpeg = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing FFmpeg initialization...');
    const ffmpeg = await initFFmpeg();
    
    if (!ffmpeg) {
      return { success: false, error: 'FFmpeg instance is null' };
    }
    
    console.log('FFmpeg test successful');
    return { success: true };
    
  } catch (error) {
    console.error('FFmpeg test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};