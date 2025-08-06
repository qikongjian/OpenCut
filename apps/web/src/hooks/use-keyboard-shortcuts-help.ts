// use-keyboard-shortcuts-help.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-keyboard-shortcuts-help.ts
// 最后更新: 2025/7/23

// use-keyboard-shortcuts-help.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

"use client";

// 导入 React 核心库
import { useMemo } from "react";
// 导入项目模块
import { useKeybindingsStore } from "@/stores/keybindings-store";
// 导入项目模块
import { Action } from "@/constants/actions";

// 接口定义 - 定义对象的结构和属性类型
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  action: Action;
  icon?: React.ReactNode;
}

// Map actions to their descriptions and categories
const actionDescriptions: Record<
  Action,
  { description: string; category: string }
> = {
  "toggle-play": { description: "Play/Pause", category: "Playback" },
  "stop-playback": { description: "Stop playback", category: "Playback" },
  "seek-forward": {
    description: "Seek forward 1 second",
    category: "Playback",
  },
  "seek-backward": {
    description: "Seek backward 1 second",
    category: "Playback",
  },
  "frame-step-forward": {
    description: "Frame step forward",
    category: "Navigation",
  },
  "frame-step-backward": {
    description: "Frame step backward",
    category: "Navigation",
  },
  "jump-forward": {
    description: "Jump forward 5 seconds",
    category: "Navigation",
  },
  "jump-backward": {
    description: "Jump backward 5 seconds",
    category: "Navigation",
  },
  "goto-start": { description: "Go to timeline start", category: "Navigation" },
  "goto-end": { description: "Go to timeline end", category: "Navigation" },
  "split-element": {
    description: "Split element at playhead",
    category: "Editing",
  },
  "delete-selected": {
    description: "Delete selected elements",
    category: "Editing",
  },
  "select-all": { description: "Select all elements", category: "Selection" },
  "duplicate-selected": {
    description: "Duplicate selected element",
    category: "Selection",
  },
  "toggle-snapping": { description: "Toggle snapping", category: "Editing" },
  undo: { description: "Undo", category: "History" },
  redo: { description: "Redo", category: "History" },
  "flip-horizontal": { description: "Flip selected elements horizontally", category: "Editing" },
  "add-transition-dissolve": { description: "Add dissolve transition", category: "Transitions" },
  "add-transition-flash-black": { description: "Add flash black transition", category: "Transitions" },
  "add-transition-flash-white": { description: "Add flash white transition", category: "Transitions" },
};

// Convert key binding format to display format
const formatKey = (key: string): string => {
  return key
    .replace("ctrl", "Cmd")
    .replace("alt", "Alt")
    .replace("shift", "Shift")
    .replace("left", "ArrowLeft")
    .replace("right", "ArrowRight")
    .replace("up", "ArrowUp")
    .replace("down", "ArrowDown")
    .replace("space", "Space")
    .replace("home", "Home")
    .replace("end", "End")
    .replace("delete", "Delete")
    .replace("backspace", "Backspace")
    .replace("-", "+");
};

// useKeyboardShortcutsHelp 自定义钩子
export const useKeyboardShortcutsHelp = () => {
// 常量定义 - 模块内部使用的固定值
  const { keybindings } = useKeybindingsStore();

// 值记忆化 - 缓存计算结果，优化性能
  const shortcuts = useMemo(() => {
// 常量定义 - 模块内部使用的固定值
    const result: KeyboardShortcut[] = [];

    // Group keybindings by action
    const actionToKeys: Record<Action, string[]> = {} as any;

    Object.entries(keybindings).forEach(([key, action]) => {
      if (action) {
        if (!actionToKeys[action]) {
          actionToKeys[action] = [];
        }
        actionToKeys[action].push(formatKey(key));
      }
    });

    // Convert to shortcuts format
    Object.entries(actionToKeys).forEach(([action, keys]) => {
// 常量定义 - 模块内部使用的固定值
      const actionInfo = actionDescriptions[action as Action];
      if (actionInfo) {
        result.push({
          id: action,
          keys,
          description: actionInfo.description,
          category: actionInfo.category,
          action: action as Action,
        });
      }
    });

    // Sort shortcuts by category first, then by description to ensure consistent ordering
    return result.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.description.localeCompare(b.description);
    });
  }, [keybindings]);

  return {
    shortcuts,
  };
};
