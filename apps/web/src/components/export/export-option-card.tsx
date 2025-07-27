// export-option-card.tsx - 导出选项卡片组件
// 此文件包含 导出选项卡片组件 的相关代码
// 文件路径: components/export/export-option-card.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

interface ExportOptionCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  onClick?: () => void
  className?: string
}

export function ExportOptionCard({
  icon,
  title,
  description,
  onClick,
  className
}: ExportOptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left",
        "focus:outline-none active:bg-accent/30",
        className
      )}
    >
      <div className="flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">
          {title}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground mt-1">
            {description}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 text-muted-foreground">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  )
} 