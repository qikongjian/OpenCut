// editor-header.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/editor-header.tsx
// 最后更新: 2025/7/23

// editor-header.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 Next.js 相关模块
import Link from "next/link";
// 导入本地模块
import { Button } from "./ui/button";
// 导入 React 核心库
import { ChevronLeft, Download } from "lucide-react";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入本地模块
import { HeaderBase } from "./header-base";
// 导入导出引擎  
import { ultraFastExportTimeline } from "@/lib/ffmpeg/operations/ultra-fast-export";
// 导入项目模块
import { formatTimeCode } from "@/lib/time";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入本地模块
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";
// 导入 React 核心库
import { useState, useRef } from "react";
// 导入项目模块
import { Input } from "@/components/ui/input";
// 导入项目模块
import { useMediaStore } from "@/stores/media-store";
// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入 FFmpeg 视频处理库
import { convertToWebM, exportVideo, exportTimeline, fastExportTimeline, cancelCurrentExport } from "@/lib/ffmpeg";
// 导入导出系统组件
import { ExportDropdown } from "./export/export-dropdown";
import { ExportSettings, ExportProgress, ExportSuccess } from "./export/index";

// EditorHeader 函数
// 导出组件 - 可复用的 UI 组件
export function EditorHeader() {
// 常量定义 - 模块内部使用的固定值
  const { getTotalDuration } = useTimelineStore();
// 常量定义 - 模块内部使用的固定值
  const { activeProject, renameProject } = useProjectStore();
// 常量定义 - 模块内部使用的固定值
  const { mediaItems } = useMediaStore();
// 状态管理 - 创建和管理组件内部状态
  const [isEditing, setIsEditing] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [newName, setNewName] = useState(activeProject?.name || "");
// 状态管理 - 创建和管理组件内部状态
  const [isExporting, setIsExporting] = useState(false);
// 常量定义 - 模块内部使用的固定值
  const inputRef = useRef<HTMLInputElement>(null);

  // 导出系统状态管理
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccessOpen, setExportSuccessOpen] = useState(false);
  const [exportedFileName, setExportedFileName] = useState('');
  const [exportedVideoCover, setExportedVideoCover] = useState<string>('');

// 导出进度处理
  const handleExportProgressOpen = async (exportSettings?: {
    name?: string;
    format?: 'mp4' | 'webm' | 'avi' | 'mov';
    resolution?: '480p' | '720p' | '1080p' | '4k';
    quality?: 'low' | 'medium' | 'high';
    frameRate?: string;
  }) => {
    if (!activeProject) {
      toast.error("No active project");
      return;
    }

    // 检查是否有时间线内容
    const timelineStore = useTimelineStore.getState();
    const { tracks, getTotalDuration, setExporting } = timelineStore;
    
    if (tracks.length === 0 || getTotalDuration() === 0) {
      toast.error("No timeline content to export. Please add media to the timeline first.");
      return;
    }

    // 设置导出状态，禁用自动保存
    setExporting(true);
    setExportProgressOpen(true);
    setIsExporting(true);
    
    try {
      // 分析时间线内容
      const allElements = tracks.flatMap(track => track.elements);
      const mediaElements = allElements.filter(el => el.type === "media");
      const textElements = allElements.filter(el => el.type === "text");
      const transitionElements = allElements.filter(el => el.type === "transition");

      console.log('Starting timeline export...', {
        totalDuration: getTotalDuration(),
        tracksCount: tracks.length,
        totalElements: allElements.length,
        mediaElements: mediaElements.length,
        textElements: textElements.length,
        transitionElements: transitionElements.length
      });

      // 详细记录字幕和转场信息
      if (textElements.length > 0) {
        console.log('📝 Text elements found:', textElements.map(el => ({
          id: el.id,
          content: el.content,
          startTime: el.startTime,
          duration: el.duration
        })));
      }

      if (transitionElements.length > 0) {
        console.log('🎬 Transition elements found:', transitionElements.map(el => ({
          id: el.id,
          type: el.transitionType,
          startTime: el.startTime,
          duration: el.duration
        })));
      }

      // 实现真正的时间线导出
      // 收集时间线上的所有媒体元素并按照时间线顺序组合视频
      
      // 获取时间线数据
      const timelineData = {
        tracks: tracks,
        totalDuration: getTotalDuration()
      };
      
      // 使用用户配置的导出设置，如果没有则使用默认值
      const exportConfig = {
        format: exportSettings?.format || 'mp4' as const,
        resolution: exportSettings?.resolution || '720p' as const,
        quality: exportSettings?.quality || 'medium' as const,
        frameRate: exportSettings?.frameRate || '30'
      };

      console.log('🚀 Using export settings:', exportConfig);

      // 暂时回到原始的 fastExportTimeline 函数，因为ultra-fast版本有逻辑问题
      const videoBlob = await fastExportTimeline(
        timelineData,
        exportConfig,
        (progress: number) => {
          console.log(`⚡ 快速导出进度: ${progress.toFixed(1)}%`);
          setExportProgress(progress);
        }
      );

      console.log('Video conversion completed, blob size:', videoBlob.size);

      // 使用用户设置的文件名，如果没有则使用项目名称
      const fileName = exportSettings?.name 
        ? `${exportSettings.name}.${exportConfig.format}`
        : `${activeProject?.name || "opencut-project"}.${exportConfig.format}`;
      setExportedFileName(fileName);

      // 生成视频封面
      const generateVideoCover = async () => {
        try {
          const video = document.createElement('video');
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return '';
          
          video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.currentTime = Math.min(1, video.duration * 0.1); // 取视频10%位置的帧
          });
          
          video.addEventListener('seeked', () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const coverUrl = canvas.toDataURL('image/jpeg', 0.8);
            setExportedVideoCover(coverUrl);
            video.remove();
            canvas.remove();
          });
          
          video.addEventListener('error', () => {
            console.error('Failed to generate video cover');
            video.remove();
            canvas.remove();
          });
          
          video.src = URL.createObjectURL(videoBlob);
          video.load();
        } catch (error) {
          console.error('Error generating video cover:', error);
        }
      };
      
      // 生成视频封面
      generateVideoCover();

      // 保存视频blob到全局变量，供下载使用
      (window as any).lastExportedVideo = videoBlob;

      // 自动下载视频
      const autoDownload = () => {
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Video downloaded successfully!");
      };

      // 显示成功弹窗并自动下载
      setExportSuccessOpen(true);
      autoDownload(); // 自动下载
      console.log('Timeline export completed successfully');
      
      // 关闭进度弹窗
      setTimeout(() => {
        setExportProgressOpen(false);
        setExportProgress(0);
      }, 500);
      
    } catch (error) {
      console.error("Export failed:", error);
      
      // 处理用户取消的情况
      if (error instanceof Error && error.message.includes('Export cancelled by user')) {
        toast.info("Export cancelled by user");
      } else {
      // 提供更具体的错误信息
      let errorMessage = "Export failed, please try again";
      if (error instanceof Error) {
        if (error.message.includes('FFmpeg processing error')) {
          errorMessage = error.message;
        } else if (error.message.includes('Unsupported video format')) {
          errorMessage = error.message;
        } else if (error.message.includes('Insufficient memory')) {
          errorMessage = "Video file too large, please try a smaller file";
        } else if (error.message.includes('Codec error')) {
          errorMessage = "Video codec not supported, please try a different file";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error, please check connection";
        } else {
          errorMessage = `Export failed: ${error.message}`;
        }
        }
        toast.error(errorMessage);
      }
      
      setExportProgressOpen(false);
      setExportProgress(0);
    } finally {
      // 重置导出状态，恢复自动保存
      const timelineStore = useTimelineStore.getState();
      timelineStore.setExporting(false);
      setIsExporting(false);
    }
  };



  // 取消导出
  const handleCancelExport = () => {
    console.log('🛑 User cancelled export');
    // 取消FFmpeg处理
    cancelCurrentExport();
    
    // 重置导出状态
    const timelineStore = useTimelineStore.getState();
    timelineStore.setExporting(false);
    
    // 重置UI状态
    setExportProgressOpen(false);
    setExportProgress(0);
    setIsExporting(false);
    
    toast.info("Export cancelled");
  };

  // 处理下载
  const handleDownload = () => {
    const videoBlob = (window as any).lastExportedVideo;
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Video downloaded successfully!");
    } else {
      toast.error("No video available for download");
    }
  };

// handleNameClick 函数
  const handleNameClick = () => {
    if (!activeProject) return;
    setNewName(activeProject.name);
    setIsEditing(true);
  };

// 常量定义 - 模块内部使用的固定值
  const handleNameSave = async () => {
    if (activeProject && newName.trim() && newName !== activeProject.name) {
      try {
        await renameProject(activeProject.id, newName.trim());
      } catch (error) {
        console.error("Failed to rename project:", error);
        setNewName(activeProject.name);
      }
    }
    setIsEditing(false);
  };

// handleInputKeyDown 函数
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleNameSave();
    else if (e.key === "Escape") setIsEditing(false);
  };

// leftContent 函数
  const leftContent = (
    <div className="flex items-center gap-2">
      <Link
        href="/projects"
        className="font-medium tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <div className="w-[14rem] h-9 flex items-center">
        {isEditing ? (
          <Input
            ref={inputRef}
            className="text-sm font-medium px-2 py-1 h-9 truncate"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleInputKeyDown}
            onFocus={(e) => e.target.select()}
            maxLength={64}
            aria-label="Project name"
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-medium cursor-pointer hover:underline"
            title="Click to rename"
            role="button"
            tabIndex={0}
            onClick={handleNameClick}
            onKeyDown={(e) => e.key === "Enter" && handleNameClick()}
          >
            <div className="truncate text-ellipsis overflow-clip w-40">
              {activeProject?.name}
            </div>
          </span>
        )}
      </div>
    </div>
  );

// centerContent 函数
  const centerContent = (
    <div className="flex items-center gap-2 text-xs">
      <span>
        {formatTimeCode(
          getTotalDuration(),
          "HH:MM:SS:FF",
          activeProject?.fps || 30
        )}
      </span>
    </div>
  );

// rightContent 函数
  const rightContent = (
    <nav className="flex items-center gap-2">
      <KeyboardShortcutsHelp />
      <ExportDropdown onExportProgressOpen={handleExportProgressOpen}>
      <Button
        size="sm"
        variant="primary"
        className="h-7 text-xs"
        disabled={isExporting}
      >
        <Download className="h-4 w-4" />
          <span className="text-sm">{isExporting ? "Exporting..." : "Export"}</span>
      </Button>
      </ExportDropdown>
    </nav>
  );

  return (
    <>
    <HeaderBase
      leftContent={leftContent}
      centerContent={centerContent}
      rightContent={rightContent}
      className="bg-background h-[3.2rem] px-4 items-center"
    />

      {/* 导出系统弹窗 */}
      <ExportProgress
        open={exportProgressOpen}
        onOpenChange={setExportProgressOpen}
        progress={exportProgress}
        status={isExporting 
          ? exportProgress < 99 
            ? "Processing..." 
            : "Finalizing..." 
          : "Completed"}
        onCancel={handleCancelExport}
      />

      {/* 导出成功弹窗 */}
      <ExportSuccess
        open={exportSuccessOpen}
        onOpenChange={setExportSuccessOpen}
        fileName={exportedFileName}
        videoCover={exportedVideoCover}
        onDownload={handleDownload}
      />
    </>
  );
}
