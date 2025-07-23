// carousel.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/carousel.tsx
// 最后更新: 2025/7/23

// carousel.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import * as React from "react";
// 导入模块
import useEmblaCarousel, {
// UseEmblaCarouselType 类型定义
  type UseEmblaCarouselType,
} from "embla-carousel-react";
// 导入 React 核心库
import { ArrowLeft, ArrowRight } from "lucide-react";

// 导入本地模块
import { cn } from "../../lib/utils";
// 导入本地模块
import { Button } from "./button";

// CarouselApi 类型定义
type CarouselApi = UseEmblaCarouselType[1];
// UseCarouselParameters 类型定义
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
// CarouselOptions 类型定义
type CarouselOptions = UseCarouselParameters[0];
// CarouselPlugin 类型定义
type CarouselPlugin = UseCarouselParameters[1];

// CarouselProps 类型定义
type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

// CarouselContextProps 类型定义
type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

// 常量定义 - 模块内部使用的固定值
const CarouselContext = React.createContext<CarouselContextProps | null>(null);

// useCarousel 自定义钩子
function useCarousel() {
// 上下文消费 - 消费 React 上下文中的值
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

// 常量定义 - 模块内部使用的固定值
const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
// 常量定义 - 模块内部使用的固定值
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    );
// 状态管理 - 创建和管理组件内部状态
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
// 状态管理 - 创建和管理组件内部状态
    const [canScrollNext, setCanScrollNext] = React.useState(false);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

// 副作用处理 - 处理组件生命周期中的副作用操作
    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

// 副作用处理 - 处理组件生命周期中的副作用操作
    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

// 常量定义 - 模块内部使用的固定值
const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

// 常量定义 - 模块内部使用的固定值
const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

// 常量定义 - 模块内部使用的固定值
const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  // React 类组件 - 基于类的组件
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

// 常量定义 - 模块内部使用的固定值
const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  // React 类组件 - 基于类的组件
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
// CarouselApi 类型定义
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
