// export-dialog.tsx - 主导出弹窗组件
// 此文件包含 主导出弹窗组件 的相关代码
// 文件路径: components/export/export-dialog.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { MessageCircle, Play, Download } from "lucide-react"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { ExportOptionCard } from "./export-option-card"
import { SocialPlatformCard } from "./social-platform-card"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportProgressOpen?: () => void
}

export function ExportDialog({
  open,
  onOpenChange,
  onExportSettingsOpen
}: ExportDialogProps) {
  const handleShareForReview = () => {
    console.log("分享以供審閱")
    // TODO: 实现分享以供审阅功能
  }

  const handleShareAsPresentation = () => {
    console.log("作為簡報分享")
    // TODO: 实现作为简报分享功能
  }

  const handleSocialPlatformClick = (platform: string) => {
    console.log("选择社交平台:", platform)
    // TODO: 实现社交平台分享功能
  }

  const handleDownload = () => {
    console.log("下載")
    onExportSettingsOpen?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <div
          className={cn(
            "fixed left-[50%] top-[50%] z-[150] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] border bg-popover shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg"
          )}
        >
          {/* 关闭按钮 */}
          <DialogClose className="absolute right-4 top-4 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* 弹窗内容 */}
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle>匯出</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 分享以供審閱 */}
              <ExportOptionCard
                icon={<MessageCircle className="w-5 h-5" />}
                title="分享以供審閱"
                description="人們可以為您的影片加上評論。"
                onClick={handleShareForReview}
              />
              
              {/* 作為簡報分享 */}
              <ExportOptionCard
                icon={<Play className="w-5 h-5" />}
                title="作為簡報分享"
                description="人們只能觀看您的影片。"
                onClick={handleShareAsPresentation}
              />
              
              {/* 分享到社群平台 */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
                <h3 className="font-medium text-foreground">分享到社群平台</h3>
                <div className="grid grid-cols-3 gap-3">
                  <SocialPlatformCard 
                    platform="tiktok" 
                    name="TikTok" 
                    onClick={() => handleSocialPlatformClick('tiktok')}
                  />
                  <SocialPlatformCard 
                    platform="tiktok-ads" 
                    name="TikTok Ads Manager" 
                    onClick={() => handleSocialPlatformClick('tiktok-ads')}
                  />
                  <SocialPlatformCard 
                    platform="youtube" 
                    name="YouTube" 
                    onClick={() => handleSocialPlatformClick('youtube')}
                  />
                  <SocialPlatformCard 
                    platform="youtube-shorts" 
                    name="YouTube Shorts" 
                    onClick={() => handleSocialPlatformClick('youtube-shorts')}
                  />
                  <SocialPlatformCard 
                    platform="facebook" 
                    name="Facebook 粉絲專頁" 
                    onClick={() => handleSocialPlatformClick('facebook')}
                  />
                  <SocialPlatformCard 
                    platform="instagram" 
                    name="Instagram Reels" 
                    onClick={() => handleSocialPlatformClick('instagram')}
                  />
                  <SocialPlatformCard 
                    platform="schedule" 
                    name="排程" 
                    badge="免費"
                    onClick={() => handleSocialPlatformClick('schedule')}
                  />
                </div>
              </div>
              
              {/* 下載 */}
              <ExportOptionCard
                icon={<Download className="w-5 h-5" />}
                title="下載"
                onClick={handleDownload}
              />
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 