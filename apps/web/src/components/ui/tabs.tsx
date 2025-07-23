// tabs.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/tabs.tsx
// 最后更新: 2025/7/23

// tabs.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import * as React from "react";
// 导入 Radix UI 组件库
import { Tabs as TabsPrimitive } from "radix-ui";

// 导入本地模块
import { cn } from "../../lib/utils";

// 常量定义 - 模块内部使用的固定值
const Tabs = TabsPrimitive.Root;

// 常量定义 - 模块内部使用的固定值
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// 常量定义 - 模块内部使用的固定值
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// 常量定义 - 模块内部使用的固定值
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
