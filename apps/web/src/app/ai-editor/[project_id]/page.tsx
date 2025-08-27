"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../../components/ui/resizable";
import { MediaPanel } from "../../../components/editor/media-panel";
import { PropertiesPanel } from "../../../components/editor/properties-panel";
import { Timeline } from "../../../components/editor/timeline";
import { PreviewPanel } from "../../../components/editor/preview-panel";
import { EditorHeader } from "@/components/editor-header";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { EditorProvider } from "@/components/editor-provider";
import { usePlaybackControls } from "@/hooks/use-playback-controls";
import { Onboarding } from "@/components/onboarding";
import { AutoAIEditingProgress } from "@/components/ai-editor/auto-ai-editing-progress";
import { useAutoAIEditingStore } from "@/stores/auto-ai-editing-store";


export default function AIEditor() {
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
    activePreset,
    resetCounter,
  } = usePanelStore();

  const {
    activeProject,
    loadProject,
    createNewProject,
    isInvalidProjectId,
    markProjectIdAsInvalid,
  } = useProjectStore();
  const params = useParams();
  const router = useRouter();
  const projectId = params.project_id as string;
  const handledProjectIds = useRef<Set<string>>(new Set());
  const isInitializingRef = useRef<boolean>(false);
  const autoStartedRef = useRef<boolean>(false);

  const { startAutoAIEditing, currentStage } = useAutoAIEditingStore();

  usePlaybackControls();

  useEffect(() => {
    let isCancelled = false;

    const initProject = async () => {
      if (!projectId) {
        return;
      }

      // Prevent duplicate initialization
      if (isInitializingRef.current) {
        return;
      }

      // Check if project is already loaded
      if (activeProject?.id === projectId) {
        return;
      }

      // Check global invalid tracking first (most important for preventing duplicates)
      if (isInvalidProjectId(projectId)) {
        return;
      }

      // Check if we've already handled this project ID locally
      if (handledProjectIds.current.has(projectId)) {
        return;
      }

      // Mark as initializing to prevent race conditions
      isInitializingRef.current = true;
      handledProjectIds.current.add(projectId);

      try {
        await loadProject(projectId);

        // Check if component was unmounted during async operation
        if (isCancelled) {
          return;
        }

        // Project loaded successfully
        isInitializingRef.current = false;

        // 🚀 AI编辑器特有：项目加载完成后自动启动AI剪辑流程
        if (!autoStartedRef.current && currentStage === 'idle') {
          autoStartedRef.current = true;
          console.log('🤖 AI编辑器：自动启动AI剪辑流程');
          // 延迟启动，确保页面完全加载
          setTimeout(() => {
            startAutoAIEditing(projectId);
          }, 1000);
        }
      } catch (error) {
        // Check if component was unmounted during async operation
        if (isCancelled) {
          return;
        }

        // More specific error handling - only create new project for actual "not found" errors
        const isProjectNotFound =
          error instanceof Error &&
          (error.message.includes("not found") ||
            error.message.includes("does not exist") ||
            error.message.includes("Project not found"));

        if (isProjectNotFound) {
          // 不再标记为无效，而是使用URL中的ID创建新项目
          console.log(`项目 ${projectId} 不存在，使用该ID创建新AI编辑项目`);

          try {
            // Using project ID from URL创建新项目，而不是生成新ID
            const createdProjectId = await createNewProject("AI Editing Project", projectId);

            // Check again if component was unmounted
            if (isCancelled) {
              return;
            }

            // 验证创建的project ID是否与URL中的ID一致
            if (createdProjectId === projectId) {
              console.log(`成功创建AI编辑项目: ${projectId}`);
              // 不需要重定向，因为URL已经是正确的
              // 重新尝试加载项目
              await loadProject(projectId);

              // 🚀 新创建的项目也自动启动AI剪辑流程
              if (!autoStartedRef.current && currentStage === 'idle') {
                autoStartedRef.current = true;
                console.log('🤖 新项目：自动启动AI剪辑流程');
                setTimeout(() => {
                  startAutoAIEditing(projectId);
                }, 1500);
              }
            } else {
              console.error("创建的project ID与URL不匹配");
              router.replace(`/ai-editor/${createdProjectId}`);
            }
          } catch (createError) {
            console.error("Failed to create new AI editing project:", createError);
            // 如果创建失败，标记为无效并重定向到新项目
            markProjectIdAsInvalid(projectId);
            try {
              const fallbackProjectId = await createNewProject("AI Editing Project");
              router.replace(`/ai-editor/${fallbackProjectId}`);
            } catch (fallbackError) {
              console.error("Failed to create fallback AI editing project:", fallbackError);
            }
          }
        } else {
          // For other errors (storage issues, corruption, etc.), don't create new project
          console.error(
            "AI editing project loading failed with recoverable error:",
            error
          );
          // Remove from handled set so user can retry
          handledProjectIds.current.delete(projectId);
        }

        isInitializingRef.current = false;
      }
    };

    initProject();

    // Cleanup function to cancel async operations
    return () => {
      isCancelled = true;
      isInitializingRef.current = false;
    };
  }, [
    projectId,
    loadProject,
    createNewProject,
    router,
    isInvalidProjectId,
    markProjectIdAsInvalid,
  ]);

  return (
    <EditorProvider>
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <EditorHeader />
        <div className="flex-1 min-h-0 min-w-0">
          {activePreset === "media" ? (
            <ResizablePanelGroup
              key={`media-${activePreset}-${resetCounter}`}
              direction="horizontal"
              className="h-full w-full gap-[0.18rem] px-3 pb-3"
            >
              <ResizablePanel
                defaultSize={toolsPanel}
                minSize={15}
                maxSize={40}
                onResize={setToolsPanel}
                className="min-w-0 rounded-sm"
              >
                <MediaPanel />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel
                defaultSize={100 - toolsPanel}
                minSize={60}
                className="min-w-0 min-h-0"
              >
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
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full w-full gap-[0.19rem]"
                    >
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

                  <ResizablePanel
                    defaultSize={timeline}
                    minSize={15}
                    maxSize={70}
                    onResize={setTimeline}
                    className="min-h-0"
                  >
                    <Timeline />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : activePreset === "inspector" ? (
            <ResizablePanelGroup
              key={`inspector-${activePreset}-${resetCounter}`}
              direction="horizontal"
              className="h-full w-full gap-[0.18rem] px-3 pb-3"
            >
              <ResizablePanel
                defaultSize={100 - propertiesPanel}
                minSize={30}
                onResize={(size) => setPropertiesPanel(100 - size)}
                className="min-w-0 min-h-0"
              >
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
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full w-full gap-[0.19rem]"
                    >
                      <ResizablePanel
                        defaultSize={toolsPanel}
                        minSize={15}
                        maxSize={40}
                        onResize={setToolsPanel}
                        className="min-w-0 rounded-sm"
                      >
                        <MediaPanel />
                      </ResizablePanel>

                      <ResizableHandle withHandle />

                      <ResizablePanel
                        defaultSize={previewPanel}
                        minSize={30}
                        onResize={setPreviewPanel}
                        className="min-w-0 min-h-0 flex-1"
                      >
                        <PreviewPanel />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  <ResizablePanel
                    defaultSize={timeline}
                    minSize={15}
                    maxSize={70}
                    onResize={setTimeline}
                    className="min-h-0"
                  >
                    <Timeline />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel
                defaultSize={propertiesPanel}
                minSize={15}
                maxSize={40}
                onResize={setPropertiesPanel}
                className="min-w-0 min-h-0"
              >
                <PropertiesPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : activePreset === "vertical-preview" ? (
            <ResizablePanelGroup
              key={`vertical-preview-${activePreset}-${resetCounter}`}
              direction="horizontal"
              className="h-full w-full gap-[0.18rem] px-3 pb-3"
            >
              <ResizablePanel
                defaultSize={100 - previewPanel}
                minSize={30}
                onResize={(size) => setPreviewPanel(100 - size)}
                className="min-w-0 min-h-0"
              >
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
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full w-full gap-[0.19rem]"
                    >
                      <ResizablePanel
                        defaultSize={toolsPanel}
                        minSize={15}
                        maxSize={40}
                        onResize={setToolsPanel}
                        className="min-w-0 rounded-sm"
                      >
                        <MediaPanel />
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

                  <ResizablePanel
                    defaultSize={timeline}
                    minSize={15}
                    maxSize={70}
                    onResize={setTimeline}
                    className="min-h-0"
                  >
                    <Timeline />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel
                defaultSize={previewPanel}
                minSize={30}
                onResize={setPreviewPanel}
                className="min-w-0 min-h-0"
              >
                <PreviewPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <ResizablePanelGroup
              key={`default-${activePreset}-${resetCounter}`}
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
                  className="h-full w-full gap-[0.19rem] px-3"
                >
                  {/* Tools Panel */}
                  <ResizablePanel
                    defaultSize={toolsPanel}
                    minSize={15}
                    maxSize={40}
                    onResize={setToolsPanel}
                    className="min-w-0 rounded-sm"
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
                    className="min-w-0 rounded-sm"
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
                className="min-h-0 px-3 pb-3"
              >
                <Timeline />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
        <Onboarding />
      </div>
    </EditorProvider>
  );
}
