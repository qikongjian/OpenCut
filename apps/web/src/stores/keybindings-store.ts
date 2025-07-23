// keybindings-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/keybindings-store.ts
// 最后更新: 2025/7/23

// keybindings-store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

"use client";

// 导入 Zustand 状态管理库
import { create } from "zustand";
// 导入 Zustand 状态管理库
import { persist } from "zustand/middleware";
// 导入项目模块
import { ActionWithOptionalArgs } from "@/constants/actions";
// 导入项目模块
import { isAppleDevice, isDOMElement, isTypableElement } from "@/lib/utils";
// 导入项目模块
import { KeybindingConfig, ShortcutKey } from "@/types/keybinding";

// Default keybindings configuration
export const defaultKeybindings: KeybindingConfig = {
  space: "toggle-play",
  j: "seek-backward",
  k: "toggle-play",
  l: "seek-forward",
  left: "frame-step-backward",
  right: "frame-step-forward",
  "shift+left": "jump-backward",
  "shift+right": "jump-forward",
  home: "goto-start",
  end: "goto-end",
  s: "split-element",
  n: "toggle-snapping",
  "ctrl+a": "select-all",
  "ctrl+d": "duplicate-selected",
  "ctrl+z": "undo",
  "ctrl+shift+z": "redo",
  "ctrl+y": "redo",
  delete: "delete-selected",
  backspace: "delete-selected",
};

// 接口定义 - 定义对象的结构和属性类型
export interface KeybindingConflict {
  key: ShortcutKey;
  existingAction: ActionWithOptionalArgs;
  newAction: ActionWithOptionalArgs;
}

// KeybindingsState 接口定义
interface KeybindingsState {
  keybindings: KeybindingConfig;
  isCustomized: boolean;
  keybindingsEnabled: boolean;

  // Actions
  updateKeybinding: (key: ShortcutKey, action: ActionWithOptionalArgs) => void;
  removeKeybinding: (key: ShortcutKey) => void;
  resetToDefaults: () => void;
  importKeybindings: (config: KeybindingConfig) => void;
  exportKeybindings: () => KeybindingConfig;
  enableKeybindings: () => void;
  disableKeybindings: () => void;

  // Validation
  validateKeybinding: (
    key: ShortcutKey,
    action: ActionWithOptionalArgs
  ) => KeybindingConflict | null;
  getKeybindingsForAction: (action: ActionWithOptionalArgs) => ShortcutKey[];

  // Utility
  getKeybindingString: (ev: KeyboardEvent) => ShortcutKey | null;
}

// 导出常量对象 - 包含多个相关常量的对象
export const useKeybindingsStore = create<KeybindingsState>()(
  // 状态持久化 - 保存状态到本地存储
  persist(
    (set, get) => ({
      keybindings: { ...defaultKeybindings },
      isCustomized: false,
      keybindingsEnabled: true,

      updateKeybinding: (key: ShortcutKey, action: ActionWithOptionalArgs) => {
        // 设置状态 - 更新状态值
        set((state) => {
// 常量定义 - 模块内部使用的固定值
          const newKeybindings = { ...state.keybindings };
          newKeybindings[key] = action;

          return {
            keybindings: newKeybindings,
            isCustomized: true,
          };
        });
      },

      removeKeybinding: (key: ShortcutKey) => {
        // 设置状态 - 更新状态值
        set((state) => {
// 常量定义 - 模块内部使用的固定值
          const newKeybindings = { ...state.keybindings };
          delete newKeybindings[key];

          return {
            keybindings: newKeybindings,
            isCustomized: true,
          };
        });
      },

      resetToDefaults: () => {
        // 设置状态 - 更新状态值
        set({
          keybindings: { ...defaultKeybindings },
          isCustomized: false,
        });
      },

      enableKeybindings: () => {
        // 设置状态 - 更新状态值
        set({ keybindingsEnabled: true });
      },

      disableKeybindings: () => {
        // 设置状态 - 更新状态值
        set({ keybindingsEnabled: false });
      },

      importKeybindings: (config: KeybindingConfig) => {
        // Validate all keys and actions
        for (const [key, action] of Object.entries(config)) {
          // Validate the key format
          if (typeof key !== "string" || key.length === 0) {
            throw new Error(`Invalid key format: ${key}`);
          }
        }
        // 设置状态 - 更新状态值
        set({
          keybindings: { ...config },
          isCustomized: true,
        });
      },

      exportKeybindings: () => {
        return get().keybindings;
      },

      validateKeybinding: (
        key: ShortcutKey,
        action: ActionWithOptionalArgs
      ) => {
// 常量定义 - 模块内部使用的固定值
        const { keybindings } = get();
// 常量定义 - 模块内部使用的固定值
        const existingAction = keybindings[key];

        if (existingAction && existingAction !== action) {
          return {
            key,
            existingAction,
            newAction: action,
          };
        }

        return null;
      },

      getKeybindingsForAction: (action: ActionWithOptionalArgs) => {
// 常量定义 - 模块内部使用的固定值
        const { keybindings } = get();
        return Object.keys(keybindings).filter(
          (key) => keybindings[key as ShortcutKey] === action
        ) as ShortcutKey[];
      },

      getKeybindingString: (ev: KeyboardEvent) => {
        return generateKeybindingString(ev) as ShortcutKey | null;
      },
    }),
    {
      name: "opencut-keybindings",
      version: 1,
    }
  )
);

// Utility functions
function generateKeybindingString(ev: KeyboardEvent): ShortcutKey | null {
// 常量定义 - 模块内部使用的固定值
  const target = ev.target;

  // We may or may not have a modifier key
  const modifierKey = getActiveModifier(ev);

  // We will always have a non-modifier key
  const key = getPressedKey(ev);
  if (!key) return null;

  // All key combos backed by modifiers are valid shortcuts (whether currently typing or not)
  if (modifierKey) {
    // If the modifier is shift and the target is an input, we ignore
    if (
      modifierKey === "shift" &&
      isDOMElement(target) &&
      isTypableElement(target)
    ) {
      return null;
    }

    return `${modifierKey}+${key}` as ShortcutKey;
  }

  // no modifier key here then we do not do anything while on input
  if (isDOMElement(target) && isTypableElement(target)) return null;

  // single key while not input
  return `${key}` as ShortcutKey;
}

// getPressedKey 函数
function getPressedKey(ev: KeyboardEvent): string | null {
  // Sometimes the property code is not available on the KeyboardEvent object
  const key = (ev.key ?? "").toLowerCase();
// 常量定义 - 模块内部使用的固定值
  const code = ev.code ?? "";

  // Check arrow keys
  if (key.startsWith("arrow")) {
    return key.slice(5);
  }

  // Check for special keys
  if (key === "tab") return "tab";
  if (key === " " || key === "space") return "space";
  if (key === "home") return "home";
  if (key === "end") return "end";
  if (key === "delete") return "delete";
  if (key === "backspace") return "backspace";

  // Check letter keys
  const isLetter = key.length === 1 && key >= "a" && key <= "z";
  if (isLetter) return key;

  // Check number keys using physical position for AZERTY support
  if (code.startsWith("Digit")) {
// 常量定义 - 模块内部使用的固定值
    const digit = code.slice(5);
    if (digit.length === 1 && digit >= "0" && digit <= "9") {
      return digit;
    }
  }

  // Fallback for other layouts
  const isDigit = key.length === 1 && key >= "0" && key <= "9";
  if (isDigit) return key;

  // Check if slash, period or enter
  if (key === "/" || key === "." || key === "enter") return key;

  // If no other cases match, this is not a valid key
  return null;
}

// getActiveModifier 函数
function getActiveModifier(ev: KeyboardEvent): string | null {
// 常量定义 - 模块内部使用的固定值
  const modifierKeys = {
    ctrl: isAppleDevice() ? ev.metaKey : ev.ctrlKey,
    alt: ev.altKey,
    shift: ev.shiftKey,
  };

  // active modifier: ctrl | alt | ctrl+alt | ctrl+shift | ctrl+alt+shift | alt+shift
  // modiferKeys object's keys are sorted to match the above order
  const activeModifier = Object.keys(modifierKeys)
    .filter((key) => modifierKeys[key as keyof typeof modifierKeys])
    .join("+");

  return activeModifier === "" ? null : activeModifier;
}
