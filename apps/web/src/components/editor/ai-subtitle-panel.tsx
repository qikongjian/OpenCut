// ai-subtitle-panel.tsx - AI字幕面板组件
// 此组件提供AI字幕数据的导入、预览和应用功能
// 文件路径: components/editor/ai-subtitle-panel.tsx
// 最后更新: 2025/1/8

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

  // 加载AI剪辑数据
  const loadAIData = useCallback(() => {
    setIsLoading(true);
    try {
      // 使用mock数据，实际项目中这里应该从API获取
      const mockData = generateAIEditingMockData(projectId || 'default');
      setAiData(mockData);
      
      const subtitles = extractSubtitleDataFromAIEditing(mockData);
      setSubtitleData(subtitles);
      
      if (subtitles) {
        toast.success('AI字幕数据加载成功');
      } else {
        toast.warning('未找到AI字幕数据');
      }
    } catch (error) {
      console.error('Failed to load AI data:', error);
      toast.error('加载AI数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 应用字幕到时间线
  const applySubtitles = useCallback(async () => {
    if (!aiData || !subtitleData) {
      toast.error('没有可用的字幕数据');
      return;
    }

    setIsApplying(true);
    try {
      // 验证字幕数据
      const validation = validateSubtitleData(subtitleData);
      if (!validation.isValid) {
        toast.error(`字幕数据验证失败: ${validation.errors.join(', ')}`);
        return;
      }

      // 解析字幕数据
      const textElements = parseDialogueTrackToTextElements(subtitleData);
      if (textElements.length === 0) {
        toast.error('没有可用的字幕内容');
        return;
      }

      // 创建字幕轨道并添加字幕
      const trackId = createSubtitleTrackWithElements(textElements, 'AI字幕');
      
      if (trackId) {
        toast.success(`成功添加 ${textElements.length} 个字幕到时间线`);
        onSubtitlesApplied?.(textElements.length);
      } else {
        toast.error('添加字幕到时间线失败');
      }
    } catch (error) {
      console.error('Failed to apply subtitles:', error);
      toast.error('应用字幕时发生错误');
    } finally {
      setIsApplying(false);
    }
  }, [aiData, subtitleData, onSubtitlesApplied]);

  // 格式化时间显示
  const formatTime = (timeCode: string) => {
    return timeCode.replace(',', '.');
  };

  // 渲染字幕预览项
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
          AI字幕集成
        </CardTitle>
        <CardDescription>
          从AI剪辑计划中导入和应用字幕数据到时间线
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 加载AI数据按钮 */}
        <div className="flex gap-2">
          <Button 
            onClick={loadAIData} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                加载AI字幕数据
              </>
            )}
          </Button>
        </div>

        {/* 字幕数据状态 */}
        {subtitleData && (
          <div className="space-y-4">
            <Separator />
            
            {/* 字幕统计信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {subtitleData.final_dialogue_segments?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">字幕片段</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {subtitleData.final_srt_content ? '✓' : '✗'}
                </div>
                <div className="text-sm text-muted-foreground">SRT格式</div>
              </div>
            </div>

            {/* 字幕预览 */}
            {subtitleData.final_dialogue_segments && subtitleData.final_dialogue_segments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  字幕预览
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

            {/* 应用字幕按钮 */}
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
                    应用中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    应用字幕到时间线
                  </>
                )}
              </Button>
            </div>

            {/* 提示信息 */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">使用说明：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 字幕将自动添加到新的文本轨道</li>
                  <li>• 时间码将根据AI剪辑计划自动对齐</li>
                  <li>• 可以在时间线中进一步编辑字幕样式和位置</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!subtitleData && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>点击上方按钮加载AI字幕数据</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
