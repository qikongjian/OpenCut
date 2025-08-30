"use client";

// 🎨 AI Editing Panel Component - Modern Redesign
// Redesigned by senior UI designer, perfectly integrated into the system
// File path: components/editor/ai-editing-panel.tsx
// Last updated: 2025/1/8

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

  // Get project ID - prioritize URL ID, then activeProject ID
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

  // Generate AI editing plan (real API call)
  const handleGenerateAIEditingPlan = async () => {
    const projectId = getProjectId();

    if (!projectId) {
      toast.error("Please create or open a project first");
      return;
    }

    console.log('🚀 Starting AI editing plan generation, project ID:', projectId);
    await generateAIEditingPlanFromAPI(projectId);
  };

  // Generate mock data (kept as backup)
  const handleGenerateMockData = () => {
    const projectId = getProjectId();

    if (!projectId) {
      toast.error("Please create or open a project first");
      return;
    }

    const mockData = generateMockData(projectId);
    loadAIEditingData(mockData);
  };

  // Show original video
  const handleShowOriginalVideo = async () => {
    try {
      await showOriginalVideoInTimeline();
    } catch (error) {
      console.error("Failed to show original video:", error);
      toast.error("Failed to show original video, please try again");
    }
  };

  // Execute editing
  const handleExecuteEditing = async () => {
    if (!currentEditingPlan) {
      toast.error("Please generate AI editing plan first");
      return;
    }

    try {
      await executeEditingPlan();
    } catch (error) {
      console.error("Failed to execute editing:", error);
      toast.error("Failed to execute editing, please try again");
    }
  };

  // Preview clip
  const handlePreviewClip = (clipIndex: number) => {
    if (isPreviewMode && previewClipIndex === clipIndex) {
      stopPreview();
      setSelectedClipIndex(null);
    } else {
      previewClip(clipIndex);
      setSelectedClipIndex(clipIndex);
    }
  };

  // Locate source video
  const handleLocateSourceVideo = (clip: any) => {
    const sourceVideo = mediaItems.find((item) =>
      item.name.includes(clip.source_clip_id)
    );

    if (sourceVideo) {
      setVideoPreview(sourceVideo.url, 0);
      toast.success(`Located source video: ${sourceVideo.name}`);
    } else {
      toast.warning(`Source video file not found: ${clip.source_clip_id}`);
    }
  };

  // Video preview
  const handleVideoPreview = (url: string, time: number) => {
    setVideoPreview(url, time);
  };

  // Format timecode
  const formatTimecode = (timecode: string) => {
    return timecode || "00:00:00";
  };

  // Convert timecode to seconds
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
      {/* 🎨 Modern header design */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">AI Editing Assistant</h3>
        </div>

        {aiEditingData && (
          <Badge variant="secondary" className="text-xs font-medium">
            {currentEditingPlan?.timeline_clips.length || 0} clips
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!aiEditingData ? (
          // Redesigned empty state
          <div className="flex flex-col h-full">
            {/* Main content area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {/* Icon and title */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full movieflow-gradient-bg flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-white movieflow-icon-highlight" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                AI Smart Editing Plan
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md leading-relaxed">
                Let AI analyze your video materials and automatically generate professional editing plans, including precise timelines, transition effects, and sound effect suggestions
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Scissors className="w-4 h-4 movieflow-icon-highlight" />
                  <span className="text-sm text-foreground">Smart Clip Detection</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Clock className="w-4 h-4 movieflow-icon-highlight" />
                  <span className="text-sm text-foreground">Precise Timeline</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Film className="w-4 h-4 movieflow-icon-highlight" />
                  <span className="text-sm text-foreground">Transition Suggestions</span>
                </div>
              </div>

              {/* Media library status */}
              <div className="w-full max-w-sm mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Media Files</span>
                  </div>
                  <Badge variant={mediaItems.length > 0 ? "default" : "secondary"} className="text-xs">
                    {mediaItems.length} files
                  </Badge>
                </div>
                {mediaItems.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                    Please upload video files to media library first
                  </p>
                )}
              </div>

              {/* Main action buttons */}
              <Button
                onClick={handleGenerateAIEditingPlan}
                disabled={isLoadingPlan}
                size="default"
                className="w-full max-w-sm movieflow-button movieflow-gradient-bg movieflow-gradient-hover movieflow-gradient-disabled backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPlan ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
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
                  className="mt-2 text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  Generate Mock Data (Dev)
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Simplified version with data
          <div className="p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-base text-foreground mb-2">
                {currentEditingPlan?.version_name || "AI Editing Plan"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {currentEditingPlan?.timeline_clips.length || 0} video clips
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleExecuteEditing}
                disabled={isExecutingPlan}
                size="sm"
                className="movieflow-button movieflow-gradient-bg movieflow-gradient-hover movieflow-gradient-disabled backdrop-blur-sm"
              >
                {isExecutingPlan ? "Executing..." : "One-Click Edit"}
              </Button>
              
              <Button
                onClick={clearAIData}
                variant="outline"
                size="sm"
              >
                Regenerate
              </Button>
            </div>

            {/* Progress display */}
            {isExecutingPlan && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Execution Progress</span>
                  <span className="text-sm">{Math.round(executionProgress)}%</span>
                </div>
                <Progress value={executionProgress} className="h-2" />
              </div>
            )}

            {/* Clip list */}
            <div className="space-y-2">
              {currentEditingPlan?.timeline_clips.map((clip, index) => (
                <Card key={clip.sequence_clip_id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Clip {index + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        {clip.clip_duration_in_sequence}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewClip(index)}
                    >
                      {isPreviewMode && previewClipIndex === index ? "Stop" : "Preview"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progressive loading indicator */}
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
