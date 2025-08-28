// upload/route.ts - 支持文件上传的导出API
// 此文件提供支持文件上传的导出服务，解决blob URL无法访问的问题
// 文件路径: app/api/export/upload/route.ts

import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { TimelineIR } from "@/types/timeline";
import { ASSGenerator } from "@/lib/export/ass-generator";

/**
 * 支持文件上传的导出API - POST请求
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  let workDir: string | null = null;
  
  // 从URL中获取项目ID
  const url = new URL(req.url);
  const projectId = url.searchParams.get('project_id');
  
  console.log('📋 导出请求信息:');
  console.log('  - 项目ID:', projectId || '未提供');
  console.log('  - 请求URL:', req.url);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 解析multipart/form-data
        const formData = await req.formData();
        
        // 获取IR数据
        const irData = formData.get('ir') as string;
        const optionsData = formData.get('options') as string;
        
        if (!irData || !optionsData) {
          throw new Error('Missing IR or options data');
        }

        const ir: TimelineIR = JSON.parse(irData);
        const options = JSON.parse(optionsData);

        console.log('=== 文件上传导出开始 ===');
        console.log('IR duration:', ir.duration, 'ms');
        console.log('IR video count:', ir.video.length);
        console.log('IR text count:', ir.texts.length);

        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'starting',
          message: '开始导出...',
          progress: 0,
        })}\n\n`));

        // 创建工作目录
        workDir = await fs.mkdtemp(join(tmpdir(), 'video-export-upload-'));
        console.log('Work directory:', workDir);

        // 处理上传的文件
        const uploadedFiles = new Map<string, string>();
        
        // 保存上传的视频文件
        for (let i = 0; i < ir.video.length; i++) {
          const videoElement = ir.video[i];
          const fileKey = `video_${videoElement.id}`;
          const uploadedFile = formData.get(fileKey) as File;
          
          if (uploadedFile) {
            const filePath = join(workDir, `uploaded_video_${i}.mp4`);
            const buffer = await uploadedFile.arrayBuffer();
            await fs.writeFile(filePath, Buffer.from(buffer));
            uploadedFiles.set(videoElement.id, filePath);
            console.log(`Saved uploaded file for video ${i}: ${filePath} (${uploadedFile.size} bytes)`);
          }
        }

        // 执行导出
        await executeExportWithFiles(ir, options, workDir, uploadedFiles, controller, encoder);

        // 发送完成事件
        const outputPath = join(workDir, 'output.mp4');
        const stats = await fs.stat(outputPath);

        // 提取导出ID（去掉前缀）
        const exportId = workDir.split('/').pop()?.replace('video-export-upload-', '') || '';

        // 🚀 新增：同步上传到七牛云
        let qiniuUrl = null;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            stage: 'uploading',
            message: '正在上传到七牛云...',
            progress: 0.9,
          })}\n\n`));

          const qiniuResult = await uploadToQiniu(outputPath, exportId);
          
          if (qiniuResult.success) {
            qiniuUrl = qiniuResult.url;
            console.log('✅ 七牛云上传成功:', qiniuUrl);
          } else {
            console.warn('⚠️ 七牛云上传失败:', qiniuResult.error);
          }
        } catch (error) {
          console.warn('⚠️ 七牛云上传异常:', error);
        }

        // 🚀 新增：调用任务结果更新接口
        if (qiniuUrl) {
          try {
            // 使用项目ID而不是导出ID
            const actualProjectId = projectId || exportId;
            console.log('🎬 准备调用粗剪视频接口:');
            console.log('  - 使用项目ID:', actualProjectId);
            console.log('  - 导出ID:', exportId);
            
            await updateTaskResult(qiniuUrl, actualProjectId);
            console.log('✅ 任务结果更新成功');
          } catch (error) {
            console.warn('⚠️ 任务结果更新失败:', error);
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          downloadUrl: `/api/export/download/${exportId}`,
          size: stats.size,
          duration: ir.duration / 1000,
          qiniuUrl: qiniuUrl, // 新增：七牛云URL
        })}\n\n`));

      } catch (error) {
        console.error('Export error:', error);
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
 * 执行导出（使用上传的文件）
 */
async function executeExportWithFiles(
  ir: TimelineIR,
  options: any,
  workDir: string,
  uploadedFiles: Map<string, string>,
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
    console.log('Generated subtitles file:', assPath);
  }

  // 准备输入文件
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'progress',
    stage: 'preparing',
    message: '准备输入文件...',
    progress: 0.3,
  })}\n\n`));

  const inputFiles = await prepareInputFilesWithUploads(ir, workDir, uploadedFiles);

  // 构建FFmpeg命令
  const ffmpegArgs = buildFFmpegCommandForUploads(ir, options, inputFiles, workDir);
  
  console.log('=== 导出调试信息 ===');
  console.log('Uploaded files count:', uploadedFiles.size);
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
 * 准备输入文件（优先使用上传的文件）
 */
async function prepareInputFilesWithUploads(
  ir: TimelineIR, 
  workDir: string, 
  uploadedFiles: Map<string, string>
): Promise<string[]> {
  const inputFiles: string[] = [];

  for (let i = 0; i < ir.video.length; i++) {
    const videoElement = ir.video[i];
    
    // 优先使用上传的文件
    if (uploadedFiles.has(videoElement.id)) {
      const uploadedFilePath = uploadedFiles.get(videoElement.id)!;
      inputFiles.push(uploadedFilePath);
      console.log(`Using uploaded file for video ${i}: ${uploadedFilePath}`);
    } else {
      // 回退到测试视频
      const inputPath = join(workDir, `test_video_${i}.mp4`);
      const videoDuration = (videoElement.out - videoElement.in) / 1000;
      await createTestVideo(inputPath, ir.width, ir.height, Math.max(videoDuration, 1));
      inputFiles.push(inputPath);
      console.log(`Created test video for ${i}: ${inputPath}`);
    }
  }

  return inputFiles;
}

/**
 * 构建FFmpeg命令（针对上传文件优化）
 */
function buildFFmpegCommandForUploads(
  ir: TimelineIR,
  options: any,
  inputFiles: string[],
  workDir: string
): string[] {
  const args: string[] = [];

  // 创建concat文件列表
  const concatList = ir.video.map((video, index) => {
    const duration = (video.out - video.in) / 1000;
    return `file '${inputFiles[index]}'
duration ${duration}`;
  }).join('\n');
  
  const finalConcatList = concatList + `\nfile '${inputFiles[inputFiles.length - 1]}'`;
  const concatPath = join(workDir, 'concat_list.txt');
  require('fs').writeFileSync(concatPath, finalConcatList);

  // 使用concat协议
  args.push('-f', 'concat', '-safe', '0', '-i', concatPath);

  // 设置总时长
  const totalDuration = ir.duration / 1000;
  args.push('-t', totalDuration.toString());

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

  return args;
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

        // 🚀 修复：确保进度不超过100%
        const totalTimeSeconds = totalDuration / 1000;
        const rawProgress = totalTimeSeconds > 0 ? Math.min(currentTime / totalTimeSeconds, 1) : 0;
        const overallProgress = Math.min(0.4 + rawProgress * 0.5, 0.9);
        const displayPercentage = Math.min(Math.round(rawProgress * 100), 100);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          stage: 'encoding',
          message: `编码中... ${displayPercentage}%`,
          progress: overallProgress,
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

/**
 * 上传文件到七牛云
 */
async function uploadToQiniu(filePath: string, exportId: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // 创建七牛云上传器
    const { QiniuUploader } = await import('@/lib/qiniu-uploader');
    const uploader = new QiniuUploader();
    
    // 检查配置
    if (!uploader.isConfigured()) {
      return {
        success: false,
        error: '七牛云配置不完整'
      };
    }

    // 上传视频文件
    const targetFileName = `export_${exportId}.mp4`;
    const result = await uploader.uploadVideo(filePath, targetFileName);
    
    if (result.success) {
      return {
        success: true,
        url: result.url
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    return {
      success: false,
      error: `七牛云上传失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 更新任务结果
 */
async function updateTaskResult(qiniuUrl: string, exportId: string): Promise<void> {
  try {
    console.log('🎬 开始调用粗剪视频接口:');
    console.log('  - 七牛云视频URL:', qiniuUrl);
    console.log('  - 导出ID:', exportId);
    
    // 构建任务结果数据
    const taskResult = {
      task_result: JSON.stringify({
        video: qiniuUrl
      }),
      task_name: "generate_final_simple_video",
      project_id: exportId
    };

    console.log('📤 粗剪视频接口入参:');
    console.log('  - task_result:', taskResult.task_result);
    console.log('  - task_name:', taskResult.task_name);
    console.log('  - project_id:', taskResult.project_id);

    // 直接调用外部粗剪视频API，而不是通过自己的后端API
    const externalApiUrl = 'https://77.smartvideo.py.qikongjian.com/movie/update_task_result';
    console.log('📡 调用外部粗剪视频API:', externalApiUrl);
    
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenCut/1.0',
      },
      body: JSON.stringify(taskResult),
    });

    console.log('📥 外部API响应:');
    console.log('  - 状态码:', response.status);
    console.log('  - 状态文本:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 外部API响应错误:', response.status, response.statusText);
      console.error('错误详情:', errorText);
      throw new Error(`外部API错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📥 外部API返回数据:', result);
    
    console.log('✅ 粗剪视频接口调用成功');

  } catch (error) {
    console.error('❌ 更新任务结果失败:', error);
    throw error;
  }
}
