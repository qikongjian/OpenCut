// use-keybindings.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-keybindings.ts
// 最后更新: 2025/7/23

// use-keybindings.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useEffect } from "react";
// 导入本地模块
import { invokeAction } from "../constants/actions";
// 导入项目模块
import { useKeybindingsStore } from "@/stores/keybindings-store";

/**
 * A composable that hooks to the caller component's
 * lifecycle and hooks to the keyboard events to fire
 * the appropriate actions based on keybindings
 */
// useKeybindingsListener 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useKeybindingsListener() {
// 常量定义 - 模块内部使用的固定值
  const { keybindings, getKeybindingString, keybindingsEnabled } =
    useKeybindingsStore();

  // 副作用 Hook - 处理副作用

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// handleKeyDown 函数
    const handleKeyDown = (ev: KeyboardEvent) => {
      // Do not check keybinds if the mode is disabled
      if (!keybindingsEnabled) return;

// 常量定义 - 模块内部使用的固定值
      const binding = getKeybindingString(ev);
      if (!binding) return;

// 常量定义 - 模块内部使用的固定值
      const boundAction = keybindings[binding];
      if (!boundAction) return;

      ev.preventDefault();

      // Handle actions with default arguments
      let actionArgs: any = undefined;

      if (boundAction === "seek-forward") {
        actionArgs = { seconds: 1 };
      } else if (boundAction === "seek-backward") {
        actionArgs = { seconds: 1 };
      } else if (boundAction === "jump-forward") {
        actionArgs = { seconds: 5 };
      } else if (boundAction === "jump-backward") {
        actionArgs = { seconds: 5 };
      }

      invokeAction(boundAction, actionArgs, "keypress");
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [keybindings, getKeybindingString, keybindingsEnabled]);
}

/**
 * This composable allows for the UI component to be disabled if the component in question is mounted
 */
// useKeybindingDisabler 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useKeybindingDisabler() {
// 常量定义 - 模块内部使用的固定值
  const { disableKeybindings, enableKeybindings } = useKeybindingsStore();

  return {
    disableKeybindings,
    enableKeybindings,
  };
}

// Export the bindings for backward compatibility
export const bindings = {};
