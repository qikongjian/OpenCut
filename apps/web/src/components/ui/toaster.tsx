// toaster.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/toaster.tsx
// 最后更新: 2025/7/23

// toaster.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入本地模块
import { useToast } from "../../hooks/use-toast";
// 导入模块
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

// Toaster 函数
// 导出组件 - 可复用的 UI 组件
export function Toaster() {
// 常量定义 - 模块内部使用的固定值
  const { toasts } = useToast();

  return (
    <ToastProvider>
// 函数定义
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
