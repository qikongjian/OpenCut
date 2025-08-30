"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { HeaderBase } from "./header-base";
import { MovieFlowHeader } from "./layout/movie-flow-header";
import Image from "next/image";
import { useAuthSession } from "@/lib/auth-compat";

export function Header() {
  const { isAuthenticated } = useAuthSession();

  // 如果用户已登录，使用MovieFlowHeader组件
  if (isAuthenticated) {
    return (
      <MovieFlowHeader
        collapsed={false}
        onToggleSidebar={() => {}}
        showSidebarToggle={false}
      />
    );
  }

  // 未登录用户使用原有的header布局
  const leftContent = (
    <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.svg" alt="MovieFlow Logo" className="invert dark:invert-0" width={32} height={32} />
        <span className="text-xl font-medium hidden md:block">MovieFlow</span>
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-1">
      <div className="flex items-center gap-4">
        <Link href="/blog">
          <Button
            variant="text"
            className="text-sm p-0"
          >
            Blog
          </Button>
        </Link>
        <Link href="/contributors">
          <Button
            variant="text"
            className="text-sm p-0"
          >
            Contributors
          </Button>
        </Link>
      </div>
      <Link href="/projects">
        <Button
          size="sm"
          className="text-sm ml-4"
        >
          Projects
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </nav>
  );

  return (
    <div className="mx-4 md:mx-0">
      <HeaderBase
        className="bg-background border rounded-2xl max-w-3xl mx-auto mt-4 pl-4 pr-[14px]"
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
