"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SimpleFFmpegTestProps {
  onStatusChange?: (status: 'idle' | 'loading' | 'ready' | 'error') => void;
}

export function SimpleFFmpegTest({ onStatusChange }: SimpleFFmpegTestProps) {
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
      // 检查浏览器基础支持
      if (typeof WebAssembly === 'undefined') {
        throw new Error('浏览器不支持WebAssembly');
      }

      toast.info('开始检测前端处理能力...');
      setProgress(10);

      // 模拟检查过程
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(25);

      // 检查SharedArrayBuffer支持
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      toast.info(`SharedArrayBuffer支持: ${hasSharedArrayBuffer ? '✓' : '✗'}`);
      setProgress(40);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 检查Worker支持
      const hasWorker = typeof Worker !== 'undefined';
      toast.info(`Web Worker支持: ${hasWorker ? '✓' : '✗'}`);
      setProgress(55);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 检查Canvas支持
      const canvas = document.createElement('canvas');
      const hasCanvas = !!(canvas.getContext && canvas.getContext('2d'));
      toast.info(`Canvas支持: ${hasCanvas ? '✓' : '✗'}`);
      setProgress(70);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 检查File API支持
      const hasFileAPI = typeof File !== 'undefined' && typeof FileReader !== 'undefined';
      toast.info(`File API支持: ${hasFileAPI ? '✓' : '✗'}`);
      setProgress(85);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 尝试简单的FFmpeg模块检测
      try {
        // 这里我们只是检查模块是否可以导入，不实际加载
        const moduleCheck = await import('@ffmpeg/ffmpeg').then(() => true).catch(() => false);
        toast.info(`FFmpeg模块: ${moduleCheck ? '✓' : '✗'}`);
        setProgress(95);

        if (!moduleCheck) {
          throw new Error('FFmpeg模块不可用');
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(100);

        updateStatus('ready');
        toast.success('前端处理环境检测完成！', {
          description: `WebAssembly: ${hasSharedArrayBuffer ? '完全支持' : '基础支持'}`,
        });

      } catch (moduleError) {
        console.warn('FFmpeg module check failed:', moduleError);
        
        // 即使FFmpeg模块有问题，如果基础环境OK，我们也认为是部分可用
        if (hasSharedArrayBuffer && hasWorker && hasCanvas) {
          setProgress(100);
          updateStatus('ready');
          toast.success('前端处理环境基本可用！', {
            description: 'FFmpeg模块可能需要额外配置，但基础功能可用',
          });
        } else {
          throw new Error('前端处理环境不完整');
        }
      }
      
    } catch (error) {
      console.error('Frontend test failed:', error);
      updateStatus('error');
      
      let errorMessage = '前端环境检测失败';
      let description = '';
      
      if (error instanceof Error) {
        if (error.message.includes('WebAssembly')) {
          errorMessage = '浏览器不支持WebAssembly';
          description = '请使用现代浏览器（Chrome 57+, Firefox 52+, Safari 11+）';
        } else if (error.message.includes('FFmpeg模块')) {
          errorMessage = 'FFmpeg模块不可用';
          description = '可能需要重新安装依赖或检查网络连接';
        } else {
          errorMessage = `环境检测错误: ${error.message}`;
          description = '详细信息请查看控制台';
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
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready':
        return '环境可用';
      case 'error':
        return '环境异常';
      case 'loading':
        return '检测中...';
      default:
        return '未检测';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>前端处理环境</span>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm">{getStatusText()}</span>
        </div>
      </div>

      {status === 'loading' && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>检测进度</span>
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
            检测中...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            检测前端环境
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground">
        <p>• 检查WebAssembly支持</p>
        <p>• 验证SharedArrayBuffer可用性</p>
        <p>• 测试Canvas和File API</p>
        <p>• 检测FFmpeg模块状态</p>
      </div>
    </div>
  );
}
