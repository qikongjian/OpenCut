// transitions.tsx - 转场视图组件
// 此文件包含 转场视图组件 的相关代码
// 文件路径: components/editor/media-panel/views/transitions.tsx
// 最后更新: 2025/7/23

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowUpDown, 
  ArrowLeftRight, 
  MoveHorizontal, 
  MoveVertical,
  Zap,
  Sparkles,
  Star
} from "lucide-react";
import { TransitionType, TransitionDirection } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { toast } from "sonner";
import { usePlaybackStore } from "@/stores/playback-store";

// 转场类型定义
interface TransitionTemplate {
  id: string;
  name: string;
  type: TransitionType;
  direction: TransitionDirection;
  icon: React.ReactNode;
  description: string;
  category: "basic" | "advanced" | "popular";
  duration: number; // 默认持续时间（秒）
  previewImage?: string; // 预览图片路径
  isPopular?: boolean; // 是否为热门转场
}

// 转场模板数据
const transitionTemplates: TransitionTemplate[] = [
  // 热门转场（参考图片设计）
  {
    id: "flash-black",
    name: "闪黑",
    type: "flash",
    direction: "in",
    icon: <Zap className="h-4 w-4" />,
    description: "快速闪黑过渡效果",
    category: "popular",
    duration: 0.3,
    previewImage: "/webp/flashBlack.webp", // 闪黑预览图
    isPopular: true,
  },
  {
    id: "flash-white",
    name: "闪白",
    type: "flash",
    direction: "out",
    icon: <Zap className="h-4 w-4" />,
    description: "快速闪白过渡效果",
    category: "popular",
    duration: 0.3,
    previewImage: "/webp/fashWhite.webp", // 闪白预览图
    isPopular: true,
  },
  {
    id: "dissolve",
    name: "叠化",
    type: "dissolve",
    direction: "in",
    icon: <Sparkles className="h-4 w-4" />,
    description: "像素级别的随机溶解效果",
    category: "popular",
    duration: 2.0,
    previewImage: "/webp/superimposition.webp",
    isPopular: true,
  },
  
  // 基础转场
  {
    id: "fade-in",
    name: "淡入",
    type: "fade",
    direction: "in",
    icon: <ArrowUpDown className="h-4 w-4" />,
    description: "从透明到不透明的平滑过渡",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "fade-out",
    name: "淡出",
    type: "fade",
    direction: "out",
    icon: <ArrowUpDown className="h-4 w-4" />,
    description: "从不透明到透明的平滑过渡",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "fade-cross",
    name: "交叉淡入淡出",
    type: "fade",
    direction: "in",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    description: "两个片段之间的平滑交叉过渡",
    category: "basic",
    duration: 1.5,
  },
  
  // 滑动类
  {
    id: "slide-right",
    name: "向右滑动",
    type: "slide",
    direction: "right",
    icon: <MoveHorizontal className="h-4 w-4" />,
    description: "新片段从左侧滑入，旧片段向右滑出",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "slide-up",
    name: "向上滑动",
    type: "slide",
    direction: "up",
    icon: <MoveVertical className="h-4 w-4" />,
    description: "新片段从下方滑入，旧片段向上滑出",
    category: "basic",
    duration: 1.0,
  },
  {
    id: "slide-down",
    name: "向下滑动",
    type: "slide",
    direction: "down",
    icon: <MoveVertical className="h-4 w-4" />,
    description: "新片段从上方滑入，旧片段向下滑出",
    category: "basic",
    duration: 1.0,
  },
  
  // 高级转场
  {
    id: "zoom-in",
    name: "放大",
    type: "zoom",
    direction: "in",
    icon: <Zap className="h-4 w-4" />,
    description: "新片段以放大效果进入",
    category: "advanced",
    duration: 1.5,
  },
  {
    id: "zoom-out",
    name: "缩小",
    type: "zoom",
    direction: "out",
    icon: <Zap className="h-4 w-4" />,
    description: "旧片段以缩小效果退出",
    category: "advanced",
    duration: 1.5,
  },
];

// 转场卡片组件
function TransitionCard({ template, onClick, disabled }: { template: TransitionTemplate; onClick: () => void; disabled?: boolean }) {
  return (
    <div 
      className={`transition-all duration-200 min-w-[100px] max-w-[120px] group flex-shrink-0 ${
        disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer hover:scale-105'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="p-1.5">
        <div className="flex flex-col items-center gap-1.5">
          {/* 预览图片 - 正方形圆角设计 */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shadow-sm">
            {template.previewImage ? (
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  {template.icon}
                </div>
              </div>
            )}
            
            {/* 热门标识 - 紫色钻石图标 */}
            {template.isPopular && (
              <div className="absolute top-0.5 left-0.5">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-sm transform rotate-45"></div>
              </div>
            )}
            
            {/* 时长标识 - 更简洁的设计 */}
            <div className="absolute bottom-0.5 right-0.5">
              <div className="bg-black/60 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                {template.duration}s
              </div>
            </div>
          </div>
          
          {/* 转场名称 - 简洁的中文标签 */}
          <div className="text-center w-full">
            <p className="text-xs font-medium text-foreground leading-tight">
              {template.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 转场视图组件
export function TransitionsView() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { tracks, selectedElements, addTransitionBetweenElements } = useTimelineStore();
  const { currentTime: playbackTime } = usePlaybackStore();

  // 获取热门转场
  const popularTemplates = transitionTemplates.filter(t => t.isPopular);

  // 智能检测可添加转场的位置
  const findTransitionOpportunities = () => {
    const opportunities: Array<{
      fromTrackId: string;
      fromElementId: string;
      toTrackId: string;
      toElementId: string;
      fromElement: any;
      toElement: any;
      type: 'selected' | 'playhead' | 'adjacent';
    }> = [];

    // 1. 检查选中的元素
    if (selectedElements.length >= 2) {
    const selectedMediaElements = selectedElements
      .map(sel => {
        const track = tracks.find(t => t.id === sel.trackId);
        const element = track?.elements.find(e => e.id === sel.elementId);
        return { track, element, trackId: sel.trackId, elementId: sel.elementId };
      })
      .filter(item => item.element && item.element.type === "media");

      if (selectedMediaElements.length >= 2) {
        // 按时间顺序排序元素
        selectedMediaElements.sort((a, b) => a.element!.startTime - b.element!.startTime);
        
        for (let i = 0; i < selectedMediaElements.length - 1; i++) {
          const from = selectedMediaElements[i];
          const to = selectedMediaElements[i + 1];
          
          opportunities.push({
            fromTrackId: from.trackId,
            fromElementId: from.elementId,
            toTrackId: to.trackId,
            toElementId: to.elementId,
            fromElement: from.element,
            toElement: to.element,
            type: 'selected'
          });
        }
      }
    }

    // 2. 检查播放头位置的相邻元素
    tracks.forEach(track => {
      if (track.type === "media") {
        const elements = track.elements.filter(e => e.type === "media");
        
        // 按时间排序
        elements.sort((a, b) => a.startTime - b.startTime);
        
        for (let i = 0; i < elements.length - 1; i++) {
          const fromElement = elements[i];
          const toElement = elements[i + 1];
          
          const fromEnd = fromElement.startTime + (fromElement.duration - fromElement.trimStart - fromElement.trimEnd);
          const toStart = toElement.startTime;
          
          // 检查播放头是否在两个元素之间
          if (playbackTime >= fromEnd - 0.5 && playbackTime <= toStart + 0.5) {
            opportunities.push({
              fromTrackId: track.id,
              fromElementId: fromElement.id,
              toTrackId: track.id,
              toElementId: toElement.id,
              fromElement,
              toElement,
              type: 'playhead'
            });
          }
        }
      }
    });

    // 3. 检查同一轨道上的相邻元素（未选中但相邻）
    tracks.forEach(track => {
      if (track.type === "media") {
        const elements = track.elements.filter(e => e.type === "media");
        elements.sort((a, b) => a.startTime - b.startTime);
        
        for (let i = 0; i < elements.length - 1; i++) {
          const fromElement = elements[i];
          const toElement = elements[i + 1];
          
                // 检查是否已经存在转场（现在转场在同一轨道上）
      const hasTransition = tracks.some(track => 
        track.elements.some(element => 
          element.type === "transition" &&
          element.fromElementId === fromElement.id &&
          element.toElementId === toElement.id
        )
      );
          
          if (!hasTransition) {
            opportunities.push({
              fromTrackId: track.id,
              fromElementId: fromElement.id,
              toTrackId: track.id,
              toElementId: toElement.id,
              fromElement,
              toElement,
              type: 'adjacent'
            });
          }
        }
      }
    });

    return opportunities;
  };

  // 处理转场选择
  const handleTransitionSelect = (template: TransitionTemplate) => {
    const opportunities = findTransitionOpportunities();
    
    if (opportunities.length === 0) {
      toast.error("没有找到可添加转场的位置。请选择两个媒体元素或将播放头放在两个视频之间。");
      return;
    }

    // 优先使用选中的元素，然后是播放头位置，最后是相邻元素
    const priorityOrder = ['selected', 'playhead', 'adjacent'];
    const bestOpportunity = opportunities.sort((a, b) => 
      priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
    )[0];

    // 添加转场
    const transitionId = addTransitionBetweenElements(
      bestOpportunity.fromTrackId,
      bestOpportunity.fromElementId,
      bestOpportunity.toTrackId,
      bestOpportunity.toElementId,
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
      const opportunityType = bestOpportunity.type === 'selected' ? '选中的元素' :
                            bestOpportunity.type === 'playhead' ? '播放头位置' : '相邻元素';
      toast.success(`已添加 ${template.name} 转场 (${opportunityType})`);
    } else {
      toast.error("添加转场失败");
    }
  };

  // 获取可用的转场机会数量
  const transitionOpportunities = findTransitionOpportunities();
  const hasOpportunities = transitionOpportunities.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* 搜索区域 */}
      <div className="p-3 border-b">
        <div className="flex flex-col gap-2">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索转场效果..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1.5 border rounded-md bg-background text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          
          {/* 转场状态提示 */}
          {!hasOpportunities && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              💡 提示：选择两个媒体元素或将播放头放在两个视频之间来添加转场
            </div>
          )}
          
          {hasOpportunities && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✅ 发现 {transitionOpportunities.length} 个可添加转场的位置
          </div>
          )}
        </div>
      </div>

      {/* 转场列表 - 只展示热门转场 */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <div className="flex items-center">
            <h3 className="text-base font-semibold">热门转场</h3>
        </div>
        
          <div className="flex gap-1 overflow-x-auto pb-2 px-1">
            {popularTemplates.map((template) => (
              <TransitionCard
                key={template.id}
                template={template}
                onClick={() => handleTransitionSelect(template)}
                disabled={!hasOpportunities}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
} 