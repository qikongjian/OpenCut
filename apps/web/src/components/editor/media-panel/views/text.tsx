// text.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/media-panel/views/text.tsx
// 最后更新: 2025/7/23

// text.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { DraggableMediaItem } from "@/components/ui/draggable-item";
// 导入项目模块
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { type TextElement } from "@/types/timeline";

let textData: TextElement = {
  id: "default-text",
  type: "text",
  name: "Default text",
  content: "Default text",
  fontSize: 48,
  fontFamily: "Arial",
  color: "#ffffff",
  backgroundColor: "transparent",
  textAlign: "center" as const,
  fontWeight: "normal" as const,
  fontStyle: "normal" as const,
  textDecoration: "none" as const,
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  duration: TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
  startTime: 0,
  trimStart: 0,
  trimEnd: 0,
};

// TextView 函数
// 导出组件 - 可复用的 UI 组件
export function TextView() {
  return (
    <div className="p-4">
      <DraggableMediaItem
        name="Default text"
        preview={
          <div className="flex items-center justify-center w-full h-full bg-accent rounded">
            <span className="text-xs select-none">Default text</span>
          </div>
        }
        dragData={{
          id: textData.id,
          type: textData.type,
          name: textData.name,
          content: textData.content,
        }}
        aspectRatio={1}
        onAddToTimeline={(currentTime) =>
          useTimelineStore.getState().addTextAtTime(textData, currentTime)
        }
        showLabel={false}
      />
    </div>
  );
}
