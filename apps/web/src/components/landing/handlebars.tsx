// handlebars.tsx - 落地页组件
// 此文件包含 落地页组件 的相关代码
// 文件路径: components/landing/handlebars.tsx
// 最后更新: 2025/7/23

// handlebars.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import React, { useState, useRef, useEffect } from "react";
// 导入 React 核心库
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";

// HandlebarsProps 接口定义
interface HandlebarsProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  onRangeChange?: (left: number, right: number) => void;
}

// Handlebars 函数
// 导出组件 - 可复用的 UI 组件
export function Handlebars({
  children,
  minWidth = 50,
  maxWidth = 400,
  onRangeChange,
}: HandlebarsProps) {
// 状态管理 - 创建和管理组件内部状态
  const [leftHandle, setLeftHandle] = useState(0);
// 状态管理 - 创建和管理组件内部状态
  const [rightHandle, setRightHandle] = useState(maxWidth);
// 状态管理 - 创建和管理组件内部状态
  const [contentWidth, setContentWidth] = useState(maxWidth);

// 常量定义 - 模块内部使用的固定值
  const leftHandleX = useMotionValue(0);
// 常量定义 - 模块内部使用的固定值
  const rightHandleX = useMotionValue(maxWidth);

// 常量定义 - 模块内部使用的固定值
  const visibleWidth = useTransform(
    [leftHandleX, rightHandleX],
    (values: number[]) => values[1] - values[0]
  );

// 常量定义 - 模块内部使用的固定值
  const contentLeft = useTransform(leftHandleX, (left: number) => -left);

// 常量定义 - 模块内部使用的固定值
  const containerRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const measureRef = useRef<HTMLDivElement>(null);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    if (!measureRef.current) return;

// measureContent 函数
    const measureContent = () => {
      if (measureRef.current) {
// 常量定义 - 模块内部使用的固定值
        const width = measureRef.current.scrollWidth;
// 常量定义 - 模块内部使用的固定值
        const paddedWidth = width + 32;
        setContentWidth(paddedWidth);
        setRightHandle(paddedWidth);
        rightHandleX.set(paddedWidth);
      }
    };

    measureContent();
// 常量定义 - 模块内部使用的固定值
    const timer = setTimeout(measureContent, 50);

    return () => clearTimeout(timer);
  }, [children, rightHandleX]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    leftHandleX.set(leftHandle);
  }, [leftHandle, leftHandleX]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    rightHandleX.set(rightHandle);
  }, [rightHandle, rightHandleX]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    onRangeChange?.(leftHandle, rightHandle);
  }, [leftHandle, rightHandle, onRangeChange]);

// handleLeftDrag 函数
  const handleLeftDrag = (event: any, info: PanInfo) => {
// 常量定义 - 模块内部使用的固定值
    const newLeft = Math.max(
      0,
      Math.min(leftHandle + info.offset.x, rightHandle - minWidth)
    );
    setLeftHandle(newLeft);
  };

// handleRightDrag 函数
  const handleRightDrag = (event: any, info: PanInfo) => {
// 常量定义 - 模块内部使用的固定值
    const newRight = Math.max(
      leftHandle + minWidth,
      Math.min(contentWidth, rightHandle + info.offset.x)
    );
    setRightHandle(newRight);
  };

  return (
    <div className="flex justify-center gap-4 leading-[4rem] mt-0 md:mt-2">
      <div
        ref={measureRef}
        className="absolute -left-[9999px] top-0 invisible px-4 whitespace-nowrap font-[inherit]"
      >
        {children}
      </div>

      <div
        ref={containerRef}
        className="relative -rotate-[2.76deg] max-w-[250px] md:max-w-[454px] mt-2"
        style={{ width: contentWidth }}
      >
        <div className="absolute inset-0 w-full h-full rounded-2xl border border-yellow-500 flex justify-between">
          <motion.div
            className="h-full border border-yellow-500 w-7 rounded-full bg-accent flex items-center justify-center cursor-ew-resize select-none"
            style={{
              position: "absolute",
              x: leftHandleX,
              left: 0,
              zIndex: 10,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: rightHandle - minWidth }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleLeftDrag}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="w-2 h-8 rounded-full bg-yellow-500"></div>
          </motion.div>

          <motion.div
            className="h-full border border-yellow-500 w-7 rounded-full bg-accent flex items-center justify-center cursor-ew-resize select-none"
            style={{
              position: "absolute",
              x: rightHandleX,
              left: -30,
              zIndex: 10,
            }}
            drag="x"
            dragConstraints={{
              left: leftHandle + minWidth,
              right: contentWidth,
            }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleRightDrag}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="w-2 h-8 rounded-full bg-yellow-500"></div>
          </motion.div>
        </div>

        <motion.div
          className="relative overflow-hidden rounded-2xl"
          style={{
            width: visibleWidth,
            x: leftHandleX,
            height: "100%",
          }}
        >
          <motion.div
            className="w-full h-full flex items-center justify-center px-4"
            style={{
              x: contentLeft,
              width: contentWidth,
              whiteSpace: "nowrap",
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
