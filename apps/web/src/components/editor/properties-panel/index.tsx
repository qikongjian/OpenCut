// index.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/properties-panel/index.tsx
// 最后更新: 2025/7/23

// index.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入项目模块
import { useAspectRatio } from "@/hooks/use-aspect-ratio";
// 导入本地模块
import { Label } from "../../ui/label";
// 导入本地模块
import { ScrollArea } from "../../ui/scroll-area";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { useMediaStore } from "@/stores/media-store";
// 导入本地模块
import { AudioProperties } from "./audio-properties";
// 导入本地模块
import { MediaProperties } from "./media-properties";
// 导入本地模块
import { TextProperties } from "./text-properties";
// 导入蒙板属性组件
import { MaskProperties } from "./mask-properties";
// 导入模块
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
// 导入项目模块
import { FPS_PRESETS } from "@/constants/timeline-constants";

// PropertiesPanel 函数
// 导出组件 - 可复用的 UI 组件
export function PropertiesPanel() {
// 常量定义 - 模块内部使用的固定值
  const { activeProject, updateProjectFps } = useProjectStore();
// 常量定义 - 模块内部使用的固定值
  const { getDisplayName, canvasSize } = useAspectRatio();
// 常量定义 - 模块内部使用的固定值
  const { selectedElements, tracks } = useTimelineStore();
// 常量定义 - 模块内部使用的固定值
  const { mediaItems } = useMediaStore();

// handleFpsChange 函数
  const handleFpsChange = (value: string) => {
// 常量定义 - 模块内部使用的固定值
    const fps = parseFloat(value);
    if (!isNaN(fps) && fps > 0) {
      updateProjectFps(fps);
    }
  };

// emptyView 函数
  const emptyView = (
    <div className="space-y-4 p-5">
      {/* Media Properties */}
      <div className="flex flex-col gap-3">
        <PropertyItem label="Name:" value={activeProject?.name || ""} />
        <PropertyItem label="Aspect ratio:" value={getDisplayName()} />
        <PropertyItem
          label="Resolution:"
          value={`${canvasSize.width} × ${canvasSize.height}`}
        />
        <div className="flex justify-between items-center">
          <Label className="text-xs text-muted-foreground">Frame rate:</Label>
          <Select
            value={(activeProject?.fps || 30).toString()}
            onValueChange={handleFpsChange}
          >
            <SelectTrigger className="w-32 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FPS_PRESETS.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <ScrollArea className="h-full bg-panel rounded-sm">
      {selectedElements.length > 0
        ? selectedElements.map(({ trackId, elementId }) => {
// 常量定义 - 模块内部使用的固定值
            const track = tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
            const element = track?.elements.find((e) => e.id === elementId);

            if (element?.type === "text") {
              return (
                <div key={elementId} className="space-y-6">
                  <TextProperties element={element} trackId={trackId} />
                  {/* 蒙板属性 */}
                  <MaskProperties element={element} trackId={trackId} />
                </div>
              );
            }
            if (element?.type === "media") {
// 常量定义 - 模块内部使用的固定值
              const mediaItem = mediaItems.find(
                (item) => item.id === element.mediaId
              );

              if (mediaItem?.type === "audio") {
                return (
                  <div key={elementId} className="space-y-6">
                    <AudioProperties element={element} />
                    {/* 蒙板属性 */}
                    <MaskProperties element={element} trackId={trackId} />
                  </div>
                );
              }

              return (
                <div key={elementId} className="space-y-6">
                  <MediaProperties element={element} />
                  {/* 蒙板属性 */}
                  <MaskProperties element={element} trackId={trackId} />
                </div>
              );
            }
            return null;
          })
        : emptyView}
    </ScrollArea>
  );
}

// PropertyItem 函数
function PropertyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <span className="text-xs text-right truncate w-40" title={value}>
        {value}
      </span>
    </div>
  );
}
