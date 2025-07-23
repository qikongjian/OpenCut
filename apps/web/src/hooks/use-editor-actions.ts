// use-editor-actions.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-editor-actions.ts
// 最后更新: 2025/7/23

// use-editor-actions.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

"use client";

// 导入 React 核心库
import { useEffect } from "react";
// 导入项目模块
import { useActionHandler } from "@/constants/actions";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import { usePlaybackStore } from "@/stores/playback-store";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入 Sonner 通知组件
import { toast } from "sonner";

// useEditorActions 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useEditorActions() {
// 常量定义 - 模块内部使用的固定值
  const {
    tracks,
    selectedElements,
    clearSelectedElements,
    setSelectedElements,
    removeElementFromTrack,
    splitElement,
    addElementToTrack,
    snappingEnabled,
    toggleSnapping,
    undo,
    redo,
  } = useTimelineStore();

// 常量定义 - 模块内部使用的固定值
  const { currentTime, duration, isPlaying, toggle, seek } = usePlaybackStore();
// 常量定义 - 模块内部使用的固定值
  const { activeProject } = useProjectStore();

  // Playback actions
  useActionHandler("toggle-play", () => {
    toggle();
  });

  useActionHandler("stop-playback", () => {
    if (isPlaying) {
      toggle();
    }
    seek(0);
  });

  useActionHandler("seek-forward", (args) => {
// 常量定义 - 模块内部使用的固定值
    const seconds = args?.seconds ?? 1;
    seek(Math.min(duration, currentTime + seconds));
  });

  useActionHandler("seek-backward", (args) => {
// 常量定义 - 模块内部使用的固定值
    const seconds = args?.seconds ?? 1;
    seek(Math.max(0, currentTime - seconds));
  });

  useActionHandler("frame-step-forward", () => {
// 常量定义 - 模块内部使用的固定值
    const projectFps = activeProject?.fps || 30;
    seek(Math.min(duration, currentTime + 1 / projectFps));
  });

  useActionHandler("frame-step-backward", () => {
// 常量定义 - 模块内部使用的固定值
    const projectFps = activeProject?.fps || 30;
    seek(Math.max(0, currentTime - 1 / projectFps));
  });

  useActionHandler("jump-forward", (args) => {
// 常量定义 - 模块内部使用的固定值
    const seconds = args?.seconds ?? 5;
    seek(Math.min(duration, currentTime + seconds));
  });

  useActionHandler("jump-backward", (args) => {
// 常量定义 - 模块内部使用的固定值
    const seconds = args?.seconds ?? 5;
    seek(Math.max(0, currentTime - seconds));
  });

  useActionHandler("goto-start", () => {
    seek(0);
  });

  useActionHandler("goto-end", () => {
    seek(duration);
  });

  // Timeline editing actions
  useActionHandler("split-element", () => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element to split");
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t: any) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((el: any) => el.id === elementId);

    if (element) {
// 常量定义 - 模块内部使用的固定值
      const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
      const effectiveEnd =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd);

      if (currentTime > effectiveStart && currentTime < effectiveEnd) {
        splitElement(trackId, elementId, currentTime);
      } else {
        toast.error("Playhead must be within selected element");
      }
    }
  });

  useActionHandler("delete-selected", () => {
    if (selectedElements.length === 0) {
      return;
    }
    selectedElements.forEach(
      ({ trackId, elementId }: { trackId: string; elementId: string }) => {
        removeElementFromTrack(trackId, elementId);
      }
    );
    clearSelectedElements();
  });

  useActionHandler("select-all", () => {
// 常量定义 - 模块内部使用的固定值
    const allElements = tracks.flatMap((track: any) =>
      track.elements.map((element: any) => ({
        trackId: track.id,
        elementId: element.id,
      }))
    );
    setSelectedElements(allElements);
  });

  useActionHandler("duplicate-selected", () => {
    if (selectedElements.length !== 1) {
      toast.error("Select exactly one element to duplicate");
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const { trackId, elementId } = selectedElements[0];
// 常量定义 - 模块内部使用的固定值
    const track = tracks.find((t: any) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
    const element = track?.elements.find((el: any) => el.id === elementId);

    if (element) {
// 常量定义 - 模块内部使用的固定值
      const newStartTime =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd) +
        0.1;
// 常量定义 - 模块内部使用的固定值
      const { id, ...elementWithoutId } = element;

      addElementToTrack(trackId, {
        ...elementWithoutId,
        startTime: newStartTime,
      });
    }
  });

  useActionHandler("toggle-snapping", () => {
    toggleSnapping();
  });

  // History actions
  useActionHandler("undo", () => {
    undo();
  });

  useActionHandler("redo", () => {
    redo();
  });
}
