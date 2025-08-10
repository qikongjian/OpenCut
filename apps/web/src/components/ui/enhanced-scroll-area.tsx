// enhanced-scroll-area.tsx - 增强版滚动区域组件
// 专为媒体面板设计的高级滚动条体验
// 文件路径: components/ui/enhanced-scroll-area.tsx

"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

// 增强版滚动区域属性接口
interface EnhancedScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  type?: "auto" | "always" | "scroll" | "hover";
  showHorizontalScrollbar?: boolean;
  variant?: "default" | "media-panel" | "timeline" | "minimal";
  scrollbarSize?: "sm" | "md" | "lg";
  hideDelay?: number;
}

// 🎨 高级UI设计：增强版滚动区域
const EnhancedScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  EnhancedScrollAreaProps
>(({ 
  className, 
  children, 
  type = "hover", 
  showHorizontalScrollbar, 
  variant = "default",
  scrollbarSize = "md",
  hideDelay = 1000,
  ...props 
}, ref) => {
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [showScrollbar, setShowScrollbar] = React.useState(false);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

  // 处理滚动状态
  const handleScrollStart = React.useCallback(() => {
    setIsScrolling(true);
    setShowScrollbar(true);
    
    // 清除之前的隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleScrollEnd = React.useCallback(() => {
    setIsScrolling(false);
    
    // 延迟隐藏滚动条
    hideTimeoutRef.current = setTimeout(() => {
      setShowScrollbar(false);
    }, hideDelay);
  }, [hideDelay]);

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      type={type}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport 
        className="h-full w-full rounded-[inherit]"
        onScroll={handleScrollStart}
        onScrollCapture={handleScrollEnd}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      
      <EnhancedScrollBar 
        variant={variant}
        size={scrollbarSize}
        isVisible={showScrollbar || isScrolling}
        isScrolling={isScrolling}
      />
      
      {showHorizontalScrollbar && (
        <EnhancedScrollBar 
          orientation="horizontal" 
          variant={variant}
          size={scrollbarSize}
          isVisible={showScrollbar || isScrolling}
          isScrolling={isScrolling}
        />
      )}
      
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});

EnhancedScrollArea.displayName = "EnhancedScrollArea";

// 🎨 高级UI设计：增强版滚动条
interface EnhancedScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  variant?: "default" | "media-panel" | "timeline" | "minimal";
  size?: "sm" | "md" | "lg";
  isVisible?: boolean;
  isScrolling?: boolean;
}

const EnhancedScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  EnhancedScrollBarProps
>(({ 
  className, 
  orientation = "vertical", 
  variant = "default",
  size = "md",
  isVisible = true,
  isScrolling = false,
  ...props 
}, ref) => {
  // 🎨 设计系统：滚动条尺寸映射
  const sizeMap = {
    sm: {
      width: "w-1.5",
      height: "h-1.5",
      padding: "p-[0.5px]",
    },
    md: {
      width: "w-2",
      height: "h-2",
      padding: "p-[1px]",
    },
    lg: {
      width: "w-3",
      height: "h-3",
      padding: "p-[1.5px]",
    },
  };

  // 🎨 设计系统：变体样式映射
  const variantStyles = {
    default: {
      track: "border-l border-l-transparent",
      thumb: "bg-border hover:bg-border/80",
    },
    "media-panel": {
      track: "border-l border-l-transparent bg-black/5",
      thumb: "bg-white/20 hover:bg-white/30 active:bg-white/40",
    },
    timeline: {
      track: "border-l border-l-panel-accent/50",
      thumb: "bg-primary/60 hover:bg-primary/80 active:bg-primary",
    },
    minimal: {
      track: "",
      thumb: "bg-muted-foreground/40 hover:bg-muted-foreground/60",
    },
  };

  const currentSize = sizeMap[size];
  const currentVariant = variantStyles[variant];

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        // 基础样式
        "flex touch-none select-none transition-all duration-300 ease-out",
        
        // 方向相关样式
        orientation === "vertical" && [
          "h-full",
          currentSize.width,
          "border-l border-l-transparent",
          currentSize.padding,
        ],
        orientation === "horizontal" && [
          currentSize.height,
          "flex-col border-t border-t-transparent",
          currentSize.padding,
        ],
        
        // 变体样式
        currentVariant.track,
        
        // 可见性控制
        isVisible ? "opacity-100" : "opacity-0",
        
        // 滚动状态样式
        isScrolling && "opacity-100 scale-105",
        
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb 
        className={cn(
          // 基础样式
          "relative flex-1 rounded-full transition-all duration-200 ease-out",
          
          // 变体样式
          currentVariant.thumb,
          
          // 滚动状态增强
          isScrolling && "scale-110 shadow-sm",
          
          // 悬停效果
          "hover:scale-105 active:scale-95",
          
          // 媒体面板特殊效果
          variant === "media-panel" && [
            "backdrop-blur-sm",
            "shadow-lg shadow-black/20",
            "border border-white/10",
          ],
        )} 
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
});

EnhancedScrollBar.displayName = "EnhancedScrollBar";

export { EnhancedScrollArea, EnhancedScrollBar };
