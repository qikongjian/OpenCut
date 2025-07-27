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
import { useProjectStore } from "../../stores/project-store"
import { useTimelineStore } from "../../stores/timeline-store"
import { useMediaStore } from "../../stores/media-store"
import { exportTimeline } from "../../lib/ffmpeg-utils"
import { toast } from "sonner"

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
  const { activeProject } = useProjectStore()
  const { tracks, getTotalDuration } = useTimelineStore()
  const { mediaItems } = useMediaStore()
  
  const [exportConfig, setExportConfig] = React.useState({
    name: "202507271044",
    resolution: "720p" as const,
    quality: "medium" as const,
    frameRate: "30",
    format: "mp4" as const
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
    onOpenChange(false) // 关闭设置弹窗
    onExportProgressOpen?.() // 打开进度弹窗

    try {
      console.log("🚀 开始按设置参数导出:", exportConfig)
      
      // 准备时间线数据
      const timelineData = {
        tracks: tracks,
        totalDuration: getTotalDuration()
      }

      // 映射质量设置到具体参数
      const qualityMap = {
        'low': 'low' as const,
        'medium': 'medium' as const, 
        'high': 'high' as const
      }

      // 使用用户配置的参数进行导出
      const finalExportConfig = {
        format: exportConfig.format,
        resolution: exportConfig.resolution,
        quality: qualityMap[exportConfig.quality],
        frameRate: exportConfig.frameRate
      }

      console.log("📝 最终导出配置:", finalExportConfig)

      // 执行导出
      const videoBlob = await exportTimeline(
        timelineData,
        finalExportConfig,
        (progress) => {
          console.log(`导出进度: ${progress.toFixed(1)}%`)
          // 这里可以通过全局状态或事件传递进度
        }
      )

      console.log("✅ 导出完成，文件大小:", videoBlob.size)

      // 自动下载文件
      const url = URL.createObjectURL(videoBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${exportConfig.name}.${exportConfig.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("视频导出并下载成功！")
      
    } catch (error) {
      console.error("导出失败:", error)
      toast.error(`导出失败: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsExporting(false)
    }
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
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Export Settings</DialogTitle>
              </div>
            </DialogHeader>
            
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
              
              {/* 质量 */}
              <div className="space-y-2">
                <Label>Quality</Label>
                <Select 
                  value={exportConfig.quality}
                  onValueChange={(value: "low" | "medium" | "high") => 
                    setExportConfig(prev => ({ ...prev, quality: value }))
                  }
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
              
              {/* 帧率 */}
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
                  onValueChange={(value: "mp4" | "webm" | "avi" | "mov") => 
                    setExportConfig(prev => ({ ...prev, format: value }))
                  }
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
                disabled={isExporting}
              >
                {isExporting ? "导出中..." : "Export"}
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 