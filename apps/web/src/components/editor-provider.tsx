// editor-provider.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/editor-provider.tsx
// 最后更新: 2025/7/23

// editor-provider.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useEffect } from "react";
// 导入 React 核心库
import { Loader2 } from "lucide-react";
// 导入项目模块
import { useEditorStore } from "@/stores/editor-store";
// 导入模块
import {
  useKeybindingsListener,
  useKeybindingDisabler,
} from "@/hooks/use-keybindings";
// 导入项目模块
import { useEditorActions } from "@/hooks/use-editor-actions";

// EditorProviderProps 接口定义
interface EditorProviderProps {
  children: React.ReactNode;
}

// EditorProvider 函数
// 导出组件 - 可复用的 UI 组件
export function EditorProvider({ children }: EditorProviderProps) {
// 常量定义 - 模块内部使用的固定值
  const { isInitializing, isPanelsReady, initializeApp } = useEditorStore();
// 常量定义 - 模块内部使用的固定值
  const { disableKeybindings, enableKeybindings } = useKeybindingDisabler();

  // Set up action handlers
  useEditorActions();

  // Set up keybinding listener
  useKeybindingsListener();

  // Disable keybindings when initializing
  useEffect(() => {
    if (isInitializing || !isPanelsReady) {
      disableKeybindings();
    } else {
      enableKeybindings();
    }
  }, [isInitializing, isPanelsReady, disableKeybindings, enableKeybindings]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Show loading screen while initializing
  if (isInitializing || !isPanelsReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  // App is ready, render children
  return <>{children}</>;
}
