"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Download, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function TestExportFixV2Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const testFFmpegImport = async () => {
    setIsLoading(true);
    setProgress(0);
    setStatus("开始测试FFmpeg动态导入...");
    setResult(null);

    try {
      setProgress(10);
      setStatus("测试FFmpeg模块导入...");

      // 测试动态导入FFmpeg
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL, fetchFile } = await import('@ffmpeg/util');

      setProgress(30);
      setStatus("FFmpeg模块导入成功，创建实例...");

      const ffmpeg = new FFmpeg();
      
      setProgress(50);
      setStatus("Settings日志回调...");

      ffmpeg.on('log', ({ message }: any) => {
        console.log('[FFmpeg Test]', message);
      });

      setProgress(70);
      setStatus("加载FFmpeg核心文件...");

      // 加载FFmpeg核心文件
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setProgress(90);
      setStatus("测试基本功能...");

      // 测试基本功能
      await ffmpeg.writeFile('test.txt', new TextEncoder().encode('Hello FFmpeg!'));
      const data = await ffmpeg.readFile('test.txt');
      const content = new TextDecoder().decode(data as Uint8Array);

      setProgress(100);
      setStatus("测试完成！");

      setResult({
        success: true,
        message: "FFmpeg动态导入测试成功！",
        details: {
          moduleLoaded: true,
          coreLoaded: true,
          fileOperations: true,
          testContent: content
        }
      });

      toast.success("FFmpeg动态导入测试成功！", {
        description: "所有模块都能正常加载和使用"
      });

    } catch (error) {
      console.error('FFmpeg test failed:', error);
      
      setResult({
        success: false,
        message: "FFmpeg动态导入测试失败",
        error: error instanceof Error ? error.message : '未知错误',
        details: {
          moduleLoaded: false,
          coreLoaded: false,
          fileOperations: false
        }
      });

      toast.error("FFmpeg动态导入测试失败", {
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testExportSystem = async () => {
    setIsLoading(true);
    setProgress(0);
    setStatus("开始测试Export系统...");
    setResult(null);

    try {
      setProgress(10);
      setStatus("导入Export管理器...");

      // 测试Export管理器
      const { ffmpegManager } = await import('@/lib/export/ffmpeg-manager');

      setProgress(30);
      setStatus("初始化FFmpeg管理器...");

      await ffmpegManager.initialize();

      setProgress(60);
      setStatus("测试FFmpeg管理器功能...");

      // 测试基本功能
      const isReady = ffmpegManager.isReady();
      
      if (isReady) {
        await ffmpegManager.writeFile('test.txt', new TextEncoder().encode('Hello Export System!'));
        const data = await ffmpegManager.readFile('test.txt');
        const content = new TextDecoder().decode(data);

        setProgress(100);
        setStatus("Export系统测试完成！");

        setResult({
          success: true,
          message: "Export系统测试成功！",
          details: {
            managerReady: true,
            fileOperations: true,
            testContent: content
          }
        });

        toast.success("Export系统测试成功！", {
          description: "FFmpeg管理器工作正常"
        });
      } else {
        throw new Error("FFmpeg管理器未就绪");
      }

    } catch (error) {
      console.error('Export system test failed:', error);
      
      setResult({
        success: false,
        message: "Export系统测试失败",
        error: error instanceof Error ? error.message : '未知错误',
        details: {
          managerReady: false,
          fileOperations: false
        }
      });

      toast.error("Export系统测试失败", {
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Export修复测试 V2</h1>
        <p className="text-muted-foreground">
          测试FFmpeg动态导入修复是否解决了 "expression is too dynamic" 错误
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              FFmpeg模块测试
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              直接测试FFmpeg模块的动态导入和基本功能
            </p>
            <Button 
              onClick={testFFmpegImport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              测试FFmpeg导入
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Export系统测试
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              测试修复后的Export系统是否能正常工作
            </p>
            <Button 
              onClick={testExportSystem} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              测试Export系统
            </Button>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              测试结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <p className="font-medium">{result.message}</p>
                {result.error && (
                  <p className="text-sm mt-1">错误: {result.error}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">详细信息:</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
