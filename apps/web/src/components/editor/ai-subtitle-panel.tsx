// ai-subtitle-panel.tsx - AI Subtitle Panel Component
// This component provides AI subtitle data import, preview and application functionality
// File path: components/editor/ai-subtitle-panel.tsx
// Last updated: 2025/1/8

"use client";

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Play, 
  Download, 
  FileText, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";

import { AIEditingData, FinalizedDialogueTrack, DialogueSegment } from "@/types/timeline";
import { generateAIEditingMockData } from "@/lib/ai-editing-mock-data";
import { 
  addAISubtitlesToTimeline, 
  extractSubtitleDataFromAIEditing,
  validateSubtitleData,
  createSubtitleTrackWithElements
} from "@/lib/ai-subtitle-integration";
import { parseDialogueTrackToTextElements } from "@/lib/subtitle-parser";

interface AISubtitlePanelProps {
  projectId?: string;
  onSubtitlesApplied?: (count: number) => void;
}

export function AISubtitlePanel({ projectId, onSubtitlesApplied }: AISubtitlePanelProps) {
  const [aiData, setAiData] = useState<AIEditingData | null>(null);
  const [subtitleData, setSubtitleData] = useState<FinalizedDialogueTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Load AI editing data
  const loadAIData = useCallback(() => {
    setIsLoading(true);
    try {
      // Use mock data, in actual project this should be fetched from API
      const mockData = generateAIEditingMockData(projectId || 'default');
      setAiData(mockData);

      const subtitles = extractSubtitleDataFromAIEditing(mockData);
      setSubtitleData(subtitles);

      if (subtitles) {
        toast.success('AI subtitle data loaded successfully');
      } else {
        toast.warning('AI subtitle data not found');
      }
    } catch (error) {
      console.error('Failed to load AI data:', error);
      toast.error('Failed to load AI data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Apply subtitles to timeline
  const applySubtitles = useCallback(async () => {
    if (!aiData || !subtitleData) {
      toast.error('No available subtitle data');
      return;
    }

    setIsApplying(true);
    try {
      // Validate subtitle data
      const validation = validateSubtitleData(subtitleData);
      if (!validation.isValid) {
        toast.error(`Subtitle data validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Parse subtitle data
      const textElements = parseDialogueTrackToTextElements(subtitleData);
      if (textElements.length === 0) {
        toast.error('No available subtitle content');
        return;
      }

      // Create subtitle track and add subtitles
      const trackId = createSubtitleTrackWithElements(textElements, 'AI Subtitles');

      if (trackId) {
        toast.success(`Successfully added ${textElements.length} subtitles to timeline`);
        onSubtitlesApplied?.(textElements.length);
      } else {
        toast.error('Failed to add subtitles to timeline');
      }
    } catch (error) {
      console.error('Failed to apply subtitles:', error);
      toast.error('Error occurred while applying subtitles');
    } finally {
      setIsApplying(false);
    }
  }, [aiData, subtitleData, onSubtitlesApplied]);

  // Format time display
  const formatTime = (timeCode: string) => {
    return timeCode.replace(',', '.');
  };

  // Render subtitle preview item
  const renderSubtitleItem = (segment: DialogueSegment, index: number) => (
    <div key={index} className="p-3 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          #{index + 1}
        </Badge>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span>{segment.speaker}</span>
        </div>
      </div>
      
      <p className="text-sm mb-2 leading-relaxed">{segment.transcript}</p>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatTime(segment.start_timecode)} → {formatTime(segment.end_timecode)}</span>
        </div>
        {segment.sequence_clip_id && (
          <Badge variant="secondary" className="text-xs">
            {segment.sequence_clip_id}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          AI Subtitle Integration
        </CardTitle>
        <CardDescription>
          Import and apply subtitle data from AI editing plan to timeline
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Load AI data button */}
        <div className="flex gap-2">
          <Button 
            onClick={loadAIData} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load AI Subtitle Data
              </>
            )}
          </Button>
        </div>

        {/* Subtitle data status */}
        {subtitleData && (
          <div className="space-y-4">
            <Separator />
            
            {/* Subtitle statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {subtitleData.final_dialogue_segments?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Subtitle Clips</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {subtitleData.final_srt_content ? '✓' : '✗'}
                </div>
                <div className="text-sm text-muted-foreground">SRT Format</div>
              </div>
            </div>

            {/* Subtitle preview */}
            {subtitleData.final_dialogue_segments && subtitleData.final_dialogue_segments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Subtitle Preview
                </h4>
                
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2 pr-4">
                    {subtitleData.final_dialogue_segments.map((segment, index) => 
                      renderSubtitleItem(segment, index)
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Apply subtitles button */}
            <div className="flex gap-2">
              <Button
                onClick={applySubtitles}
                disabled={isApplying}
                className="flex-1"
                size="lg"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Subtitles to Timeline
                  </>
                )}
              </Button>
            </div>

            {/* Usage instructions */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Usage Instructions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Subtitles will be automatically added to a new text track</li>
                  <li>• Timecodes will be automatically aligned according to AI editing plan</li>
                  <li>• You can further edit subtitle styles and positions in the timeline</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!subtitleData && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click the button above to load AI subtitle data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
