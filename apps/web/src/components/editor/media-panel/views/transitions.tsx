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
    description: "画面快速切至全黑并回到新画面的过渡效果",
    category: "popular",
    duration: 1.0,
    previewImage: "/webp/flashBlack.webp", // 闪黑预览图
    isPopular: true,
  },
  {
    id: "flash-white",
    name: "闪白",
    type: "flash",
    direction: "out",
    icon: <Zap className="h-4 w-4" />,
    description: "画面快速切至全白并回到新画面的过渡效果",
    category: "popular",
    duration: 1.0,
    previewImage: "/webp/fashWhite.webp", // 闪白预览图
    isPopular: true,
  },
  {
    id: "dissolve",
    name: "叠化",
    type: "dissolve",
    direction: "in",
    icon: <Sparkles className="h-4 w-4" />,
    description: "两个画面整体透明度平滑渐变的溶解效果",
    category: "popular",
    duration: 1.0,
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
            
            {/* 热门标识 - 使用系统主色调 */}
            {template.isPopular && (
              <div className="absolute top-0.5 left-0.5">
                <div className="w-2.5 h-2.5 bg-primary rounded-sm transform rotate-45 shadow-sm"></div>
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

  // 🚀 辅助函数：检查两个元素之间是否已经存在转场
  const hasExistingTransition = (fromElementId: string, toElementId: string) => {
    return tracks.some(track =>
      track.elements.some(element => {
        if (element.type === "transition") {
          const transitionElement = element as import("@/types/timeline").TransitionElement;
          return transitionElement.fromElementId === fromElementId &&
                 transitionElement.toElementId === toElementId;
        }
        return false;
      })
    );
  };

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

    // 🚀 修复：只检查选中的元素，不检查相邻元素
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

          // 🎯 检查两个元素是否适合添加转场图标
          const fromEnd = from.element!.startTime + (from.element!.duration - from.element!.trimStart - from.element!.trimEnd);
          const toStart = to.element!.startTime;
          const gap = toStart - fromEnd;

          // 转场图标适用于相邻或有间隙的元素（间隙不超过10秒）
          const isValidForTransition = gap <= 10.0 && gap >= -1.0; // 允许轻微重叠

          // 检查是否已经存在转场
          if (isValidForTransition && !hasExistingTransition(from.elementId, to.elementId)) {
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
    }

    // 🚀 移除：不再检查播放头位置和相邻元素的转场机会
    // 只根据用户选中的元素来添加转场

    return opportunities;
  };

  // 处理转场选择
  const handleTransitionSelect = (template: TransitionTemplate) => {
    const opportunities = findTransitionOpportunities();

    console.log(`🎬 尝试添加转场: ${template.name}`);
    console.log(`   找到 ${opportunities.length} 个转场机会`);
    console.log(`   当前选中元素数量: ${selectedElements.length}`);

    if (opportunities.length === 0) {
      toast.error("没有找到可添加转场的位置。请选择两个或更多媒体元素来添加转场。");
      return;
    }

    // 🚀 修复：只添加用户选中的转场
    let successCount = 0;
    opportunities.forEach((opportunity, index) => {
      console.log(`   机会 ${index + 1}: ${opportunity.fromElement.name} → ${opportunity.toElement.name}`);

      const transitionId = addTransitionBetweenElements(
        opportunity.fromTrackId,
        opportunity.fromElementId,
        opportunity.toTrackId,
        opportunity.toElementId,
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
        successCount++;
        console.log(`   ✅ 转场添加成功: ${transitionId}`);
      } else {
        console.log(`   ❌ 转场添加失败`);
      }
    });

    if (successCount > 0) {
      if (successCount === 1) {
        const opportunity = opportunities[0];
        const fromName = opportunity.fromElement.name || '视频1';
        const toName = opportunity.toElement.name || '视频2';
        toast.success(`已添加 ${template.name} 转场 (${fromName} → ${toName})`);
      } else {
        toast.success(`已添加 ${successCount} 个 ${template.name} 转场`);
      }
    } else {
      toast.error("添加转场失败");
    }
  };

  // 在指定位置添加转场
  const addTransitionAtOpportunity = (opportunity: any, template: TransitionTemplate) => {
    const transitionId = addTransitionBetweenElements(
      opportunity.fromTrackId,
      opportunity.fromElementId,
      opportunity.toTrackId,
      opportunity.toElementId,
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
      const fromName = opportunity.fromElement.name || '视频1';
      const toName = opportunity.toElement.name || '视频2';
      toast.success(`已添加 ${template.name} 转场 (${fromName} → ${toName})`);
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
            <div className="text-xs text-muted-foreground bg-muted/50 border border-border/50 p-2 rounded-md">
              💡 提示：选择两个或更多媒体元素来添加转场
            </div>
          )}

          {hasOpportunities && (
            <div className="text-xs text-primary bg-primary/10 border border-primary/20 p-2 rounded-md">
              ✅ 发现 {transitionOpportunities.length} 个可添加转场的位置（基于选中的元素）
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
