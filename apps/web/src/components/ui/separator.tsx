// separator.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/separator.tsx
// 最后更新: 2025/7/23

// separator.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client"

// 导入 React 核心库
import * as React from "react"
// 导入 React 核心库
import * as SeparatorPrimitive from "@radix-ui/react-separator"

// 导入项目模块
import { cn } from "@/lib/utils"

// 常量定义 - 模块内部使用的固定值
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
