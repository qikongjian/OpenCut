// export-button.tsx - Export Button Component
// This file provides smart export button with strategy selection and progress display
// File path: components/export/export-button.tsx

"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ChevronDown, 
  Zap, 
  Cloud, 
  Monitor, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
// import { ExportDialog } from "./export-dialog";
// import { ExportProgressDialog } from "./export-progress-dialog";
import { exportManager } from "@/lib/export/export-manager";
import { performanceAnalyzer } from "@/lib/export/performance-analyzer";
import {
  ExportStrategy,
  ExportProgress,
  ExportResult,
  UserPreference,
  ExportQuality,
  PrivacyLevel
} from "@/types/export";
import { toast } from "sonner";
import { downloadExportResult } from "@/lib/download-utils";

/**
 * 获取阶段显示名称
 */
function getStageDisplayName(stage: string): string {
  const stageNames: Record<string, string> = {
    'preparing': '准备中',
    'processing': '处理中',
    'encoding': '编码中',
    'finalizing': '最终化',
    'completed': '已完成'
  };
  return stageNames[stage] || stage;
}

interface ExportButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "primary" | "primary-gradient";
  size?: "sm" | "default" | "lg";
}

export function ExportButton({ 
  className, 
  variant = "default", 
  size = "default" 
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [strategies, setStrategies] = useState<{
    primary: ExportStrategy;
    alternatives: ExportStrategy[];
  } | null>(null);

  // Default user preferences
  const defaultPreference: UserPreference = {
    privacy: 'balanced',
    quality: 'standard',
    allowCloudProcessing: true,
  };

  /**
   * Quick export - using AI video exporter
   */
  const handleQuickExport = useCallback(async () => {
    setIsLoading(true);

    try {
      // 显示进度对话框
      setShowProgress(true);

      // 🎯 新增：性能分析
      setExportProgress({
        overall: 0.02,
        stage: 'preparing',
        message: '分析Export性能...',
        elapsedTime: 0,
        startTime: Date.now(),
      });

      console.log('📊 Analyzing export performance...');
      const performanceAnalysis = performanceAnalyzer.analyzeExportPerformance();
      const performanceSummary = performanceAnalyzer.generatePerformanceSummary(performanceAnalysis);

      console.log('Performance Analysis:', performanceAnalysis);
      console.log('Performance Summary:', performanceSummary);

      // 显示性能分析结果
      if (performanceAnalysis.performanceScore < 60) {
        toast.warning("检测到性能瓶颈", {
          description: `性能评分: ${performanceAnalysis.performanceScore}/100`,
          duration: 3000,
        });
      } else if (performanceAnalysis.optimizationPotential > 50) {
        toast.info("发现优化机会", {
          description: `可提升 ${performanceAnalysis.optimizations[0]?.estimatedSpeedup || 2}x Export速度`,
          duration: 3000,
        });
      }

      // 更新进度：检查Export条件
      setExportProgress({
        overall: 0.05,
        stage: 'preparing',
        message: '检查Export条件...',
        elapsedTime: 0,
        startTime: Date.now(),
      });

      // 🚀 优先使用Python后端导出（七牛云集成），获得实时进度更新
      try {
        console.log('🐍 尝试使用Python后端导出服务...');
        
        // 动态导入导出管理器
        const { exportManager } = await import('@/lib/export/export-manager');
        
        // 使用Python后端导出，获得实时进度
        const result = await exportManager.smartExport(
          defaultPreference,
          (progress) => {
            console.log('📊 收到导出进度更新:', progress);
            setExportProgress(progress);
          }
        );

        console.log('🎉 Python后端导出完成:', result);
        
        // 处理Python后端导出结果
        await handleExportResult(result, 'Python后端导出');
        return result;
        
      } catch (pythonError) {
        console.warn('⚠️ Python后端导出失败，回退到AI视频导出器:', pythonError);
        
        // 回退到AI视频导出器
      const { aiVideoExporter, AIVideoExporter } = await import('@/lib/export/ai-video-exporter');

      // 检查是否可以使用AI视频Export
      const canExportCheck = AIVideoExporter.canExport();

      if (canExportCheck.canExport) {
          toast.info('使用AI视频导出器（回退方案）');

        const result = await aiVideoExporter.exportAIVideo((progress) => {
          setExportProgress(progress);
        });

          // 处理AI视频导出结果
          return await handleExportResult(result, 'AI视频导出');
        }

        // 如果AI视频导出器也不可用，抛出错误
        throw new Error(`AI视频导出器不可用: ${canExportCheck.reason}`);
      }
    } catch (error) {
      console.error('Export失败:', error);
      
      // 清理进度状态
      setExportProgress(null);
      setShowProgress(false);
      
      // 显示错误信息
      toast.error('Export失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * 处理导出结果
   */
  const handleExportResult = async (result: ExportResult, method: string): Promise<void> => {
    console.log(`${method}完成:`, result);

    // 检查导出是否成功
        if (!result.success) {
      throw new Error(`${method}失败：${result.error || '未知错误'}`);
        }

        // 验证结果对象
        if (!result.url) {
      throw new Error(`${method}结果缺少下载URL`);
    }

    // 显示成功提示
    toast.success(`${method}完成!`, {
      description: result.size ? `文件大小: ${(result.size / 1024 / 1024).toFixed(1)}MB` : '导出完成',
          action: {
            label: "下载",
            onClick: async () => {
          await downloadExportResult(result);
            },
          },
        });

    // 自动下载
    if (result.url) {
      await downloadExportResult(result);
    }
  };

  /**
   * 下载导出结果
   */
  const downloadExportResult = async (result: ExportResult): Promise<void> => {
    try {
        const success = await downloadExportResult(
        result.url!,
          result.filename || 'export.mp4',
        result.size,
        async () => {
          // 下载前的回调：调用粗剪接口
          try {
            const { exportManager } = await import('@/lib/export/export-manager');
            await exportManager.callRoughCutAPI(result.url!, result);
          } catch (error) {
            console.warn('⚠️ 粗剪接口调用失败，但继续下载:', error);
        }
        );

        if (!success) {
          toast.error('自动下载失败', {
            description: '请点击下载按钮手动下载'
          });
        }
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
      }
  };

    } catch (error) {
      console.error('Export failed:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);

      // 提供更详细的错误信息和解决建议
      let errorMessage = "Export失败";
      let errorDescription = "未知错误";

      if (error instanceof Error) {
        errorDescription = error.message;
        console.error('Error message:', error.message);

        // 根据错误类型提供建议
        if (error.message.includes('FFmpeg')) {
          errorDescription += "\nSuggestion: Please ensure your browser supports WebAssembly";
        } else if (error.message.includes('memory') || error.message.includes('内存')) {
          errorDescription += "\nSuggestion: Try closing other tabs or reducing export quality";
        } else if (error.message.includes('项目为空') || error.message.includes('时间轴为空')) {
          errorDescription += "\nSuggestion: Please execute AI editing first or add video content to timeline";
        } else if (error.message.includes('AI剪辑')) {
          errorDescription += "\nSuggestion: Please click 'Generate AI Editing Plan' and execute 'One-Click Edit' first";
        } else if (error.message.includes('download') || error.message.includes('下载') || error.message.includes('File not found')) {
          errorDescription += "\nSuggestion: Export file may have expired, please try exporting again";
        } else if (error.message.includes('Failed to download result file')) {
          errorDescription += "\nSuggestion: Network connection issue or file has been cleaned up, please try exporting again";
        }
      }

      toast.error(errorMessage, {
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
      setShowProgress(false);
      setExportProgress(null);
    }
  }, []);

  /**
   * 高级Export - 显示选项对话框
   */
  const handleAdvancedExport = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 获取Export策略
      const strategyData = await exportManager.getExportStrategy(defaultPreference);
      setStrategies(strategyData);
      setShowDialog(true);
    } catch (error) {
      console.error('Failed to get export strategies:', error);
      toast.error("无法获取Export选项", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 渲染策略徽章
   */
  const renderStrategyBadge = (strategy: ExportStrategy) => {
    const getMethodIcon = () => {
      switch (strategy.method) {
        case 'frontend':
          return <Monitor className="w-3 h-3" />;
        case 'backend':
          return <Cloud className="w-3 h-3" />;
        default:
          return <Zap className="w-3 h-3" />;
      }
    };

    const getMethodLabel = () => {
      switch (strategy.method) {
        case 'frontend':
          return '本地处理';
        case 'backend':
          return '云端处理';
        default:
          return '智能选择';
      }
    };

    const getQualityColor = () => {
      switch (strategy.quality) {
        case 'preview':
          return 'bg-yellow-100 text-yellow-800';
        case 'standard':
          return 'bg-blue-100 text-blue-800';
        case 'professional':
          return 'bg-purple-100 text-purple-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          {getMethodIcon()}
          {getMethodLabel()}
        </Badge>
        <Badge className={getQualityColor()}>
          {strategy.quality === 'preview' && 'Preview质量'}
          {strategy.quality === 'standard' && '标准质量'}
          {strategy.quality === 'professional' && '专业质量'}
        </Badge>
        {strategy.warnings && strategy.warnings.length > 0 && (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className={`${className} ${
              isLoading && exportProgress 
                ? 'min-h-[80px] px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                : ''
            } transition-all duration-300`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isLoading && exportProgress ? (
              <div className="flex flex-col items-start min-w-[120px]">
                <span className="text-sm font-medium text-left">
                  {exportProgress.message || '处理中...'}
                </span>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${exportProgress.overall * 100}%` }}
                  >
                    {/* 添加进度条动画效果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between items-center w-full mt-1">
                  <span className="text-xs text-muted-foreground">
                    {Math.round(exportProgress.overall * 100)}%
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    {getStageDisplayName(exportProgress.stage)}
                  </span>
                </div>
                {/* 显示时间信息 */}
                {exportProgress.elapsedTime > 0 && (
                  <span className="text-xs text-muted-foreground mt-1">
                    已用: {Math.round(exportProgress.elapsedTime / 1000)}s
                  </span>
                )}
              </div>
            ) : (
              <span>Export视频</span>
            )}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleQuickExport} disabled={isLoading}>
            <Zap className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>快速Export</span>
              <span className="text-xs text-muted-foreground">
                使用推荐Settings
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleAdvancedExport} disabled={isLoading}>
            <Settings className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>高级Export</span>
              <span className="text-xs text-muted-foreground">
                自定义Export选项
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleQuickExport()} disabled={isLoading}>
            <Monitor className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>本地Export</span>
              <span className="text-xs text-muted-foreground">
                隐私优先，本地处理
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport()} disabled={isLoading}>
            <Cloud className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>云端Export</span>
              <span className="text-xs text-muted-foreground">
                性能优先，服务器处理
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* TODO: 实现高级Export对话框和进度对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">高级Export选项</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Export对话框组件正在开发中...
            </p>
            <Button onClick={() => setShowDialog(false)}>关闭</Button>
          </div>
        </div>
      )}

      {showProgress && exportProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Export进度</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{exportProgress.message || '处理中...'}</span>
                  <span>{Math.round(exportProgress.overall * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress.overall * 100}%` }}
                  />
                </div>
              </div>
              
              {/* 显示当前阶段 */}
              <div className="text-xs text-muted-foreground">
                <span>当前阶段: {getStageDisplayName(exportProgress.stage)}</span>
              </div>
              
              {/* 显示详细信息 */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>已用时间: {Math.round(exportProgress.elapsedTime / 1000)}秒</span>
                {exportProgress.estimatedTimeRemaining && (
                  <span>预计剩余: {Math.round(exportProgress.estimatedTimeRemaining / 1000)}秒</span>
                )}
              </div>
              
              {/* 显示处理速度等信息 */}
              {exportProgress.processingSpeed && (
                <div className="text-xs text-muted-foreground">
                  <span>处理速度: {exportProgress.processingSpeed.toFixed(1)} 帧/秒</span>
                </div>
              )}
              
              {exportProgress.currentFrame && (
                <div className="text-xs text-muted-foreground">
                  <span>当前帧: {exportProgress.currentFrame}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await exportManager.cancelExport();
                    toast.info("Export已Cancel");
                  } catch (error) {
                    console.error('Failed to cancel export:', error);
                  } finally {
                    setShowProgress(false);
                    setExportProgress(null);
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

