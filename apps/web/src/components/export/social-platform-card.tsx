// social-platform-card.tsx - 社交媒体平台卡片组件
// 此文件包含 社交媒体平台卡片组件 的相关代码
// 文件路径: components/export/social-platform-card.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

interface SocialPlatformCardProps {
  platform: string
  name: string
  badge?: string
  onClick?: () => void
  className?: string
}

// 社交媒体平台图标组件
const PlatformIcon = ({ platform }: { platform: string }) => {
  const iconProps = {
    className: "w-7 h-7",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }

  switch (platform) {
    case 'tiktok':
      return (
        <svg {...iconProps}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z"/>
        </svg>
      )
    case 'tiktok-ads':
      return (
        <svg {...iconProps}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z"/>
          <circle cx="18" cy="6" r="2" fill="currentColor"/>
        </svg>
      )
    case 'youtube':
      return (
        <svg {...iconProps} className="w-7 h-7 text-red-500">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    case 'youtube-shorts':
      return (
        <svg {...iconProps} className="w-7 h-7 text-red-500">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          <rect x="16" y="2" width="6" height="8" rx="1" fill="currentColor"/>
        </svg>
      )
    case 'facebook':
      return (
        <svg {...iconProps} className="w-7 h-7 text-blue-600">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    case 'instagram':
      return (
        <svg {...iconProps} className="w-7 h-7 text-pink-500">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    case 'schedule':
      return (
        <svg {...iconProps} className="w-7 h-7 text-blue-500">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      )
    default:
      return (
        <div className="w-7 h-7 bg-muted rounded flex items-center justify-center text-xs font-medium">
          {platform.charAt(0).toUpperCase()}
        </div>
      )
  }
}

export function SocialPlatformCard({
  platform,
  name,
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
      
      <PlatformIcon platform={platform} />
      
      <span className="text-[9px] text-center leading-tight text-foreground font-medium max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
        {name}
      </span>
    </button>
  )
} 