"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  ChevronDown,
  ArrowLeft,
  Download,
  SquarePen,
  Trash,
  Sun,
} from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { HeaderBase } from "./header-base";
import { formatTimeCode } from "@/lib/time";
import { useProjectStore } from "@/stores/project-store";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { RenameProjectDialog } from "./rename-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { useRouter } from "next/navigation";
import { FaDiscord } from "react-icons/fa6";
import { useTheme } from "next-themes";
import { usePlaybackStore } from "@/stores/playback-store";
import { TransitionUpIcon } from "./icons";
import { PanelPresetSelector } from "./panel-preset-selector";

export function EditorHeader() {
  const { getTotalDuration } = useTimelineStore();
  const { currentTime } = usePlaybackStore();
  const { activeProject, renameProject, deleteProject } = useProjectStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleNameSave = async (newName: string) => {
    console.log("handleNameSave", newName);
    if (activeProject && newName.trim() && newName !== activeProject.name) {
      try {
        await renameProject(activeProject.id, newName.trim());
        setIsRenameDialogOpen(false);
      } catch (error) {
        console.error("Failed to rename project:", error);
      }
    }
  };

  const handleDelete = () => {
    if (activeProject) {
      deleteProject(activeProject.id);
      setIsDeleteDialogOpen(false);
      router.push("/projects");
    }
  };

  const leftContent = (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="h-auto py-1.5 px-2.5 flex items-center justify-center"
          >
            <ChevronDown className="text-muted-foreground" />
            <span className="text-[0.85rem] mr-2">{activeProject?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 z-100">
          <Link href="/projects">
            <DropdownMenuItem className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Projects
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="flex items-center gap-1.5"
            onClick={() => setIsRenameDialogOpen(true)}
          >
            <SquarePen className="h-4 w-4" />
            Rename project
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="flex items-center gap-1.5"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="https://discord.gg/zmR9N35cjK"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <FaDiscord className="h-4 w-4" />
              Discord
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameProjectDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onConfirm={handleNameSave}
        projectName={activeProject?.name || ""}
      />
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        projectName={activeProject?.name || ""}
      />
    </div>
  );

  const centerContent = (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-foreground tabular-nums">
        {formatTimeCode(currentTime, "HH:MM:SS:FF", activeProject?.fps || 30)}
      </span>
      <span className="text-foreground/50">/</span>
      <span className="text-foreground/50 tabular-nums">
        {formatTimeCode(
          getTotalDuration(),
          "HH:MM:SS:FF",
          activeProject?.fps || 30
        )}
      </span>
    </div>
  );

  const rightContent = (
    <nav className="flex items-center gap-2">
      <PanelPresetSelector />
      <KeyboardShortcutsHelp />
      <ExportButton />
      <Button
        size="icon"
        variant="text"
        className="h-7"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="!size-[1.1rem]" />
        <span className="sr-only">{theme === "dark" ? "Light" : "Dark"}</span>
      </Button>
    </nav>
  );

  return (
    <HeaderBase
      leftContent={leftContent}
      centerContent={centerContent}
      rightContent={rightContent}
      className="bg-background h-[3.2rem] px-3 items-center mt-0.5"
    />
  );
}

function ExportButton() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState<number>(0);
  const [exportMessage, setExportMessage] = React.useState<string>("");

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage("初始化Export系统...");

    try {
      // 动态导入Export系统
      const { exportManager } = await import("@/lib/export");

      // 初始化Export管理器
      await exportManager.initialize();
      console.log("Export管理器初始化完成");

      setExportMessage("分析项目...");
      setExportProgress(0.1);

      // 检查项目数据
      const { IRGenerator } = await import("@/lib/export");
      const ir = IRGenerator.generateIR();
      console.log("生成的IR:", ir);

      if (!ir.video.length && !ir.audio.length && !ir.texts.length) {
        throw new Error("项目为空，请先添加媒体内容");
      }

      console.log(`项目信息: ${ir.video.length}个视频, ${ir.audio.length}个音频, ${ir.texts.length}个文本, 总时长${(ir.duration/1000).toFixed(1)}秒`);

      // 🚀 优化：根据原视频分辨率自动选择质量
      // 分析视频分辨率，选择合适的质量设置
      let quality: 'preview' | 'standard' | 'professional' = 'standard';

      // 如果是高分辨率视频（1080p及以上），使用标准质量以平衡速度和质量
      // 如果是4K视频，仍使用标准质量避免过慢
      if (ir.width >= 1920 && ir.height >= 1080) {
        quality = 'standard'; // 保持标准质量，确保合理的导出速度
      } else if (ir.width >= 1280 && ir.height >= 720) {
        quality = 'standard'; // 720p使用标准质量
      } else {
        quality = 'preview'; // 低分辨率使用预览质量，加快速度
      }

      console.log(`🎬 视频分辨率: ${ir.width}x${ir.height}, 选择质量: ${quality}`);

      // 智能Export
      const result = await exportManager.smartExport(
        {
          privacy: 'balanced',
          quality: quality,
          allowCloudProcessing: true,
        },
        (progress) => {
          setExportProgress(progress.overall);
          setExportMessage(progress.message || "处理中...");
        }
      );

      // Export成功
      setExportMessage("Export完成!");
      setExportProgress(1);

      // 🚀 新增：调用粗剪视频接口
      if (result.url && result.blob) {
        try {
          setExportMessage("正在调用粗剪视频接口...");
          
          // 🔐 初始化token系统
          const { initializeTokenSystem } = await import("@/lib/ai-editing-auth");
          try {
            await initializeTokenSystem();
            console.log('✅ 导出按钮token系统初始化成功');
          } catch (error) {
            console.warn('⚠️ 导出按钮token系统初始化失败:', error);
          }
          
          // 动态导入粗剪客户端
          const { roughCutClient } = await import("@/lib/rough-cut-client");
          
          // 从多个来源获取当前项目ID
          const { getProjectIdFromMultipleSources } = await import("@/lib/project-utils");
          const currentProjectId = getProjectIdFromMultipleSources();
          
          // 调用粗剪接口
          const roughCutResult = await roughCutClient.callRoughCutAPI({
            projectId: currentProjectId,
            videoUrl: result.url, // 这里使用blob URL，实际应该使用七牛云URL
            taskName: 'generate_final_simple_video',
            onProgress: (progress) => {
              setExportMessage(progress.message);
              if (progress.stage === 'completed') {
                setExportMessage("粗剪接口调用成功！");
              } else if (progress.stage === 'failed') {
                setExportMessage("粗剪接口调用失败");
              }
            }
          });
          
          if (roughCutResult.success) {
            console.log("✅ 粗剪视频接口调用成功:", roughCutResult);
            setExportMessage("粗剪接口调用成功！");
          } else {
            console.warn("⚠️ 粗剪视频接口调用失败:", roughCutResult.error);
            setExportMessage("粗剪接口调用失败");
          }
          
        } catch (error) {
          console.error("❌ 调用粗剪接口异常:", error);
          setExportMessage("粗剪接口调用异常");
        }
      }

      // 🚀 修复：使用统一的下载工具，确保直接下载
      if (result.url) {
        // 动态导入下载工具
        const { downloadExportResult } = await import("@/lib/download-utils");

        const success = await downloadExportResult(
          result.url,
          result.filename || 'opencut-export.mp4',
          result.size,
          async () => {
            // 下载前的回调：调用粗剪接口
            try {
              const { exportManager } = await import('@/lib/export/export-manager');
              await exportManager.callRoughCutAPI(result.url!, result);
            } catch (error) {
              console.warn('⚠️ 粗剪接口调用失败，但继续下载:', error);
            }
          }
        );

        // 显示成功消息
        console.log("Export成功:", {
          size: `${(result.size! / 1024 / 1024).toFixed(1)}MB`,
          duration: `${result.duration?.toFixed(1)}秒`,
          method: result.method,
          quality: result.quality
        });

        if (!success) {
          console.warn("自动下载失败，用户需要手动下载");
        }
      }

    } catch (error) {
      // 更详细的错误日志
      console.error('Export失败:', error);
      const msg = (error && typeof error === 'object' && 'message' in (error as any))
        ? String((error as any).message)
        : (error instanceof Error ? error.message : '未知错误');
      setExportMessage('Export失败: ' + msg);

      // 3秒后重置状态
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage('');
      }, 3000);
      return;
    }

    // 2秒后重置状态
    setTimeout(() => {
      setIsExporting(false);
      setExportProgress(0);
      setExportMessage("");
    }, 2000);
  };

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 bg-[#38BDF8] text-white rounded-md px-[0.1rem] py-[0.1rem] transition-all duration-200 ${
          isExporting ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:brightness-95'
        }`}
        onClick={handleExport}
        disabled={isExporting}
      >
        <div className="flex items-center gap-1.5 bg-linear-270 from-[#2567EC] to-[#37B6F7] rounded-[0.8rem] px-4 py-1 relative shadow-[0_1px_3px_0px_rgba(0,0,0,0.45)]">
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin z-50" />
          ) : (
            <TransitionUpIcon className="z-50" />
          )}
          <span className="text-[0.875rem] z-50 min-w-[3rem]">
            {isExporting ? `${Math.round(exportProgress * 100)}%` : 'Export'}
          </span>
          <div className="absolute w-full h-full left-0 top-0 bg-linear-to-t from-white/0 to-white/50 z-10 rounded-[0.8rem] flex items-center justify-center">
            <div className="absolute w-[calc(100%-4px)] h-[calc(100%-4px)] top-[0.12rem] bg-linear-270 from-[#2567EC] to-[#37B6F7] z-50 rounded-lg"></div>
          </div>
          {/* 进度条 */}
          {isExporting && (
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-[0.8rem] z-60 transition-all duration-300"
                 style={{ width: `${exportProgress * 100}%` }} />
          )}
        </div>
      </button>

      {/* 进度提示 */}
      {isExporting && exportMessage && (
        <div className="absolute top-full left-0 mt-2 px-3 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-50">
          {exportMessage}
        </div>
      )}
    </div>
  );
}
