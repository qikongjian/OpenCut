// effects.tsx - 视频编辑器组件
// 此文件包含蒙板和特效管理界面的相关代码
// 文件路径: components/editor/media-panel/views/effects.tsx
// 最后更新: 2025/1/8

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Square, 
  Circle, 
  Search, 
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MASK_TEMPLATES, createRectangleMask, createCircleMask } from "@/lib/mask-utils";
import { MaskConfig } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { toast } from "sonner";

// 蒙板模板卡片组件
interface MaskTemplateCardProps {
  template: typeof MASK_TEMPLATES[0];
  onClick: () => void;
  disabled?: boolean;
}

function MaskTemplateCard({ template, onClick, disabled = false }: MaskTemplateCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* 蒙板图标 */}
      <div className="text-2xl">{template.icon}</div>
      
      {/* 蒙板名称 */}
      <div className="text-xs font-medium text-center">{template.name}</div>
      
      {/* 蒙板描述 */}
      <div className="text-[10px] text-muted-foreground text-center">
        {template.description}
      </div>
      
      {/* 悬停效果 */}
      <div className="absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// 应用的蒙板项组件
interface AppliedMaskItemProps {
  mask: MaskConfig;
  elementId: string;
  trackId: string;
  onEdit: () => void;
  onRemove: () => void;
}

function AppliedMaskItem({ mask, elementId, trackId, onEdit, onRemove }: AppliedMaskItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
    // TODO: 实现蒙板可见性切换
    toast.info(`蒙板${isVisible ? '隐藏' : '显示'}`);
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
      {/* 蒙板类型图标 */}
      <div className="text-sm">
        {mask.shape === 'rectangle' ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      </div>
      
      {/* 蒙板信息 */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">
          {mask.shape === 'rectangle' ? '矩形蒙板' : '圆形蒙板'}
        </div>
        <div className="text-[10px] text-muted-foreground">
          透明度: {Math.round(mask.opacity * 100)}%
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleToggleVisibility}
        >
          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onEdit}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// 主要的Effects视图组件
export function EffectsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedElements, addMaskToElement, removeMaskFromElement } = useTimelineStore();
  const { pause } = usePlaybackStore();

  // 检查是否有选中的元素
  const hasSelectedElements = selectedElements.length > 0;
  const selectedElement = hasSelectedElements ? selectedElements[0] : null;

  // 过滤蒙板模板
  const filteredTemplates = MASK_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理蒙板模板选择
  const handleMaskTemplateSelect = (template: typeof MASK_TEMPLATES[0]) => {
    if (!selectedElement) {
      toast.error("请先选择一个时间轴元素");
      return;
    }

    try {
      // 暂停播放
      pause();
      
      // 添加蒙板到选中的元素
      addMaskToElement(selectedElement.trackId, selectedElement.elementId, template.config);
      
      toast.success(`已添加${template.name}`);
    } catch (error) {
      console.error("Failed to add mask:", error);
      toast.error("添加蒙板失败");
    }
  };

  // 处理蒙板编辑
  const handleMaskEdit = (mask: MaskConfig) => {
    // TODO: 打开蒙板编辑器
    toast.info("蒙板编辑功能即将推出");
  };

  // 处理蒙板删除
  const handleMaskRemove = (maskId: string) => {
    if (!selectedElement) return;

    try {
      removeMaskFromElement(selectedElement.trackId, selectedElement.elementId, maskId);
      toast.success("已删除蒙板");
    } catch (error) {
      console.error("Failed to remove mask:", error);
      toast.error("删除蒙板失败");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 搜索区域 */}
      <div className="p-3 border-b">
        <div className="flex flex-col gap-2">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索蒙板效果..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          
          {/* 选择状态提示 */}
          {!hasSelectedElements && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              💡 提示：选择时间轴上的元素来添加蒙板效果
            </div>
          )}
          
          {hasSelectedElements && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✅ 已选择元素，可以添加蒙板效果
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* 蒙板模板区域 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-semibold">基础蒙板</h3>
              <Badge variant="secondary" className="text-[10px]">
                {filteredTemplates.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {filteredTemplates.map((template) => (
                <MaskTemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleMaskTemplateSelect(template)}
                  disabled={!hasSelectedElements}
                />
              ))}
            </div>
          </div>

          {/* 已应用的蒙板 */}
          {hasSelectedElements && selectedElement && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">已应用的蒙板</h3>
                </div>
                
                {/* TODO: 从选中元素获取蒙板列表 */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground text-center py-4">
                    暂无应用的蒙板
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 即将推出的功能 */}
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">即将推出</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 opacity-50">
                <div className="text-lg">🌈</div>
                <div className="text-xs text-center text-muted-foreground">渐变蒙板</div>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 opacity-50">
                <div className="text-lg">✏️</div>
                <div className="text-xs text-center text-muted-foreground">自定义路径</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
