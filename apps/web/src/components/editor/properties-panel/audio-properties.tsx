// audio-properties.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/properties-panel/audio-properties.tsx
// 最后更新: 2025/7/23

// audio-properties.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { MediaElement } from "@/types/timeline";

// AudioProperties 函数
// 导出组件 - 可复用的 UI 组件
export function AudioProperties({ element }: { element: MediaElement }) {
  return <div className="space-y-4 p-5">Audio properties</div>;
}