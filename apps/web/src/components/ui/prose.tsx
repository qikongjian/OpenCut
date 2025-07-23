// prose.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/prose.tsx
// 最后更新: 2025/7/23

// prose.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { cn } from "@/lib/utils";
// 导入 React 核心库
import type React from "react";

// ProseProps 类型定义
type ProseProps = React.HTMLAttributes<HTMLElement> & {
  as?: "article";
  html: string;
};

// Prose 函数
function Prose({ children, html, className }: ProseProps) {
  return (
    <article
      className={cn(
        "prose prose-h2:font-semibold max-w-none prose-h1:text-xl prose-a:text-blue-600 prose-p:text-justify dark:prose-invert mx-auto",
        className
      )}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
    </article>
  );
}

export default Prose;
