// input.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/input.tsx
// 最后更新: 2025/7/23

// input.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入 React 核心库
import * as React from "react";
// 导入 React 核心库
import { Eye, EyeOff } from "lucide-react";

// 导入本地模块
import { cn } from "../../lib/utils";
// 导入本地模块
import { Button } from "./button";

// InputProps 接口定义
interface InputProps extends React.ComponentProps<"input"> {
  showPassword?: boolean;
  onShowPasswordChange?: (show: boolean) => void;
}

// 常量定义 - 模块内部使用的固定值
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, showPassword, onShowPasswordChange, value, ...props },
    ref
  ) => {
// 常量定义 - 模块内部使用的固定值
    const isPassword = type === "password";
// 常量定义 - 模块内部使用的固定值
    const showPasswordToggle = isPassword && onShowPasswordChange;
// 常量定义 - 模块内部使用的固定值
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className={showPassword ? "relative w-full" : ""}>
        <input
          type={inputType}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showPasswordToggle && "pr-10",
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
        {showPasswordToggle && (
          <Button
            type="button"
            variant="text"
            size="icon"
            onClick={() => onShowPasswordChange?.(!showPassword)}
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
