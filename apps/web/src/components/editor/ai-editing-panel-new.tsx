"use client";

// 🎨 AI Editing Panel Component - Modern Redesign
// Redesigned by senior UI designer, perfectly integrated into the system
// File path: components/editor/ai-editing-panel-new.tsx
// Last updated: 2025/1/8

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
  ArrowRight,
  LogIn
} from "lucide-react";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { useProjectStore } from "@/stores/project-store";
import { useMediaStore } from "@/stores/media-store";
import { useVideoPreviewStore } from "@/stores/video-preview-store";
import { VideoThumbnail } from "./video-thumbnail";
import { toast } from "sonner";
import { extractSubtitleDataFromAIEditing } from "@/lib/ai-subtitle-integration";

// Timecode conversion function
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

// Timecode formatting function
const formatTimecode = (timecode: string): string => {
  return timecode || "00:00:00:00";
};

export function AIEditingPanelNew() {
  // Get project ID from URL parameters
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

  // Get project ID - prioritize URL ID，then activeProject ID
  const getProjectId = () => {
    if (urlProjectId) {
      console.log('Using project ID from URL:', urlProjectId);
      return urlProjectId;
    }
    if (activeProject?.id) {
      console.log('Using activeProject ID:', activeProject.id);
      return activeProject.id;
    }
    console.warn('No valid project ID found');
    return null;
  };

  // Generate AI Editing Plan (Real API call)
  const handleGenerateAIEditingPlan = async () => {
    const projectId = getProjectId();

    if (!projectId) {
      toast.error("Please create or open a project first");
      return;
    }

    console.log('🚀 Starting Generate AI Editing Plan, project ID:', projectId);
    await generateAIEditingPlanFromAPI(projectId);
  };

  // Generate Mock Data (Keep as backup)
  const handleGenerateMockData = () => {
    const projectId = getProjectId();

    if (!projectId) {
      toast.error("Please create or open a project first");
      return;
    }

    const mockData = generateMockData(projectId);
    loadAIEditingData(mockData);
    toast.success("AI editing plan generated!");
  };

  // Show original video
  const handleShowOriginalVideo = async () => {
    if (!currentEditingPlan) {
      toast.error("Please generate editing plan first");
      return;
    }
    
    try {
      await showOriginalVideoInTimeline();
    } catch (error) {
      console.error("Failed to show original video:", error);
      toast.error("Failed to show original video，please try again");
    }
  };

  // Execute editing
  const handleExecuteEditing = async () => {
    if (!currentEditingPlan) {
      toast.error("No executable editing plan");
      return;
    }

    if (isShowingOriginalVideo) {
      toast.info("🎬 Starting visual editing process, please watch the editing operations on the timeline!");
      await executeVisualEditingPlan();
    } else {
      toast.info("🚀 Starting automatic editing, downloading and processing video clips...");
      await executeEditingPlan();
    }
  };

  // PreviewClip
  const handlePreviewClip = (clipIndex: number) => {
    if (isPreviewMode && previewClipIndex === clipIndex) {
      stopPreview();
    } else {
      previewClip(clipIndex);
      setSelectedClipIndex(clipIndex);
    }
  };

  // Video Preview
  const handleVideoPreview = (url: string, time: number) => {
    startPreview(url, time);
  };

  // Locate source video
  const handleLocateSourceVideo = (clip: any) => {
    toast.info(`Locate source video: ${clip.source_clip_id}`);
  };

  // Render main content
  const renderMainContent = () => {
    // Show AI editing features
    if (!aiEditingData) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            {/* Icon and title */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl movieflow-gradient-bg flex items-center justify-center mb-4 mx-auto">
                <Bot className="w-8 h-8 text-white movieflow-icon-highlight" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>

            <h4 className="text-lg font-semibold text-foreground mb-2">Start AI Smart Editing</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
              Upload video materials, AI will automatically analyze content and generate professional editing plans
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">Smart Editing</p>
                  <p className="text-xs text-muted-foreground">Auto-detect highlight clips</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="w-8 h-8 rounded-lg bg-chart-4/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-chart-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">Auto Subtitles</p>
                  <p className="text-xs text-muted-foreground">Smart subtitle generation</p>
                </div>
              </div>
            </div>

            {/* Media library status */}
            <div className="w-full max-w-sm mb-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Media Library</span>
                </div>
                <Badge variant={mediaItems.length > 0 ? "default" : "secondary"} className="text-xs">
                  {mediaItems.length} files
                </Badge>
              </div>
              {mediaItems.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                  💡 Recommend importing video files to media library first
                </p>
              )}
            </div>

            {/* Main action buttons */}
            <div className="space-y-3 w-full max-w-sm">
              <Button
                onClick={handleGenerateAIEditingPlan}
                disabled={isLoadingPlan}
                size="default"
                className="w-full movieflow-button movieflow-gradient-bg movieflow-gradient-hover movieflow-gradient-disabled backdrop-blur-sm"
              >
                {isLoadingPlan ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2 animate-pulse movieflow-icon-highlight" />
                    Loading editing plan...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2 movieflow-icon-highlight" />
                    Generate AI Editing Plan
                  </>
                )}
              </Button>

              {/* Development mode: Mock data button */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={handleGenerateMockData}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  Generate Mock Data (Dev)
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Modern editing plan info area */}
        <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-chart-4/5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-base text-foreground mb-1">
                {currentEditingPlan?.version_name || "AI Editing Plan"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {currentEditingPlan?.timeline_clips.length || 0} video clips • Smart analysis complete
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
              Generated
            </Badge>
          </div>

          {/* Modern action button group */}
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
                  Loading original video...
                </>
              ) : isShowingOriginalVideo ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-2 movieflow-icon-highlight" />
                  Original video shown
                </>
              ) : (
                <>
                  <Film className="w-3 h-3 mr-2 movieflow-icon-highlight" />
                  Show complete original video
                </>
              )}
            </Button>

            <Button
              onClick={handleExecuteEditing}
              disabled={isExecutingPlan}
              size="sm"
              className="w-full justify-start text-xs movieflow-button movieflow-gradient-bg movieflow-gradient-hover movieflow-gradient-disabled backdrop-blur-sm"
            >
              {isExecutingPlan ? (
                <>
                  <Clock className="w-3 h-3 mr-2 animate-spin" />
                  Editing in progress...
                </>
              ) : isShowingOriginalVideo ? (
                <>
                  <Zap className="w-3 h-3 mr-2 movieflow-icon-highlight" />
                  Start visual editing
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 mr-2 movieflow-icon-highlight" />
                  Start One-Click Edit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Modern execution progress display */}
        {isExecutingPlan && (
          <div className="p-4 border-b border-border/40">
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 movieflow-icon-highlight animate-spin" />
                <span className="text-sm font-medium movieflow-gradient-text">
                  Executing editing plan
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

        {/* Plan description and subtitle info */}
        <div className="p-4 border-b border-border/40 space-y-3">
          {currentEditingPlan?.version_summary && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentEditingPlan.version_summary}
              </p>
            </div>
          )}

          {/* Subtitle info */}
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
                      AI Subtitle Data
                    </span>
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    {segmentCount > 0 && `${segmentCount} dialogue clips`}
                    {segmentCount > 0 && hasSrt && ' • '}
                    {hasSrt && 'SRT format available'}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Modern clip list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/40">
            <h5 className="text-sm font-semibold text-foreground mb-1">Video Clips</h5>
            <p className="text-xs text-muted-foreground">
              {currentEditingPlan?.timeline_clips.length || 0} smart-detected highlight clips
            </p>
          </div>

          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-3">
              {currentEditingPlan?.timeline_clips.map((clip, index) => (
                <Card
                  key={clip.sequence_clip_id}
                  className={`group cursor-pointer transition-all duration-200 border-border/40 hover:shadow-md ${
                    selectedClipIndex === index
                      ? 'ring-2 ring-primary/50 bg-primary/5 border-primary/30'
                      : 'hover:bg-muted/30 hover:border-border/60'
                  }`}
                  onClick={() => setSelectedClipIndex(index)}
                >
                  <CardContent className="p-3">
                    {/* Clip header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Clip {index + 1}
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
                            <Eye className="w-3 h-3 movieflow-icon-highlight" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                        <Badge variant="secondary" className="text-xs font-medium">
                          {clip.clip_duration_in_sequence}
                        </Badge>
                      </div>
                    </div>

                    {/* Video thumbnail area */}
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
                            title="Locate source video"
                          >
                            <Search className="w-3 h-3 movieflow-icon-highlight" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Scene info */}
                    {clip.corresponding_script_scene_id && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <FileText className="w-3 h-3" />
                        <span>Scene: {clip.corresponding_script_scene_id}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-panel">
      {/* Modern header design */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg movieflow-gradient-bg shadow-sm">
            <Bot className="w-4 h-4 text-white movieflow-icon-highlight" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">AI Smart Editing</h3>
            <p className="text-xs text-muted-foreground">Smart Video Edit Assistant</p>
          </div>
        </div>

        {aiEditingData && (
          <Badge variant="secondary" className="text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            {currentEditingPlan?.timeline_clips.length || 0} Clips
          </Badge>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderMainContent()}
      </div>
    </div>
  );
}
