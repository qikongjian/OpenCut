// panel-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/panel-store.ts
// 最后更新: 2025/7/23

// panel-store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Zustand 状态管理库
import { create } from "zustand";
// 导入 Zustand 状态管理库
import { persist } from "zustand/middleware";

// 常量定义 - 模块内部使用的固定值
const DEFAULT_PANEL_SIZES = {
  toolsPanel: 45,
  previewPanel: 75,
  propertiesPanel: 20,
  mainContent: 70,
  timeline: 30,
} as const;

// PanelState 接口定义
interface PanelState {
  // Panel sizes as percentages
  toolsPanel: number;
  previewPanel: number;
  propertiesPanel: number;
  mainContent: number;
  timeline: number;

  // Actions
  setToolsPanel: (size: number) => void;
  setPreviewPanel: (size: number) => void;
  setPropertiesPanel: (size: number) => void;
  setMainContent: (size: number) => void;
  setTimeline: (size: number) => void;
}

// 导出常量对象 - 包含多个相关常量的对象
export const usePanelStore = create<PanelState>()(
  // 状态持久化 - 保存状态到本地存储

  persist(
    (set) => ({
      // Default sizes - optimized for responsiveness
      ...DEFAULT_PANEL_SIZES,

      // Actions
      setToolsPanel: (size) => set({ toolsPanel: size }),
      setPreviewPanel: (size) => set({ previewPanel: size }),
      setPropertiesPanel: (size) => set({ propertiesPanel: size }),
      setMainContent: (size) => set({ mainContent: size }),
      setTimeline: (size) => set({ timeline: size }),
    }),
    {
      name: "panel-sizes",
    }
  )
);
