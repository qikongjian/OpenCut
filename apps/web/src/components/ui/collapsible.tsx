// collapsible.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/collapsible.tsx
// 最后更新: 2025/7/23

// collapsible.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client"

// 导入 Radix UI 组件库
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

// 常量定义 - 模块内部使用的固定值
const Collapsible = CollapsiblePrimitive.Root

// 常量定义 - 模块内部使用的固定值
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

// 常量定义 - 模块内部使用的固定值
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
