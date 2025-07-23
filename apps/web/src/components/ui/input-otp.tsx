// input-otp.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/input-otp.tsx
// 最后更新: 2025/7/23

// input-otp.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import * as React from "react";
// 导入 Input OTP 一次性密码组件
import { OTPInput, OTPInputContext } from "input-otp";
// 导入 React 核心库
import { Minus } from "lucide-react";

// 导入本地模块
import { cn } from "../../lib/utils";

// 常量定义 - 模块内部使用的固定值
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center justify-between gap-2 w-full has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

// 常量定义 - 模块内部使用的固定值
const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center flex-1 gap-2", className)}
    {...props}
  />
));
InputOTPGroup.displayName = "InputOTPGroup";

// 常量定义 - 模块内部使用的固定值
const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
// 上下文消费 - 消费 React 上下文中的值
  const inputOTPContext = React.useContext(OTPInputContext);
// 常量定义 - 模块内部使用的固定值
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex aspect-square flex-1 min-w-[36px] items-center justify-center border border-input text-lg shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

// 常量定义 - 模块内部使用的固定值
const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
