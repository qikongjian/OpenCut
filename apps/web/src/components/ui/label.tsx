// label.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/label.tsx
// 最后更新: 2025/7/23

// label.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import * as React from "react";
// 导入 Radix UI 组件库
import { Label as LabelPrimitive } from "radix-ui";
// 导入 CVA 类名变体工具
import { cva, type VariantProps } from "class-variance-authority";

// 导入本地模块
import { cn } from "../../lib/utils";

// 常量定义 - 模块内部使用的固定值
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

// 常量定义 - 模块内部使用的固定值
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
