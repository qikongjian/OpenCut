// export-settings.tsx - 导出设置弹窗组件
// 此文件包含 导出设置弹窗组件 的相关代码
// 文件路径: components/export/export-settings.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { ChevronLeft, X } from "lucide-react"
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
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface ExportSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack?: () => void
  onExportProgressOpen?: () => void
}

export function ExportSettings({
  open,
  onOpenChange,
  onBack,
  onExportProgressOpen
}: ExportSettingsProps) {
  const [exportConfig, setExportConfig] = React.useState({
    name: "202507271044",
    resolution: "720p",
    quality: "medium",
    frameRate: "30",
    format: "mp4"
  })

  const handleExport = () => {
    console.log("开始导出:", exportConfig)
    onExportProgressOpen?.()
  }

  const generateDefaultName = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    return `${year}${month}${day}${hour}${minute}`
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
              <div className="flex items-center gap-2">
                <Button variant="text" size="sm" onClick={onBack}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Export Settings</DialogTitle>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 影片封面 */}
              <div className="space-y-2">
                <Label>Video Cover</Label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <div className="text-white text-sm font-medium">Video Cover Preview</div>
                  </div>
                </div>
              </div>
              
              {/* 名稱 */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={exportConfig.name}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={generateDefaultName()}
                />
              </div>
              
              {/* 解析度 */}
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select 
                  value={exportConfig.resolution}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, resolution: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="720p" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 品質 */}
              <div className="space-y-2">
                <Label>Quality</Label>
                <Select 
                  value={exportConfig.quality}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Recommended Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Quality</SelectItem>
                    <SelectItem value="medium">Recommended Quality</SelectItem>
                    <SelectItem value="high">High Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 畫面速率 */}
              <div className="space-y-2">
                <Label>Frame Rate</Label>
                <Select 
                  value={exportConfig.frameRate}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, frameRate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="30fps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24fps</SelectItem>
                    <SelectItem value="30">30fps</SelectItem>
                    <SelectItem value="60">60fps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 格式 */}
              <div className="space-y-2">
                <Label>Format</Label>
                <Select 
                  value={exportConfig.format}
                  onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MP4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                    <SelectItem value="avi">AVI</SelectItem>
                    <SelectItem value="mov">MOV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 导出按钮 */}
              <Button 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" 
                onClick={handleExport}
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 