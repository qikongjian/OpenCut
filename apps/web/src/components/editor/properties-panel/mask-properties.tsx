// mask-properties.tsx - 蒙板属性编辑组件
// 此文件包含蒙板属性编辑界面的相关代码
// 文件路径: components/editor/properties-panel/mask-properties.tsx
// 最后更新: 2025/1/8

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PropertyItem,
  PropertyItemLabel,
  PropertyItemValue,
} from "./property-item";
import { 
  Square, 
  Circle, 
  RotateCcw, 
  Trash2, 
  Eye, 
  EyeOff,
  Plus,
  Settings
} from "lucide-react";
import { MaskConfig, TimelineElement } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { createRectangleMask, createCircleMask } from "@/lib/mask-utils";
import { toast } from "sonner";

interface MaskPropertiesProps {
  element: TimelineElement;
  trackId: string;
}

// 单个蒙板编辑器组件
interface MaskEditorProps {
  mask: MaskConfig;
  onUpdate: (updates: Partial<MaskConfig>) => void;
  onRemove: () => void;
}

function MaskEditor({ mask, onUpdate, onRemove }: MaskEditorProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
    // TODO: 实现蒙板可见性切换
    toast.info(`蒙板${isVisible ? '隐藏' : '显示'}`);
  };

  return (
    <AccordionItem value={mask.id} className="border rounded-lg">
      <AccordionTrigger className="px-3 py-2 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          {/* 蒙板类型图标 */}
          {mask.shape === 'rectangle' ? (
            <Square className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
          
          {/* 蒙板名称 */}
          <span className="text-sm font-medium">
            {mask.shape === 'rectangle' ? '矩形蒙板' : '圆形蒙板'}
          </span>
          
          {/* 状态标识 */}
          <Badge variant="secondary" className="text-[10px]">
            {Math.round(mask.opacity * 100)}%
          </Badge>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-3 pb-3">
        <div className="space-y-4">
          {/* 基础属性 */}
          <div className="space-y-3">
            {/* 蒙板类型 */}
            <PropertyItem direction="row">
              <PropertyItemLabel>类型</PropertyItemLabel>
              <PropertyItemValue>
                <Select
                  value={mask.shape}
                  onValueChange={(value) => onUpdate({ shape: value as any })}
                >
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">矩形</SelectItem>
                    <SelectItem value="circle">圆形</SelectItem>
                  </SelectContent>
                </Select>
              </PropertyItemValue>
            </PropertyItem>

            {/* 位置 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">位置</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">X</Label>
                  <Input
                    type="number"
                    value={Math.round(mask.x * 100)}
                    onChange={(e) => onUpdate({ x: Number(e.target.value) / 100 })}
                    className="h-7 text-xs"
                    min="-100"
                    max="100"
                    step="1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(mask.y * 100)}
                    onChange={(e) => onUpdate({ y: Number(e.target.value) / 100 })}
                    className="h-7 text-xs"
                    min="-100"
                    max="100"
                    step="1"
                  />
                </div>
              </div>
            </div>

            {/* 尺寸 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">尺寸</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">宽度</Label>
                  <Input
                    type="number"
                    value={Math.round(mask.width * 100)}
                    onChange={(e) => onUpdate({ width: Number(e.target.value) / 100 })}
                    className="h-7 text-xs"
                    min="1"
                    max="200"
                    step="1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">高度</Label>
                  <Input
                    type="number"
                    value={Math.round(mask.height * 100)}
                    onChange={(e) => onUpdate({ height: Number(e.target.value) / 100 })}
                    className="h-7 text-xs"
                    min="1"
                    max="200"
                    step="1"
                  />
                </div>
              </div>
            </div>

            {/* 旋转 */}
            <PropertyItem direction="column">
              <PropertyItemLabel>旋转: {mask.rotation}°</PropertyItemLabel>
              <PropertyItemValue>
                <Slider
                  value={[mask.rotation]}
                  onValueChange={([value]) => onUpdate({ rotation: value })}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </PropertyItemValue>
            </PropertyItem>

            {/* 透明度 */}
            <PropertyItem direction="column">
              <PropertyItemLabel>透明度: {Math.round(mask.opacity * 100)}%</PropertyItemLabel>
              <PropertyItemValue>
                <Slider
                  value={[mask.opacity * 100]}
                  onValueChange={([value]) => onUpdate({ opacity: value / 100 })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </PropertyItemValue>
            </PropertyItem>

            {/* 羽化 */}
            <PropertyItem direction="column">
              <PropertyItemLabel>羽化: {mask.feather}px</PropertyItemLabel>
              <PropertyItemValue>
                <Slider
                  value={[mask.feather]}
                  onValueChange={([value]) => onUpdate({ feather: value })}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </PropertyItemValue>
            </PropertyItem>

            {/* 反转蒙板 */}
            <PropertyItem direction="row">
              <PropertyItemLabel>反转蒙板</PropertyItemLabel>
              <PropertyItemValue>
                <Switch
                  checked={mask.invert}
                  onCheckedChange={(checked) => onUpdate({ invert: checked })}
                />
              </PropertyItemValue>
            </PropertyItem>
          </div>

          <Separator />

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleVisibility}
              className="flex-1"
            >
              {isVisible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              {isVisible ? '隐藏' : '显示'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate(mask.shape === 'rectangle' ? createRectangleMask() : createCircleMask())}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// 主要的蒙板属性组件
export function MaskProperties({ element, trackId }: MaskPropertiesProps) {
  const { addMaskToElement, removeMaskFromElement, updateElementMask } = useTimelineStore();
  
  const masks = element.masks || [];

  const handleAddMask = (type: 'rectangle' | 'circle') => {
    const newMask = type === 'rectangle' ? createRectangleMask() : createCircleMask();
    addMaskToElement(trackId, element.id, newMask);
  };

  const handleUpdateMask = (maskId: string, updates: Partial<MaskConfig>) => {
    updateElementMask(trackId, element.id, maskId, updates);
  };

  const handleRemoveMask = (maskId: string) => {
    removeMaskFromElement(trackId, element.id, maskId);
  };

  return (
    <div className="space-y-4">
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <h3 className="text-sm font-semibold">蒙板设置</h3>
          <Badge variant="secondary" className="text-[10px]">
            {masks.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddMask('rectangle')}
            className="h-7 px-2"
          >
            <Square className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddMask('circle')}
            className="h-7 px-2"
          >
            <Circle className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* 蒙板列表 */}
      {masks.length > 0 ? (
        <ScrollArea className="max-h-96">
          <Accordion type="multiple" className="space-y-2">
            {masks.map((mask) => (
              <MaskEditor
                key={mask.id}
                mask={mask}
                onUpdate={(updates) => handleUpdateMask(mask.id, updates)}
                onRemove={() => handleRemoveMask(mask.id)}
              />
            ))}
          </Accordion>
        </ScrollArea>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <div className="text-2xl mb-2">🎭</div>
          <div className="text-sm">暂无蒙板</div>
          <div className="text-xs mt-1">点击上方按钮添加蒙板</div>
        </div>
      )}
    </div>
  );
}
