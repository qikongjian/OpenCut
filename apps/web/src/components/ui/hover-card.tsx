// hover-card.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/hover-card.tsx
// 最后更新: 2025/7/23

// hover-card.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import * as React from "react";
// 导入 Radix UI 组件库
import { HoverCard as HoverCardPrimitive } from "radix-ui";

// 导入本地模块
import { cn } from "../../lib/utils";

// 常量定义 - 模块内部使用的固定值
const HoverCard = HoverCardPrimitive.Root;

// 常量定义 - 模块内部使用的固定值
const HoverCardTrigger = HoverCardPrimitive.Trigger;

// 常量定义 - 模块内部使用的固定值
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
