"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';

interface FFmpegTestProps {
  onStatusChange?: (status: 'idle' | 'loading' | 'ready' | 'error') => void;
}

export function FFmpegTest({ onStatusChange }: FFmpegTestProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const updateStatus = (newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const testFFmpeg = async () => {
    updateStatus('loading');
    setProgress(0);

    try {
      // 检查浏览器支持
      if (typeof WebAssembly === 'undefined') {
        throw new Error('浏览器不支持WebAssembly');
      }

      toast.info('开始加载FFmpeg.wasm...');
      setProgress(10);

      // 使用更安全的动态导入方式
      let FFmpeg: any;
      let toBlobURL: any;

      try {
        // 分别导入模块
        const ffmpegModule = await import('@ffmpeg/ffmpeg');
        const utilModule = await import('@ffmpeg/util');

        FFmpeg = ffmpegModule.FFmpeg;
        toBlobURL = utilModule.toBlobURL;

        if (!FFmpeg || !toBlobURL) {
          throw new Error('FFmpeg模块导入失败');
        }
      } catch (importError) {
        console.error('Import error:', importError);
        throw new Error('无法导入FFmpeg模块，可能是依赖问题');
      }

      setProgress(20);

      const ffmpeg = new FFmpeg();

      // Settings日志回调
      ffmpeg.on('log', ({ message }: any) => {
        console.log('FFmpeg log:', message);
      });

      // Settings进度回调
      ffmpeg.on('progress', ({ progress: ffmpegProgress }: any) => {
        console.log('FFmpeg progress:', ffmpegProgress);
        setProgress(50 + ffmpegProgress * 40);
      });

      toast.info('正在下载FFmpeg核心文件...');
      setProgress(30);

      // 加载FFmpeg核心
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      } catch (loadError) {
        console.warn('Failed to load from unpkg, trying jsdelivr...', loadError);
        setProgress(40);

        // 备用CDN
        const backupURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${backupURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${backupURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      setProgress(90);

      // 测试FFmpeg功能 - 创建一个简单的测试
      toast.info('测试FFmpeg功能...');

      // 创建一个简单的测试输入
      const testInput = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
      await ffmpeg.writeFile('test.txt', testInput);

      // 验证文件写入
      const files = await ffmpeg.listDir('/');
      console.log('FFmpeg files:', files);

      setProgress(100);
      updateStatus('ready');

      toast.success('前端FFmpeg.wasm加载成功！', {
        description: '现在可以在浏览器中进行视频处理',
      });

    } catch (error) {
      console.error('Frontend FFmpeg test failed:', error);
      updateStatus('error');

      let errorMessage = '前端FFmpeg加载失败';
      let description = '';

      if (error instanceof Error) {
        if (error.message.includes('导入FFmpeg模块') || error.message.includes('Cannot find module')) {
          errorMessage = 'FFmpeg模块导入失败';
          description = '请检查@ffmpeg/ffmpeg和@ffmpeg/util是否正确安装';
        } else if (error.message.includes('WebAssembly')) {
          errorMessage = '浏览器不支持WebAssembly';
          description = '请使用现代浏览器（Chrome 57+, Firefox 52+, Safari 11+）';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '网络连接失败';
          description = '无法下载FFmpeg核心文件，请检查网络连接';
        } else if (error.message.includes('SharedArrayBuffer')) {
          errorMessage = 'SharedArrayBuffer不可用';
          description = '需要启用跨域隔离或使用HTTPS';
        } else {
          errorMessage = `FFmpeg错误: ${error.message}`;
          description = '详细错误信息请查看控制台';
        }
      }

      toast.error(errorMessage, { description });
    } finally {
      setProgress(0);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready':
        return '已就绪';
      case 'error':
        return '错误';
      case 'loading':
        return '加载中...';
      default:
        return '未测试';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>FFmpeg.wasm状态</span>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm">{getStatusText()}</span>
        </div>
      </div>

      {status === 'loading' && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>加载进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <Button 
        onClick={testFFmpeg}
        disabled={status === 'loading'}
        className="w-full"
        variant="outline"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            测试中...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            测试前端引擎
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground">
        <p>• 加载FFmpeg.wasm库</p>
        <p>• 验证浏览器兼容性</p>
        <p>• 测试本地处理能力</p>
        <p>• 检查WebAssembly支持</p>
      </div>
    </div>
  );
}
