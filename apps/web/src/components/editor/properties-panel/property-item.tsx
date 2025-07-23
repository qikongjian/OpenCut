// property-item.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/properties-panel/property-item.tsx
// 最后更新: 2025/7/23

// property-item.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { cn } from "@/lib/utils";

// PropertyItemProps 接口定义
interface PropertyItemProps {
  direction?: "row" | "column";
  children: React.ReactNode;
  className?: string;
}

// PropertyItem 函数
// 导出组件 - 可复用的 UI 组件
export function PropertyItem({
  direction = "row",
  children,
  className,
}: PropertyItemProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        direction === "row"
          ? "items-center justify-between gap-6"
          : "flex-col gap-1",
        className
      )}
    >
      {children}
    </div>
  );
}

// PropertyItemLabel 函数
// 导出组件 - 可复用的 UI 组件
export function PropertyItemLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={cn("text-xs", className)}>{children}</label>;
}

// PropertyItemValue 函数
// 导出组件 - 可复用的 UI 组件
export function PropertyItemValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex-1", className)}>{children}</div>;
}
