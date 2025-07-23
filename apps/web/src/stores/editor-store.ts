// editor-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/editor-store.ts
// 最后更新: 2025/7/23

// 导入 Zustand 状态管理库的创建函数
import { create } from "zustand";
// 导入编辑器相关的类型定义
import { CanvasSize, CanvasPreset } from "@/types/editor";

// 画布模式类型定义
type CanvasMode = "preset" | "original" | "custom";

// 编辑器状态接口定义
interface EditorState {
  // 加载状态
  isInitializing: boolean; // 应用是否正在初始化
  isPanelsReady: boolean; // 面板是否准备就绪

  // 画布/项目设置
  canvasSize: CanvasSize; // 当前画布尺寸
  canvasMode: CanvasMode; // 当前画布模式
  canvasPresets: CanvasPreset[]; // 预设画布尺寸列表

  // 操作方法
  setInitializing: (loading: boolean) => void; // 设置初始化状态
  setPanelsReady: (ready: boolean) => void; // 设置面板就绪状态
  initializeApp: () => Promise<void>; // 初始化应用
  setCanvasSize: (size: CanvasSize) => void; // 设置画布尺寸
  setCanvasSizeToOriginal: (aspectRatio: number) => void; // 根据原始宽高比设置画布尺寸
  setCanvasSizeFromAspectRatio: (aspectRatio: number) => void; // 根据宽高比设置画布尺寸
}

// 默认画布预设尺寸列表
const DEFAULT_CANVAS_PRESETS: CanvasPreset[] = [
  { name: "16:9", width: 1920, height: 1080 }, // 横屏高清
  { name: "9:16", width: 1080, height: 1920 }, // 竖屏手机
  { name: "1:1", width: 1080, height: 1080 }, // 正方形
  { name: "4:3", width: 1440, height: 1080 }, // 传统比例
];

// 辅助函数：根据宽高比找到最佳匹配的画布预设
const findBestCanvasPreset = (aspectRatio: number): CanvasSize => {
  // 计算每个预设的宽高比，找到最接近的匹配
  let bestMatch = DEFAULT_CANVAS_PRESETS[0]; // 默认使用16:9高清
  let smallestDifference = Math.abs(
    aspectRatio - bestMatch.width / bestMatch.height
  );

  // 遍历所有预设，找到最接近的宽高比
  for (const preset of DEFAULT_CANVAS_PRESETS) {
// 常量定义 - 模块内部使用的固定值
    const presetAspectRatio = preset.width / preset.height;
// 常量定义 - 模块内部使用的固定值
    const difference = Math.abs(aspectRatio - presetAspectRatio);

    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestMatch = preset;
    }
  }

  // 如果差异仍然很大（> 0.1），根据媒体宽高比创建自定义尺寸
  const bestAspectRatio = bestMatch.width / bestMatch.height;
  if (Math.abs(aspectRatio - bestAspectRatio) > 0.1) {
    // 根据宽高比创建自定义尺寸
    if (aspectRatio > 1) {
      // 横屏 - 使用1920宽度
      return { width: 1920, height: Math.round(1920 / aspectRatio) };
    } else {
      // 竖屏或正方形 - 使用1080高度
      return { width: Math.round(1080 * aspectRatio), height: 1080 };
    }
  }

  return { width: bestMatch.width, height: bestMatch.height };
};

// 创建编辑器状态管理存储
export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  isInitializing: true, // 应用启动时正在初始化
  isPanelsReady: false, // 面板尚未准备就绪
  canvasSize: { width: 1920, height: 1080 }, // 默认16:9高清画布
  canvasMode: "preset" as CanvasMode, // 默认使用预设模式
  canvasPresets: DEFAULT_CANVAS_PRESETS, // 预设画布尺寸列表

  // 操作方法实现
  setInitializing: (loading) => {
    // 设置应用初始化状态
    // 设置状态 - 更新状态值

    set({ isInitializing: loading });
  },

  setPanelsReady: (ready) => {
    // 设置面板就绪状态
    // 设置状态 - 更新状态值

    set({ isPanelsReady: ready });
  },

  initializeApp: async () => {
    // 初始化视频编辑器应用
    console.log("Initializing video editor...");
    // 设置状态 - 更新状态值

    set({ isInitializing: true, isPanelsReady: false });

    // 这里可以添加其他初始化逻辑，如加载用户设置、检查权限等
    // 设置状态 - 更新状态值

    set({ isPanelsReady: true, isInitializing: false });
    console.log("Video editor ready");
  },

  setCanvasSize: (size) => {
    // 直接设置画布尺寸，使用预设模式
    // 设置状态 - 更新状态值

    set({ canvasSize: size, canvasMode: "preset" });
  },

  setCanvasSizeToOriginal: (aspectRatio) => {
    // 根据原始媒体文件的宽高比设置画布尺寸
    const newCanvasSize = findBestCanvasPreset(aspectRatio);
    // 设置状态 - 更新状态值

    set({ canvasSize: newCanvasSize, canvasMode: "original" });
  },

  setCanvasSizeFromAspectRatio: (aspectRatio) => {
// 常量定义 - 模块内部使用的固定值
    const newCanvasSize = findBestCanvasPreset(aspectRatio);
    // 设置状态 - 更新状态值

    set({ canvasSize: newCanvasSize, canvasMode: "custom" });
  },
}));
