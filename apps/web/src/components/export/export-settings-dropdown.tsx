// export-settings-dropdown.tsx - 导出设置下拉菜单组件
// 此文件包含 导出设置下拉菜单组件 的相关代码
// 文件路径: components/export/export-settings-dropdown.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { ChevronLeft, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
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

interface ExportSettingsDropdownProps {
  children: React.ReactNode
  onExportProgressOpen?: () => void
  onBack?: () => void
}

export function ExportSettingsDropdown({
  children,
  onExportProgressOpen,
  onBack
}: ExportSettingsDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [exportConfig, setExportConfig] = React.useState({
    name: "202507271044",
    resolution: "720p",
    quality: "medium",
    frameRate: "30",
    format: "mp4"
  })

  const handleExport = () => {
    console.log("Start export:", exportConfig)
    setOpen(false)
    onExportProgressOpen?.()
  }

  const handleBack = () => {
    setOpen(false)
    onBack?.()
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-96 p-4 space-y-4"
        sideOffset={8}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-foreground">Export Settings</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Video Cover */}
          <div className="space-y-2">
            <Label>Video Cover</Label>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <div className="text-white text-sm font-medium">Video Cover Preview</div>
              </div>
            </div>
          </div>
          
          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              value={exportConfig.name}
              onChange={(e) => setExportConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder={generateDefaultName()}
            />
          </div>
          
          {/* Resolution */}
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
          
          {/* Quality */}
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
          
          {/* Frame Rate */}
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
          
          {/* Format */}
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
          
          {/* Export button */}
          <Button 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" 
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 