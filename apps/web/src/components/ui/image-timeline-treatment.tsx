// image-timeline-treatment.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/image-timeline-treatment.tsx
// 最后更新: 2025/7/23

// image-timeline-treatment.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useState } from "react";
// 导入项目模块
import { cn } from "@/lib/utils";
// 导入项目模块
import type { BackgroundType } from "@/types/editor";

// ImageTimelineTreatmentProps 接口定义
interface ImageTimelineTreatmentProps {
  src: string;
  alt: string;
  targetAspectRatio?: number; // Default to 16:9 for video
  className?: string;
  backgroundType?: BackgroundType;
  backgroundColor?: string;
}

// ImageTimelineTreatment 函数
// 导出组件 - 可复用的 UI 组件
export function ImageTimelineTreatment({
  src,
  alt,
  targetAspectRatio = 16 / 9,
  className,
  backgroundType = "blur",
  backgroundColor = "#000000",
}: ImageTimelineTreatmentProps) {
// 状态管理 - 创建和管理组件内部状态
  const [imageLoaded, setImageLoaded] = useState(false);
// 常量定义 - 模块内部使用的固定值
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

// handleImageLoad 函数
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
// 常量定义 - 模块内部使用的固定值
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoaded(true);
  };

// 常量定义 - 模块内部使用的固定值
  const imageAspectRatio = imageDimensions
    ? imageDimensions.width / imageDimensions.height
    : 1;

// 常量定义 - 模块内部使用的固定值
  const needsAspectRatioTreatment = imageAspectRatio !== targetAspectRatio;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: targetAspectRatio }}
    >
      {/* Background Layer */}
      {needsAspectRatioTreatment && imageLoaded && (
        <>
          {backgroundType === "blur" && (
            <div className="absolute inset-0">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover filter blur-xl scale-110 opacity-60"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}

          {backgroundType === "mirror" && (
            <div className="absolute inset-0">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover opacity-30"
                aria-hidden="true"
              />
            </div>
          )}

          {backgroundType === "color" && (
            <div className="absolute inset-0" style={{ backgroundColor }} />
          )}
        </>
      )}

      {/* Main Image Layer */}
      <div className="absolute inset-0">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
        />
      </div>

      {/* Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <div className="animate-pulse text-xs text-muted-foreground">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
