// export-progress.tsx - 导出进度弹窗组件
// 此文件包含 导出进度弹窗组件 的相关代码
// 文件路径: components/export/export-progress.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

interface ExportProgressProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  progress?: number
  status?: string
  onCancel?: () => void
}

export function ExportProgress({
  open,
  onOpenChange,
  progress = 0.0,
  status = "Saving...",
  onCancel
}: ExportProgressProps) {
  const handleCancel = () => {
    console.log("Cancel export")
    onCancel?.()
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  // 根据进度显示不同的描述文字
  const getProgressDescription = () => {
    if (progress < 20) {
      return "Preparing media files..."
    } else if (progress < 50) {
      return "Processing video segments..."
    } else if (progress < 85) {
      return "Combining segments..."
    } else if (progress < 99) {
      return "Finalizing video export..."
    } else if (progress >= 99) {
      return "Almost done, please wait..."
    }
    return "Saving video, please wait a moment"
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
          {/* 弹窗内容 */}
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <DialogTitle>Download</DialogTitle>
                <Button 
                  variant="text" 
                  size="sm" 
                  onClick={handleClose}
                  className="h-auto p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="py-8 text-center space-y-6">
              {/* 进度显示 */}
              <div className="text-6xl font-bold text-white">
                {progress.toFixed(1)}%
              </div>
              
              {/* 状态文字 */}
              <div className="text-lg text-muted-foreground">
                {status}
              </div>
              
              {/* 描述文字 */}
              <div className="text-sm text-muted-foreground">
                {getProgressDescription()}
              </div>
              
              {/* 取消按钮 */}
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="mt-6"
                disabled={progress >= 99} // 当进度接近100%时禁用取消按钮
              >
                Cancel Export
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 