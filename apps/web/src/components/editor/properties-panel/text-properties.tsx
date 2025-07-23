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
    </div>
  );
}
