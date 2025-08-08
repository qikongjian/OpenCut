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
import { exportTimeline } from "../../lib/ffmpeg-utils"

interface ExportDropdownProps {
  children: React.ReactNode
  onExportProgressOpen?: (exportSettings?: {
    name?: string;
    format?: 'mp4' | 'webm' | 'avi' | 'mov';
    resolution?: '480p' | '720p' | '1080p' | '4k';
    quality?: 'low' | 'medium' | 'high';
    frameRate?: string;
  }) => void
}

interface ExportConfig {
  name: string;
  resolution: '480p' | '720p' | '1080p' | '4k';
  quality: 'low' | 'medium' | 'high';
  frameRate: string;
  format: 'mp4' | 'webm' | 'avi' | 'mov';
}

export function ExportDropdown({
  children,
  onExportProgressOpen
}: ExportDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [videoCover, setVideoCover] = React.useState<string | null>(null)
  const [exportConfig, setExportConfig] = React.useState<ExportConfig>({
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
        console.log("开始生成时间线封面...");

        // 获取时间线状态
        const timelineStore = useTimelineStore.getState();
        const { tracks, getTotalDuration } = timelineStore;

        console.log("时间线状态:", {
          tracksCount: tracks.length,
          totalDuration: getTotalDuration(),
          mediaItemsCount: mediaItems.length
        });

        // 检查是否有时间线内容
        if (tracks.length === 0 || getTotalDuration() === 0) {
          console.log("没有时间线内容，设置封面为null");
          setVideoCover(null);
          return;
        }

        // 获取第一个媒体元素作为封面源
        const firstMediaElement = tracks
          .flatMap(track => track.elements)
          .filter(element => element.type === "media")
          .sort((a, b) => a.startTime - b.startTime)[0];

        console.log("第一个媒体元素:", firstMediaElement);

        if (!firstMediaElement) {
          console.log("没有找到媒体元素");
          setVideoCover(null);
          return;
        }

        // 优先使用时间轴元素中存储的媒体文件副本
        const elementMedia = firstMediaElement as any; // MediaElement

        let mediaItem = null;
        let mediaFile = null;
        let mediaUrl = null;
        let thumbnailUrl = null;

        if (elementMedia.mediaFile) {
          // 使用时间轴元素中的媒体文件副本
          mediaFile = elementMedia.mediaFile;
          mediaUrl = elementMedia.mediaUrl;
          thumbnailUrl = elementMedia.thumbnailUrl;
        } else {
          // 回退到从媒体库中查找
          mediaItem = mediaItems.find(item => item.id === firstMediaElement.mediaId);

          if (!mediaItem) {
            setVideoCover(null);
            return;
          }

          mediaFile = mediaItem.file;
          mediaUrl = mediaItem.url;
          thumbnailUrl = mediaItem.thumbnailUrl;
        }

        // 优先使用已有的缩略图
        if (thumbnailUrl && (thumbnailUrl.startsWith('data:') || thumbnailUrl.startsWith('blob:'))) {
          console.log("使用已有缩略图:", thumbnailUrl.substring(0, 50) + "...");
          setVideoCover(thumbnailUrl);
          return;
        }

        // 检查是否为远程URL（AI剪辑视频）
        const isRemoteUrl = mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'));

        if (isRemoteUrl) {
          console.log("检测到远程URL，尝试直接使用视频帧作为封面");
          // 对于远程URL，尝试生成封面但不依赖File对象
          const video = document.createElement("video");
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.error("无法获取canvas上下文");
            setVideoCover(null);
            return;
          }

          let timeoutId: NodeJS.Timeout;

          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            video.remove();
            canvas.remove();
          };

          video.addEventListener("loadedmetadata", () => {
            console.log("远程视频元数据加载完成:", {
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration
            });

            if (video.videoWidth === 0 || video.videoHeight === 0) {
              console.warn("视频尺寸为0，无法生成封面");
              cleanup();
              setVideoCover(null);
              return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // 使用时间线中的时间点，如果超出视频长度则使用10%位置
            const targetTime = Math.min(firstMediaElement.startTime + firstMediaElement.trimStart, video.duration * 0.1);
            console.log("设置远程视频时间点:", targetTime);
            video.currentTime = targetTime;
          });

          video.addEventListener("seeked", () => {
            console.log("远程视频seek完成，开始绘制封面");
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const coverUrl = canvas.toDataURL("image/jpeg", 0.8);
              console.log("远程视频封面生成成功:", coverUrl.substring(0, 50) + "...");
              setVideoCover(coverUrl);
            } catch (error) {
              console.error("绘制远程视频封面失败:", error);
              setVideoCover(null);
            }
            cleanup();
          });

          video.addEventListener("error", (e) => {
            console.error("远程视频加载错误:", e);
            cleanup();
            setVideoCover(null);
          });

          // 设置超时，避免无限等待
          timeoutId = setTimeout(() => {
            console.warn("远程视频加载超时");
            cleanup();
            setVideoCover(null);
          }, 10000); // 10秒超时

          video.crossOrigin = "anonymous"; // 尝试解决CORS问题
          video.src = mediaUrl;
          video.load();

        } else if (mediaFile) {
          // 本地文件，使用原有逻辑
          console.log("处理本地文件，生成封面");
          const video = document.createElement("video");
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.error("无法获取canvas上下文");
            return;
          }

          let timeoutId: NodeJS.Timeout;

          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            video.remove();
            canvas.remove();
          };

          video.addEventListener("loadedmetadata", () => {
            console.log("本地视频元数据加载完成:", {
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration
            });

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // 使用时间线中的时间点，如果超出视频长度则使用10%位置
            const targetTime = Math.min(firstMediaElement.startTime + firstMediaElement.trimStart, video.duration * 0.1);
            console.log("设置本地视频时间点:", targetTime);
            video.currentTime = targetTime;
          });

          video.addEventListener("seeked", () => {
            console.log("本地视频seek完成，开始绘制封面");
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const coverUrl = canvas.toDataURL("image/jpeg", 0.8);
              console.log("本地视频封面生成成功:", coverUrl.substring(0, 50) + "...");
              setVideoCover(coverUrl);
            } catch (error) {
              console.error("绘制本地视频封面失败:", error);
              setVideoCover(null);
            }
            cleanup();
          });

          video.addEventListener("error", (e) => {
            console.error("本地视频加载错误:", e);
            cleanup();
            setVideoCover(null);
          });

          // 设置超时，避免无限等待
          timeoutId = setTimeout(() => {
            console.warn("本地视频加载超时");
            cleanup();
            setVideoCover(null);
          }, 5000); // 5秒超时

          video.src = URL.createObjectURL(mediaFile);
          video.load();
        } else {
          console.log("没有可用的媒体文件或URL");
          setVideoCover(null);
        }
      } catch (error) {
        console.error("生成时间线封面时出错:", error);

        // 备用方案：尝试使用第一个媒体项的缩略图
        if (mediaItems.length > 0) {
          const firstMediaItem = mediaItems[0];
          if (firstMediaItem.thumbnailUrl) {
            console.log("使用备用缩略图:", firstMediaItem.thumbnailUrl);
            setVideoCover(firstMediaItem.thumbnailUrl);
          }
        }
      }
    };

    // 只有当导出菜单打开时才生成封面
    if (open) {
      generateTimelineCover();
    }

    // 监听手动刷新事件
    const handleRefresh = () => {
      if (open) {
        generateTimelineCover();
      }
    };

    window.addEventListener('refresh-video-cover', handleRefresh);

    return () => {
      window.removeEventListener('refresh-video-cover', handleRefresh);
    };
  }, [mediaItems, open]);

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

  // 直接显示设置页面的处理函数
  const handleShowSettings = () => {
    console.log("Show Settings Directly")
    
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
    if (!activeProject) {
      toast.error("没有活动项目")
      return
    }
    
    // 检查是否有时间线内容
    const timelineStore = useTimelineStore.getState();
    const { tracks, getTotalDuration } = timelineStore;
    
    if (tracks.length === 0 || getTotalDuration() === 0) {
      toast.error("时间线没有内容可导出，请先添加媒体到时间线")
      return
    }

    setOpen(false)
    setShowSettings(false)
    
    // 准备用户配置的导出设置
    const userExportSettings = {
      name: exportConfig.name,
      format: exportConfig.format as 'mp4' | 'webm' | 'avi' | 'mov',
      resolution: exportConfig.resolution as '480p' | '720p' | '1080p' | '4k',
      quality: exportConfig.quality as 'low' | 'medium' | 'high',
      frameRate: exportConfig.frameRate
    };

    console.log("📝 传递用户导出设置:", userExportSettings);
    
    // 触发统一的导出处理，传递用户设置
    onExportProgressOpen?.(userExportSettings)
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
        {/* 直接显示导出设置页面 */}
        <>
          {/* 标题和关闭按钮 */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Export Settings</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-accent/50 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* 影片封面 */}
          <div className="space-y-2">
            <Label htmlFor="video-cover" className="text-sm font-medium">
              Video Cover
            </Label>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border relative">
              {videoCover ? (
                <img 
                  src={videoCover} 
                  alt="Video Cover" 
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("缩略图加载成功")}
                  onError={(e) => {
                    console.error("缩略图加载失败:", e);
                    setVideoCover(null);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <div className="text-white text-sm font-medium">
                    {mediaItems.length > 0 ? "Loading Cover..." : "No Media Available"}
                  </div>
                </div>
              )}
              {/* 刷新按钮 */}
              {!videoCover && mediaItems.length > 0 && (
                <button
                  onClick={() => {
                    console.log("手动刷新缩略图");
                    setVideoCover(null);
                    // 触发重新生成封面
                    setTimeout(() => {
                      // 重新触发useEffect中的封面生成逻辑
                      const event = new CustomEvent('refresh-video-cover');
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white text-xs hover:bg-black/70"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>
          
          {/* 名稱 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <Input 
              id="name"
              value={exportConfig.name}
              onChange={(e) => setExportConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder={generateDefaultName()}
              className="h-9"
            />
          </div>
          
          {/* 解析度 */}
          <div className="space-y-2">
            <Label htmlFor="resolution" className="text-sm font-medium">
              Resolution
            </Label>
            <Select 
              value={exportConfig.resolution}
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, resolution: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
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
            <Label htmlFor="quality" className="text-sm font-medium">
              Quality
            </Label>
            <Select 
              value={exportConfig.quality}
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, quality: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
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
            <Label htmlFor="frameRate" className="text-sm font-medium">
              Frame Rate
            </Label>
            <Select 
              value={exportConfig.frameRate}
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, frameRate: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
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
            <Label htmlFor="format" className="text-sm font-medium">
              Format
            </Label>
            <Select 
              value={exportConfig.format}
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
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
            onClick={handleExport}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" 
          >
            Export
          </Button>
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 