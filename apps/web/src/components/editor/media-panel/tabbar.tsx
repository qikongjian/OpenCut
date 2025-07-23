// tabbar.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/media-panel/tabbar.tsx
// 最后更新: 2025/7/23

// tabbar.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入项目模块
import { cn } from "@/lib/utils";
// 导入本地模块
import { Tab, tabs, useMediaPanelStore } from "./store";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入 React 核心库
import { ChevronRight, ChevronLeft } from "lucide-react";
// 导入 React 核心库
import { useRef, useState, useEffect } from "react";

// TabBar 函数
// 导出组件 - 可复用的 UI 组件
export function TabBar() {
// 常量定义 - 模块内部使用的固定值
  const { activeTab, setActiveTab } = useMediaPanelStore();
// 常量定义 - 模块内部使用的固定值
  const scrollContainerRef = useRef<HTMLDivElement>(null);
// 状态管理 - 创建和管理组件内部状态
  const [isAtEnd, setIsAtEnd] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [isAtStart, setIsAtStart] = useState(true);

// scrollToEnd 函数
  const scrollToEnd = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
      });
      setIsAtEnd(true);
      setIsAtStart(false);
    }
  };

// scrollToStart 函数
  const scrollToStart = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: 0,
      });
      setIsAtStart(true);
      setIsAtEnd(false);
    }
  };

// checkScrollPosition 函数
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
// 常量定义 - 模块内部使用的固定值
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
// 常量定义 - 模块内部使用的固定值
      const isAtEndNow = scrollLeft + clientWidth >= scrollWidth - 1;
// 常量定义 - 模块内部使用的固定值
      const isAtStartNow = scrollLeft <= 1;
      setIsAtEnd(isAtEndNow);
      setIsAtStart(isAtStartNow);
    }
  };

  // We're using useEffect because we need to sync with external DOM scroll events
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);

// 常量定义 - 模块内部使用的固定值
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="flex">
      <ScrollButton
        direction="left"
        onClick={scrollToStart}
        isVisible={!isAtStart}
      />
      <div
        ref={scrollContainerRef}
        className="h-12 bg-panel-accent px-3 flex justify-start items-center gap-5 overflow-x-auto scrollbar-x-hidden relative w-full"
      >
        {(Object.keys(tabs) as Tab[]).map((tabKey) => {
// 常量定义 - 模块内部使用的固定值
          const tab = tabs[tabKey];
          return (
            <div
              className={cn(
                "flex flex-col gap-0.5 items-center cursor-pointer",
                activeTab === tabKey ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setActiveTab(tabKey)}
              key={tabKey}
            >
              <tab.icon className="!size-[1.1rem]" />
              <span className="text-[0.65rem]">{tab.label}</span>
            </div>
          );
        })}
      </div>
      <ScrollButton
        direction="right"
        onClick={scrollToEnd}
        isVisible={!isAtEnd}
      />
    </div>
  );
}

// ScrollButton 函数
function ScrollButton({
  direction,
  onClick,
  isVisible,
}: {
  direction: "left" | "right";
  onClick: () => void;
  isVisible: boolean;
}) {
  if (!isVisible) return null;

// 常量定义 - 模块内部使用的固定值
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <div className="bg-panel-accent w-12 h-full flex items-center justify-center">
      <Button
        size="icon"
        className="rounded-[0.4rem] w-4 h-7 !bg-foreground/10"
        onClick={onClick}
      >
        <Icon className="!size-4 text-foreground" />
      </Button>
    </div>
  );
}
