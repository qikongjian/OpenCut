// store.ts - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/media-panel/store.ts
// 最后更新: 2025/7/23

// store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入模块
import {
  CaptionsIcon,
  ArrowLeftRightIcon,
  SparklesIcon,
  StickerIcon,
  MusicIcon,
  VideoIcon,
  BlendIcon,
  SlidersHorizontalIcon,
  LucideIcon,
  TypeIcon,
  Bot,
} from "lucide-react";
// 导入 Zustand 状态管理库
import { create } from "zustand";

// 类型定义 - 创建类型别名或联合类型
export type Tab =
  | "media"
  | "audio"
  | "text"
  | "stickers"
  | "effects"
  | "transitions"
  | "captions"
  | "filters"
  | "adjustment"
  | "ai-editing";

// 导出常量对象 - 包含多个相关常量的对象
export const tabs: { [key in Tab]: { icon: LucideIcon; label: string } } = {
  media: {
    icon: VideoIcon,
    label: "Media",
  },
  audio: {
    icon: MusicIcon,
    label: "Audio",
  },
  text: {
    icon: TypeIcon,
    label: "Text",
  },
  stickers: {
    icon: StickerIcon,
    label: "Stickers",
  },
  effects: {
    icon: SparklesIcon,
    label: "Effects",
  },
  transitions: {
    icon: ArrowLeftRightIcon,
    label: "Transitions",
  },
  captions: {
    icon: CaptionsIcon,
    label: "Captions",
  },
  filters: {
    icon: BlendIcon,
    label: "Filters",
  },
  adjustment: {
    icon: SlidersHorizontalIcon,
    label: "Adjustment",
  },
  "ai-editing": {
    icon: Bot,
    label: "AI剪辑",
  },
};

// MediaPanelStore 接口定义
interface MediaPanelStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

// 导出常量对象 - 包含多个相关常量的对象
export const useMediaPanelStore = create<MediaPanelStore>((set) => ({
  activeTab: "media",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
