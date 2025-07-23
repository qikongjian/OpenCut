// use-keybinding-conflicts.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-keybinding-conflicts.ts
// 最后更新: 2025/7/23

// use-keybinding-conflicts.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

"use client";

// 导入 React 核心库
import { useMemo } from "react";
// 导入项目模块
import { useKeybindingsStore } from "@/stores/keybindings-store";
// 导入项目模块
import { ActionWithOptionalArgs } from "@/constants/actions";

// 接口定义 - 定义对象的结构和属性类型
export interface KeybindingConflictInfo {
  key: string;
  actions: ActionWithOptionalArgs[];
  isConflict: boolean;
}

// useKeybindingConflicts 自定义钩子
export const useKeybindingConflicts = () => {
// 常量定义 - 模块内部使用的固定值
  const { keybindings } = useKeybindingsStore();

// 值记忆化 - 缓存计算结果，优化性能
  const conflicts = useMemo(() => {
// 常量定义 - 模块内部使用的固定值
    const keyToActions: Record<string, ActionWithOptionalArgs[]> = {};
// 常量定义 - 模块内部使用的固定值
    const conflictList: KeybindingConflictInfo[] = [];

    // Group actions by key
    Object.entries(keybindings).forEach(([key, action]) => {
      if (!keyToActions[key]) {
        keyToActions[key] = [];
      }
      keyToActions[key].push(action);
    });

    // Find conflicts
    Object.entries(keyToActions).forEach(([key, actions]) => {
// 常量定义 - 模块内部使用的固定值
      const uniqueActions = [...new Set(actions)];
      conflictList.push({
        key,
        actions: uniqueActions,
        isConflict: uniqueActions.length > 1,
      });
    });

    return conflictList.filter((item) => item.isConflict);
  }, [keybindings]);

// 常量定义 - 模块内部使用的固定值
  const hasConflicts = conflicts.length > 0;

// getConflictsForKey 函数
  const getConflictsForKey = (key: string): KeybindingConflictInfo | null => {
    return conflicts.find((conflict) => conflict.key === key) || null;
  };

// getConflictsForAction 函数
  const getConflictsForAction = (
    action: ActionWithOptionalArgs
  ): KeybindingConflictInfo[] => {
    return conflicts.filter((conflict) => conflict.actions.includes(action));
  };

  return {
    conflicts,
    hasConflicts,
    getConflictsForKey,
    getConflictsForAction,
  };
};
