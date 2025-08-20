"use client";

// 🎨 AI剪辑面板组件 - 现代化重新设计
// 高级UI设计师重新设计，完美融合到系统中
// 文件路径: components/editor/ai-editing-panel-new.tsx
// 最后更新: 2025/1/8

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Scissors,
  Play,
  Eye,
  Clock,
  Film,
  Zap,
  FileText,
  CheckCircle,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { useProjectStore } from "@/stores/project-store";
import { useMediaStore } from "@/stores/media-store";
import { useVideoPreviewStore } from "@/stores/video-preview-store";
import { VideoThumbnail } from "./video-thumbnail";
import { toast } from "sonner";
import { extractSubtitleDataFromAIEditing } from "@/lib/ai-subtitle-integration";

// 时间码转换函数
const timecodeToSeconds = (timecode: string): number => {
  if (!timecode) return 0;
  const parts = timecode.split(':');
  if (parts.length === 4) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    const frames = parseInt(parts[3]);
    return hours * 3600 + minutes * 60 + seconds + frames / 30;
  }
  return 0;
};

// 时间码格式化函数
const formatTimecode = (timecode: string): string => {
  return timecode || "00:00:00:00";
};

export function AIEditingPanelNew() {
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
    loadAIEditingData,
    executeEditingPlan,
    executeVisualEditingPlan,
    previewClip,
    stopPreview,
    generateMockData,
    generateAIEditingPlanFromAPI,
    showOriginalVideoInTimeline,
  } = useAIEditingStore();

  const { activeProject } = useProjectStore();
  const { mediaItems } = useMediaStore();
  const { startPreview } = useVideoPreviewStore();

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
    toast.success("AI剪辑计划已生成！");
  };

  // 显示原始视频
  const handleShowOriginalVideo = async () => {
    if (!currentEditingPlan) {
      toast.error("请先生成剪辑计划");
      return;
    }
    
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
      toast.error("没有可执行的剪辑计划");
      return;
    }

    if (isShowingOriginalVideo) {
      toast.info("🎬 开始可视化剪辑过程，请观看时间轴上的剪辑操作！");
      await executeVisualEditingPlan();
    } else {
      toast.info("🚀 开始自动剪辑，正在下载并处理视频片段...");
      await executeEditingPlan();
    }
  };

  // 预览片段
  const handlePreviewClip = (clipIndex: number) => {
    if (isPreviewMode && previewClipIndex === clipIndex) {
      stopPreview();
    } else {
      previewClip(clipIndex);
      setSelectedClipIndex(clipIndex);
    }
  };

  // 视频预览
  const handleVideoPreview = (url: string, time: number) => {
    startPreview(url, time);
  };

  // 定位源视频
  const handleLocateSourceVideo = (clip: any) => {
    toast.info(`定位源视频: ${clip.source_clip_id}`);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 🎨 现代化头部设计 */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">AI智能剪辑</h3>
            <p className="text-xs text-muted-foreground">智能视频编辑助手</p>
          </div>
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {/* 图标和标题 */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 flex items-center justify-center mb-4 mx-auto">
                  <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>

              <h4 className="text-lg font-semibold text-foreground mb-2">开始AI智能剪辑</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                上传视频素材，AI将自动分析内容并生成专业的剪辑方案
              </p>

              {/* 功能特性 */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-foreground">智能剪辑</p>
                    <p className="text-xs text-muted-foreground">自动识别精彩片段</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-foreground">自动字幕</p>
                    <p className="text-xs text-muted-foreground">智能生成字幕文本</p>
                  </div>
                </div>
              </div>

              {/* 媒体库状态 */}
              <div className="w-full max-w-sm mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">媒体库</span>
                  </div>
                  <Badge variant={mediaItems.length > 0 ? "default" : "secondary"} className="text-xs">
                    {mediaItems.length} 个文件
                  </Badge>
                </div>
                {mediaItems.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                    💡 建议先导入视频文件到媒体库
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
          // 🎨 重新设计的有数据状态
          <div className="flex flex-col h-full">
            {/* 🎨 现代化的剪辑计划信息区域 */}
            <div className="p-4 border-b border-border/40 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-base text-foreground mb-1">
                    {currentEditingPlan?.version_name || "AI剪辑计划"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {currentEditingPlan?.timeline_clips.length || 0} 个视频片段 • 智能分析完成
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-medium bg-white/50 dark:bg-black/20">
                  已生成
                </Badge>
              </div>

              {/* 🎨 现代化的操作按钮组 */}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={handleShowOriginalVideo}
                  disabled={isExecutingPlan || isShowingOriginalVideo || visualEditingState === 'showing-original'}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-xs bg-white/50 dark:bg-black/20 border-border/60 hover:bg-white/80 dark:hover:bg-black/40"
                >
                  {visualEditingState === 'showing-original' ? (
                    <>
                      <div className="w-3 h-3 mr-2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      正在加载原视频...
                    </>
                  ) : isShowingOriginalVideo ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                      已显示原视频
                    </>
                  ) : (
                    <>
                      <Film className="w-3 h-3 mr-2 text-blue-600" />
                      显示完整原视频
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleExecuteEditing}
                  disabled={isExecutingPlan}
                  size="sm"
                  className="w-full justify-start text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md"
                >
                  {isExecutingPlan ? (
                    <>
                      <Clock className="w-3 h-3 mr-2 animate-spin" />
                      正在剪辑中...
                    </>
                  ) : isShowingOriginalVideo ? (
                    <>
                      <Zap className="w-3 h-3 mr-2" />
                      开始可视化剪辑
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 mr-2" />
                      开始一键剪辑
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 🎨 现代化的执行进度显示 */}
            {isExecutingPlan && (
              <div className="p-4 border-b border-border/40">
                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      正在执行剪辑计划
                    </span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {Math.round(executionProgress)}%
                    </Badge>
                  </div>
                  <Progress value={executionProgress} className="h-2 mb-2" />
                  {currentProcessingClip && (
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {currentProcessingClip}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 计划描述和字幕信息 */}
            <div className="p-4 border-b border-border/40 space-y-3">
              {currentEditingPlan?.version_summary && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentEditingPlan.version_summary}
                  </p>
                </div>
              )}

              {/* 字幕信息 */}
              {aiEditingData && (() => {
                const subtitleData = extractSubtitleDataFromAIEditing(aiEditingData);
                if (subtitleData) {
                  const segmentCount = subtitleData.final_dialogue_segments?.length || 0;
                  const hasSrt = !!subtitleData.final_srt_content;

                  return (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          AI字幕数据
                        </span>
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        {segmentCount > 0 && `${segmentCount} 个对话片段`}
                        {segmentCount > 0 && hasSrt && ' • '}
                        {hasSrt && 'SRT格式可用'}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* 🎨 现代化的片段列表 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border/40">
                <h5 className="text-sm font-semibold text-foreground mb-1">视频片段</h5>
                <p className="text-xs text-muted-foreground">
                  {currentEditingPlan?.timeline_clips.length || 0} 个智能识别的精彩片段
                </p>
              </div>

              <ScrollArea className="flex-1 h-full">
                <div className="p-4 space-y-3">
                  {currentEditingPlan?.timeline_clips.map((clip, index) => (
                    <Card
                      key={clip.sequence_clip_id}
                      className={`group cursor-pointer transition-all duration-200 border-border/40 hover:shadow-md ${
                        selectedClipIndex === index
                          ? 'ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : 'hover:bg-muted/30 hover:border-border/60'
                      }`}
                      onClick={() => setSelectedClipIndex(index)}
                    >
                      <CardContent className="p-3">
                        {/* 片段头部 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              片段 {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewClip(index);
                              }}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {isPreviewMode && previewClipIndex === index ? (
                                <Eye className="w-3 h-3 text-blue-600" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </Button>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {clip.clip_duration_in_sequence}
                            </Badge>
                          </div>
                        </div>

                        {/* 视频缩略图区域 */}
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <VideoThumbnail
                              videoUrl={clip.video_url}
                              startTime={timecodeToSeconds(clip.source_in_timecode)}
                              width={100}
                              height={56}
                              onPreview={(url, time) => handleVideoPreview(url, time)}
                              className="flex-shrink-0 rounded-lg border border-border/40 overflow-hidden"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {clip.source_clip_id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimecode(clip.source_in_timecode)} → {formatTimecode(clip.source_out_timecode)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimecode(clip.sequence_start_timecode)}
                              </Badge>
                              <Button
                                variant="text"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocateSourceVideo(clip);
                                }}
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="定位源视频"
                              >
                                <Search className="w-3 h-3 text-blue-500" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 场景信息 */}
                        {clip.corresponding_script_scene_id && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <FileText className="w-3 h-3" />
                            <span>场景: {clip.corresponding_script_scene_id}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
