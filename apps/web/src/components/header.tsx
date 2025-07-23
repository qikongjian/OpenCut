// header.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/header.tsx
// 最后更新: 2025/7/23

// header.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 Next.js 相关模块
import Link from "next/link";
// 导入本地模块
import { Button } from "./ui/button";
// 导入 React 核心库
import { ArrowRight } from "lucide-react";
// 导入本地模块
import { HeaderBase } from "./header-base";
// 导入 Next.js 相关模块
import Image from "next/image";

// Header 函数
// 导出组件 - 可复用的 UI 组件
export function Header() {
// leftContent 函数
  const leftContent = (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/logo.svg" alt="OpenCut Logo" width={32} height={32} />
      <span className="text-xl font-medium hidden md:block">OpenCut</span>
    </Link>
  );

// rightContent 函数
  const rightContent = (
    <nav className="flex items-center gap-3">
      <Link href="/blog">
        <Button variant="text" className="text-sm p-0">
          Blog
        </Button>
      </Link>
      <Link href="/contributors">
        <Button variant="text" className="text-sm p-0">
          Contributors
        </Button>
      </Link>
      <Link href="/projects">
        <Button size="sm" className="text-sm ml-4">
          Projects
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </nav>
  );

  return (
    <div className="mx-4 md:mx-0">
      <HeaderBase
        className="bg-accent border rounded-2xl max-w-3xl mx-auto mt-4 pl-4 pr-[14px]"
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
