// export-button.tsx - 导出按钮组件
// 此文件提供智能导出按钮，支持策略选择和进度显示
// 文件路径: components/export/export-button.tsx

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
import { 
  ExportStrategy, 
  ExportProgress, 
  ExportResult, 
  UserPreference,
  ExportQuality,
  PrivacyLevel 
} from "@/types/export";
import { toast } from "sonner";

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

  // 默认用户偏好
  const defaultPreference: UserPreference = {
    privacy: 'balanced',
    quality: 'standard',
    allowCloudProcessing: true,
  };

  /**
   * 快速导出 - 使用AI视频导出器
   */
  const handleQuickExport = useCallback(async () => {
    setIsLoading(true);

    try {
      // 显示进度对话框
      setShowProgress(true);

      // 更新进度：初始化
      setExportProgress({
        overall: 0.05,
        stage: 'preparing',
        message: '检查导出条件...',
        elapsedTime: 0,
        startTime: Date.now(),
      });

      // 首先尝试使用AI视频导出器
      const { aiVideoExporter, AIVideoExporter } = await import('@/lib/export/ai-video-exporter');

      // 检查是否可以使用AI视频导出
      const canExportCheck = AIVideoExporter.canExport();

      if (canExportCheck.canExport) {
        // 使用AI视频导出器
        toast.info('使用AI视频导出器');

        const result = await aiVideoExporter.exportAIVideo((progress) => {
          setExportProgress(progress);
        });

        // 导出成功
        toast.success("AI视频导出完成!", {
          description: `文件大小: ${(result.size! / 1024 / 1024).toFixed(1)}MB`,
          action: {
            label: "下载",
            onClick: () => {
              const a = document.createElement('a');
              a.href = result.url!;
              a.download = result.filename!;
              a.click();
            },
          },
        });

        // 自动下载
        if (result.url) {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = result.filename || 'ai-video-export.mp4';
          a.click();
        }

      } else {
        // 回退到通用导出系统
        toast.info(`回退到通用导出: ${canExportCheck.reason}`);

        // 强制使用前端导出，因为后端FFmpeg可能不可用
        const frontendPreference: UserPreference = {
          ...defaultPreference,
          method: 'frontend',
          privacy: 'strict', // 强制本地处理
        };

        const result = await exportManager.smartExport(
          frontendPreference,
          (progress) => {
            setExportProgress(progress);
          }
        );

        console.log('Export result received:', result);

        // 检查导出是否成功
        if (!result.success) {
          throw new Error('导出失败：' + (result.error || '未知错误'));
        }

        // 验证结果对象
        if (!result.url) {
          throw new Error('导出结果缺少下载URL');
        }
        if (!result.size) {
          throw new Error('导出结果缺少文件大小信息');
        }

        // 导出成功
        toast.success("导出完成!", {
          description: `文件大小: ${(result.size / 1024 / 1024).toFixed(1)}MB`,
          action: {
            label: "下载",
            onClick: () => {
              try {
                const a = document.createElement('a');
                a.href = result.url;
                a.download = result.filename || 'export.mp4';
                a.click();
              } catch (downloadError) {
                console.error('Manual download failed:', downloadError);
                toast.error('手动下载失败', {
                  description: '请尝试重新导出'
                });
              }
            },
          },
        });

        // 自动下载
        try {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = result.filename || 'export.mp4';
          a.click();
          console.log('✅ Auto download triggered successfully');
        } catch (autoDownloadError) {
          console.error('Auto download failed:', autoDownloadError);
          // 自动下载失败不显示错误，用户可以手动点击下载按钮
        }
      }

    } catch (error) {
      console.error('Export failed:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);

      // 提供更详细的错误信息和解决建议
      let errorMessage = "导出失败";
      let errorDescription = "未知错误";

      if (error instanceof Error) {
        errorDescription = error.message;
        console.error('Error message:', error.message);

        // 根据错误类型提供建议
        if (error.message.includes('FFmpeg')) {
          errorDescription += "\n建议：请确保浏览器支持WebAssembly";
        } else if (error.message.includes('memory') || error.message.includes('内存')) {
          errorDescription += "\n建议：请尝试关闭其他标签页或降低导出质量";
        } else if (error.message.includes('项目为空') || error.message.includes('时间轴为空')) {
          errorDescription += "\n建议：请先执行AI剪辑或添加视频内容到时间轴";
        } else if (error.message.includes('AI剪辑')) {
          errorDescription += "\n建议：请先点击'生成AI剪辑计划'并执行'一键剪辑'";
        } else if (error.message.includes('download') || error.message.includes('下载') || error.message.includes('File not found')) {
          errorDescription += "\n建议：导出文件可能已过期，请重新尝试导出";
        } else if (error.message.includes('Failed to download result file')) {
          errorDescription += "\n建议：网络连接问题或文件已清理，请重新尝试导出";
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
   * 高级导出 - 显示选项对话框
   */
  const handleAdvancedExport = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 获取导出策略
      const strategyData = await exportManager.getExportStrategy(defaultPreference);
      setStrategies(strategyData);
      setShowDialog(true);
    } catch (error) {
      console.error('Failed to get export strategies:', error);
      toast.error("无法获取导出选项", {
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
          {strategy.quality === 'preview' && '预览质量'}
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
            className={className}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            导出视频
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleQuickExport} disabled={isLoading}>
            <Zap className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>快速导出</span>
              <span className="text-xs text-muted-foreground">
                使用推荐设置
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleAdvancedExport} disabled={isLoading}>
            <Settings className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>高级导出</span>
              <span className="text-xs text-muted-foreground">
                自定义导出选项
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleQuickExport()} disabled={isLoading}>
            <Monitor className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>本地导出</span>
              <span className="text-xs text-muted-foreground">
                隐私优先，本地处理
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport()} disabled={isLoading}>
            <Cloud className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>云端导出</span>
              <span className="text-xs text-muted-foreground">
                性能优先，服务器处理
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* TODO: 实现高级导出对话框和进度对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">高级导出选项</h3>
            <p className="text-sm text-muted-foreground mb-4">
              导出对话框组件正在开发中...
            </p>
            <Button onClick={() => setShowDialog(false)}>关闭</Button>
          </div>
        </div>
      )}

      {showProgress && exportProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">导出进度</h3>
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>已用时间: {Math.round(exportProgress.elapsedTime)}秒</span>
                {exportProgress.estimatedTimeRemaining && (
                  <span>预计剩余: {Math.round(exportProgress.estimatedTimeRemaining)}秒</span>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await exportManager.cancelExport();
                    toast.info("导出已取消");
                  } catch (error) {
                    console.error('Failed to cancel export:', error);
                  } finally {
                    setShowProgress(false);
                    setExportProgress(null);
                  }
                }}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
