// export-dropdown.tsx - 导出下拉菜单组件
// 此文件包含 导出下拉菜单组件 的相关代码
// 文件路径: components/export/export-dropdown.tsx
// 最后更新: 2025/1/27

"use client"

import * as React from "react"
import { MessageCircle, Play, Download, MoreHorizontal, ChevronLeft, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
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
import { ExportOptionCard } from "./export-option-card"
import { SocialPlatformCard } from "./social-platform-card"
import { useMediaStore } from "../../stores/media-store"
import { useProjectStore } from "../../stores/project-store"
import { toast } from "sonner"
import { useTimelineStore } from "../../stores/timeline-store"

interface ExportDropdownProps {
  children: React.ReactNode
  onExportProgressOpen?: () => void
}

export function ExportDropdown({
  children,
  onExportProgressOpen
}: ExportDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [videoCover, setVideoCover] = React.useState<string | null>(null)
  const [exportConfig, setExportConfig] = React.useState({
    name: "202507271044",
    resolution: "720p",
    quality: "medium",
    frameRate: "30",
    format: "mp4"
  })

  const { mediaItems } = useMediaStore()
  const { activeProject } = useProjectStore()

  // 获取时间线编辑后的视频封面
  React.useEffect(() => {
    const generateTimelineCover = async () => {
      try {
        // 获取时间线状态
        const timelineStore = useTimelineStore.getState();
        const { tracks, getTotalDuration } = timelineStore;
        
        // 检查是否有时间线内容
        if (tracks.length === 0 || getTotalDuration() === 0) {
          setVideoCover(null);
          return;
        }

        // 获取第一个媒体元素作为封面源
        const firstMediaElement = tracks
          .flatMap(track => track.elements)
          .filter(element => element.type === "media")
          .sort((a, b) => a.startTime - b.startTime)[0];

        if (!firstMediaElement) {
          setVideoCover(null);
          return;
        }

        // 找到对应的媒体文件
        const mediaItem = mediaItems.find(item => item.id === firstMediaElement.mediaId);
        if (!mediaItem || !mediaItem.file) {
          setVideoCover(null);
          return;
        }

        // 生成封面（使用时间线中的时间点）
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        video.addEventListener("loadedmetadata", () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // 使用时间线中的时间点，考虑trimStart
          const timelineTime = firstMediaElement.startTime + firstMediaElement.trimStart;
          const videoTime = Math.min(timelineTime, video.duration * 0.1);
          video.currentTime = videoTime;
        });

        video.addEventListener("seeked", () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8)
          setVideoCover(thumbnailUrl)
          
          // 清理
          video.remove()
          canvas.remove()
        });

        video.addEventListener("error", () => {
          console.error("Could not load video for timeline cover generation")
          video.remove()
          canvas.remove()
        });

        video.src = URL.createObjectURL(mediaItem.file)
        video.load()
      } catch (error) {
        console.error("Failed to generate timeline cover:", error)
        setVideoCover(null)
      }
    }

    generateTimelineCover()
  }, [mediaItems])

  const handleShareForReview = () => {
    console.log("Share for Review")
    setOpen(false)
    // TODO: 实现分享以供审阅功能
  }

  const handleShareAsPresentation = () => {
    console.log("Share as Presentation")
    setOpen(false)
    // TODO: 实现作为简报分享功能
  }

  const handleSocialPlatformClick = (platform: string) => {
    console.log("选择社交平台:", platform)
    setOpen(false)
    // TODO: 实现社交平台分享功能
  }

  const handleDownload = () => {
    console.log("Download - Show Settings")
    
    // 检查是否有活动项目
    if (!activeProject) {
      toast.error("No active project")
      return
    }

    // 检查是否有时间线内容
    const timelineStore = useTimelineStore.getState();
    const { tracks, getTotalDuration } = timelineStore;
    
    if (tracks.length === 0 || getTotalDuration() === 0) {
      toast.error("No timeline content to export. Please add media to the timeline first.")
      return
    }

    // 生成默认文件名
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const defaultName = `${year}${month}${day}${hour}${minute}`
    
    setExportConfig(prev => ({ ...prev, name: defaultName }))
    setShowSettings(true)
  }

  const handleBack = () => {
    setShowSettings(false)
  }

  const handleExport = async () => {
    console.log("Start export:", exportConfig)
    
    // 检查是否有时间线内容
    const timelineStore = useTimelineStore.getState();
    const { tracks, getTotalDuration } = timelineStore;
    
    if (tracks.length === 0 || getTotalDuration() === 0) {
      toast.error("No timeline content to export. Please add media to the timeline first.")
      return
    }

    setOpen(false)
    setShowSettings(false)
    
    // 触发导出进度
    onExportProgressOpen?.()
  }

  const handleClose = () => {
    setOpen(false)
    setShowSettings(false)
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
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-4 space-y-4"
        sideOffset={8}
      >
        {!showSettings ? (
          // 主导出菜单
          <>
            {/* 标题 */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Export</h3>
            </div>

            {/* 分享以供審閱 */}
            <ExportOptionCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="Share for Review"
              description="People can add comments to your video."
              onClick={handleShareForReview}
            />
            
            {/* 作為簡報分享 */}
            <ExportOptionCard
              icon={<Play className="w-5 h-5" />}
              title="Share as Presentation"
              description="People can only watch your video."
              onClick={handleShareAsPresentation}
            />
            
            {/* 分享到社群平台 */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground text-sm">Share to Social Platforms</h4>
              <div className="grid grid-cols-4 gap-2">
                <SocialPlatformCard 
                  platform="tiktok" 
                  name="TikTok" 
                  onClick={() => handleSocialPlatformClick('tiktok')}
                  className="min-h-[60px]"
                />
                <SocialPlatformCard 
                  platform="tiktok-ads" 
                  name="TikTok Ads Manager" 
                  onClick={() => handleSocialPlatformClick('tiktok-ads')}
                  className="min-h-[60px]"
                />
                <SocialPlatformCard 
                  platform="youtube" 
                  name="YouTube" 
                  onClick={() => handleSocialPlatformClick('youtube')}
                  className="min-h-[60px]"
                />
                <SocialPlatformCard 
                  platform="youtube-shorts" 
                  name="YouTube Shorts" 
                  onClick={() => handleSocialPlatformClick('youtube-shorts')}
                  className="min-h-[60px]"
                />
                <SocialPlatformCard 
                  platform="facebook" 
                  name="Facebook Page" 
                  onClick={() => handleSocialPlatformClick('facebook')}
                  className="min-h-[60px]"
                />
                <SocialPlatformCard 
                  platform="instagram" 
                  name="Instagram Reels" 
                  onClick={() => handleSocialPlatformClick('instagram')}
                  className="min-h-[60px]"
                />
                <SocialPlatformCard 
                  platform="schedule" 
                  name="Schedule" 
                  badge="Free"
                  onClick={() => handleSocialPlatformClick('schedule')}
                  className="min-h-[60px]"
                />
                {/* 更多选项按钮 */}
                <button className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors min-h-[60px] w-full">
                  <MoreHorizontal className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            {/* 下載 */}
            <ExportOptionCard
              icon={<Download className="w-5 h-5" />}
              title="Download"
              onClick={handleDownload}
            />
          </>
        ) : (
          // 导出设置页面
          <>
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
                onClick={handleClose}
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
                  {videoCover ? (
                    <img 
                      src={videoCover} 
                      alt="Video Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <div className="text-white text-sm font-medium">Video Cover Preview</div>
                    </div>
                  )}
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 