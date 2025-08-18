// ai-clips/route.ts - 基于AI剪辑计划的快速导出API
// 此文件提供基于video_url的快速导出服务，避免文件上传瓶颈
// 文件路径: app/api/export/ai-clips/route.ts

import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { TimelineIR } from "@/types/timeline";
import { ASSGenerator } from "@/lib/export/ass-generator";

interface AIClipData {
  sequence_clip_id: string;
  video_url: string;
  sequence_start_timecode: string;
  source_in_timecode: string;
  source_out_timecode: string;
  clip_duration_in_sequence: string;
}

interface AIExportRequest {
  clips: AIClipData[];
  subtitles: string; // ASS格式字幕
  totalDuration: number; // 总时长（秒）
  options: {
    quality: 'preview' | 'standard' | 'professional';
    width?: number;
    height?: number;
    fps?: number;
  };
}

/**
 * 基于AI剪辑计划的快速导出API - POST请求
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  let workDir: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('🚀 AI clips export API called');
        const requestData: AIExportRequest = await req.json();
        const { clips, subtitles, totalDuration, options } = requestData;

        console.log('=== AI剪辑快速导出开始 ===');
        console.log('Clips count:', clips.length);
        console.log('Total duration:', totalDuration, 'seconds');
        console.log('Quality:', options.quality);
        console.log('First clip URL:', clips[0]?.video_url);

        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'starting',
          message: '开始快速导出...',
          progress: 0,
        })}\n\n`));

        // 创建工作目录
        workDir = await fs.mkdtemp(join(tmpdir(), 'ai-clips-export-'));
        console.log('Work directory:', workDir);

        // 执行快速导出
        await executeAIClipsExport(clips, subtitles, totalDuration, options, workDir, controller, encoder);

        // 发送完成事件
        const outputPath = join(workDir, 'output.mp4');
        const stats = await fs.stat(outputPath);

        // 提取导出ID（去掉前缀）
        const exportId = workDir.split('/').pop()?.replace('ai-clips-export-', '') || '';

        console.log('🎉 AI剪辑导出完成:', {
          outputPath,
          fileSize: stats.size,
          exportId,
          workDir,
          downloadUrl: `/api/export/download/${exportId}`,
        });

        // 验证文件确实存在
        try {
          const fileExists = await fs.access(outputPath);
          console.log('✅ 输出文件确认存在:', outputPath);
        } catch (error) {
          console.error('❌ 输出文件不存在:', outputPath, error);
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          downloadUrl: `/api/export/download/${exportId}`,
          size: stats.size,
          duration: totalDuration,
        })}\n\n`));

      } catch (error) {
        console.error('AI clips export error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`));
      } finally {
        controller.close();
      }
    },
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
 * 执行AI剪辑快速导出
 */
async function executeAIClipsExport(
  clips: AIClipData[],
  subtitles: string,
  totalDuration: number,
  options: any,
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  // 生成字幕文件
  if (subtitles) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'progress',
      stage: 'preparing',
      message: '生成字幕文件...',
      progress: 0.1,
    })}\n\n`));

    const assPath = join(workDir, 'subtitles.ass');
    await fs.writeFile(assPath, subtitles, 'utf8');
    console.log('Generated subtitles file:', assPath);
  }

  // 下载和处理视频片段
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'downloading',
    message: '下载视频片段...',
    progress: 0.2,
  })}\n\n`));

  const processedClips = await downloadAndProcessClips(clips, workDir, controller, encoder);

  // 构建FFmpeg命令
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'preparing',
    message: '准备视频合成...',
    progress: 0.6,
  })}\n\n`));

  const ffmpegArgs = await buildAIClipsFFmpegCommand(processedClips, subtitles, totalDuration, options, workDir);
  
  console.log('=== AI剪辑导出调试信息 ===');
  console.log('Processed clips:', processedClips.length);
  console.log('Processed clips details:', processedClips.map(clip => ({
    path: clip.clipPath,
    duration: clip.duration,
    exists: require('fs').existsSync(clip.clipPath)
  })));
  console.log('FFmpeg args:', ffmpegArgs.join(' '));
  console.log('========================');

  // 执行FFmpeg
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'encoding',
    message: '开始视频编码...',
    progress: 0.7,
  })}\n\n`));

  await executeFFmpegWithProgress(ffmpegArgs, workDir, totalDuration, controller, encoder);
}

/**
 * 下载和处理视频片段 - 并行版本
 */
async function downloadAndProcessClips(
  clips: AIClipData[],
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<Array<{ clipPath: string; duration: number }>> {
  console.log(`🚀 开始并行下载 ${clips.length} 个视频片段...`);

  // 并行处理所有片段
  const processPromises = clips.map(async (clip, i) => {
    const clipId = `${i + 1}/${clips.length}`;

    try {
      console.log(`🎬 开始处理片段 ${clipId}: ${clip.sequence_clip_id}`);

      // 下载原始视频 (带重试)
      const originalPath = join(workDir, `original_${i}.mp4`);
      console.log(`📥 下载视频 ${clipId}: ${clip.video_url}`);
      await downloadFile(clip.video_url, originalPath, 3); // 最多重试3次
      console.log(`✅ 下载完成 ${clipId}: ${clip.sequence_clip_id}`);

      // 裁剪视频片段 (带重试)
      const clippedPath = join(workDir, `clipped_${i}.mp4`);
      console.log(`✂️ 裁剪视频 ${clipId}: ${clip.source_in_timecode} -> ${clip.source_out_timecode}`);
      await clipVideo(originalPath, clippedPath, clip.source_in_timecode, clip.source_out_timecode, 2); // 最多重试2次
      console.log(`✅ 裁剪完成 ${clipId}: ${clip.sequence_clip_id}`);

      // 计算片段时长
      const duration = timecodeToSeconds(clip.source_out_timecode) - timecodeToSeconds(clip.source_in_timecode);
      console.log(`⏱️ 片段时长 ${clipId}: ${duration.toFixed(2)}秒`);

      // 清理原始文件以节省空间
      try {
        await fs.unlink(originalPath);
        console.log(`🗑️ 清理完成 ${clipId}: ${clip.sequence_clip_id}`);
      } catch (cleanupError) {
        console.warn(`⚠️ 清理文件失败 ${clipId}:`, cleanupError);
        // 清理失败不影响主流程
      }

      console.log(`🎉 片段处理完成 ${clipId}: ${clip.sequence_clip_id}`);
      return {
        clipPath: clippedPath,
        duration,
        index: i // 保持原始顺序
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ 片段处理失败 ${clipId}:`, errorMsg);
      console.error(`❌ 失败的片段信息:`, {
        sequence_clip_id: clip.sequence_clip_id,
        video_url: clip.video_url,
        timecode: `${clip.source_in_timecode} -> ${clip.source_out_timecode}`
      });

      // 重新抛出错误，确保Promise.all失败
      throw new Error(`片段 ${clipId} (${clip.sequence_clip_id}) 处理失败: ${errorMsg}`);
    }
  });

  // 监控并行进度
  let completedCount = 0;
  const totalCount = clips.length;

  // 等待所有片段处理完成，同时监控进度
  const results = await Promise.all(
    processPromises.map(async (promise, index) => {
      const result = await promise;
      completedCount++;

      const progress = 0.2 + (completedCount / totalCount) * 0.4; // 20% - 60%
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'progress',
        stage: 'downloading',
        message: `已完成 ${completedCount}/${totalCount} 个片段`,
        progress,
      })}\n\n`));

      return result;
    })
  );

  // 按原始顺序排序
  const processedClips = results
    .sort((a, b) => a.index - b.index)
    .map(({ clipPath, duration }) => ({ clipPath, duration }));

  console.log(`🎉 所有 ${clips.length} 个片段处理完成！`);
  return processedClips;
}

/**
 * 下载文件 - 带重试机制
 */
async function downloadFile(url: string, outputPath: string, maxRetries: number = 3): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 下载尝试 ${attempt}/${maxRetries}: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));

      console.log(`✅ 下载成功 (尝试 ${attempt}/${maxRetries}): ${url}`);
      return; // 成功，退出重试循环

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ 下载失败 (尝试 ${attempt}/${maxRetries}): ${url} - ${lastError.message}`);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败了
  throw new Error(`下载失败，已重试 ${maxRetries} 次: ${url} - 最后错误: ${lastError?.message}`);
}

/**
 * 裁剪视频片段 - 带重试机制
 */
async function clipVideo(inputPath: string, outputPath: string, startTime: string, endTime: string, maxRetries: number = 2): Promise<void> {
  const startSeconds = timecodeToSeconds(startTime);
  const endSeconds = timecodeToSeconds(endTime);
  const duration = endSeconds - startSeconds;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`✂️ 裁剪尝试 ${attempt}/${maxRetries}: ${inputPath} -> ${outputPath}`);

      await new Promise<void>((resolve, reject) => {
        const args = [
          '-i', inputPath,
          '-ss', startSeconds.toString(),
          '-t', duration.toString(),
          '-c:v', 'libx264', // 重新编码视频确保兼容性
          '-c:a', 'aac', // 重新编码音频确保兼容性
          '-preset', 'fast', // 使用快速预设平衡速度和质量
          '-crf', '23', // 设置合理的质量
          '-avoid_negative_ts', 'make_zero',
          '-y',
          outputPath
        ];

        const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' });
        let stderr = '';

        ffmpeg.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg clip failed with code ${code}: ${stderr}`));
          }
        });

        ffmpeg.on('error', reject);
      });

      console.log(`✅ 裁剪成功 (尝试 ${attempt}/${maxRetries}): ${outputPath}`);
      return; // 成功，退出重试循环

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ 裁剪失败 (尝试 ${attempt}/${maxRetries}): ${outputPath} - ${lastError.message}`);

      if (attempt < maxRetries) {
        const delay = 1000; // 1秒延迟
        console.log(`⏳ 等待 ${delay}ms 后重试裁剪...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败了
  throw new Error(`视频裁剪失败，已重试 ${maxRetries} 次: ${outputPath} - 最后错误: ${lastError?.message}`);
}

/**
 * 构建AI剪辑FFmpeg命令
 */
async function buildAIClipsFFmpegCommand(
  processedClips: Array<{ clipPath: string; duration: number }>,
  subtitles: string,
  totalDuration: number,
  options: any,
  workDir: string
): Promise<string[]> {
  const args: string[] = [];

  // 创建concat文件列表
  const concatList = processedClips.map(clip => `file '${clip.clipPath}'`).join('\n');
  const concatPath = join(workDir, 'concat_list.txt');
  await fs.writeFile(concatPath, concatList);

  // 使用concat协议
  args.push('-f', 'concat', '-safe', '0', '-i', concatPath);

  // 设置总时长
  args.push('-t', totalDuration.toString());

  // 基础设置
  args.push('-c:v', 'libx264');
  args.push('-c:a', 'aac');
  args.push('-preset', 'medium');
  args.push('-pix_fmt', 'yuv420p');

  // 只在明确指定分辨率时才设置，否则保持原始分辨率
  if (options.width && options.height) {
    args.push('-s', `${options.width}x${options.height}`);
  }

  // 只在明确指定帧率时才设置，否则保持原始帧率
  if (options.fps) {
    args.push('-r', options.fps.toString());
  }

  // 质量设置
  switch (options.quality) {
    case 'preview':
      args.push('-crf', '28');
      break;
    case 'standard':
      args.push('-crf', '23');
      break;
    case 'professional':
      args.push('-crf', '18');
      break;
  }

  // 字幕处理
  if (subtitles) {
    const assPath = join(workDir, 'subtitles.ass');
    args.push('-vf', `subtitles=${assPath}`);
  }

  // 输出文件
  args.push('-y');
  args.push(join(workDir, 'output.mp4'));

  return args;
}

/**
 * 时间码转换为秒
 */
function timecodeToSeconds(timecode: string): number {
  const parts = timecode.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * 执行FFmpeg并推送实时进度
 */
function executeFFmpegWithProgress(
  args: string[],
  workDir: string,
  totalDuration: number,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, {
      cwd: workDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';

    ffmpeg.stderr?.on('data', (data) => {
      stderr += data.toString();
      
      // 解析FFmpeg进度
      const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min(0.7 + (currentTime / totalDuration) * 0.25, 0.95);
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'encoding',
          message: `编码中... ${Math.round(progress * 100)}%`,
          progress,
        })}\n\n`));
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'finalizing',
          message: '完成导出',
          progress: 1.0,
        })}\n\n`));
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}
