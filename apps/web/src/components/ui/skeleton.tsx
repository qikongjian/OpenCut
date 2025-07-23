// skeleton.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/skeleton.tsx
// 最后更新: 2025/7/23

// skeleton.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入本地模块
import { cn } from "../../lib/utils";

// Skeleton 函数
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
