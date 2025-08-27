// download/[id]/route.ts - 导出文件下载API
// 此文件提供导出文件的下载服务
// 文件路径: app/api/export/download/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * 下载导出的文件 - GET请求
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证ID格式（防止路径遍历攻击）
    if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid download ID' },
        { status: 400 }
      );
    }

    // 构建文件路径 - 支持多种导出类型
    const possibleWorkDirs = [
      join(tmpdir(), `video-export-upload-${id}`), // 上传导出
      join(tmpdir(), `incremental-export-${id}`), // 增量导出
      join(tmpdir(), `opencut-stream-export-${id}`),
      join(tmpdir(), `ai-clips-export-${id}`),
      join(tmpdir(), `opencut-export-${id}`), // 兼容旧版本
    ];

    let outputPath: string | null = null;
    let foundWorkDir: string | null = null;

    // 查找存在的文件
    for (const workDir of possibleWorkDirs) {
      const testPath = join(workDir, 'output.mp4');
      try {
        await fs.access(testPath);
        outputPath = testPath;
        foundWorkDir = workDir;
        console.log('✅ Found file at:', testPath);
        break;
      } catch {
        console.log('❌ Path not found:', testPath);
        // 继续尝试下一个路径
      }
    }

    if (!outputPath || !foundWorkDir) {
      console.error('❌ File not found for download ID:', id, {
        searchedPaths: possibleWorkDirs,
        foundPath: outputPath,
        foundWorkDir,
      });
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }

    console.log('✅ Found file for download:', {
      id,
      outputPath,
      workDir: foundWorkDir,
    });

    // 读取文件
    const fileData = await fs.readFile(outputPath);

    // 获取文件统计信息
    const stats = await fs.stat(outputPath);

    // 延迟清理工作目录，给前端足够时间下载
    setTimeout(() => {
      cleanupWorkDir(foundWorkDir).catch(console.warn);
    }, 30000); // 30秒后清理

    // 返回文件
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="export_${id}.mp4"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

/**
 * 获取文件信息 - HEAD请求
 */
export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
      return new NextResponse(null, { status: 400 });
    }

    // 构建文件路径 - 支持多种导出类型
    const possibleWorkDirs = [
      join(tmpdir(), `opencut-stream-export-${id}`),
      join(tmpdir(), `ai-clips-export-${id}`),
      join(tmpdir(), `opencut-export-${id}`), // 兼容旧版本
    ];

    // 查找存在的文件
    for (const workDir of possibleWorkDirs) {
      const outputPath = join(workDir, 'output.mp4');
      try {
        const stats = await fs.stat(outputPath);

        return new NextResponse(null, {
          status: 200,
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': stats.size.toString(),
            'Last-Modified': stats.mtime.toUTCString(),
          },
        });
      } catch {
        // 继续尝试下一个路径
      }
    }

    return new NextResponse(null, { status: 404 });

  } catch (error) {
    console.error('Head request error:', error);
    return new NextResponse(null, { status: 500 });
  }
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
