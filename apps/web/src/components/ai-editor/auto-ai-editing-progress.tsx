// auto-ai-editing-progress.tsx - 自动化AI剪辑进度显示组件
// 显示自动化流程的进度和状态
// 文件路径: components/ai-editor/auto-ai-editing-progress.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Video, 
  Scissors, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Play,
  Square,
  RotateCcw
} from "lucide-react";
import { useAutoAIEditingStore, AutoAIEditingStage } from "@/stores/auto-ai-editing-store";
import { cn } from "@/lib/utils";

// 阶段配置
const STAGE_CONFIG: Record<AutoAIEditingStage, {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
}> = {
  idle: {
    icon: Bot,
    label: "准备就绪",
    description: "点击开始自动化AI剪辑",
    color: "text-muted-foreground",
  },
  'loading-plan': {
    icon: Bot,
    label: "加载剪辑计划",
    description: "AI正在分析视频并生成剪辑计划",
    color: "text-blue-500",
  },
  'showing-original': {
    icon: Video,
    label: "显示原视频",
    description: "将原视频添加到时间轴",
    color: "text-green-500",
  },
  'visual-editing': {
    icon: Scissors,
    label: "可视化剪辑",
    description: "执行可视化剪辑动画并生成最终结果",
    color: "text-purple-500",
  },
  'applying-result': {
    icon: Video,
    label: "应用剪辑结果",
    description: "将AI剪辑结果应用到时间轴",
    color: "text-orange-500",
  },
  exporting: {
    icon: Download,
    label: "导出视频",
    description: "正在导出最终视频文件",
    color: "text-indigo-500",
  },
  completed: {
    icon: CheckCircle,
    label: "完成",
    description: "自动化AI剪辑流程已完成",
    color: "text-green-600",
  },
  error: {
    icon: XCircle,
    label: "错误",
    description: "流程执行过程中出现错误",
    color: "text-red-500",
  },
};

interface AutoAIEditingProgressProps {
  projectId: string;
  className?: string;
}

export function AutoAIEditingProgress({ projectId, className }: AutoAIEditingProgressProps) {
  const {
    currentStage,
    overallProgress,
    stageProgress,
    currentMessage,
    isAutoRunning,
    error,
    exportProgress,
    startAutoAIEditing,
    stopAutoAIEditing,
    resetState,
  } = useAutoAIEditingStore();

  const stageConfig = STAGE_CONFIG[currentStage];
  const StageIcon = stageConfig.icon;

  const handleStart = () => {
    startAutoAIEditing(projectId);
  };

  const handleStop = () => {
    stopAutoAIEditing();
  };

  const handleReset = () => {
    resetState();
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              currentStage === 'completed' ? "bg-green-100 dark:bg-green-900/20" :
              currentStage === 'error' ? "bg-red-100 dark:bg-red-900/20" :
              isAutoRunning ? "bg-blue-100 dark:bg-blue-900/20" :
              "bg-muted"
            )}>
              {isAutoRunning && currentStage !== 'completed' && currentStage !== 'error' ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                <StageIcon className={cn("w-5 h-5", stageConfig.color)} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">自动化AI剪辑</h3>
              <p className="text-sm text-muted-foreground">一键完成AI视频剪辑流程</p>
            </div>
          </div>

          {/* 状态徽章 */}
          <Badge 
            variant={
              currentStage === 'completed' ? 'default' :
              currentStage === 'error' ? 'destructive' :
              isAutoRunning ? 'secondary' : 'outline'
            }
            className="text-xs"
          >
            {stageConfig.label}
          </Badge>
        </div>

        {/* 当前阶段信息 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <StageIcon className={cn("w-4 h-4", stageConfig.color)} />
            <span className="font-medium text-sm">{stageConfig.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {currentMessage || stageConfig.description}
          </p>

          {/* 总体进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>总体进度</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* 阶段进度条 */}
          {isAutoRunning && currentStage !== 'idle' && currentStage !== 'completed' && currentStage !== 'error' && (
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>当前阶段</span>
                <span>{Math.round(stageProgress)}%</span>
              </div>
              <Progress value={stageProgress} className="h-1" />
            </div>
          )}
        </div>

        {/* 导出进度详情 */}
        {exportProgress && currentStage === 'exporting' && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-sm">导出详情</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {exportProgress.message || '正在处理...'}
            </p>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>导出进度</span>
              <span>{Math.round(exportProgress.overall * 100)}%</span>
            </div>
            <Progress value={exportProgress.overall * 100} className="h-1" />
            {exportProgress.elapsedTime > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                已用时: {Math.round(exportProgress.elapsedTime)}秒
              </p>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {error && currentStage === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="font-medium text-sm text-red-700 dark:text-red-300">错误详情</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {currentStage === 'idle' || currentStage === 'error' ? (
            <Button
              onClick={handleStart}
              disabled={isAutoRunning}
              className="flex-1"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              开始自动化AI剪辑
            </Button>
          ) : currentStage === 'completed' ? (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="outline"
              disabled={!isAutoRunning}
              className="flex-1"
              size="lg"
            >
              <Square className="w-4 h-4 mr-2" />
              停止流程
            </Button>
          )}
        </div>

        {/* 流程说明和优化提示 */}
        {currentStage === 'idle' && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">
                🚀 智能自动化流程
              </h4>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>1. 🤖 AI分析并生成剪辑计划</li>
                <li>2. 📹 智能显示原视频到时间轴</li>
                <li>3. ✂️ 可视化剪辑 + 并行处理</li>
                <li>4. 🎬 应用最终剪辑结果</li>
                <li>5. 📤 自动导出并下载视频</li>
              </ol>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  优化提示
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                整个流程约需2-3分钟，期间可以观看可视化剪辑过程
              </p>
            </div>
          </div>
        )}

        {/* 进行中的详细信息 */}
        {isAutoRunning && currentStage !== 'idle' && currentStage !== 'completed' && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="font-medium text-sm">实时状态</span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>当前阶段:</span>
                <span className="font-medium">{stageConfig.label}</span>
              </div>
              <div className="flex justify-between">
                <span>整体进度:</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              {exportProgress && (
                <div className="flex justify-between">
                  <span>导出进度:</span>
                  <span className="font-medium">{Math.round(exportProgress.overall * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
