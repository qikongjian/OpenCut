// social-platform-card.tsx - 社交媒体平台卡片组件
// 此文件包含 社交媒体平台卡片组件 的相关代码
// 文件路径: components/export/social-platform-card.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

interface SocialPlatformCardProps {
  platform: string
  icon?: string
  badge?: string
  onClick?: () => void
  className?: string
}

export function SocialPlatformCard({
  platform,
  icon,
  badge,
  onClick,
  className
}: SocialPlatformCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "min-h-[72px] w-full",
        className
      )}
    >
      {badge && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px] font-medium">
          {badge}
        </span>
      )}
      
      {icon ? (
        <div className="w-7 h-7 flex items-center justify-center text-2xl">
          {icon}
        </div>
      ) : (
        <div className="w-7 h-7 bg-muted rounded flex items-center justify-center text-xs font-medium">
          {platform.charAt(0).toUpperCase()}
        </div>
      )}
      
      <span className="text-[9px] text-center leading-tight text-foreground font-medium max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
        {platform}
      </span>
    </button>
  )
} 