// text-properties.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/properties-panel/text-properties.tsx
// 最后更新: 2025/7/23

// text-properties.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { Textarea } from "@/components/ui/textarea";
// 导入项目模块
import { FontPicker } from "@/components/ui/font-picker";
// 导入项目模块
import { FontFamily } from "@/constants/font-constants";
// 导入项目模块
import { TextElement } from "@/types/timeline";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { Slider } from "@/components/ui/slider";
// 导入项目模块
import { Input } from "@/components/ui/input";
// 导入项目模块
import { Label } from "@/components/ui/label";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入图标
import { Palette, Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
// 导入模块
import {
  PropertyItem,
  PropertyItemLabel,
  PropertyItemValue,
} from "./property-item";

// TextProperties 函数
// 导出组件 - 可复用的 UI 组件
export function TextProperties({
  element,
  trackId,
}: {
  element: TextElement;
  trackId: string;
}) {
// 常量定义 - 模块内部使用的固定值
  const { updateTextElement } = useTimelineStore();

  return (
    <div className="space-y-6 p-5">
      <Textarea
        placeholder="Name"
        defaultValue={element.content}
        className="min-h-[4.5rem] resize-none bg-background/50"
        onChange={(e) =>
          updateTextElement(trackId, element.id, { content: e.target.value })
        }
      />
      <PropertyItem direction="row">
        <PropertyItemLabel>Font</PropertyItemLabel>
        <PropertyItemValue>
          <FontPicker
            defaultValue={element.fontFamily}
            onValueChange={(value: FontFamily) =>
              updateTextElement(trackId, element.id, { fontFamily: value })
            }
          />
        </PropertyItemValue>
      </PropertyItem>
      <PropertyItem direction="column">
        <PropertyItemLabel>Font size</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              defaultValue={[element.fontSize]}
              min={8}
              max={300}
              step={1}
              onValueChange={([value]) =>
                updateTextElement(trackId, element.id, { fontSize: value })
              }
              className="w-full"
            />
            <Input
              type="number"
              value={element.fontSize}
              onChange={(e) =>
                updateTextElement(trackId, element.id, {
                  fontSize: parseInt(e.target.value),
                })
              }
              className="w-12 !text-xs h-7 rounded-sm text-center
               [appearance:textfield]
               [&::-webkit-outer-spin-button]:appearance-none
               [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* 🎨 颜色控制 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          颜色设置
        </Label>

        {/* 文字颜色 */}
        <PropertyItem direction="row">
          <PropertyItemLabel>文字颜色</PropertyItemLabel>
          <PropertyItemValue>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={element.color}
                onChange={(e) =>
                  updateTextElement(trackId, element.id, { color: e.target.value })
                }
                className="w-12 h-8 p-1 border rounded cursor-pointer"
              />
              <Input
                type="text"
                value={element.color}
                onChange={(e) =>
                  updateTextElement(trackId, element.id, { color: e.target.value })
                }
                className="flex-1 h-8 text-xs"
                placeholder="#ffffff"
              />
            </div>
          </PropertyItemValue>
        </PropertyItem>

        {/* 背景颜色 */}
        <PropertyItem direction="row">
          <PropertyItemLabel>背景颜色</PropertyItemLabel>
          <PropertyItemValue>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={element.backgroundColor === 'transparent' ? '#000000' : element.backgroundColor}
                onChange={(e) =>
                  updateTextElement(trackId, element.id, { backgroundColor: e.target.value })
                }
                className="w-12 h-8 p-1 border rounded cursor-pointer"
              />
              <Input
                type="text"
                value={element.backgroundColor}
                onChange={(e) =>
                  updateTextElement(trackId, element.id, { backgroundColor: e.target.value })
                }
                className="flex-1 h-8 text-xs"
                placeholder="transparent"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateTextElement(trackId, element.id, { backgroundColor: 'transparent' })
                }
                className="h-8 px-2 text-xs"
              >
                透明
              </Button>
            </div>
          </PropertyItemValue>
        </PropertyItem>

        {/* 快速颜色预设 */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">快速颜色</Label>
          <div className="grid grid-cols-8 gap-1">
            {[
              '#ffffff', '#000000', '#ff0000', '#00ff00',
              '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
              '#ffa500', '#800080', '#ffc0cb', '#a52a2a',
              '#808080', '#008000', '#000080', '#800000'
            ].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() =>
                  updateTextElement(trackId, element.id, { color })
                }
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 📝 文字样式 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Type className="w-4 h-4" />
          文字样式
        </Label>

        {/* 对齐方式 */}
        <PropertyItem direction="row">
          <PropertyItemLabel>对齐</PropertyItemLabel>
          <PropertyItemValue>
            <div className="flex gap-1">
              {[
                { value: 'left', icon: AlignLeft, label: '左对齐' },
                { value: 'center', icon: AlignCenter, label: '居中' },
                { value: 'right', icon: AlignRight, label: '右对齐' }
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={element.textAlign === value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateTextElement(trackId, element.id, { textAlign: value as any })
                  }
                  className="h-8 px-2"
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </PropertyItemValue>
        </PropertyItem>

        {/* 字体样式 */}
        <PropertyItem direction="row">
          <PropertyItemLabel>样式</PropertyItemLabel>
          <PropertyItemValue>
            <div className="flex gap-1">
              <Button
                variant={element.fontWeight === 'bold' ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  updateTextElement(trackId, element.id, {
                    fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold'
                  })
                }
                className="h-8 px-3 font-bold"
              >
                B
              </Button>
              <Button
                variant={element.fontStyle === 'italic' ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  updateTextElement(trackId, element.id, {
                    fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic'
                  })
                }
                className="h-8 px-3 italic"
              >
                I
              </Button>
              <Button
                variant={element.textDecoration === 'underline' ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  updateTextElement(trackId, element.id, {
                    textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline'
                  })
                }
                className="h-8 px-3 underline"
              >
                U
              </Button>
            </div>
          </PropertyItemValue>
        </PropertyItem>

        {/* 透明度 */}
        <PropertyItem direction="column">
          <PropertyItemLabel>透明度: {Math.round(element.opacity * 100)}%</PropertyItemLabel>
          <PropertyItemValue>
            <Slider
              value={[element.opacity * 100]}
              onValueChange={([value]) =>
                updateTextElement(trackId, element.id, { opacity: value / 100 })
              }
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </PropertyItemValue>
        </PropertyItem>
      </div>
    </div>
  );
}
