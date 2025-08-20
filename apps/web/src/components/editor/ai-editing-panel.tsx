
"use client";

// 🎨 AI剪辑面板组件 - 现代化重新设计
// 高级UI设计师重新设计，完美融合到系统中
// 文件路径: components/editor/ai-editing-panel.tsx
// 最后更新: 2025/1/8

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ProgressiveLoadingIndicator } from "./progressive-loading-indicator";

export function AIEditingPanel() {
  const {
    aiEditingData,
    currentEditingPlan,
    isExecutingPlan,
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
    clearAIData,
    showOriginalVideoInTimeline,
  } = useAIEditingStore();

  const { activeProject } = useProjectStore();
  const { mediaItems } = useMediaStore();
  const { startPreview } = useVideoPreviewStore();
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);

  // 生成Mock数据
  const handleGenerateMockData = () => {
    if (!activeProject) {
      toast.error("请先创建或打开一个项目");
      return;
    }

    const mockData = generateMockData(activeProject.id);
    loadAIEditingData(mockData);
  };

  // 生成剪辑计划并显示原始视频
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

  // 🎯 资深工程师修复：根据不同情况执行不同的剪辑流程
  const handleExecuteEditing = async () => {
    if (!currentEditingPlan) {
      toast.error("没有可执行的剪辑计划");
      return;
    }

    if (isShowingOriginalVideo) {
      // 情况二：已显示原视频 → 执行可视化剪辑流程
      toast.info("🎬 开始可视化剪辑过程，请观看时间轴上的剪辑操作！");
      await executeVisualEditingPlan();
    } else {
      // 情况一：未显示原视频 → 执行直接剪辑流程
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

  // 定位到源视频
  const handleLocateSourceVideo = (clip: any) => {
    // 查找对应的媒体文件
    const mediaItem = mediaItems.find(item =>
      item.url === clip.video_url ||
      item.name.includes(clip.source_clip_id)
    );

    if (mediaItem) {
      // 切换到媒体面板并高亮显示对应文件
      toast.success(`已定位到源视频: ${mediaItem.name}`);
      // 这里可以添加切换到媒体面板的逻辑
    } else {
      toast.warning(`未找到源视频文件: ${clip.source_clip_id}`);
    }
  };

  // 处理视频预览
  const handleVideoPreview = (videoUrl: string, startTime?: number) => {
    // 转换时间码为秒数
    const timeInSeconds = startTime || 0;

    // 在中央预览区播放视频
    startPreview(videoUrl, timeInSeconds);
    toast.success("正在中央预览区播放视频");
  };

  // 时间码转换为秒数
  const timecodeToSeconds = (timecode: string): number => {
    const parts = timecode.split(':');
    if (parts.length === 4) {
      // HH:MM:SS:FF 格式
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      const frames = parseInt(parts[3]);
      return hours * 3600 + minutes * 60 + seconds + frames / 30;
    } else if (parts.length === 3) {
      // HH:MM:SS 格式
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // 格式化时间码
  const formatTimecode = (timecode: string) => {
    return timecode.replace(/\.\d+$/, ''); // 移除毫秒部分
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
            {/* 主要内容区域 */}
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
                onClick={handleGenerateMockData}
                size="default"
                className="w-full max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Bot className="w-4 h-4 mr-2" />
                生成AI剪辑计划
              </Button>
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
                {/* 显示原始视频按钮 */}
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

                {/* 一键剪辑按钮 */}
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

              {/* 🎨 现代化的执行进度显示 */}
              {isExecutingPlan && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
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
              )}

              {/* 计划描述 */}
              {currentEditingPlan?.version_summary && (
                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentEditingPlan.version_summary}
                  </p>
                </div>
              )}

              {/* 🎨 现代化的字幕信息显示 */}
              {aiEditingData && (() => {
                const subtitleData = extractSubtitleDataFromAIEditing(aiEditingData);
                if (subtitleData) {
                  const segmentCount = subtitleData.final_dialogue_segments?.length || 0;
                  const hasSrt = !!subtitleData.final_srt_content;

                  return (
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50">
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
                      </CardContent>
                    <CardContent className="pt-0 p-2">
                      <div className="space-y-2">
                        {/* 视频缩略图 */}
                        <div className="flex items-center gap-2">
                          <VideoThumbnail
                            videoUrl={clip.video_url}
                            startTime={timecodeToSeconds(clip.source_in_timecode)}
                            width={120}
                            height={68}
                            onPreview={(url, time) => handleVideoPreview(url, time)}
                            className="flex-shrink-0 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {clip.source_clip_id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimecode(clip.source_in_timecode)} - {formatTimecode(clip.source_out_timecode)}
                            </div>
                            <div className="text-xs text-blue-600">
                              点击缩略图预览
                            </div>
                          </div>
                        </div>

                        {/* 视频源信息 */}
                        <div className="bg-muted/30 p-2 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Film className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">视频源</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLocateSourceVideo(clip);
                              }}
                              className="h-5 w-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                              title="定位源视频"
                            >
                              <Search className="w-3 h-3 text-blue-500" />
                            </Button>
                          </div>
                          <div className="text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>文件: {clip.source_clip_id}</span>
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </div>
                            <div>片段: {formatTimecode(clip.source_in_timecode)} - {formatTimecode(clip.source_out_timecode)}</div>
                          </div>
                        </div>

                        {/* 时间轴信息 */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimecode(clip.sequence_start_timecode)}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{clip.corresponding_script_scene_id}</span>
                        </div>

                        {/* 类型和转场标签 */}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={clip.clip_type === "video_and_audio" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {clip.clip_type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {clip.transition_from_previous.transition_type}
                          </Badge>
                        </div>

                        {/* 剪辑意图 */}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <span className="font-medium">意图:</span> {clip.clip_placement_reasons.core_intent_and_audience_effect}
                        </p>

                        {/* 问题提示 */}
                        {clip.continuity_correction_suggestion.error_exists && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mb-1">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">质量问题</span>
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-300">
                              {clip.continuity_correction_suggestion.error_description || "需要注意连续性问题"}
                            </div>
                          </div>
                        )}

                        {/* 音效和视觉建议 */}
                        {(clip.sound_design_suggestions.length > 0 || clip.visual_enhancement_suggestions.length > 0) && (
                          <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                            <div className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">
                              AI建议
                            </div>
                            {clip.sound_design_suggestions.length > 0 && (
                              <div className="text-xs text-green-600 dark:text-green-300">
                                🎵 {clip.sound_design_suggestions[0].description}
                              </div>
                            )}
                            {clip.visual_enhancement_suggestions.length > 0 && (
                              <div className="text-xs text-green-600 dark:text-green-300">
                                🎨 {clip.visual_enhancement_suggestions[0].description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* 底部操作 */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAIData}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  清空计划
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>AI分析完成</span>
                </div>
              </div>

              {/* 使用说明 */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <p className="font-medium mb-1">💡 使用提示:</p>
                <p>1. 每个片段显示实际视频，可播放预览</p>
                <p>2. 点击视频区域在中央播放器预览</p>
                <p className="font-medium text-blue-600 mt-2 mb-1">🎬 两种剪辑模式:</p>
                <p>• <span className="font-medium">直接剪辑</span>: 生成计划后直接点击"一键剪辑"</p>
                <p>  → 自动下载视频并快速拼接到时间轴</p>
                <p>• <span className="font-medium">可视化剪辑</span>: 先点击"显示完整原视频"再点击"可视化剪辑"</p>
                <p>  → 先显示未剪辑的完整原始视频，然后展示真实的剪辑操作过程</p>
                <p className="font-medium mt-2 mb-1">📋 其他功能:</p>
                <p>3. AI生成的片段会有绿色标识和Bot图标</p>
                <p>4. 字幕会自动添加到独立的文本轨道</p>
                <p>5. 注意⚠️标记的质量问题和🎵AI建议</p>
                <p>6. 可以在时间轴中进一步调整剪辑结果</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎨 渐进式加载指示器 */}
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
