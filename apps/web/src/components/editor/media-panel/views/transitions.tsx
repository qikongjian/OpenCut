// transitions.tsx - 转场视图组件
// 此文件包含 转场视图组件 的相关代码
// 文件路径: components/editor/media-panel/views/transitions.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowUpDown, 
  ArrowLeftRight, 
  MoveHorizontal, 
  MoveVertical,
  Zap,
  Sparkles
} from "lucide-react";
import { TransitionType, TransitionDirection } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { toast } from "sonner";

// 转场类型定义
interface TransitionTemplate {
  id: string;
  name: string;
  type: TransitionType;
  direction: TransitionDirection;
  icon: React.ReactNode;
  description: string;
  category: "basic" | "advanced";
  duration: number; // 默认持续时间（秒）
}

// 基础转场模板
const transitionTemplates: TransitionTemplate[] = [
  // 淡入淡出类
  {
    id: "fade-in",
    name: "淡入",
    type: "fade",
    direction: "in",
    icon: <ArrowUpDown className="h-6 w-6" />,
    description: "从透明到不透明的平滑过渡",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "fade-out",
    name: "淡出",
    type: "fade",
    direction: "out",
    icon: <ArrowUpDown className="h-6 w-6" />,
    description: "从不透明到透明的平滑过渡",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "fade-cross",
    name: "交叉淡入淡出",
    type: "fade",
    direction: "in",
    icon: <ArrowLeftRight className="h-6 w-6" />,
    description: "两个片段之间的平滑交叉过渡",
    category: "basic",
    duration: 1.5,
  },
  
  // 滑动类
  {
    id: "slide-left",
    name: "向左滑动",
    type: "slide",
    direction: "left",
    icon: <MoveHorizontal className="h-6 w-6" />,
    description: "新片段从右侧滑入，旧片段向左滑出",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "slide-right",
    name: "向右滑动",
    type: "slide",
    direction: "right",
    icon: <MoveHorizontal className="h-6 w-6" />,
    description: "新片段从左侧滑入，旧片段向右滑出",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "slide-up",
    name: "向上滑动",
    type: "slide",
    direction: "up",
    icon: <MoveVertical className="h-6 w-6" />,
    description: "新片段从下方滑入，旧片段向上滑出",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "slide-down",
    name: "向下滑动",
    type: "slide",
    direction: "down",
    icon: <MoveVertical className="h-6 w-6" />,
    description: "新片段从上方滑入，旧片段向下滑出",
    category: "basic",
    duration: 1.0,
  },
  
  // 高级转场（为未来扩展预留）
  {
    id: "zoom-in",
    name: "放大",
    type: "zoom",
    direction: "in",
    icon: <Zap className="h-6 w-6" />,
    description: "新片段以放大效果进入",
    category: "advanced",
    duration: 1.5,
  },
  {
    id: "zoom-out",
    name: "缩小",
    type: "zoom",
    direction: "out",
    icon: <Zap className="h-6 w-6" />,
    description: "旧片段以缩小效果退出",
    category: "advanced",
    duration: 1.5,
  },
  {
    id: "dissolve",
    name: "溶解",
    type: "dissolve",
    direction: "in",
    icon: <Sparkles className="h-6 w-6" />,
    description: "像素级别的随机溶解效果",
    category: "advanced",
    duration: 2.0,
  },
];

// 转场视图组件
export function TransitionsView() {
  const [selectedCategory, setSelectedCategory] = React.useState<"basic" | "advanced">("basic");
  const [searchQuery, setSearchQuery] = React.useState("");
  const { tracks, selectedElements, addTransitionBetweenElements } = useTimelineStore();

  // 过滤转场模板
  const filteredTemplates = transitionTemplates.filter(template => {
    const matchesCategory = template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 处理转场选择
  const handleTransitionSelect = (template: TransitionTemplate) => {
    // 检查是否有选中的元素
    if (selectedElements.length < 2) {
      toast.error("请先选择两个媒体元素来添加转场");
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
      toast.error("请选择两个媒体元素来添加转场");
      return;
    }

    // 按时间顺序排序元素
    selectedMediaElements.sort((a, b) => a.element!.startTime - b.element!.startTime);

    const [firstElement, secondElement] = selectedMediaElements;

    // 添加转场
    const transitionId = addTransitionBetweenElements(
      firstElement.trackId,
      firstElement.elementId,
      secondElement.trackId,
      secondElement.elementId,
      template.type,
      {
        direction: template.direction,
        duration: template.duration,
        easing: "ease-in-out",
        intensity: 1.0,
        blur: 0.0,
      }
    );

    if (transitionId) {
      toast.success(`已添加 ${template.name} 转场`);
    } else {
      toast.error("添加转场失败");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 搜索和筛选区域 */}
      <div className="p-4 border-b">
        <div className="flex flex-col gap-3">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索转场效果..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          {/* 分类筛选 */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "basic" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("basic")}
            >
              基础转场
            </Button>
            <Button
              variant={selectedCategory === "advanced" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("advanced")}
            >
              高级转场
            </Button>
          </div>
        </div>
      </div>

      {/* 转场列表 */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleTransitionSelect(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      {template.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {template.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {template.duration}s
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.category === "basic" ? "基础" : "高级"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>没有找到匹配的转场效果</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 