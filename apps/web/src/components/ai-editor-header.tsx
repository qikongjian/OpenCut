"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { GradientText } from "./ui/gradient-text";
import { useTheme } from "next-themes";
import {
  Sun,
  User,
  Sparkles,
  LogOut,
  Bell,
  PanelsLeftBottom,
  Library,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTimelineStore } from "@/stores/timeline-store";
import { HeaderBase } from "./header-base";
import { formatTimeCode } from "@/lib/time";
import { useProjectStore } from "@/stores/project-store";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";

import { usePlaybackStore } from "@/stores/playback-store";
import { TransitionUpIcon } from "./icons";
import { PanelPresetSelector } from "./panel-preset-selector";
import { MovieFlowHeader } from "./layout/movie-flow-header";
import { useAuthSession } from "@/lib/auth-compat";

interface AIEditorHeaderProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function AIEditorHeader({ onToggleSidebar }: AIEditorHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isAuthenticated } = useAuthSession();

  // SmartCut项目相关状态
  const { getTotalDuration } = useTimelineStore();
  const { currentTime } = usePlaybackStore();
  const { activeProject } = useProjectStore();

  // 用户菜单外部点击关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Logo动画处理
  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.classList.remove('on');
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.classList.add('on');
  };



  // 返回上一页的处理函数
  const handleGoBack = () => {
    // 从URL路径中提取项目ID
    // 例如: /ai-editor/6fb14ce4-2d90-4c25-af07-f09c8b66e19c -> 6fb14ce4-2d90-4c25-af07-f09c8b66e19c
    const pathSegments = pathname.split('/');
    const projectId = pathSegments[pathSegments.length - 1]; // 获取路径的最后一段作为项目ID

    if (projectId && projectId !== 'ai-editor' && projectId.length > 10) {
      // 如果有有效的项目ID，跳转到指定的MovieFlow链接，使用项目ID作为episodeId
      const targetUrl = `http://movieflow.ai/create/work-flow?episodeId=${projectId}&from=1`;
      console.log(`🔗 跳转到MovieFlow: ${targetUrl}`);
      window.location.href = targetUrl;
    } else {
      // 如果没有有效的项目ID，执行原来的返回逻辑
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }
  };

  // 左侧内容：返回按钮 + 侧边栏切换 + Logo + 项目菜单
  const leftContent = (
    <div className="flex items-center gap-2">
      {/* 返回按钮 */}
      <Button
        variant="text"
        size="sm"
        onClick={handleGoBack}
        className="movieflow-icon-highlight hover:bg-white/10 transition-colors duration-200"
        title="返回上一页"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* 侧边栏切换按钮（如果提供了回调） */}
      {onToggleSidebar && (
        <Button variant="text" size="sm" onClick={onToggleSidebar}>
          <PanelsLeftBottom className="h-4 w-4" />
        </Button>
      )}

      {/* Logo */}
      <div
        className="flex items-center cursor-pointer space-x-4 logo-container"
        onClick={() => router.push('/')}
        onMouseEnter={handleMouseEnter}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="logo-wrapper">
          <h1 className="text-2xl font-bold">
            <GradientText
              text="MovieFlow"
              startPercentage={30}
              endPercentage={70}
            />
          </h1>
        </div>
      </div>


    </div>
  );

  // 中间内容：时间码显示
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

  // 右侧内容：功能按钮 + 用户菜单
  const rightContent = (
    <div className="flex items-center space-x-4">
      {/* Pricing Link */}
      <Button
        variant="text"
        size="sm"
        onClick={() => window.open('https://pre.pi.huiying.video/pricing', '_blank')}
        className="text-gray-300 hover:text-white"
      >
        Pricing
      </Button>
      
      {/* 面板预设选择器 */}
      <PanelPresetSelector />
      
      {/* 键盘快捷键帮助 */}
      <KeyboardShortcutsHelp />
      
      {/* 导出按钮 */}
      <ExportButton />
      
      {/* 通知按钮 */}
      <Button variant="text" size="sm">
        <Bell className="h-4 w-4" />
      </Button>

      {/* 主题切换 */}
      <Button
        size="icon"
        variant="text"
        className="h-7"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="!size-[1.1rem]" />
        <span className="sr-only">{theme === "dark" ? "Light" : "Dark"}</span>
      </Button>

      {/* 用户菜单 */}
      <div className="relative">
        <Button 
          ref={buttonRef}
          variant="text" 
          size="sm"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          data-alt="user-menu-trigger"
        >
          <User className="h-4 w-4" />
        </Button>
        
        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 bg-[#1E1E1E] rounded-lg shadow-lg overflow-hidden z-50"
              data-alt="user-menu-dropdown"
            >
              {/* User Info */}
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-[#1E4D3E] flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Editor User</p>
                    <p className="text-xs text-gray-500">smartcut.ai</p>
                  </div>
                </div>
              </div>

              {/* AI Points */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-white underline text-sm">100 点数</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-white border-white hover:bg-white/10 rounded-full px-8"
                >
                  升级
                </Button>
              </div>
              
              {/* Menu Items */}
              <div className="p-2">
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-white"
                  onClick={() => window.open('https://pre.pi.huiying.video/pricing', '_blank')}
                  data-alt="upgrade-button"
                >
                  <Crown className="h-4 w-4" />
                  <span>升级</span>
                </motion.button>

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-white"
                  onClick={() => window.open('https://pre.pi.huiying.video/my-library', '_blank')}
                  data-alt="my-library-button"
                >
                  <Library className="h-4 w-4" />
                  <span>我的库</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-white"
                  onClick={() => {
                    // 处理退出登录
                    setIsUserMenuOpen(false);
                    // 跳转到登录页面或首页
                    window.location.href = 'https://pre.pi.huiying.video/logout';
                  }}
                  data-alt="logout-button"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出账号</span>
                </motion.button>

                {/* Footer */}
                <div className="mt-4 px-3 py-2 text-xs text-gray-400 text-center">
                  <div>隐私权和条款 · 许可</div>
                  <div>MovieFlow | {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // 如果用户已登录，使用MovieFlowHeader组件，但需要自定义中间内容
  if (isAuthenticated) {
    return (
      <div className="fixed right-0 top-0 left-0 h-16 header z-[999]" style={{ isolation: 'isolate' }}>
        <div className="h-full flex items-center justify-between pr-6 pl-6">
          <div className="flex items-center space-x-4">
            {/* 返回按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="movieflow-icon-highlight hover:bg-white/10 transition-colors duration-200"
              title="返回上一页"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* 侧边栏切换按钮 */}
            {onToggleSidebar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleSidebar}
              >
                <PanelsLeftBottom className="h-4 w-4" />
              </Button>
            )}

            {/* Logo */}
            <div
              className={`flex items-center cursor-pointer space-x-4 link-logo roll event-on`}
              onClick={() => router.push("/")}
              onMouseEnter={handleMouseEnter}
              onAnimationEnd={handleAnimationEnd}
            >
              <span className="translate">
                <span>
                  <h1 className="logo text-2xl font-bold">
                    <GradientText
                      text="MovieFlow"
                      startPercentage={30}
                      endPercentage={70}
                    />
                  </h1>
                </span>
                <span>
                  <h1 className="logo text-2xl font-bold">
                    <GradientText
                      text="MovieFlow"
                      startPercentage={30}
                      endPercentage={70}
                    />
                  </h1>
                </span>
              </span>
              {/* beta标签 */}
              <div className="relative transform translate-y-[-1px]">
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[rgb(212 202 202)] border border-[rgba(106,244,249,0.2)] rounded-full shadow-[0_0_10px_rgba(106,244,249,0.1)]">
                  Beta
                </span>
              </div>
            </div>
          </div>

          {/* 中间内容：时间码显示 */}
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

          <div className="flex items-center space-x-4">
            {/* Pricing Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://pre.pi.huiying.video/pricing', '_blank')}
              className="text-gray-300 hover:text-white"
            >
              Pricing
            </Button>

            {/* Export Button */}
            <ExportButton />

            {/* Panel Preset Selector */}
            <PanelPresetSelector />

            {/* User Menu */}
            {rightContent}
          </div>
        </div>
      </div>
    );
  }

  // 未登录用户使用原有的header布局
  return (
    <>
      <style jsx>{`
        .logo-container {
          pointer-events: initial;
          overflow: hidden;
        }

        .logo-wrapper {
          display: inline-block;
        }

        @keyframes logoAnimation {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(0, 100%);
          }
        }

        @media (pointer: fine) {
          .logo-container.on .logo-wrapper {
            animation-name: logoAnimation;
            animation-play-state: running;
            animation-iteration-count: 1;
            animation-duration: 0.4s;
            animation-timing-function: cubic-bezier(0.16, 0.03, 0.08, 1.55);
          }
        }
      `}</style>

      <HeaderBase
        leftContent={leftContent}
        centerContent={centerContent}
        rightContent={rightContent}
        className="bg-background h-[3.2rem] px-3 items-center mt-0.5"
      />
    </>
  );
}

// 导出按钮组件（复用现有的ExportButton）
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

      // 智能Export
      const result = await exportManager.smartExport(
        {
          privacy: 'balanced',
          quality: 'standard',
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

      // 自动下载
      if (result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.filename || 'smartcut-ai-export.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 显示成功消息
        console.log("Export成功:", {
          size: `${(result.size! / 1024 / 1024).toFixed(1)}MB`,
          duration: `${result.duration?.toFixed(1)}秒`,
          method: result.method,
          quality: result.quality
        });
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
