// sonner.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/sonner.tsx
// 最后更新: 2025/7/23

// sonner.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client"

// 导入 Next.js 相关模块
import { useTheme } from "next-themes"
// 导入 Sonner 通知组件
import { Toaster as Sonner } from "sonner"

// ToasterProps 类型定义
type ToasterProps = React.ComponentProps<typeof Sonner>

// Toaster 函数
const Toaster = ({ ...props }: ToasterProps) => {
// 常量定义 - 模块内部使用的固定值
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
