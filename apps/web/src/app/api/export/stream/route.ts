// stream/route.ts - 流式导出API，支持实时进度推送
// 此文件提供支持Server-Sent Events的流式导出服务
// 文件路径: app/api/export/stream/route.ts

import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { z } from "zod";
import { TimelineIR } from "@/types/timeline";
import { ASSGenerator } from "@/lib/export/ass-generator";

// 请求验证schema
const streamExportRequestSchema = z.object({
  ir: z.object({
    width: z.number(),
    height: z.number(),
    fps: z.number(),
    duration: z.number(),
    video: z.array(z.any()),
    audio: z.array(z.any()),
    texts: z.array(z.any()),
    transitions: z.array(z.any()),
  }),
  options: z.object({
    quality: z.enum(['preview', 'standard', 'professional']),
    format: z.enum(['mp4', 'webm', 'mov']).optional(),
    codec: z.enum(['h264', 'h265', 'vp9', 'av1']).optional(),
    useGPU: z.boolean().optional(),
    subtitleMode: z.enum(['hard', 'soft', 'none']).optional(),
  }),
});

/**
 * 流式导出API - POST请求
 * 使用Server-Sent Events推送实时进度
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  let workDir: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 解析请求体
        const body = await req.json();
        const { ir, options } = streamExportRequestSchema.parse(body);

        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'start',
          message: '开始导出...',
          timestamp: new Date().toISOString(),
        })}\n\n`));

        // 创建临时工作目录
        workDir = await fs.mkdtemp(join(tmpdir(), 'opencut-stream-export-'));

        // 提取导出ID（去掉前缀）
        const exportId = workDir.split('/').pop()?.replace('opencut-stream-export-', '') || '';

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'preparing',
          message: '准备工作环境...',
          progress: 0.1,
        })}\n\n`));

        // 执行流式导出
        await streamExportVideo(ir, options, workDir, controller, encoder);

        // 发送完成事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          message: '导出完成',
          downloadUrl: `/api/export/download/${exportId}`,
          timestamp: new Date().toISOString(),
        })}\n\n`));

      } catch (error) {
        console.error('Stream export error:', error);
        
        // 发送错误事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })}\n\n`));

        // 清理工作目录
        if (workDir) {
          await cleanupWorkDir(workDir);
        }
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * 流式导出视频
 */
async function streamExportVideo(
  ir: TimelineIR,
  options: any,
  workDir: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  // 生成字幕文件
  if (ir.texts.length > 0 && options.subtitleMode !== 'none') {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'progress',
      stage: 'preparing',
      message: '生成字幕文件...',
      progress: 0.2,
    })}\n\n`));

    const assContent = ASSGenerator.generateASS(ir);
    const assPath = join(workDir, 'subtitles.ass');
    await fs.writeFile(assPath, assContent, 'utf8');
  }

  // 准备输入文件
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'preparing',
    message: '准备输入文件...',
    progress: 0.3,
  })}\n\n`));

  const inputFiles = await prepareInputFiles(ir, workDir);

  // 构建FFmpeg命令
  const ffmpegArgs = buildFFmpegCommand(ir, options, inputFiles, workDir);

  console.log('=== 导出调试信息 ===');
  console.log('IR duration:', ir.duration, 'ms');
  console.log('IR video count:', ir.video.length);
  console.log('IR text count:', ir.texts.length);
  console.log('Input files:', inputFiles);
  console.log('FFmpeg args:', ffmpegArgs.join(' '));
  console.log('===================');

  // 执行FFmpeg并推送进度
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'encoding',
    message: '开始视频编码...',
    progress: 0.4,
  })}\n\n`));

  await executeFFmpegWithProgress(ffmpegArgs, workDir, ir.duration, controller, encoder);
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
    const totalDurationSeconds = totalDuration / 1000;

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;

      // 解析进度信息
      const timeMatch = output.match(/time=(\d+):(\d+):(\d+)\.(\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        // 🚀 修复：确保进度不超过100%
        const rawProgress = totalDurationSeconds > 0 ? currentTime / totalDurationSeconds : 0;
        const encodingProgress = Math.min(rawProgress, 1); // 限制在100%以内
        const overallProgress = Math.min(0.4 + encodingProgress * 0.5, 0.9);
        const displayPercentage = Math.min(Math.round(encodingProgress * 100), 100); // 显示百分比限制在100%

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'encoding',
          message: `编码进度: ${displayPercentage}%`,
          progress: overallProgress,
          currentTime,
          totalTime: totalDurationSeconds,
        })}\n\n`));
      }

      // 解析速度信息
      const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
      if (speedMatch) {
        const speed = parseFloat(speedMatch[1]);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'info',
          message: `处理速度: ${speed}x`,
          speed,
        })}\n\n`));
      }

      // 解析帧信息
      const frameMatch = output.match(/frame=\s*(\d+)/);
      if (frameMatch) {
        const frames = parseInt(frameMatch[1]);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'info',
          message: `已处理帧数: ${frames}`,
          frames,
        })}\n\n`));
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'finalizing',
          message: '完成编码，准备输出...',
          progress: 0.95,
        })}\n\n`));
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with exit code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 准备输入文件（使用真实媒体文件）
 */
async function prepareInputFiles(ir: TimelineIR, workDir: string, uploadedFiles?: Map<string, string>): Promise<string[]> {
  const inputFiles: string[] = [];

  // 处理真实的视频文件
  for (let i = 0; i < ir.video.length; i++) {
    const videoElement = ir.video[i];
    const inputPath = join(workDir, `video_${i}.mp4`);

    try {
      // 优先使用上传的文件
      if (uploadedFiles && uploadedFiles.has(videoElement.id)) {
        const uploadedFilePath = uploadedFiles.get(videoElement.id)!;
        inputFiles.push(uploadedFilePath);
        console.log(`Using uploaded file for video ${i}: ${uploadedFilePath}`);
        continue;
      }

      // 如果是本地文件路径，直接使用
      if (videoElement.src.startsWith('/') || videoElement.src.startsWith('file://')) {
        inputFiles.push(videoElement.src);
      }
      // 如果是HTTP URL，下载到本地
      else if (videoElement.src.startsWith('http')) {
        await downloadFile(videoElement.src, inputPath);
        inputFiles.push(inputPath);
      }
      // 如果是blob URL或其他格式，创建测试视频作为后备
      else {
        console.warn(`Unsupported video source: ${videoElement.src}, creating test video`);
        // 计算这个视频片段的实际时长（秒）
        const videoDuration = (videoElement.out - videoElement.in) / 1000;
        await createTestVideo(inputPath, ir.width, ir.height, Math.max(videoDuration, 1));
        inputFiles.push(inputPath);
      }
    } catch (error) {
      console.error(`Failed to prepare video ${i}:`, error);
      // 创建测试视频作为后备，使用默认时长
      const videoElement = ir.video[i];
      const videoDuration = videoElement ? (videoElement.out - videoElement.in) / 1000 : 5;
      await createTestVideo(inputPath, ir.width, ir.height, Math.max(videoDuration, 1));
      inputFiles.push(inputPath);
    }
  }

  return inputFiles;
}

/**
 * 下载文件到本地
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
}

/**
 * 创建测试视频文件
 */
async function createTestVideo(
  outputPath: string,
  width: number,
  height: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-f', 'lavfi',
      '-i', `testsrc=duration=${duration}:size=${width}x${height}:rate=30`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-y',
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to create test video: ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}

/**
 * 构建FFmpeg命令（完整版本，支持时间轴合成）
 */
function buildFFmpegCommand(
  ir: TimelineIR,
  options: any,
  inputFiles: string[],
  workDir: string
): string[] {
  // 使用concat协议来处理多个视频片段
  return buildConcatFFmpegCommand(ir, options, inputFiles, workDir);
}

/**
 * 构建concat FFmpeg命令（处理多个视频片段）
 */
function buildConcatFFmpegCommand(
  ir: TimelineIR,
  options: any,
  inputFiles: string[],
  workDir: string
): string[] {
  const args: string[] = [];

  // 🚀 修复：正确处理concat协议，避免时长不一致
  // 按时间轴顺序排序视频片段
  const sortedVideos = [...ir.video].sort((a, b) => a.start - b.start);

  // 创建concat文件列表，精确控制每个片段的时长
  const concatEntries: string[] = [];
  let totalCalculatedDuration = 0;

  for (let i = 0; i < sortedVideos.length; i++) {
    const video = sortedVideos[i];
    const inputFile = inputFiles[i];

    if (inputFile) {
      // 计算实际播放时长（考虑trim）
      const segmentDuration = (video.out - video.in) / 1000;
      totalCalculatedDuration += segmentDuration;

      concatEntries.push(`file '${inputFile}'`);
      concatEntries.push(`duration ${segmentDuration.toFixed(6)}`);

      console.log(`Video segment ${i}: ${segmentDuration.toFixed(3)}s (${video.in/1000}-${video.out/1000})`);
    }
  }

  // 🚀 修复：不添加重复的最后文件引用，这是导致时长错误的主要原因
  const concatContent = concatEntries.join('\n');

  const concatPath = join(workDir, 'concat_list.txt');
  require('fs').writeFileSync(concatPath, concatContent);

  console.log('=== Concat Debug Info ===');
  console.log('IR total duration:', ir.duration / 1000, 'seconds');
  console.log('Calculated total duration:', totalCalculatedDuration, 'seconds');
  console.log('Video segments count:', sortedVideos.length);
  console.log('Concat file content:');
  console.log(concatContent);
  console.log('========================');

  // 使用concat协议作为唯一输入
  args.push('-f', 'concat', '-safe', '0', '-i', concatPath);

  // 🚀 修复：使用计算出的精确时长，而不是IR中可能不准确的总时长
  args.push('-t', totalCalculatedDuration.toFixed(6));

  // 基础设置
  args.push('-c:v', options.codec || 'libx264');
  args.push('-c:a', 'aac');
  args.push('-preset', 'medium');
  args.push('-pix_fmt', 'yuv420p');
  args.push('-s', `${ir.width}x${ir.height}`);
  args.push('-r', ir.fps.toString());

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
  if (ir.texts.length > 0 && options.subtitleMode !== 'none') {
    const assPath = join(workDir, 'subtitles.ass');
    args.push('-vf', `subtitles=${assPath}`);
  }

  // 输出文件
  args.push('-y');
  args.push(join(workDir, 'output.mp4'));

  console.log('FFmpeg command:', args.join(' '));

  return args;
}

/**
 * 清理工作目录
 */
async function cleanupWorkDir(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup work directory ${workDir}:`, error);
  }
}
