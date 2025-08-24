"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function TestDynamicImportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (result: any) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testDirectFFmpegImport = async () => {
    setIsLoading(true);
    try {
      toast.info("测试直接FFmpeg导入...");
      
      // 直接动态导入FFmpeg
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      
      addResult({
        test: "直接FFmpeg导入",
        success: true,
        message: "FFmpeg模块导入成功"
      });
      
      toast.success("直接FFmpeg导入成功！");
    } catch (error) {
      addResult({
        test: "直接FFmpeg导入",
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
      
      toast.error("直接FFmpeg导入失败");
    } finally {
      setIsLoading(false);
    }
  };

  const testFFmpegManager = async () => {
    setIsLoading(true);
    try {
      toast.info("测试FFmpeg管理器...");
      
      // 导入FFmpeg管理器
      const { ffmpegManager } = await import('@/lib/export/ffmpeg-manager');
      
      addResult({
        test: "FFmpeg管理器导入",
        success: true,
        message: "FFmpeg管理器导入成功"
      });
      
      // 测试初始化
      await ffmpegManager.initialize();
      
      addResult({
        test: "FFmpeg管理器初始化",
        success: true,
        message: "FFmpeg管理器初始化成功"
      });
      
      toast.success("FFmpeg管理器测试成功！");
    } catch (error) {
      addResult({
        test: "FFmpeg管理器",
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
      
      toast.error("FFmpeg管理器测试失败");
    } finally {
      setIsLoading(false);
    }
  };

  const testFrontendExporter = async () => {
    setIsLoading(true);
    try {
      toast.info("测试前端Export器...");
      
      // 导入前端Export器
      const { FrontendExporter } = await import('@/lib/export/frontend-exporter');
      
      addResult({
        test: "前端Export器导入",
        success: true,
        message: "前端Export器导入成功"
      });
      
      const exporter = new FrontendExporter();
      
      addResult({
        test: "前端Export器实例化",
        success: true,
        message: "前端Export器实例化成功"
      });
      
      toast.success("前端Export器测试成功！");
    } catch (error) {
      addResult({
        test: "前端Export器",
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
      
      toast.error("前端Export器测试失败");
    } finally {
      setIsLoading(false);
    }
  };

  const testAIVideoExporter = async () => {
    setIsLoading(true);
    try {
      toast.info("测试AI视频Export器...");
      
      // 导入AI视频Export器
      const { AIVideoExporter, aiVideoExporter } = await import('@/lib/export/ai-video-exporter');
      
      addResult({
        test: "AI视频Export器导入",
        success: true,
        message: "AI视频Export器导入成功"
      });
      
      // 测试canExport方法
      const canExport = AIVideoExporter.canExport();
      
      addResult({
        test: "AI视频Export器检查",
        success: true,
        message: `canExport: ${canExport.canExport}, reason: ${canExport.reason || 'N/A'}`
      });
      
      toast.success("AI视频Export器测试成功！");
    } catch (error) {
      addResult({
        test: "AI视频Export器",
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
      
      toast.error("AI视频Export器测试失败");
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">动态导入测试</h1>
        <p className="text-muted-foreground">
          测试各个模块的动态导入是否正常工作
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button 
          onClick={testDirectFFmpegImport} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          测试FFmpeg导入
        </Button>

        <Button 
          onClick={testFFmpegManager} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          测试FFmpeg管理器
        </Button>

        <Button 
          onClick={testFrontendExporter} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          测试前端Export器
        </Button>

        <Button 
          onClick={testAIVideoExporter} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          测试AIExport器
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">测试结果</h2>
        <Button onClick={clearResults} variant="outline" size="sm">
          清空结果
        </Button>
      </div>

      <div className="space-y-3">
        {results.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                点击上方按钮开始测试
              </p>
            </CardContent>
          </Card>
        ) : (
          results.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  {result.test}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {result.timestamp}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`p-3 rounded-lg text-sm ${
                  result.success 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {result.success ? result.message : result.error}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
