// test-export-optimization/page.tsx - 导出优化测试页面
// 此页面演示导出性能优化功能
// 文件路径: app/test-export-optimization/page.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Download, 
  BarChart3, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileVideo,
  Settings
} from "lucide-react";
import { PerformanceInsights } from "@/components/export/performance-insights";
import { ExportButton } from "@/components/export/export-button";
import { toast } from "sonner";

export default function TestExportOptimization() {
  const [simulationStep, setSimulationStep] = useState<'initial' | 'ai-editing' | 'optimized'>('initial');
  const [exportTimes, setExportTimes] = useState<{
    standard: number | null;
    optimized: number | null;
  }>({
    standard: null,
    optimized: null
  });

  const simulateAIEditing = () => {
    toast.info("模拟AI剪辑过程...");
    
    // 模拟AI剪辑过程
    setTimeout(() => {
      setSimulationStep('ai-editing');
      toast.success("AI剪辑完成！时间轴已更新");
    }, 2000);
  };

  const simulateOptimization = () => {
    toast.info("应用导出优化...");
    
    setTimeout(() => {
      setSimulationStep('optimized');
      toast.success("优化已应用！预计导出速度提升4.5x");
    }, 1000);
  };

  const simulateExport = (type: 'standard' | 'optimized') => {
    const baseTime = 45; // 基础导出时间（秒）
    const optimizedTime = type === 'optimized' ? Math.round(baseTime / 4.5) : baseTime;
    
    toast.info(`开始${type === 'optimized' ? '优化' : '标准'}导出...`);
    
    setTimeout(() => {
      setExportTimes(prev => ({
        ...prev,
        [type]: optimizedTime
      }));
      toast.success(`${type === 'optimized' ? '优化' : '标准'}导出完成！用时 ${optimizedTime}秒`);
    }, 1000);
  };

  const resetSimulation = () => {
    setSimulationStep('initial');
    setExportTimes({ standard: null, optimized: null });
    toast.info("重置演示");
  };

  const getStepStatus = (step: string) => {
    if (simulationStep === 'initial') {
      return step === 'initial' ? 'active' : 'pending';
    } else if (simulationStep === 'ai-editing') {
      if (step === 'initial') return 'completed';
      if (step === 'ai-editing') return 'active';
      return 'pending';
    } else {
      if (step === 'optimized') return 'active';
      return 'completed';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'active': return <Play className="w-5 h-5 text-blue-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">导出性能优化演示</h1>
        <p className="text-muted-foreground">
          演示AI剪辑完成后如何利用时间轴数据优化导出性能
        </p>
      </div>

      {/* 流程步骤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            优化流程演示
          </CardTitle>
          <CardDescription>
            模拟从AI剪辑到优化导出的完整流程
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 步骤1：初始状态 */}
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(getStepStatus('initial'))}
                <h3 className="font-semibold">1. 初始状态</h3>
              </div>
              <p className="text-sm text-center text-muted-foreground mb-4">
                新项目，时间轴为空
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={simulateAIEditing}
                disabled={simulationStep !== 'initial'}
              >
                开始AI剪辑
              </Button>
            </div>

            {/* 步骤2：AI剪辑完成 */}
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(getStepStatus('ai-editing'))}
                <h3 className="font-semibold">2. AI剪辑完成</h3>
              </div>
              <p className="text-sm text-center text-muted-foreground mb-4">
                视频和字幕已在时间轴
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={simulateOptimization}
                disabled={simulationStep !== 'ai-editing'}
              >
                应用优化
              </Button>
            </div>

            {/* 步骤3：优化完成 */}
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(getStepStatus('optimized'))}
                <h3 className="font-semibold">3. 优化导出</h3>
              </div>
              <p className="text-sm text-center text-muted-foreground mb-4">
                利用时间轴数据快速导出
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetSimulation}
              >
                重置演示
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">性能分析</TabsTrigger>
          <TabsTrigger value="comparison">性能对比</TabsTrigger>
          <TabsTrigger value="technical">技术细节</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <PerformanceInsights 
            onOptimizationApplied={(type) => {
              console.log('Optimization applied:', type);
            }}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>导出性能对比</CardTitle>
              <CardDescription>
                标准导出 vs 优化导出的性能差异
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 标准导出 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileVideo className="w-5 h-5" />
                    <h3 className="font-semibold">标准导出</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>下载原始视频:</span>
                      <span>30秒</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>视频处理:</span>
                      <span>12秒</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>字幕合成:</span>
                      <span>3秒</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>总计:</span>
                      <span>{exportTimes.standard ? `${exportTimes.standard}秒` : '45秒'}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => simulateExport('standard')}
                    disabled={exportTimes.standard !== null}
                    className="w-full"
                  >
                    {exportTimes.standard ? '已完成' : '模拟标准导出'}
                  </Button>
                </div>

                {/* 优化导出 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold">优化导出</h3>
                    <Badge variant="secondary">4.5x 提速</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>利用本地文件:</span>
                      <span className="text-green-600">跳过</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>增量处理:</span>
                      <span>8秒</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>字幕合成:</span>
                      <span>2秒</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>总计:</span>
                      <span className="text-green-600">
                        {exportTimes.optimized ? `${exportTimes.optimized}秒` : '10秒'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => simulateExport('optimized')}
                    disabled={exportTimes.optimized !== null || simulationStep !== 'optimized'}
                    className="w-full"
                    variant={simulationStep === 'optimized' ? 'default' : 'secondary'}
                  >
                    {exportTimes.optimized ? '已完成' : '模拟优化导出'}
                  </Button>
                </div>
              </div>

              {/* 性能提升总结 */}
              {exportTimes.standard && exportTimes.optimized && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">性能提升总结</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">时间节省:</span>
                      <span className="font-semibold ml-2">
                        {exportTimes.standard - exportTimes.optimized}秒
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">提速倍数:</span>
                      <span className="font-semibold ml-2">
                        {(exportTimes.standard / exportTimes.optimized).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>技术实现细节</CardTitle>
              <CardDescription>
                深入了解导出优化的技术原理
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🎯 核心优化策略</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• 增量导出：利用时间轴已处理的视频和字幕数据</li>
                    <li>• 智能缓存：避免重复下载和处理相同的媒体文件</li>
                    <li>• 并行处理：同时处理多个视频片段</li>
                    <li>• 预处理优化：在AI剪辑阶段预先准备导出数据</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">🚀 性能瓶颈分析</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• 网络瓶颈：重复下载远程视频文件（占80%时间）</li>
                    <li>• 处理冗余：重复解码和编码已处理的视频</li>
                    <li>• 内存浪费：未充分利用已加载的媒体数据</li>
                    <li>• 串行处理：缺乏并行处理机制</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">💡 优化效果</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="font-medium text-red-800 mb-1">优化前</h5>
                      <ul className="text-xs text-red-700 space-y-1">
                        <li>• 重新下载所有视频</li>
                        <li>• 重复处理已剪辑内容</li>
                        <li>• 串行处理流程</li>
                        <li>• 平均导出时间：45秒</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <h5 className="font-medium text-green-800 mb-1">优化后</h5>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• 利用本地已处理文件</li>
                        <li>• 增量处理变更内容</li>
                        <li>• 并行处理多个片段</li>
                        <li>• 平均导出时间：10秒</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 实际导出按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>实际导出测试</CardTitle>
          <CardDescription>
            使用真实的导出功能测试优化效果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <ExportButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
