// subtitle-integration demo page
// 此页面演示AI字幕集成功能
// 文件路径: app/demo/subtitle-integration/page.tsx
// Last updated: 2025/1/8

"use client";

import React, { useState } from 'react';
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
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from 'next/link';

import { generateAIEditingMockData } from "@/lib/ai-editing-mock-data";
import { 
  extractSubtitleDataFromAIEditing,
  validateSubtitleData
} from "@/lib/ai-subtitle-integration";
import { parseDialogueTrackToTextElements } from "@/lib/subtitle-parser";
import { AIEditingData, FinalizedDialogueTrack, DialogueSegment } from "@/types/timeline";

export default function SubtitleIntegrationDemo() {
  const [aiData, setAiData] = useState<AIEditingData | null>(null);
  const [subtitleData, setSubtitleData] = useState<FinalizedDialogueTrack | null>(null);
  const [textElements, setTextElements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载演示数据
  const loadDemoData = async () => {
    setIsLoading(true);
    try {
      // 生成mock数据
      const mockData = generateAIEditingMockData('demo-project');
      setAiData(mockData);
      
      // 提取字幕数据
      const subtitles = extractSubtitleDataFromAIEditing(mockData);
      setSubtitleData(subtitles);
      
      if (subtitles) {
        // 验证字幕数据
        const validation = validateSubtitleData(subtitles);
        if (validation.isValid) {
          // 生成文本元素
          const elements = parseDialogueTrackToTextElements(subtitles);
          setTextElements(elements);
          toast.success(`成功加载 ${elements.length} 个字幕元素`);
        } else {
          toast.error(`字幕数据验证失败: ${validation.errors.join(', ')}`);
        }
      } else {
        toast.warning('未找到字幕数据');
      }
    } catch (error) {
      console.error('Failed to load demo data:', error);
      toast.error('加载演示数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化时间显示
  const formatTime = (timeCode: string) => {
    return timeCode.replace(',', '.');
  };

  // 格式化持续时间
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toFixed(1);
    return `${minutes}:${seconds.padStart(4, '0')}`;
  };

  // 渲染字幕Preview项
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

  // 渲染文本元素项
  const renderTextElementItem = (element: any, index: number) => (
    <div key={index} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="default" className="text-xs bg-green-600">
          TextElement #{index + 1}
        </Badge>
        <div className="text-xs text-muted-foreground">
          {formatDuration(element.duration)}
        </div>
      </div>
      
      <p className="text-sm mb-2 leading-relaxed font-medium">{element.content}</p>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>开始时间: {element.startTime.toFixed(1)}s</div>
        <div>字体大小: {element.fontSize}px</div>
        <div>颜色: {element.color}</div>
        <div>对齐: {element.textAlign}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-4">
          <Link href="/demo">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回演示首页
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">AI字幕集成演示</h1>
            <p className="text-muted-foreground">演示从AI剪辑计划中提取和处理字幕数据的完整流程</p>
          </div>
        </div>

        {/* 加载按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              演示数据加载
            </CardTitle>
            <CardDescription>
              加载AI剪辑计划中的字幕数据并进行处理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadDemoData} 
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载演示数据...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  加载AI字幕演示数据
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 数据展示 */}
        {subtitleData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 原始字幕数据 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  原始字幕数据
                </CardTitle>
                <CardDescription>
                  从AI剪辑计划中提取的finalized_dialogue_track数据
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {subtitleData.final_dialogue_segments?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">对话Clip</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {subtitleData.final_srt_content ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-muted-foreground">SRT格式</div>
                  </div>
                </div>

                {/* 字幕Preview */}
                {subtitleData.final_dialogue_segments && subtitleData.final_dialogue_segments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">对话ClipPreview</h4>
                    <ScrollArea className="h-64 w-full">
                      <div className="space-y-2 pr-4">
                        {subtitleData.final_dialogue_segments.slice(0, 5).map((segment, index) => 
                          renderSubtitleItem(segment, index)
                        )}
                        {subtitleData.final_dialogue_segments.length > 5 && (
                          <div className="text-center text-sm text-muted-foreground py-2">
                            ... 还有 {subtitleData.final_dialogue_segments.length - 5} 个Clip
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 转换后的文本元素 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  转换后的文本元素
                </CardTitle>
                <CardDescription>
                  解析后可直接添加到时间线的TextElement对象
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {textElements.length}
                    </div>
                    <div className="text-sm text-muted-foreground">文本元素</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {textElements.reduce((total, el) => total + el.duration, 0).toFixed(1)}s
                    </div>
                    <div className="text-sm text-muted-foreground">总时长</div>
                  </div>
                </div>

                {/* 文本元素Preview */}
                {textElements.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">文本元素Preview</h4>
                    <ScrollArea className="h-64 w-full">
                      <div className="space-y-2 pr-4">
                        {textElements.slice(0, 5).map((element, index) => 
                          renderTextElementItem(element, index)
                        )}
                        {textElements.length > 5 && (
                          <div className="text-center text-sm text-muted-foreground py-2">
                            ... 还有 {textElements.length - 5} 个元素
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 功能说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              功能说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">数据流程</h4>
                <ol className="text-sm space-y-1 text-muted-foreground">
                  <li>1. 从AI剪辑计划中提取finalized_dialogue_track</li>
                  <li>2. 验证字幕数据的完整性和有效性</li>
                  <li>3. 解析对话Clip或SRT内容</li>
                  <li>4. 转换为TextElement对象</li>
                  <li>5. 应用默认样式和布局</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">支持的功能</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• SRT格式时间码解析</li>
                  <li>• 对话Clip数据处理</li>
                  <li>• 自动样式应用</li>
                  <li>• 时间轴重叠检测</li>
                  <li>• 批量字幕导入</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 空状态 */}
        {!subtitleData && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">点击上方按钮加载演示数据</p>
            <p className="text-sm">演示AI字幕集成的完整功能</p>
          </div>
        )}
      </div>
    </div>
  );
}
