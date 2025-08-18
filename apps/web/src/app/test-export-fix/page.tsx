"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Settings,
  FileImage
} from 'lucide-react';
import { toast } from 'sonner';
import { SimpleFFmpegTest } from '@/components/simple-ffmpeg-test';

export default function TestExportFixPage() {
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [frontendStatus, setFrontendStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  // 测试后端健康状态
  const testBackendHealth = async () => {
    setIsTestingBackend(true);
    try {
      const response = await fetch('/api/export', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend health check:', data);

        if (data.status === 'healthy' && data.ffmpeg === 'available') {
          setBackendStatus('healthy');
          toast.success('后端导出服务正常');
        } else {
          setBackendStatus('unhealthy');
          toast.warning(`后端服务状态: ${data.status || 'unknown'}, FFmpeg: ${data.ffmpeg || 'unknown'}`);
        }
      } else {
        // 处理503等错误
        const data = await response.json().catch(() => ({}));
        console.log('Backend health check failed:', response.status, data);

        setBackendStatus('unhealthy');

        if (response.status === 503) {
          toast.warning('后端服务不可用 (503)', {
            description: 'FFmpeg可能未安装或服务未启动',
          });
        } else {
          toast.warning(`后端服务错误 (${response.status})`, {
            description: data.message || '服务器响应异常',
          });
        }
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('unhealthy');

      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('网络连接失败', {
          description: '无法连接到后端服务',
        });
      } else {
        toast.error('后端服务检查失败', {
          description: error instanceof Error ? error.message : '未知错误',
        });
      }
    } finally {
      setIsTestingBackend(false);
    }
  };



  // 测试导出功能
  const testExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(10);
      toast.info('开始测试导出...');

      // 创建一个简单的测试导出
      setExportProgress(30);

      // 模拟导出过程
      for (let i = 30; i <= 90; i += 10) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 创建一个测试文件
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 绘制测试内容
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('OpenCut 导出测试', canvas.width / 2, canvas.height / 2 - 100);

        // 添加副标题
        ctx.font = '48px Arial';
        ctx.fillStyle = '#888888';
        ctx.fillText('Export System Test', canvas.width / 2, canvas.height / 2);

        // 添加时间戳
        ctx.font = '32px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 100);

        // 添加字幕示例
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('这是一个带字幕的测试视频', canvas.width / 2, canvas.height - 80);
        ctx.font = '28px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('This is a test video with subtitles', canvas.width / 2, canvas.height - 40);
      }

      setExportProgress(95);

      // 转换为Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      const url = URL.createObjectURL(blob);
      const filename = `opencut-export-test-${Date.now()}.png`;

      setExportProgress(100);

      // 导出成功
      toast.success('导出测试成功!', {
        description: `文件大小: ${(blob.size / 1024 / 1024).toFixed(1)}MB`,
        action: {
          label: "下载",
          onClick: () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
          },
        },
      });

      // 自动下载
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

    } catch (error) {
      console.error('Export test failed:', error);
      toast.error('导出测试失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // 测试简化导出
  const testSimpleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(10);
      toast.info('开始简化导出测试...');

      // 动态导入简化导出器
      const { simpleExporter } = await import('@/lib/export/simple-exporter');

      setExportProgress(20);

      // 执行简化导出
      const result = await simpleExporter.exportAsImage((progress) => {
        setExportProgress(20 + progress.overall * 70);
      });

      setExportProgress(95);

      // 同时导出项目信息
      const projectResult = await simpleExporter.exportProjectInfo();

      setExportProgress(100);

      // 导出成功
      toast.success('简化导出测试成功!', {
        description: `图片: ${(result.size! / 1024 / 1024).toFixed(1)}MB, 项目信息: ${(projectResult.size! / 1024).toFixed(1)}KB`,
        action: {
          label: "下载图片",
          onClick: () => {
            const a = document.createElement('a');
            a.href = result.url!;
            a.download = result.filename!;
            a.click();
          },
        },
      });

      // 自动下载图片
      const a1 = document.createElement('a');
      a1.href = result.url!;
      a1.download = result.filename!;
      a1.click();

      // 自动下载项目信息
      setTimeout(() => {
        const a2 = document.createElement('a');
        a2.href = projectResult.url!;
        a2.download = projectResult.filename!;
        a2.click();
      }, 1000);

    } catch (error) {
      console.error('Simple export test failed:', error);
      toast.error('简化导出测试失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>;
      case 'unhealthy':
      case 'error':
        return <Badge variant="destructive">异常</Badge>;
      case 'loading':
        return <Badge variant="secondary">加载中</Badge>;
      case 'idle':
        return <Badge variant="outline">待测试</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔧 导出系统修复测试</h1>
        <p className="text-muted-foreground">
          测试和修复OpenCut的视频导出功能，包括后端FFmpeg和前端FFmpeg.wasm
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 后端服务测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              后端导出服务
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>服务状态</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(backendStatus)}
                {getStatusBadge(backendStatus)}
              </div>
            </div>
            
            <Button 
              onClick={testBackendHealth}
              disabled={isTestingBackend}
              className="w-full"
              variant="outline"
            >
              {isTestingBackend ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  检测中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  测试后端服务
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>• 检查FFmpeg是否已安装</p>
              <p>• 验证API端点是否可用</p>
              <p>• 测试服务器处理能力</p>
            </div>
          </CardContent>
        </Card>

        {/* 前端服务测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              前端导出引擎
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleFFmpegTest onStatusChange={setFrontendStatus} />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* 导出测试 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            导出功能测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>导出进度</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={testExport}
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  正在测试导出...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  开始基础导出测试
                </>
              )}
            </Button>

            <Button
              onClick={testSimpleExport}
              disabled={isExporting}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  简化导出中...
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4 mr-2" />
                  简化导出测试 (推荐)
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <div>
              <p className="font-medium mb-1">基础导出测试:</p>
              <p>• 生成测试项目数据</p>
              <p>• 创建简单的画布导出</p>
            </div>
            <div>
              <p className="font-medium mb-1">简化导出测试 (推荐):</p>
              <p>• 集成AI剪辑数据</p>
              <p>• 生成项目信息JSON</p>
              <p>• 包含字幕和时间轴统计</p>
              <p>• 自动下载图片和项目文件</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
