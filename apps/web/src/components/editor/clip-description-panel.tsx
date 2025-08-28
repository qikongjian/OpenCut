"use client";

import { useEffect, useState } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useAIEditingStore } from "@/stores/ai-editing-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Clock, Film, Heart, Zap, Eye, Map, Camera } from "lucide-react";

interface ClipDescription {
  sequence_clip_id: string;
  core_intent_and_audience_effect: string;
  emotion_priority: string;
  story_priority: string;
  rhythm_priority: string;
  eyeline_priority: string;
  space_priority: string;
  lens_language_application: string;
  transition_reason?: string;
}

export function ClipDescriptionPanel() {
  const { currentTime } = usePlaybackStore();
  const { tracks } = useTimelineStore();
  const { currentEditingPlan } = useAIEditingStore();
  const [currentClipDescription, setCurrentClipDescription] = useState<ClipDescription | null>(null);

  useEffect(() => {
    if (!currentEditingPlan || !tracks.length) {
      setCurrentClipDescription(null);
      return;
    }

    // 查找当前时间对应的视频元素
    const currentTimeMs = currentTime * 1000;
    let currentElement = null;

    for (const track of tracks) {
      if (track.type === "media") {
        for (const element of track.elements) {
          const elementStartMs = element.startTime * 1000;
          const elementEndMs = elementStartMs + (element.duration * 1000);
          
          if (currentTimeMs >= elementStartMs && currentTimeMs < elementEndMs) {
            currentElement = element;
            break;
          }
        }
        if (currentElement) break;
      }
    }

    if (!currentElement) {
      setCurrentClipDescription(null);
      return;
    }

    // 根据元素名称或其他标识符找到对应的剪辑计划片段
    const matchingClip = currentEditingPlan.timeline_clips.find(clip => {
      // 尝试通过sequence_clip_id匹配
      return currentElement.name?.includes(clip.sequence_clip_id) ||
             currentElement.id === clip.sequence_clip_id;
    });

    if (matchingClip && matchingClip.clip_placement_reasons) {
      setCurrentClipDescription({
        sequence_clip_id: matchingClip.sequence_clip_id,
        core_intent_and_audience_effect: matchingClip.clip_placement_reasons.core_intent_and_audience_effect,
        emotion_priority: matchingClip.clip_placement_reasons.emotion_priority,
        story_priority: matchingClip.clip_placement_reasons.story_priority,
        rhythm_priority: matchingClip.clip_placement_reasons.rhythm_priority,
        eyeline_priority: matchingClip.clip_placement_reasons.eyeline_priority,
        space_priority: matchingClip.clip_placement_reasons.space_priority,
        lens_language_application: matchingClip.clip_placement_reasons.lens_language_application,
        transition_reason: matchingClip.transition_from_previous?.reason_for_transition,
      });
    } else {
      setCurrentClipDescription(null);
    }
  }, [currentTime, tracks, currentEditingPlan]);

  if (!currentClipDescription) {
    return (
      <div className="bg-background h-full p-4 flex flex-col items-center justify-center gap-3 rounded-sm">
        <Film className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
        <div className="flex flex-col gap-2 text-center">
          <p className="text-lg font-medium">No Clip Selected</p>
          <p className="text-sm text-muted-foreground text-balance">
            Play the timeline to see AI clip descriptions
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background rounded-sm">
      <div className="p-4 space-y-4">
        {/* 片段标题 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Current Clip</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentClipDescription.sequence_clip_id}
          </Badge>
        </div>

        <Separator />

        {/* 核心意图和观众效果 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <h4 className="font-medium text-sm">Core Intent & Audience Effect</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentClipDescription.core_intent_and_audience_effect}
          </p>
        </div>

        <Separator />

        {/* 情感优先级 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <h4 className="font-medium text-sm">Emotion Priority</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentClipDescription.emotion_priority}
          </p>
        </div>

        {/* 故事优先级 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-500" />
            <h4 className="font-medium text-sm">Story Priority</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentClipDescription.story_priority}
          </p>
        </div>

        {/* 节奏优先级 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h4 className="font-medium text-sm">Rhythm Priority</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentClipDescription.rhythm_priority}
          </p>
        </div>

        {/* 视线优先级 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-500" />
            <h4 className="font-medium text-sm">Eyeline Priority</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentClipDescription.eyeline_priority}
          </p>
        </div>

        {/* 空间优先级 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-purple-500" />
            <h4 className="font-medium text-sm">Space Priority</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentClipDescription.space_priority}
          </p>
        </div>

        {/* 镜头语言应用 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-orange-500" />
            <h4 className="font-medium text-sm">Lens Language Application</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentClipDescription.lens_language_application}
          </p>
        </div>

        {/* 转场原因（如果有） */}
        {currentClipDescription.transition_reason && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <h4 className="font-medium text-sm">Transition Reason</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentClipDescription.transition_reason}
              </p>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
