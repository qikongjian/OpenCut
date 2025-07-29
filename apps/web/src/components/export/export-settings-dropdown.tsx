// export-settings-dropdown.tsx - 导出设置下拉菜单组件

"use client"

import * as React from "react"
import { ChevronLeft } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useProjectStore } from "../../stores/project-store"
import { useTimelineStore } from "../../stores/timeline-store"
import { useMediaStore } from "../../stores/media-store"
import { exportTimeline } from "../../lib/ffmpeg-utils"
import { toast } from "sonner"

interface ExportSettingsDropdownProps {
  children: React.ReactNode
  onExportProgressOpen?: (exportSettings?: {
    name?: string;
    format?: 'mp4' | 'webm' | 'avi' | 'mov';
    resolution?: '480p' | '720p' | '1080p' | '4k';
    quality?: 'low' | 'medium' | 'high';
    frameRate?: string;
  }) => void
  onBack?: () => void
}

interface ExportConfig {
  name: string;
  resolution: '480p' | '720p' | '1080p' | '4k';
  quality: 'low' | 'medium' | 'high';
  frameRate: string;
  format: 'mp4' | 'webm' | 'avi' | 'mov';
}

export function ExportSettingsDropdown({
  children,
  onExportProgressOpen,
  onBack
}: ExportSettingsDropdownProps) {
  const { activeProject } = useProjectStore()
  const { tracks, getTotalDuration } = useTimelineStore()
  const { mediaItems } = useMediaStore()
  
  const [open, setOpen] = React.useState(false)
  const [exportConfig, setExportConfig] = React.useState<ExportConfig>({
    name: "202507271044",
    resolution: "720p",
    quality: "medium",
    frameRate: "30",
    format: "mp4"
  })
  
  const [videoCover, setVideoCover] = React.useState<string | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // 生成视频封面
  React.useEffect(() => {
    const generateVideoCover = async () => {
      try {
        // 找到时间线中第一个媒体元素
        const firstMediaElement = tracks
          .flatMap(track => track.elements)
          .filter(element => element.type === "media")
          .sort((a, b) => a.startTime - b.startTime)[0]

        if (!firstMediaElement) {
          console.log("没有找到媒体元素")
          return
        }

        // 通过mediaId找到对应的媒体项
        const mediaItem = mediaItems.find(item => item.id === firstMediaElement.mediaId)
        
        if (mediaItem && mediaItem.thumbnailUrl) {
          // 使用已有的缩略图
          setVideoCover(mediaItem.thumbnailUrl)
          return
        }

        if (mediaItem && mediaItem.file && mediaItem.type === "video") {
          // 动态生成视频封面
          const video = document.createElement("video")
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) return

          video.addEventListener("loadedmetadata", () => {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            // 使用时间线中的时间点
            const targetTime = Math.min(firstMediaElement.startTime, video.duration * 0.1)
            video.currentTime = targetTime
          })

          video.addEventListener("seeked", () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const coverUrl = canvas.toDataURL("image/jpeg", 0.8)
            setVideoCover(coverUrl)
            video.remove()
            canvas.remove()
          })

          video.addEventListener("error", () => {
            console.error("视频封面生成失败")
            video.remove()
            canvas.remove()
          })

          video.src = URL.createObjectURL(mediaItem.file)
          video.load()
        }
      } catch (error) {
        console.error("生成视频封面时出错:", error)
      }
    }

    if (open) {
      generateVideoCover()
    }
  }, [open, tracks, mediaItems])

  // 生成默认文件名
  React.useEffect(() => {
    const generateDefaultName = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')
      return `${year}${month}${day}${hour}${minute}`
    }

    if (open) {
      setExportConfig(prev => ({ ...prev, name: generateDefaultName() }))
    }
  }, [open])

  const handleExport = async () => {
    if (!activeProject) {
      toast.error("没有活动项目")
      return
    }

    // 检查是否有时间线内容
    if (tracks.length === 0 || getTotalDuration() === 0) {
      toast.error("时间线没有内容可导出，请先添加媒体到时间线")
      return
    }

    setIsExporting(true)
    setOpen(false) // 关闭下拉菜单
    onExportProgressOpen?.(exportConfig) // 触发统一的导出处理
  }

  const handleBack = () => {
    setOpen(false)
    onBack?.()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="p-4">
          {/* 标题栏 */}
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold">Export Settings</h3>
          </div>
          
          <div className="space-y-4">
            {/* 视频封面 */}
            <div className="space-y-2">
              <Label>Video Cover</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                {videoCover ? (
                  <img 
                    src={videoCover} 
                    alt="Video Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <div className="text-white text-sm font-medium">正在生成封面...</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 文件名 */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={exportConfig.name}
                onChange={(e) => setExportConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入文件名"
                className="h-8"
              />
            </div>
            
            {/* 分辨率 */}
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select 
                value={exportConfig.resolution}
                onValueChange={(value: "480p" | "720p" | "1080p" | "4k") => 
                  setExportConfig(prev => ({ ...prev, resolution: value }))
                }
              >
                <SelectTrigger className="h-8">
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
            
            {/* 质量 */}
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select 
                value={exportConfig.quality}
                onValueChange={(value: "low" | "medium" | "high") => 
                  setExportConfig(prev => ({ ...prev, quality: value }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Recommended Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Quality</SelectItem>
                  <SelectItem value="medium">Recommended Quality</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 帧率 */}
            <div className="space-y-2">
              <Label>Frame Rate</Label>
              <Select 
                value={exportConfig.frameRate}
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, frameRate: value }))}
              >
                <SelectTrigger className="h-8">
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
                onValueChange={(value: "mp4" | "webm" | "avi" | "mov") => 
                  setExportConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger className="h-8">
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
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-8" 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? "导出中..." : "Export"}
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 