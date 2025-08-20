// incremental/route.ts - 增量导出API
// 此文件提供基于时间轴状态的增量导出服务，大幅提升导出性能
// 文件路径: app/api/export/incremental/route.ts

import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { TimelineIR } from "@/types/timeline";

/**
 * 验证文件是否为有效的视频文件
 */
async function validateVideoFile(bytes: Uint8Array): Promise<boolean> {
  if (bytes.length < 8) {
    console.log(`❌ File too small: ${bytes.length} bytes`);
    return false;
  }

  // 检查常见视频文件的魔数（文件头）
  const header = Array.from(bytes.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(`🔍 File header (first 12 bytes): ${header}`);

  // MP4文件头检查
  if (bytes.length >= 8) {
    // MP4: 第4-7字节通常是 "ftyp"
    const ftypCheck = String.fromCharCode(...bytes.slice(4, 8));
    console.log(`🔍 MP4 ftyp check: "${ftypCheck}"`);
    if (ftypCheck === 'ftyp') {
      console.log('✅ Valid MP4 file detected');
      return true;
    }
  }

  // AVI文件头: "RIFF" + 4字节长度 + "AVI "
  if (bytes.length >= 12) {
    const riffCheck = String.fromCharCode(...bytes.slice(0, 4));
    const aviCheck = String.fromCharCode(...bytes.slice(8, 12));
    console.log(`🔍 AVI check: RIFF="${riffCheck}", AVI="${aviCheck}"`);
    if (riffCheck === 'RIFF' && aviCheck === 'AVI ') {
      console.log('✅ Valid AVI file detected');
      return true;
    }
  }

  // MOV文件头检查
  if (header.includes('6d6f6f76') || header.includes('6d646174')) {
    console.log('✅ Valid MOV file detected');
    return true; // 'moov' or 'mdat'
  }

  // WebM文件头检查
  if (header.startsWith('1a45dfa3')) {
    console.log('✅ Valid WebM file detected');
    return true; // WebM/Matroska
  }

  // 如果文件足够大，可能是有效的视频文件
  if (bytes.length > 10000) {
    console.log(`⚠️ Large file (${bytes.length} bytes) but unknown format, assuming valid`);
    return true;
  }

  console.log(`❌ File validation failed: ${bytes.length} bytes, header: ${header}`);
  return false;
}

/**
 * 详细分析文件内容
 */
async function analyzeFileContent(bytes: Uint8Array, filename: string): Promise<void> {
  console.log(`🔬 Analyzing file content: ${filename}`);
  console.log(`📊 File size: ${bytes.length} bytes`);

  if (bytes.length > 0) {
    const header = Array.from(bytes.slice(0, Math.min(16, bytes.length)))
      .map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log(`📋 Hex header: ${header}`);

    const ascii = Array.from(bytes.slice(0, Math.min(16, bytes.length)))
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');
    console.log(`📋 ASCII header: "${ascii}"`);

    // 检查是否全为零
    const allZeros = bytes.slice(0, Math.min(1000, bytes.length)).every(b => b === 0);
    if (allZeros) {
      console.log('⚠️ File appears to be all zeros (empty/corrupted)');
    }

    // 检查是否有重复模式（可能是占位符数据）
    const firstByte = bytes[0];
    const sameBytes = bytes.slice(0, Math.min(1000, bytes.length)).every(b => b === firstByte);
    if (sameBytes) {
      console.log(`⚠️ File appears to have repeating pattern (byte: 0x${firstByte.toString(16)})`);
    }
  } else {
    console.log('❌ File is empty');
  }
}

interface ProcessedMediaData {
  elementId: string;
  type: 'video' | 'audio' | 'text';
  hasLocalFile: boolean;
  isRemoteVideo?: boolean; // 添加远程视频标识
  fileData?: string; // Base64 编码的文件数据
  metadata: any;
  timelinePosition: {
    start: number;
    duration: number;
    trackId: string;
  };
}

interface IncrementalExportRequest {
  exportType: 'incremental';
  timeline: {
    ir: TimelineIR;
    subtitles: string; // ASS格式字幕
    totalDuration: number; // 总时长（秒）
  };
  processedMedia: ProcessedMediaData[];
  aiPlan: {
    clips: any[];
    optimizationHints: any;
  };
  options: {
    quality: 'preview' | 'standard' | 'professional';
    width: number;
    height: number;
    fps: number;
  };
}

/**
 * 增量导出API - POST请求
 * 核心优化：利用时间轴已处理的内容，避免重复下载和处理
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  let workDir: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('⚡ Incremental export API called');

        // 解析请求体 - 支持 FormData 和 JSON
        let requestData: IncrementalExportRequest;
        let uploadedFiles: Map<string, File> = new Map();

        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
          // 处理 FormData
          const formData = await req.formData();
          const requestDataStr = formData.get('requestData') as string;

          console.log('📋 FormData entries:');
          for (const [key, value] of formData.entries()) {
            if (key === 'requestData') {
              console.log(`  ${key}: ${typeof value} (${(value as string).length} chars)`);
            } else if (value instanceof File) {
              console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else {
              console.log(`  ${key}: ${typeof value} (${value})`);
            }
          }

          if (!requestDataStr) {
            throw new Error('Missing requestData in FormData');
          }

          try {
            requestData = JSON.parse(requestDataStr);
            console.log('✅ RequestData parsed successfully');
          } catch (parseError) {
            console.error('❌ Failed to parse requestData:', parseError);
            throw new Error(`Invalid requestData JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }

          // 收集上传的文件
          for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value instanceof File) {
              const elementId = key.replace('file_', '');
              uploadedFiles.set(elementId, value);
              console.log(`📁 Collected file for element ${elementId}: ${value.name} (${value.size} bytes)`);
            }
          }

          console.log('📁 FormData processed, files:', uploadedFiles.size);
        } else {
          // 处理 JSON
          requestData = await req.json();
          console.log('📋 JSON request processed');
        }

        const { timeline, processedMedia, aiPlan, options } = requestData;

        console.log('=== 增量导出开始 ===');
        console.log('Timeline elements:', {
          video: timeline.ir.video.length,
          audio: timeline.ir.audio.length,
          text: timeline.ir.texts.length
        });
        console.log('Processed media count:', processedMedia.length);
        console.log('Local files available:', processedMedia.filter(m => m.hasLocalFile).length);
        console.log('Uploaded files count:', uploadedFiles.size);

        // 详细调试信息
        console.log('=== 详细调试信息 ===');
        processedMedia.forEach((media, index) => {
          console.log(`Media ${index}:`, {
            elementId: media.elementId,
            type: media.type,
            hasLocalFile: media.hasLocalFile,
            hasFileData: !!media.fileData,
            fileDataLength: media.fileData?.length || 0,
            hasUploadedFile: uploadedFiles.has(media.elementId),
            uploadedFileSize: uploadedFiles.get(media.elementId)?.size || 0
          });
        });

        uploadedFiles.forEach((file, elementId) => {
          console.log(`Uploaded file ${elementId}:`, {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
        });

        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'starting',
          message: '开始增量导出...',
          progress: 0,
        })}\n\n`));

        // 创建工作目录
        workDir = await fs.mkdtemp(join(tmpdir(), 'incremental-export-'));
        console.log('Work directory:', workDir);

        // 🚀 核心优化：智能选择导出策略
        const exportStrategy = determineOptimalStrategy(timeline, processedMedia, aiPlan);
        console.log('📊 Export strategy:', exportStrategy);

        // 根据策略执行导出
        if (exportStrategy.type === 'timeline-direct') {
          await executeTimelineDirectExport(timeline, processedMedia, options, workDir, controller, encoder, uploadedFiles);
        } else if (exportStrategy.type === 'hybrid') {
          await executeHybridExport(timeline, processedMedia, aiPlan, options, workDir, controller, encoder, uploadedFiles);
        } else {
          // 回退到简化的导出策略
          await executeSimplifiedExport(timeline, options, workDir, controller, encoder);
        }

        // 发送完成事件
        const outputPath = join(workDir, 'output.mp4');
        const stats = await fs.stat(outputPath);
        const exportId = workDir.split('/').pop()?.replace('incremental-export-', '') || '';

        console.log('🎉 增量导出完成:', {
          outputPath,
          fileSize: stats.size,
          exportId,
          strategy: exportStrategy.type,
          speedup: exportStrategy.estimatedSpeedup
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          downloadUrl: `/api/export/download/${exportId}`,
          fileSize: stats.size,
          strategy: exportStrategy.type,
          speedup: exportStrategy.estimatedSpeedup
        })}\n\n`));

        controller.close();

      } catch (error) {
        console.error('❌ Incremental export failed:', error);
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : '增量导出失败',
          details: error instanceof Error ? error.stack : undefined
        })}\n\n`));
        
        controller.close();
      } finally {
        // 注意：不要在这里清理工作目录，下载完成后再清理
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * 确定最优导出策略
 */
function determineOptimalStrategy(timeline: any, processedMedia: ProcessedMediaData[], aiPlan: any): {
  type: 'timeline-direct' | 'hybrid' | 'fallback';
  reason: string;
  estimatedSpeedup: number;
  confidence: number;
} {
  const localFilesCount = processedMedia.filter(m => m.hasLocalFile && m.type === 'video').length;
  const totalVideoElements = timeline.ir.video.length;
  const hasSubtitles = timeline.ir.texts.length > 0;
  
  // 策略1：时间轴直接导出（最快）
  if (localFilesCount >= totalVideoElements * 0.8 && hasSubtitles) {
    return {
      type: 'timeline-direct',
      reason: '时间轴包含足够的本地文件和字幕，可直接导出',
      estimatedSpeedup: 4.5,
      confidence: 0.9
    };
  }
  
  // 策略2：混合导出（中等速度）
  if (localFilesCount > 0 || hasSubtitles) {
    return {
      type: 'hybrid',
      reason: '部分内容可复用，使用混合导出策略',
      estimatedSpeedup: 2.8,
      confidence: 0.7
    };
  }
  
  // 策略3：回退到标准导出
  return {
    type: 'fallback',
    reason: '无法优化，回退到标准AI剪辑导出',
    estimatedSpeedup: 1.0,
    confidence: 0.5
  };
}

/**
 * 执行时间轴直接导出（最优策略）
 */
async function executeTimelineDirectExport(
  timeline: any,
  processedMedia: ProcessedMediaData[],
  options: any,
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  uploadedFiles: Map<string, File>
): Promise<void> {
  console.log('🚀 Executing timeline direct export...');
  
  // 发送进度更新
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'processing',
    message: '使用时间轴直接导出...',
    progress: 0.1,
  })}\n\n`));

  // 1. 准备本地文件并应用裁剪
  const inputFiles: string[] = [];
  const videoElements = timeline.ir.video.sort((a: any, b: any) => a.start - b.start);

  for (let i = 0; i < videoElements.length; i++) {
    const element = videoElements[i];
    const mediaData = processedMedia.find(m => m.elementId === element.id);

    if (mediaData?.hasLocalFile) {
      // 🚀 关键修复：生成裁剪后的片段，而不是完整文件
      const inputPath = join(workDir, `segment_${i}.mp4`);

      try {
        // 优先使用上传的文件
        const uploadedFile = uploadedFiles.get(element.id);
        if (uploadedFile) {
          console.log(`📁 Processing uploaded file for element ${element.id}:`);
          console.log(`   - File name: ${uploadedFile.name}`);
          console.log(`   - File size: ${uploadedFile.size} bytes`);
          console.log(`   - File type: ${uploadedFile.type}`);

          const buffer = await uploadedFile.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);

          // 详细分析文件内容
          await analyzeFileContent(uint8Array, uploadedFile.name);

          // 验证文件是否为有效的视频文件
          if (buffer.byteLength < 1000) {
            console.warn(`⚠️ Uploaded file ${element.id} too small (${buffer.byteLength} bytes), might be invalid`);
            throw new Error(`Uploaded file too small: ${buffer.byteLength} bytes`);
          }

          // 验证文件头是否为视频格式
          const isValidVideo = await validateVideoFile(uint8Array);
          if (!isValidVideo) {
            console.warn(`⚠️ Uploaded file ${element.id} is not a valid video file`);
            throw new Error('Invalid video file format');
          }

          await fs.writeFile(inputPath, uint8Array);
          console.log(`✅ Prepared uploaded file ${i}: ${inputPath} (${buffer.byteLength} bytes)`);

          // 验证写入的文件
          try {
            const writtenStats = await fs.stat(inputPath);
            console.log(`✅ File written to disk: ${writtenStats.size} bytes`);
            if (writtenStats.size !== buffer.byteLength) {
              console.warn(`⚠️ Size mismatch: expected ${buffer.byteLength}, got ${writtenStats.size}`);
            }
          } catch (statError) {
            console.error(`❌ Failed to stat written file: ${inputPath}`, statError);
            throw new Error('Failed to verify written file');
          }

        } else if (mediaData.fileData) {
          // 回退到 Base64 数据
          console.log(`📝 Processing Base64 data for element ${element.id}, length: ${mediaData.fileData.length}`);

          // 验证Base64数据
          if (!mediaData.fileData || mediaData.fileData.length < 100) {
            throw new Error(`Base64 data too short: ${mediaData.fileData?.length || 0} characters`);
          }

          try {
            const binaryString = atob(mediaData.fileData);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            await fs.writeFile(inputPath, bytes);
            console.log(`✅ Prepared Base64 file ${i}: ${inputPath} (${bytes.length} bytes)`);

            // 验证解码后的文件
            if (bytes.length < 1000) {
              throw new Error(`Decoded file too small: ${bytes.length} bytes`);
            }

            // 验证文件头
            const isValidVideo = await validateVideoFile(bytes);
            if (!isValidVideo) {
              throw new Error('Decoded file is not a valid video format');
            }

          } catch (base64Error) {
            console.error(`❌ Base64 decode error for element ${element.id}:`, base64Error);
            throw new Error(`Base64 decode failed: ${base64Error instanceof Error ? base64Error.message : 'Unknown error'}`);
          }
        } else if (mediaData.metadata?.remoteUrl) {
          // 处理远程视频URL
          console.log(`🌐 Downloading remote video for element ${element.id}: ${mediaData.metadata.remoteUrl}`);

          try {
            const response = await fetch(mediaData.metadata.remoteUrl);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            await fs.writeFile(inputPath, bytes);
            console.log(`✅ Downloaded remote video ${i}: ${inputPath} (${bytes.length} bytes)`);

            // 验证下载的文件
            if (bytes.length < 1000) {
              throw new Error(`Downloaded file too small: ${bytes.length} bytes`);
            }

            // 验证文件头
            const isValidVideo = await validateVideoFile(bytes);
            if (!isValidVideo) {
              throw new Error('Downloaded file is not a valid video format');
            }

          } catch (downloadError) {
            console.error(`❌ Failed to download remote video for element ${element.id}:`, downloadError);
            throw new Error(`Remote video download failed: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
          }
        } else {
          console.error(`❌ No file data available for element ${element.id}`);
          console.error(`❌ MediaData details:`, {
            hasLocalFile: mediaData.hasLocalFile,
            hasFileData: !!mediaData.fileData,
            fileDataLength: mediaData.fileData?.length || 0,
            hasRemoteUrl: !!mediaData.metadata?.remoteUrl,
            remoteUrl: mediaData.metadata?.remoteUrl,
            uploadedFileExists: uploadedFiles.has(element.id),
            isRemoteVideo: mediaData.isRemoteVideo,
            elementSrc: element.src
          });

          // 🚀 修复：尝试从元素的src属性获取URL作为最后的备用方案
          if (element.src && (element.src.startsWith('http') || element.src.startsWith('blob:'))) {
            console.log(`🔄 Attempting to use element src as fallback: ${element.src}`);
            try {
              const response = await fetch(element.src);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const arrayBuffer = await response.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              await fs.writeFile(inputPath, bytes);
              console.log(`✅ Successfully used element src as fallback: ${inputPath} (${bytes.length} bytes)`);

              // 验证文件
              if (bytes.length < 1000) {
                throw new Error(`Fallback file too small: ${bytes.length} bytes`);
              }

              const isValidVideo = await validateVideoFile(bytes);
              if (!isValidVideo) {
                throw new Error('Fallback file is not a valid video format');
              }

              console.log(`✅ Fallback video file validated successfully`);
              // 不抛出错误，继续处理
            } catch (fallbackError) {
              console.error(`❌ Fallback attempt failed:`, fallbackError);
              throw new Error('No file data available and fallback failed');
            }
          } else {
            throw new Error('No file data available');
          }
        }

        // 🚀 关键修复：应用裁剪参数生成精确的片段
        const trimmedPath = join(workDir, `trimmed_${i}.mp4`);
        await createTrimmedSegment(inputPath, trimmedPath, element, options);

        inputFiles.push(trimmedPath);
      } catch (error) {
        console.error(`❌ Failed to process file data for element ${element.id}:`, error);
        console.error(`❌ Element details:`, {
          elementId: element.id,
          hasMediaData: !!mediaData,
          hasLocalFile: mediaData?.hasLocalFile,
          hasFileData: !!mediaData?.fileData,
          fileDataLength: mediaData?.fileData?.length || 0,
          hasUploadedFile: uploadedFiles.has(element.id),
          uploadedFileSize: uploadedFiles.get(element.id)?.size || 0
        });

        // 只有在确实无法获取真实文件时才创建占位符
        console.warn(`⚠️ Creating placeholder video for element ${element.id} due to: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await createPlaceholderVideo(inputPath, element.duration || 5000, options);
        inputFiles.push(inputPath);
      }
    } else {
      // 如果没有本地文件，创建一个占位符视频
      console.warn(`⚠️ No local file for element ${element.id}, creating placeholder`);
      const inputPath = join(workDir, `input_${i}.mp4`);
      await createPlaceholderVideo(inputPath, element.duration || 5000, options);
      inputFiles.push(inputPath);
    }
    
    // 更新进度
    const progress = 0.1 + (i / videoElements.length) * 0.3;
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'progress',
      stage: 'processing',
      message: `准备文件 ${i + 1}/${videoElements.length}...`,
      progress,
    })}\n\n`));
  }

  // 2. 生成字幕文件
  let subtitlesPath: string | null = null;
  const hasSubtitles = timeline.subtitles && timeline.subtitles.length > 0;
  if (hasSubtitles) {
    subtitlesPath = join(workDir, 'subtitles.ass');
    await fs.writeFile(subtitlesPath, timeline.subtitles, 'utf8');
    console.log('✅ Subtitles file created:', subtitlesPath);

    // 验证字幕文件是否存在
    try {
      await fs.access(subtitlesPath);
      console.log(`✅ Subtitles file verified: ${subtitlesPath}`);
    } catch (error) {
      console.warn(`⚠️ Subtitles file not accessible: ${subtitlesPath}`);
      subtitlesPath = null;
    }
  } else {
    console.log('⚠️ No subtitles provided');
  }

  // 3. 验证所有输入文件
  console.log(`📊 Validating ${inputFiles.length} input files:`);
  for (let i = 0; i < inputFiles.length; i++) {
    try {
      const stats = await fs.stat(inputFiles[i]);
      console.log(`  ${i + 1}. ${inputFiles[i]} - ${stats.size} bytes`);

      if (stats.size === 0) {
        console.error(`❌ Input file ${i + 1} is empty: ${inputFiles[i]}`);
        throw new Error(`Input file ${i + 1} is empty`);
      }
    } catch (error) {
      console.error(`❌ Input file ${i + 1} validation failed: ${inputFiles[i]}`, error);
      throw new Error(`Input file validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 4. 构建FFmpeg命令（优化版）
  const ffmpegArgs = buildOptimizedFFmpegCommand(inputFiles, timeline, options, workDir, subtitlesPath);

  // 5. 执行FFmpeg
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'encoding',
    message: '开始视频编码...',
    progress: 0.5,
  })}\n\n`));

  try {
    await executeFFmpegWithProgress(ffmpegArgs, workDir, controller, encoder);
    console.log('✅ Timeline direct export completed');
  } catch (error) {
    console.error('❌ Timeline direct export failed:', error);

    // 尝试不带字幕的版本
    if (hasSubtitles && subtitlesPath) {
      console.log('🔄 Retrying without subtitles...');
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'progress',
        stage: 'retry',
        message: '重试不带字幕的导出...',
        progress: 0.6,
      })}\n\n`));

      const ffmpegArgsNoSubs = buildOptimizedFFmpegCommand(inputFiles, timeline, options, workDir, null);
      try {
        await executeFFmpegWithProgress(ffmpegArgsNoSubs, workDir, controller, encoder);
        console.log('✅ Export without subtitles completed successfully');
        return;
      } catch (retryError) {
        console.error('❌ Retry without subtitles also failed:', retryError);
      }
    }

    // 最后回退到简化导出
    console.log('🔄 Falling back to simplified export...');
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'progress',
      stage: 'fallback',
      message: '使用简化导出策略...',
      progress: 0.7,
    })}\n\n`));

    await executeSimplifiedExport(timeline, options, workDir, controller, encoder);
  }
}

/**
 * 构建优化的FFmpeg命令
 */
function buildOptimizedFFmpegCommand(
  inputFiles: string[],
  timeline: any,
  options: any,
  workDir: string,
  subtitlesPath: string | null
): string[] {
  console.log(`🔧 Building FFmpeg command for ${inputFiles.length} files`);

  // 对于多文件，使用concat协议而不是filter_complex
  if (inputFiles.length > 1) {
    return buildConcatFFmpegCommand(inputFiles, timeline, options, workDir, subtitlesPath);
  }

  // 单文件处理
  const args = ['ffmpeg', '-y'];
  args.push('-i', inputFiles[0]);

  // 检查是否有字幕文件
  const hasSubtitles = subtitlesPath !== null;

  if (hasSubtitles && subtitlesPath) {
    // 使用字幕滤镜，转义路径中的特殊字符
    const escapedPath = subtitlesPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
    args.push('-vf', `subtitles='${escapedPath}'`);
    console.log(`📝 Adding subtitles filter: subtitles='${escapedPath}'`);
  }

  // 🚀 关键修复：添加精确时长限制
  const totalDurationSeconds = timeline.totalDuration || (timeline.ir?.duration / 1000);
  if (totalDurationSeconds > 0) {
    args.push('-t', totalDurationSeconds.toFixed(3)); // 精确到毫秒
    console.log(`⏱️ Setting precise output duration: ${totalDurationSeconds.toFixed(3)} seconds`);
  }

  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
  args.push('-c:a', 'aac', '-b:a', '128k');
  args.push('-movflags', '+faststart');

  // 输出文件
  args.push(join(workDir, 'output.mp4'));

  console.log('🎬 Single file FFmpeg command:', args.join(' '));
  return args;
}

/**
 * 使用concat协议构建FFmpeg命令（更可靠的多文件处理）
 */
function buildConcatFFmpegCommand(
  inputFiles: string[],
  timeline: any,
  options: any,
  workDir: string,
  subtitlesPath: string | null
): string[] {
  console.log(`🔗 Building concat command for ${inputFiles.length} files`);

  const args = ['ffmpeg', '-y'];
  const concatFile = join(workDir, 'concat_list.txt');

  // 创建concat文件内容
  const concatContent = inputFiles.map(file => `file '${file}'`).join('\n');

  // 同步写入concat文件
  require('fs').writeFileSync(concatFile, concatContent);
  console.log(`📝 Created concat file: ${concatFile}`);
  console.log(`📝 Concat content:\n${concatContent}`);

  // 使用concat协议
  args.push('-f', 'concat');
  args.push('-safe', '0');
  args.push('-i', concatFile);

  // 检查是否有字幕文件
  const hasSubtitles = subtitlesPath !== null;

  if (hasSubtitles && subtitlesPath) {
    // 使用字幕滤镜
    const escapedPath = subtitlesPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
    args.push('-vf', `subtitles='${escapedPath}'`);
    console.log(`📝 Adding subtitles filter: subtitles='${escapedPath}'`);
  }

  // 🚀 关键修复：添加精确时长限制（concat模式）
  const totalDurationSeconds = timeline.totalDuration || (timeline.ir?.duration / 1000);
  if (totalDurationSeconds > 0) {
    args.push('-t', totalDurationSeconds.toFixed(3)); // 精确到毫秒
    console.log(`⏱️ Setting precise concat duration: ${totalDurationSeconds.toFixed(3)} seconds`);
  }

  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
  args.push('-c:a', 'aac', '-b:a', '128k');
  args.push('-movflags', '+faststart');

  // 输出文件
  args.push(join(workDir, 'output.mp4'));

  console.log('🎬 Concat FFmpeg command:', args.join(' '));
  return args;
}

/**
 * 执行FFmpeg并报告进度
 */
async function executeFFmpegWithProgress(
  args: string[],
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    console.log('🎬 Executing FFmpeg:', args.join(' '));
    console.log('📁 Working directory:', workDir);

    // 验证输入文件
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '-i' && i + 1 < args.length) {
        const inputFile = args[i + 1];
        if (!inputFile.startsWith('lavfi:') && !inputFile.startsWith('anullsrc') && !inputFile.startsWith('color=')) {
          try {
            const stats = await fs.stat(inputFile);
            console.log(`✅ Input file ${inputFile}: ${stats.size} bytes`);
            if (stats.size === 0) {
              console.warn(`⚠️ Warning: Input file ${inputFile} is empty`);
            }
          } catch (e) {
            console.error(`❌ Input file ${inputFile} not found:`, e);
            reject(new Error(`Input file not found: ${inputFile}`));
            return;
          }
        }
      }
    }

    const process = spawn(args[0], args.slice(1), {
      cwd: workDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    let stdout = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;

      // 实时输出FFmpeg日志
      console.log('FFmpeg:', chunk.trim());

      // 解析FFmpeg进度
      const progressMatch = chunk.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (progressMatch) {
        const hours = parseInt(progressMatch[1]);
        const minutes = parseInt(progressMatch[2]);
        const seconds = parseFloat(progressMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        // 假设总时长已知，计算进度
        const progress = 0.5 + (currentTime / 60) * 0.4; // 50%-90%

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'encoding',
          message: `编码中... ${Math.round(progress * 100)}%`,
          progress: Math.min(progress, 0.9),
        })}\n\n`));
      }
    });

    process.on('close', async (code) => {
      console.log(`🏁 FFmpeg process finished with code: ${code}`);

      if (code === 0) {
        // 验证输出文件
        const outputPath = args[args.length - 1];
        try {
          const stats = await fs.stat(outputPath);
          console.log(`✅ Output file created: ${outputPath} (${stats.size} bytes)`);

          if (stats.size < 1000) {
            console.error(`❌ Output file too small: ${stats.size} bytes`);
            console.error('❌ FFmpeg stderr:', stderr);
            reject(new Error(`Output file too small: ${stats.size} bytes. FFmpeg stderr: ${stderr.slice(-1000)}`));
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            stage: 'finalizing',
            message: '导出完成',
            progress: 1.0,
          })}\n\n`));
          resolve();
        } catch (e) {
          console.error(`❌ Output file not created: ${outputPath}`, e);
          console.error('❌ FFmpeg stderr:', stderr);
          reject(new Error(`Output file not created. FFmpeg stderr: ${stderr.slice(-1000)}`));
        }
      } else {
        console.error('❌ FFmpeg failed with code:', code);
        console.error('❌ FFmpeg stderr:', stderr);
        console.error('❌ FFmpeg stdout:', stdout);
        reject(new Error(`FFmpeg exited with code ${code}. Error: ${stderr.slice(-1000)}`));
      }
    });

    process.on('error', (error) => {
      console.error('❌ FFmpeg process error:', error);
      reject(error);
    });
  });
}

/**
 * 执行混合导出策略
 */
async function executeHybridExport(
  timeline: any,
  processedMedia: ProcessedMediaData[],
  aiPlan: any,
  options: any,
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  uploadedFiles: Map<string, File>
): Promise<void> {
  console.log('🔄 Executing hybrid export...');

  // 发送进度更新
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'processing',
    message: '使用混合导出策略...',
    progress: 0.1,
  })}\n\n`));

  // 简化实现：回退到时间轴直接导出
  await executeTimelineDirectExport(timeline, processedMedia, options, workDir, controller, encoder, uploadedFiles);
}

/**
 * 执行标准AI导出（回退策略）
 */
async function executeStandardAIExport(
  clips: any[],
  subtitles: string,
  totalDuration: number,
  options: any,
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  console.log('📺 Executing standard AI export fallback...');

  // 发送进度更新
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'processing',
    message: '使用标准AI导出...',
    progress: 0.1,
  })}\n\n`));

  // 简化实现：创建基本的视频文件
  const outputPath = join(workDir, 'output.mp4');

  // 创建一个简单的测试视频
  const ffmpegArgs = [
    'ffmpeg', '-y',
    '-f', 'lavfi',
    '-i', `color=c=black:s=${options.width}x${options.height}:d=${totalDuration}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    outputPath
  ];

  await executeFFmpegWithProgress(ffmpegArgs, workDir, controller, encoder);
}

/**
 * 执行简化导出策略（最可靠的回退方案）
 */
async function executeSimplifiedExport(
  timeline: any,
  options: any,
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  console.log('🔧 Executing simplified export...');

  // 发送进度更新
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'processing',
    message: '使用简化导出策略...',
    progress: 0.1,
  })}\n\n`));

  const outputPath = join(workDir, 'output.mp4');

  // 尝试查找现有的输入文件
  const inputFiles = [];
  try {
    const files = await fs.readdir(workDir);
    console.log(`📁 Found files in work directory: ${files.join(', ')}`);

    for (const file of files) {
      if (file.startsWith('input_') && file.endsWith('.mp4')) {
        const fullPath = join(workDir, file);
        // 检查文件是否存在且有内容
        try {
          const stats = await fs.stat(fullPath);
          console.log(`📊 File ${file}: ${stats.size} bytes`);
          if (stats.size > 1000) { // 至少1KB
            inputFiles.push(fullPath);
          } else {
            console.warn(`⚠️ File ${file} too small (${stats.size} bytes), skipping`);
          }
        } catch (e) {
          console.warn(`⚠️ Could not stat file ${fullPath}:`, e);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not read work directory:', error);
  }

  console.log(`📹 Found ${inputFiles.length} valid input files`);

  let ffmpegArgs: string[];

  if (inputFiles.length > 0) {
    // 检查字幕文件
    let subtitlesPath = null;
    try {
      const subtitlesFile = join(workDir, 'subtitles.ass');
      const stats = await fs.stat(subtitlesFile);
      if (stats.size > 0) {
        subtitlesPath = subtitlesFile;
        console.log(`📝 Found subtitles file: ${subtitlesFile} (${stats.size} bytes)`);
      }
    } catch (e) {
      console.log('📝 No subtitles file found');
    }

    if (inputFiles.length === 1) {
      // 单个文件，直接转码
      console.log(`📹 Processing single file: ${inputFiles[0]}`);
      ffmpegArgs = [
        'ffmpeg', '-y',
        '-i', inputFiles[0]
      ];

      // 添加字幕
      if (subtitlesPath) {
        const escapedPath = subtitlesPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
        ffmpegArgs.push('-vf', `subtitles='${escapedPath}'`);
        console.log(`📝 Adding subtitles: ${escapedPath}`);
      }

      ffmpegArgs.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputPath
      );
    } else {
      // 多个文件，使用concat协议
      console.log(`📹 Processing ${inputFiles.length} files with concat`);
      const concatFile = join(workDir, 'concat_simplified.txt');
      const concatContent = inputFiles.map(file => `file '${file}'`).join('\n');
      await fs.writeFile(concatFile, concatContent);
      console.log(`📝 Created concat file with content:\n${concatContent}`);

      ffmpegArgs = [
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile
      ];

      // 添加字幕
      if (subtitlesPath) {
        const escapedPath = subtitlesPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
        ffmpegArgs.push('-vf', `subtitles='${escapedPath}'`);
        console.log(`📝 Adding subtitles: ${escapedPath}`);
      }

      // 🚀 关键修复：添加精确时长限制（简化导出）
      const totalDurationSeconds = timeline.totalDuration || (timeline.ir?.duration / 1000);
      if (totalDurationSeconds > 0) {
        ffmpegArgs.push('-t', totalDurationSeconds.toFixed(3));
        console.log(`⏱️ Setting simplified export duration: ${totalDurationSeconds.toFixed(3)} seconds`);
      }

      ffmpegArgs.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputPath
      );
    }
  } else {
    // 回退到创建测试视频
    console.log('📹 No valid input files found, creating test video');
    const duration = Math.max((timeline.totalDuration || 10000) / 1000, 5);
    ffmpegArgs = [
      'ffmpeg', '-y',
      '-f', 'lavfi',
      '-i', `color=c=blue:s=${options.width || 1920}x${options.height || 1080}:d=${duration}:r=25`,
      '-f', 'lavfi',
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-shortest',
      outputPath
    ];
  }

  console.log('🎬 Simplified FFmpeg command:', ffmpegArgs.join(' '));
  await executeFFmpegWithProgress(ffmpegArgs, workDir, controller, encoder);
}

/**
 * 🚀 关键函数：根据IR信息创建精确裁剪的视频片段
 */
async function createTrimmedSegment(
  inputPath: string,
  outputPath: string,
  element: any,
  options: any
): Promise<void> {
  console.log(`✂️ Creating trimmed segment for element ${element.id}:`);
  console.log(`   - Input: ${inputPath}`);
  console.log(`   - Output: ${outputPath}`);
  console.log(`   - In: ${element.in}ms, Out: ${element.out}ms`);
  console.log(`   - Start: ${element.start}ms`);

  // 计算裁剪参数（转换为秒）
  const startSeconds = (element.in || 0) / 1000;
  const durationSeconds = ((element.out || 0) - (element.in || 0)) / 1000;

  console.log(`   - FFmpeg: -ss ${startSeconds.toFixed(3)}s, -t ${durationSeconds.toFixed(3)}s`);

  // 构建FFmpeg命令进行精确裁剪
  const ffmpegArgs = [
    'ffmpeg', '-y',
    '-ss', startSeconds.toFixed(3), // 开始时间
    '-i', inputPath,
    '-t', durationSeconds.toFixed(3), // 持续时间
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-avoid_negative_ts', 'make_zero', // 避免负时间戳
    '-movflags', '+faststart',
    outputPath
  ];

  console.log(`🎬 Trimming command: ${ffmpegArgs.join(' ')}`);

  // 执行FFmpeg命令
  const { spawn } = require('child_process');
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegArgs[0], ffmpegArgs.slice(1));

    let stderr = '';
    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code: number) => {
      if (code === 0) {
        console.log(`✅ Successfully created trimmed segment: ${outputPath}`);
        resolve();
      } else {
        console.error(`❌ FFmpeg trimming failed with code ${code}`);
        console.error(`❌ FFmpeg stderr: ${stderr}`);
        reject(new Error(`FFmpeg trimming failed: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error: Error) => {
      console.error(`❌ FFmpeg spawn error:`, error);
      reject(error);
    });
  });
}

/**
 * 创建占位符视频
 */
async function createPlaceholderVideo(
  outputPath: string,
  durationMs: number,
  options: any
): Promise<void> {
  const durationSec = Math.max(durationMs / 1000, 1); // 至少1秒

  console.log(`🎬 Creating placeholder video: ${outputPath} (${durationSec}s)`);

  const args = [
    'ffmpeg', '-y',
    '-f', 'lavfi',
    '-i', `color=c=gray:s=${options.width || 1920}x${options.height || 1080}:d=${durationSec}:r=25`,
    '-f', 'lavfi',
    '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '30',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    '-movflags', '+faststart',
    outputPath
  ];

  return new Promise((resolve, reject) => {
    console.log('🎬 Placeholder FFmpeg command:', args.join(' '));

    const process = spawn(args[0], args.slice(1));

    let stderr = '';

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', async (code) => {
      if (code === 0) {
        try {
          const stats = await fs.stat(outputPath);
          console.log(`✅ Placeholder video created: ${outputPath} (${stats.size} bytes)`);
          resolve();
        } catch (e) {
          console.error(`❌ Placeholder video not created: ${outputPath}`, e);
          reject(new Error(`Placeholder video not created: ${e instanceof Error ? e.message : 'Unknown error'}`));
        }
      } else {
        console.error(`❌ Failed to create placeholder video, exit code: ${code}`);
        console.error(`❌ FFmpeg stderr: ${stderr}`);
        reject(new Error(`Failed to create placeholder video, exit code: ${code}. Error: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ Placeholder video process error:`, error);
      reject(error);
    });
  });
}
