// test-transitions/page.tsx - 转场功能测试页面
// 此文件包含 转场功能测试页面 的相关代码
// 文件路径: app/test-transitions/page.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { toast } from "sonner";
import { 
  ArrowUpDown, 
  ArrowLeftRight, 
  MoveHorizontal, 
  MoveVertical,
  Zap,
  Sparkles
} from "lucide-react";

// 测试转场模板
const testTransitions = [
  {
    id: "fade-in",
    name: "淡入",
    type: "fade" as const,
    direction: "in" as const,
    icon: <ArrowUpDown className="h-6 w-6" />,
    description: "从透明到不透明的平滑过渡",
    duration: 1.0,
  },
  {
    id: "fade-out",
    name: "淡出",
    type: "fade" as const,
    direction: "out" as const,
    icon: <ArrowUpDown className="h-6 w-6" />,
    description: "从不透明到透明的平滑过渡",
    duration: 1.0,
  },
  {
    id: "slide-left",
    name: "向左滑动",
    type: "slide" as const,
    direction: "left" as const,
    icon: <MoveHorizontal className="h-6 w-6" />,
    description: "新片段从右侧滑入，旧片段向左滑出",
    duration: 1.0,
  },
  {
    id: "slide-right",
    name: "向右滑动",
    type: "slide" as const,
    direction: "right" as const,
    icon: <MoveHorizontal className="h-6 w-6" />,
    description: "新片段从左侧滑入，旧片段向右滑出",
    duration: 1.0,
  },
];

export default function TestTransitionsPage() {
  const { tracks, selectedElements, addTransitionBetweenElements, addMediaAtTime } = useTimelineStore();
  const { mediaItems, addMediaItem } = useMediaStore();

  // 创建测试媒体
  const createTestMedia = async () => {
    // 创建两个测试视频文件
    const video1 = new File(['test video 1'], 'test1.mp4', { type: 'video/mp4' });
    const video2 = new File(['test video 2'], 'test2.mp4', { type: 'video/mp4' });

    try {
      // 添加到媒体库
      await addMediaItem('test-project', {
        name: '测试视频 1',
        type: 'video',
        file: video1,
        url: URL.createObjectURL(video1),
        duration: 5,
        width: 1920,
        height: 1080,
        fps: 30,
      });

      await addMediaItem('test-project', {
        name: '测试视频 2',
        type: 'video',
        file: video2,
        url: URL.createObjectURL(video2),
        duration: 5,
        width: 1920,
        height: 1080,
        fps: 30,
      });

      toast.success("测试媒体创建成功");
    } catch (error) {
      toast.error("创建测试媒体失败");
    }
  };

  // 添加测试媒体到时间线
  const addTestMediaToTimeline = () => {
    const video1 = mediaItems.find(item => item.name === '测试视频 1');
    const video2 = mediaItems.find(item => item.name === '测试视频 2');

    if (video1 && video2) {
      addMediaAtTime(video1, 0);
      addMediaAtTime(video2, 6); // 在第一个视频结束后添加第二个
      toast.success("测试媒体已添加到时间线");
    } else {
      toast.error("请先创建测试媒体");
    }
  };

  // 测试转场功能
  const testTransition = (transition: typeof testTransitions[0]) => {
    if (selectedElements.length < 2) {
      toast.error("请先选择两个媒体元素");
      return;
    }

    // 获取选中的媒体元素
    const selectedMediaElements = selectedElements
      .map(sel => {
        const track = tracks.find(t => t.id === sel.trackId);
        const element = track?.elements.find(e => e.id === sel.elementId);
        return { track, element, trackId: sel.trackId, elementId: sel.elementId };
      })
      .filter(item => item.element && item.element.type === "media");

    if (selectedMediaElements.length < 2) {
      toast.error("请选择两个媒体元素");
      return;
    }

    // 按时间顺序排序
    selectedMediaElements.sort((a, b) => a.element!.startTime - b.element!.startTime);
    const [firstElement, secondElement] = selectedMediaElements;

    // 添加转场
    const transitionId = addTransitionBetweenElements(
      firstElement.trackId,
      firstElement.elementId,
      secondElement.trackId,
      secondElement.elementId,
      transition.type,
      {
        direction: transition.direction,
        duration: transition.duration,
        easing: "ease-in-out",
        intensity: 1.0,
        blur: 0.0,
      }
    );

    if (transitionId) {
      toast.success(`已添加 ${transition.name} 转场`);
    } else {
      toast.error("添加转场失败");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">转场功能测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 测试设置 */}
        <Card>
          <CardHeader>
            <CardTitle>测试设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createTestMedia} className="w-full">
              创建测试媒体
            </Button>
            <Button onClick={addTestMediaToTimeline} className="w-full">
              添加测试媒体到时间线
            </Button>
          </CardContent>
        </Card>

        {/* 转场测试 */}
        <Card>
          <CardHeader>
            <CardTitle>转场测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              选择两个媒体元素，然后点击转场效果进行测试
            </p>
            <div className="grid grid-cols-2 gap-2">
              {testTransitions.map((transition) => (
                <Button
                  key={transition.id}
                  variant="outline"
                  size="sm"
                  onClick={() => testTransition(transition)}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <div className="p-2 bg-primary/10 rounded-md">
                    {transition.icon}
                  </div>
                  <div className="text-xs font-medium">
                    {transition.name}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {transition.duration}s
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 状态信息 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>状态信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">媒体库项目:</span> {mediaItems.length}
            </div>
            <div>
              <span className="font-medium">时间线轨道:</span> {tracks.length}
            </div>
            <div>
              <span className="font-medium">选中元素:</span> {selectedElements.length}
            </div>
            <div>
              <span className="font-medium">转场轨道:</span> {tracks.filter(t => t.type === 'transition').length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>点击"创建测试媒体"按钮创建测试视频</li>
            <li>点击"添加测试媒体到时间线"将视频添加到时间线</li>
            <li>在时间线上选择两个媒体元素（按住Ctrl多选）</li>
            <li>点击转场效果按钮测试转场功能</li>
            <li>观察时间线上是否出现转场元素</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 