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
  SettingsIcon,
  Bot,
} from "lucide-react";
import { create } from "zustand";

export type Tab =
  | "ai-editing"
  | "media"
  | "sounds"
  | "text"
  | "stickers"
  | "effects"
  | "transitions"
  | "captions"
  | "filters"
  | "adjustment"
  | "settings";

export const tabs: { [key in Tab]: { icon: LucideIcon; label: string } } = {
  "ai-editing": {
    icon: Bot,
    label: "AI剪辑",
  },
  media: {
    icon: VideoIcon,
    label: "Media",
  },
  sounds: {
    icon: MusicIcon,
    label: "Sounds",
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
  settings: {
    icon: SettingsIcon,
    label: "Settings",
  },
};

interface MediaPanelStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const useMediaPanelStore = create<MediaPanelStore>((set) => ({
  activeTab: "ai-editing",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
