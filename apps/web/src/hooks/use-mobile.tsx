// use-mobile.tsx - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/use-mobile.tsx
// 最后更新: 2025/7/23

// use-mobile.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入 React 核心库
import * as React from "react"

// 常量定义 - 模块内部使用的固定值
const MOBILE_BREAKPOINT = 768

// useIsMobile 自定义钩子
// 导出组件 - 可复用的 UI 组件
// 自定义 Hook - 可复用的状态逻辑
export function useIsMobile() {
// 常量定义 - 模块内部使用的固定值
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

// 副作用处理 - 处理组件生命周期中的副作用操作
  React.useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
// onChange 函数
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
