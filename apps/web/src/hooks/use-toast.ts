// use-toast.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-toast.ts
// 最后更新: 2025/7/23

// use-toast.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

"use client";

// Inspired by react-hot-toast library
import * as React from "react";

// 导入本地模块
import type { ToastActionElement, ToastProps } from "../components/ui/toast";

// 常量定义 - 模块内部使用的固定值
const TOAST_LIMIT = 1;
// 常量定义 - 模块内部使用的固定值
const TOAST_REMOVE_DELAY = 1000000;

// ToasterToast 类型定义
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// 常量定义 - 模块内部使用的固定值
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

// genId 函数
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// ActionType 类型定义
type ActionType = typeof actionTypes;

// Action 类型定义
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

// State 接口定义
interface State {
  toasts: ToasterToast[];
}

// 常量定义 - 模块内部使用的固定值
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// addToRemoveQueue 函数
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

// 常量定义 - 模块内部使用的固定值
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
// 分发状态更新 - 发送 action 到 reducer
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// reducer 函数
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
// 常量定义 - 模块内部使用的固定值
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// 常量定义 - 模块内部使用的固定值
const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

// dispatch 函数
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Toast 类型定义
type Toast = Omit<ToasterToast, "id">;

// toast 函数
function toast({ ...props }: Toast) {
// 常量定义 - 模块内部使用的固定值
  const id = genId();

// update 函数
  const update = (props: ToasterToast) =>
// 分发状态更新 - 发送 action 到 reducer
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
// dismiss 函数
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

// 分发状态更新 - 发送 action 到 reducer
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

// useToast 自定义钩子
function useToast() {
// 常量定义 - 模块内部使用的固定值
  const [state, setState] = React.useState<State>(memoryState);

// 副作用处理 - 处理组件生命周期中的副作用操作
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
// 常量定义 - 模块内部使用的固定值
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
// 分发状态更新 - 发送 action 到 reducer
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
