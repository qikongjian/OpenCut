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
import { convertToWebM } from "@/lib/ffmpeg-utils";

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

// 常量定义 - 模块内部使用的固定值
  const handleExport = async () => {
    if (!activeProject) {
      toast.error("没有活动项目");
      return;
    }

    // 检查是否有媒体文件
    if (mediaItems.length === 0) {
      toast.error("请先添加媒体文件到项目中");
      return;
    }

    setIsExporting(true);
    
    try {
      // 获取第一个视频文件作为导出源
      const videoItem = mediaItems.find(item => item.type === "video");
      
      if (!videoItem || !videoItem.file) {
        toast.error("没有找到可导出的视频文件");
        return;
      }

      console.log('Starting video export...', {
        fileName: videoItem.name,
        fileSize: videoItem.file.size,
        fileType: videoItem.file.type
      });

      toast.info("正在导出视频，请稍候...");

      // 使用 FFmpeg 转换视频
      const videoBlob = await convertToWebM(videoItem.file, (progress) => {
        console.log(`导出进度: ${progress.toFixed(1)}%`);
      });

      console.log('Video conversion completed, blob size:', videoBlob.size);

      // 创建下载链接
      const url = URL.createObjectURL(videoBlob);
// 常量定义 - 模块内部使用的固定值
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeProject.name || "opencut-project"}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("视频导出成功！");
      console.log('Video export completed successfully');
    } catch (error) {
      console.error("导出失败:", error);
      
      // 提供更具体的错误信息
      let errorMessage = "导出失败，请重试";
      if (error instanceof Error) {
        if (error.message.includes('FFmpeg')) {
          errorMessage = "视频处理失败，请检查文件格式";
        } else if (error.message.includes('network')) {
          errorMessage = "网络错误，请检查连接";
        } else {
          errorMessage = `导出失败: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
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
      <Button
        size="sm"
        variant="primary"
        className="h-7 text-xs"
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className="h-4 w-4" />
        <span className="text-sm">{isExporting ? "导出中..." : "Export"}</span>
      </Button>
    </nav>
  );

  return (
    <HeaderBase
      leftContent={leftContent}
      centerContent={centerContent}
      rightContent={rightContent}
      className="bg-background h-[3.2rem] px-4 items-center"
    />
  );
}
