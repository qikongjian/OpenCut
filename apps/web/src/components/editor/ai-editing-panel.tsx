"use client";

// ai-editing-panel.tsx - AI剪辑面板组件
// 此文件包含 AI剪辑计划展示和一键剪辑功能 的相关代码
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
  Search
} from "lucide-react";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { useProjectStore } from "@/stores/project-store";
import { useMediaStore } from "@/stores/media-store";
import { useVideoPreviewStore } from "@/stores/video-preview-store";
import { VideoThumbnail } from "./video-thumbnail";
import { toast } from "sonner";
import { extractSubtitleDataFromAIEditing } from "@/lib/ai-subtitle-integration";

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
    await showOriginalVideoInTimeline();
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
    <div className="h-full flex flex-col bg-panel">
      {/* 头部 */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">AI智能剪辑</h3>
        {aiEditingData && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {currentEditingPlan?.timeline_clips.length || 0} 片段
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {!aiEditingData ? (
          // 空状态 - 显示生成Mock数据按钮
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Bot className="w-12 h-12 text-muted-foreground mb-3" />
            <h4 className="text-base font-medium mb-2">AI剪辑助手</h4>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              让AI分析您的视频素材，自动生成专业的剪辑方案
            </p>

            {/* 媒体文件状态提示 */}
            <div className="mb-4 p-2 bg-muted/30 rounded-md w-full">
              <div className="flex items-center gap-2 text-xs">
                <Film className="w-3 h-3" />
                <span>媒体库: {mediaItems.length} 个文件</span>
              </div>
              {mediaItems.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  建议先导入视频文件
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerateMockData}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Bot className="w-3 h-3 mr-2" />
              生成AI剪辑计划
            </Button>
          </div>
        ) : (
          // 有数据状态
          <div className="flex flex-col h-full">
            {/* 剪辑计划信息 */}
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{currentEditingPlan?.version_name}</h4>
                <div className="flex items-center gap-2">
                  {/* 显示原始视频按钮 */}
                  <Button
                    onClick={handleShowOriginalVideo}
                    disabled={isExecutingPlan || isShowingOriginalVideo}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {isShowingOriginalVideo ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                        已显示原视频
                      </>
                    ) : (
                      <>
                        <Film className="w-3 h-3 mr-1" />
                        显示所有原视频
                      </>
                    )}
                  </Button>

                  {/* 一键剪辑按钮 - 根据状态显示不同的剪辑模式 */}
                  <Button
                    onClick={handleExecuteEditing}
                    disabled={isExecutingPlan}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-xs"
                  >
                    {isExecutingPlan ? (
                      <>
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        剪辑中...
                      </>
                    ) : isShowingOriginalVideo ? (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        可视化剪辑
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        一键剪辑
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isExecutingPlan && (
                <div className="space-y-2">
                  <Progress value={executionProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>正在应用剪辑计划... {Math.round(executionProgress)}%</p>
                    {currentProcessingClip && (
                      <p className="text-blue-600">
                        正在处理: {currentProcessingClip}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mt-2">
                {currentEditingPlan?.version_summary}
              </p>

              {/* 字幕信息显示 */}
              {aiEditingData && (() => {
                const subtitleData = extractSubtitleDataFromAIEditing(aiEditingData);
                if (subtitleData) {
                  const segmentCount = subtitleData.final_dialogue_segments?.length || 0;
                  const hasSrt = !!subtitleData.final_srt_content;

                  return (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          包含AI字幕数据
                        </span>
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {segmentCount > 0 && `${segmentCount} 个对话片段`}
                        {segmentCount > 0 && hasSrt && ' • '}
                        {hasSrt && 'SRT格式'}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* 片段列表 */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {currentEditingPlan?.timeline_clips.map((clip, index) => (
                  <Card
                    key={clip.sequence_clip_id}
                    className={`cursor-pointer transition-colors border-border/50 ${
                      selectedClipIndex === index
                        ? 'ring-1 ring-primary bg-primary/5'
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedClipIndex(index)}
                  >
                    <CardHeader className="pb-1 p-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium">
                          片段 {index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewClip(index);
                            }}
                            className="h-5 w-5 p-0"
                          >
                            {isPreviewMode && previewClipIndex === index ? (
                              <Eye className="w-3 h-3 text-primary" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {clip.clip_duration_in_sequence}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
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
                <p>• <span className="font-medium">可视化剪辑</span>: 先点击"显示原视频"再点击"可视化剪辑"</p>
                <p>  → 展示真实的剪辑操作过程（播放头移动、剪切、移动）</p>
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
    </div>
  );
}
