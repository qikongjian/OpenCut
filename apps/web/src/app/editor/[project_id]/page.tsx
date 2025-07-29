// page.tsx - Next.js 页面组件
// 此文件包含 next.js 页面组件 的相关代码
// 文件路径: app/editor/[project_id]/page.tsx
// 最后更新: 2025/7/23

// page.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { useEffect, useRef } from "react";
// 导入 Next.js 相关模块
import { useParams, useRouter } from "next/navigation";
// 导入模块
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../../components/ui/resizable";
// 导入本地模块
import { MediaPanel } from "../../../components/editor/media-panel";
// 导入本地模块
import { PropertiesPanel } from "../../../components/editor/properties-panel";
// 导入本地模块
import { Timeline } from "../../../components/editor/timeline";
// 导入本地模块
import { PreviewPanel } from "../../../components/editor/preview-panel";
// 导入项目模块
import { EditorHeader } from "@/components/editor-header";
// 导入项目模块
import { usePanelStore } from "@/stores/panel-store";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入项目模块
import { useEditorStore } from "@/stores/editor-store";
// 导入项目模块
import { EditorProvider } from "@/components/editor-provider";
// 导入项目模块
import { usePlaybackControls } from "@/hooks/use-playback-controls";
// 导入项目模块
import { Onboarding } from "@/components/onboarding";

// Editor 函数
// 默认导出组件 - 页面或主要组件
export default function Editor() {
// 常量定义 - 模块内部使用的固定值
  const {
    toolsPanel,
    previewPanel,
    mainContent,
    timeline,
    setToolsPanel,
    setPreviewPanel,
    setMainContent,
    setTimeline,
    propertiesPanel,
    setPropertiesPanel,
  } = usePanelStore();

// 常量定义 - 模块内部使用的固定值
  const { activeProject, loadProject, createNewProject } = useProjectStore();
// 常量定义 - 模块内部使用的固定值
  const params = useParams();
// 常量定义 - 模块内部使用的固定值
  const router = useRouter();
// 常量定义 - 模块内部使用的固定值
  const projectId = params.project_id as string;
// 常量定义 - 模块内部使用的固定值
  const handledProjectIds = useRef<Set<string>>(new Set());

  usePlaybackControls();

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    const initProject = async () => {
      if (!projectId) return;

      // 如果当前活动项目ID已经匹配，且项目存在，则不需要重新加载
      if (activeProject?.id === projectId && activeProject) {
        return;
      }

      if (handledProjectIds.current.has(projectId)) {
        return;
      }

      try {
        await loadProject(projectId);
      } catch (error) {
        handledProjectIds.current.add(projectId);

        const newProjectId = await createNewProject("Untitled Project");
        router.replace(`/editor/${newProjectId}`);
        return;
      }
    };

    initProject();
  }, [projectId, loadProject, createNewProject, router]); // 移除 activeProject?.id 依赖项

  return (
    <EditorProvider>
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <EditorHeader />
        <div className="flex-1 min-h-0 min-w-0">
          <ResizablePanelGroup
            direction="vertical"
            className="h-full w-full gap-[0.18rem]"
          >
            <ResizablePanel
              defaultSize={mainContent}
              minSize={30}
              maxSize={85}
              onResize={setMainContent}
              className="min-h-0"
            >
              {/* Main content area */}
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full gap-[0.19rem] px-2"
              >
                {/* Tools Panel */}
                <ResizablePanel
                  defaultSize={toolsPanel}
                  minSize={15}
                  maxSize={40}
                  onResize={setToolsPanel}
                  className="min-w-0"
                >
                  <MediaPanel />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Preview Area */}
                <ResizablePanel
                  defaultSize={previewPanel}
                  minSize={30}
                  onResize={setPreviewPanel}
                  className="min-w-0 min-h-0 flex-1"
                >
                  <PreviewPanel />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel
                  defaultSize={propertiesPanel}
                  minSize={15}
                  maxSize={40}
                  onResize={setPropertiesPanel}
                  className="min-w-0"
                >
                  <PropertiesPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline */}
            <ResizablePanel
              defaultSize={timeline}
              minSize={15}
              maxSize={70}
              onResize={setTimeline}
              className="min-h-0 px-2 pb-2"
            >
              <Timeline />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <Onboarding />
      </div>
    </EditorProvider>
  );
}
