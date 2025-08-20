"use client";

// 🎨 AI剪辑面板组件 - 现代化重新设计
// 高级UI设计师重新设计，完美融合到系统中
// 文件路径: components/editor/ai-editing-panel.tsx
// 最后更新: 2025/1/8

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Scissors,
  Play,
  Eye,
  Clock,
  Film,
  Zap,
  FileText,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Search
} from "lucide-react";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { useProjectStore } from "@/stores/project-store";
import { useMediaStore } from "@/stores/media-store";
import { useVideoPreviewStore } from "@/stores/video-preview-store";
import { VideoThumbnail } from "./video-thumbnail";
import { toast } from "sonner";
import { extractSubtitleDataFromAIEditing } from "@/lib/ai-subtitle-integration";
import { ProgressiveLoadingIndicator } from "./progressive-loading-indicator";

export function AIEditingPanel() {
  // 获取URL参数中的项目ID
  const params = useParams();
  const urlProjectId = params?.project_id as string;

  const {
    aiEditingData,
    currentEditingPlan,
    isExecutingPlan,
    isLoadingPlan,
    executionProgress,
    currentProcessingClip,
    previewClipIndex,
    isPreviewMode,
    isShowingOriginalVideo,
    visualEditingState,
    progressiveLoadingState,
    loadAIEditingData,
    executeEditingPlan,
    executeVisualEditingPlan,
    previewClip,
    stopPreview,
    generateMockData,
    generateAIEditingPlanFromAPI,
    clearAIData,
    showOriginalVideoInTimeline,
  } = useAIEditingStore();

  const { activeProject } = useProjectStore();
  const { mediaItems } = useMediaStore();
  const { setVideoPreview } = useVideoPreviewStore();

  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);

  // 获取项目ID - 优先使用URL中的ID，然后是activeProject的ID
  const getProjectId = () => {
    if (urlProjectId) {
      console.log('使用URL中的项目ID:', urlProjectId);
      return urlProjectId;
    }
    if (activeProject?.id) {
      console.log('使用activeProject的ID:', activeProject.id);
      return activeProject.id;
    }
    console.warn('没有找到有效的项目ID');
    return null;
  };

  // 生成AI剪辑计划（真实API调用）
  const handleGenerateAIEditingPlan = async () => {
    const projectId = getProjectId();
    
    if (!projectId) {
      toast.error("请先创建或打开一个项目");
      return;
    }

    console.log('🚀 开始生成AI剪辑计划，项目ID:', projectId);
    await generateAIEditingPlanFromAPI(projectId);
  };

  // 生成Mock数据（保留作为备用）
  const handleGenerateMockData = () => {
    const projectId = getProjectId();
    
    if (!projectId) {
      toast.error("请先创建或打开一个项目");
      return;
    }

    const mockData = generateMockData(projectId);
    loadAIEditingData(mockData);
  };

  // 显示原始视频
  const handleShowOriginalVideo = async () => {
    try {
      await showOriginalVideoInTimeline();
    } catch (error) {
      console.error("显示原视频失败:", error);
      toast.error("显示原视频失败，请重试");
    }
  };

  // 执行剪辑
  const handleExecuteEditing = async () => {
    if (!currentEditingPlan) {
      toast.error("请先生成AI剪辑计划");
      return;
    }

    try {
      await executeEditingPlan();
    } catch (error) {
      console.error("执行剪辑失败:", error);
      toast.error("执行剪辑失败，请重试");
    }
  };

  // 预览片段
  const handlePreviewClip = (clipIndex: number) => {
    if (isPreviewMode && previewClipIndex === clipIndex) {
      stopPreview();
      setSelectedClipIndex(null);
    } else {
      previewClip(clipIndex);
      setSelectedClipIndex(clipIndex);
    }
  };

  // 定位源视频
  const handleLocateSourceVideo = (clip: any) => {
    const sourceVideo = mediaItems.find((item) =>
      item.name.includes(clip.source_clip_id)
    );

    if (sourceVideo) {
      setVideoPreview(sourceVideo.url, 0);
      toast.success(`已定位到源视频: ${sourceVideo.name}`);
    } else {
      toast.warning(`未找到源视频文件: ${clip.source_clip_id}`);
    }
  };

  // 视频预览
  const handleVideoPreview = (url: string, time: number) => {
    setVideoPreview(url, time);
  };

  // 格式化时间码
  const formatTimecode = (timecode: string) => {
    return timecode || "00:00:00";
  };

  // 时间码转秒数
  const timecodeToSeconds = (timecode: string): number => {
    if (!timecode) return 0;
    
    const parts = timecode.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 🎨 现代化头部设计 */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">AI剪辑助手</h3>
        </div>

        {aiEditingData && (
          <Badge variant="secondary" className="text-xs font-medium">
            {currentEditingPlan?.timeline_clips.length || 0} 个片段
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!aiEditingData ? (
          // 🎨 重新设计的空状态
          <div className="flex flex-col h-full">
            {/* 主要内容区域 */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {/* 图标和标题 */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                AI智能剪辑计划
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md leading-relaxed">
                让AI分析您的视频素材，自动生成专业的剪辑方案，包含精确的时间轴、转场效果和音效建议
              </p>

              {/* 功能特性 */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Scissors className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-foreground">智能片段识别</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-foreground">精确时间轴</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Film className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-foreground">转场建议</span>
                </div>
              </div>

              {/* 媒体库状态 */}
              <div className="w-full max-w-sm mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">媒体文件</span>
                  </div>
                  <Badge variant={mediaItems.length > 0 ? "default" : "secondary"} className="text-xs">
                    {mediaItems.length} 个文件
                  </Badge>
                </div>
                {mediaItems.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                    请先上传视频文件到媒体库
                  </p>
                )}
              </div>

              {/* 主要操作按钮 */}
              <Button
                onClick={handleGenerateAIEditingPlan}
                disabled={isLoadingPlan}
                size="default"
                className="w-full max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPlan ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    正在生成...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    生成AI剪辑计划
                  </>
                )}
              </Button>
              
              {/* 开发模式：Mock数据按钮 */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={handleGenerateMockData}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  生成Mock数据（开发）
                </Button>
              )}
            </div>
          </div>
        ) : (
          // 有数据状态的简化版本
          <div className="p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-base text-foreground mb-2">
                {currentEditingPlan?.version_name || "AI剪辑计划"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {currentEditingPlan?.timeline_clips.length || 0} 个视频片段
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleExecuteEditing}
                disabled={isExecutingPlan}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                {isExecutingPlan ? "执行中..." : "一键剪辑"}
              </Button>
              
              <Button
                onClick={clearAIData}
                variant="outline"
                size="sm"
              >
                重新生成
              </Button>
            </div>

            {/* 进度显示 */}
            {isExecutingPlan && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">执行进度</span>
                  <span className="text-sm">{Math.round(executionProgress)}%</span>
                </div>
                <Progress value={executionProgress} className="h-2" />
              </div>
            )}

            {/* 片段列表 */}
            <div className="space-y-2">
              {currentEditingPlan?.timeline_clips.map((clip, index) => (
                <Card key={clip.sequence_clip_id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">片段 {index + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        {clip.clip_duration_in_sequence}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewClip(index)}
                    >
                      {isPreviewMode && previewClipIndex === index ? "停止" : "预览"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 渐进式加载指示器 */}
      <ProgressiveLoadingIndicator
        isVisible={progressiveLoadingState.isVisible}
        currentItem={progressiveLoadingState.currentItem}
        totalItems={progressiveLoadingState.totalItems}
        currentItemName={progressiveLoadingState.currentItemName}
        stage={progressiveLoadingState.stage}
      />
    </div>
  );
}
