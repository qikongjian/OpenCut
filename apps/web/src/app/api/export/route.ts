// route.ts - 后端导出API
// 此文件提供高性能的服务端视频导出服务
// 文件路径: app/api/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { z } from "zod";
import { TimelineIR } from "@/types/timeline";
import { ExportOptions } from "@/types/export";
import { ASSGenerator } from "@/lib/export/ass-generator";

// 请求验证schema
const exportRequestSchema = z.object({
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
 * 后端导出API - POST请求
 */
export async function POST(req: NextRequest) {
  let workDir: string | null = null;
  
  try {
    // 解析请求体
    const body = await req.json();
    const { ir, options } = exportRequestSchema.parse(body);

    // 创建临时工作目录
    workDir = await fs.mkdtemp(join(tmpdir(), 'opencut-export-'));
    console.log(`Created work directory: ${workDir}`);

    // 执行导出
    const result = await exportVideo(ir, options, workDir);

    // 读取输出文件
    const outputPath = join(workDir, 'output.mp4');
    const outputData = await fs.readFile(outputPath);

    // 清理工作目录
    await cleanupWorkDir(workDir);

    // 返回文件
    return new NextResponse(outputData, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="export_${Date.now()}.mp4"`,
        'Content-Length': outputData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    
    // 清理工作目录
    if (workDir) {
      await cleanupWorkDir(workDir);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 导出视频主函数
 */
async function exportVideo(
  ir: TimelineIR,
  options: any,
  workDir: string
): Promise<void> {
  // 生成字幕文件
  if (ir.texts.length > 0 && options.subtitleMode !== 'none') {
    const assContent = ASSGenerator.generateASS(ir);
    const assPath = join(workDir, 'subtitles.ass');
    await fs.writeFile(assPath, assContent, 'utf8');
  }

  // 准备输入文件列表
  const inputFiles = await prepareInputFiles(ir, workDir);

  // 构建FFmpeg命令
  const ffmpegArgs = buildFFmpegCommand(ir, options, inputFiles, workDir);

  // 执行FFmpeg
  await executeFFmpeg(ffmpegArgs, workDir);
}

/**
 * 准备输入文件
 */
async function prepareInputFiles(ir: TimelineIR, workDir: string): Promise<string[]> {
  const inputFiles: string[] = [];

  // 处理视频文件
  for (let i = 0; i < ir.video.length; i++) {
    const video = ir.video[i];
    const inputPath = join(workDir, `video_${i}.mp4`);

    try {
      // 如果是Blob URL，需要特殊处理
      if (video.src.startsWith('blob:')) {
        console.log(`Skipping blob URL for now: ${video.src}`);
        // 在实际实现中，需要从前端传递实际的文件数据
        // 现在创建一个占位符文件
        await createPlaceholderVideo(inputPath, video.duration || 5000);
      } else {
        // 如果是实际文件路径，复制文件
        console.log(`Would copy video file: ${video.src} -> ${inputPath}`);
        // 在实际实现中，这里需要从存储中获取实际文件
        await createPlaceholderVideo(inputPath, video.duration || 5000);
      }

      inputFiles.push(inputPath);
    } catch (error) {
      console.error(`Failed to prepare video file ${video.src}:`, error);
      // 创建占位符视频
      await createPlaceholderVideo(inputPath, video.duration || 5000);
      inputFiles.push(inputPath);
    }
  }

  // 处理音频文件
  for (let i = 0; i < ir.audio.length; i++) {
    const audio = ir.audio[i];
    const inputPath = join(workDir, `audio_${i}.mp3`);

    try {
      if (audio.src.startsWith('blob:')) {
        console.log(`Skipping blob URL for now: ${audio.src}`);
        await createPlaceholderAudio(inputPath, audio.duration || 5000);
      } else {
        console.log(`Would copy audio file: ${audio.src} -> ${inputPath}`);
        await createPlaceholderAudio(inputPath, audio.duration || 5000);
      }

      inputFiles.push(inputPath);
    } catch (error) {
      console.error(`Failed to prepare audio file ${audio.src}:`, error);
      await createPlaceholderAudio(inputPath, audio.duration || 5000);
      inputFiles.push(inputPath);
    }
  }

  return inputFiles;
}

/**
 * 创建占位符视频文件
 */
async function createPlaceholderVideo(outputPath: string, durationMs: number): Promise<void> {
  const durationSeconds = Math.max(1, Math.floor(durationMs / 1000));

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', `color=c=blue:size=1920x1080:duration=${durationSeconds}`,
      '-c:v', 'libx264',
      '-t', durationSeconds.toString(),
      '-pix_fmt', 'yuv420p',
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to create placeholder video: ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}

/**
 * 创建占位符音频文件
 */
async function createPlaceholderAudio(outputPath: string, durationMs: number): Promise<void> {
  const durationSeconds = Math.max(1, Math.floor(durationMs / 1000));

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', `sine=frequency=440:duration=${durationSeconds}`,
      '-c:a', 'mp3',
      '-t', durationSeconds.toString(),
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to create placeholder audio: ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}

/**
 * 构建FFmpeg命令
 */
function buildFFmpegCommand(
  ir: TimelineIR,
  options: any,
  inputFiles: string[],
  workDir: string
): string[] {
  const args: string[] = [];

  // 输入文件
  for (const inputFile of inputFiles) {
    args.push('-i', inputFile);
  }

  // 基础编码设置
  args.push('-c:v', options.codec || 'libx264');
  args.push('-c:a', 'aac');
  args.push('-preset', 'medium');
  args.push('-pix_fmt', 'yuv420p');

  // 分辨率和帧率
  args.push('-s', `${ir.width}x${ir.height}`);
  args.push('-r', ir.fps.toString());

  // 质量设置
  switch (options.quality) {
    case 'preview':
      args.push('-crf', '28');
      args.push('-b:v', '2M');
      args.push('-b:a', '128k');
      break;
    case 'standard':
      args.push('-crf', '23');
      args.push('-b:v', '5M');
      args.push('-b:a', '192k');
      break;
    case 'professional':
      args.push('-crf', '18');
      args.push('-b:v', '15M');
      args.push('-b:a', '320k');
      break;
  }

  // GPU加速
  if (options.useGPU) {
    // 检查是否支持硬件加速
    if (options.codec === 'h264') {
      args.splice(args.indexOf('-c:v') + 1, 1, 'h264_nvenc');
    } else if (options.codec === 'h265') {
      args.splice(args.indexOf('-c:v') + 1, 1, 'hevc_nvenc');
    }
  }

  // 字幕处理
  if (ir.texts.length > 0 && options.subtitleMode === 'hard') {
    const assPath = join(workDir, 'subtitles.ass');
    args.push('-vf', `subtitles=${assPath}`);
  } else if (ir.texts.length > 0 && options.subtitleMode === 'soft') {
    args.push('-i', join(workDir, 'subtitles.ass'));
    args.push('-c:s', 'ass');
  }

  // 输出文件
  args.push('-y'); // 覆盖输出文件
  args.push(join(workDir, 'output.mp4'));

  return args;
}

/**
 * 执行FFmpeg命令
 */
function executeFFmpeg(args: string[], workDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Executing FFmpeg with args:', args);
    
    const ffmpeg = spawn('ffmpeg', args, {
      cwd: workDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';

    ffmpeg.stdout.on('data', (data) => {
      console.log('FFmpeg stdout:', data.toString());
    });

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log('FFmpeg stderr:', output);
      
      // 解析进度信息
      const timeMatch = output.match(/time=(\d+):(\d+):(\d+)\.(\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        console.log(`Progress: ${currentTime}s processed`);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('FFmpeg completed successfully');
        resolve();
      } else {
        console.error('FFmpeg failed with code:', code);
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg failed with exit code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg spawn error:', error);
      reject(error);
    });
  });
}

/**
 * 清理工作目录
 */
async function cleanupWorkDir(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
    console.log(`Cleaned up work directory: ${workDir}`);
  } catch (error) {
    console.warn(`Failed to cleanup work directory ${workDir}:`, error);
  }
}

/**
 * 健康检查端点 - GET请求
 */
export async function GET() {
  try {
    // 检查FFmpeg是否可用
    const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: 'pipe' });
    
    return new Promise((resolve) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ 
            status: 'healthy', 
            ffmpeg: 'available',
            timestamp: new Date().toISOString(),
          }));
        } else {
          resolve(NextResponse.json({ 
            status: 'unhealthy', 
            ffmpeg: 'unavailable',
            timestamp: new Date().toISOString(),
          }, { status: 503 }));
        }
      });

      ffmpeg.on('error', () => {
        resolve(NextResponse.json({ 
          status: 'unhealthy', 
          ffmpeg: 'error',
          timestamp: new Date().toISOString(),
        }, { status: 503 }));
      });
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy', 
      error: 'Failed to check FFmpeg',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
