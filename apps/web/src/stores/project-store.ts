// project-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/project-store.ts
// 最后更新: 2025/7/23

// project-store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import { TProject } from "@/types/project";
// 导入 Zustand 状态管理库
import { create } from "zustand";
// 导入项目模块
import { storageService } from "@/lib/storage/storage-service";
// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入本地模块
import { useMediaStore } from "./media-store";
// 导入本地模块
import { useTimelineStore } from "./timeline-store";
// 导入项目模块
import { generateUUID } from "@/lib/utils";

// ProjectStore 接口定义
interface ProjectStore {
  activeProject: TProject | null;
  savedProjects: TProject[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  createNewProject: (name: string) => Promise<string>;
  loadProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  loadAllProjects: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  closeProject: () => void;
  renameProject: (projectId: string, name: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<string>;
  updateProjectBackground: (backgroundColor: string) => Promise<void>;
  updateBackgroundType: (
    type: "color" | "blur",
    options?: { backgroundColor?: string; blurIntensity?: number }
  ) => Promise<void>;
  updateProjectFps: (fps: number) => Promise<void>;

  getFilteredAndSortedProjects: (
    searchQuery: string,
    sortOption: string
  ) => TProject[];
}

// 导出常量对象 - 包含多个相关常量的对象
export const useProjectStore = create<ProjectStore>((set, get) => ({
  activeProject: null,
  savedProjects: [],
  isLoading: true,
  isInitialized: false,

  createNewProject: async (name: string) => {
// 常量定义 - 模块内部使用的固定值
    const newProject: TProject = {
      id: generateUUID(),
      name,
      thumbnail: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      backgroundColor: "#000000",
      backgroundType: "color",
      blurIntensity: 8,
    };

    // 设置状态 - 更新状态值


    set({ activeProject: newProject });

    try {
      await storageService.saveProject(newProject);
      // Reload all projects to update the list
      await get().loadAllProjects();
      return newProject.id;
    } catch (error) {
      toast.error("Failed to save new project");
      throw error;
    }
  },

  loadProject: async (id: string) => {
    if (!get().isInitialized) {
      set({ isLoading: true });
    }

    // 只有在切换到不同项目时才清空媒体和时间线
    const currentProject = get().activeProject;
    const isProjectSwitch = !currentProject || currentProject.id !== id;
    
    if (isProjectSwitch) {
      // Clear media and timeline when switching to a different project
      const mediaStore = useMediaStore.getState();
      const timelineStore = useTimelineStore.getState();
      mediaStore.clearAllMedia();
      timelineStore.clearTimeline();
    }

    try {
      const project = await storageService.loadProject(id);
      if (project) {
        set({ activeProject: project });

        // Load project-specific data in parallel
        const mediaStore = useMediaStore.getState();
        const timelineStore = useTimelineStore.getState();
        await Promise.all([
          mediaStore.loadProjectMedia(id),
          timelineStore.loadProjectTimeline(id),
        ]);
      } else {
        throw new Error(`Project with id ${id} not found`);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      throw error; // Re-throw so the editor page can handle it
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentProject: async () => {
// 常量定义 - 模块内部使用的固定值
    const { activeProject } = get();
    if (!activeProject) return;

    try {
      // Save project metadata and timeline data in parallel
      const timelineStore = useTimelineStore.getState();
      await Promise.all([
        storageService.saveProject(activeProject),
        timelineStore.saveProjectTimeline(activeProject.id),
      ]);
      await get().loadAllProjects(); // Refresh the list
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  },

  loadAllProjects: async () => {
    if (!get().isInitialized) {
      // 设置状态 - 更新状态值

      set({ isLoading: true });
    }

    try {
// 常量定义 - 模块内部使用的固定值
      const projects = await storageService.loadAllProjects();
      // 设置状态 - 更新状态值

      set({ savedProjects: projects });
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      // 设置状态 - 更新状态值

      set({ isLoading: false, isInitialized: true });
    }
  },

  deleteProject: async (id: string) => {
    try {
      // Delete project data in parallel
      await Promise.all([
        storageService.deleteProjectMedia(id),
        storageService.deleteProjectTimeline(id),
        storageService.deleteProject(id),
      ]);
      await get().loadAllProjects(); // Refresh the list

      // If we deleted the active project, close it and clear data
      const { activeProject } = get();
      if (activeProject?.id === id) {
        // 设置状态 - 更新状态值

        set({ activeProject: null });
// 常量定义 - 模块内部使用的固定值
        const mediaStore = useMediaStore.getState();
// 常量定义 - 模块内部使用的固定值
        const timelineStore = useTimelineStore.getState();
        mediaStore.clearAllMedia();
        timelineStore.clearTimeline();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  },

  closeProject: () => {
    // 设置状态 - 更新状态值

    set({ activeProject: null });

    // Clear data from stores when closing project
    const mediaStore = useMediaStore.getState();
// 常量定义 - 模块内部使用的固定值
    const timelineStore = useTimelineStore.getState();
    mediaStore.clearAllMedia();
    timelineStore.clearTimeline();
  },

  renameProject: async (id: string, name: string) => {
// 常量定义 - 模块内部使用的固定值
    const { savedProjects } = get();

    // Find the project to rename
    const projectToRename = savedProjects.find((p) => p.id === id);
    if (!projectToRename) {
      toast.error("Project not found", {
        description: "Please try again",
      });
      return;
    }

// 常量定义 - 模块内部使用的固定值
    const updatedProject = {
      ...projectToRename,
      name,
      updatedAt: new Date(),
    };

    try {
      // Save to storage
      await storageService.saveProject(updatedProject);

      await get().loadAllProjects();

      // Update activeProject if it's the same project
      const { activeProject } = get();
      if (activeProject?.id === id) {
        // 设置状态 - 更新状态值

        set({ activeProject: updatedProject });
      }
    } catch (error) {
      console.error("Failed to rename project:", error);
      toast.error("Failed to rename project", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  },

  duplicateProject: async (projectId: string) => {
    try {
// 常量定义 - 模块内部使用的固定值
      const project = await storageService.loadProject(projectId);
      if (!project) {
        toast.error("Project not found", {
          description: "Please try again",
        });
        throw new Error("Project not found");
      }

// 常量定义 - 模块内部使用的固定值
      const { savedProjects } = get();

      // Extract the base name (remove any existing numbering)
      const numberMatch = project.name.match(/^\((\d+)\)\s+(.+)$/);
// 常量定义 - 模块内部使用的固定值
      const baseName = numberMatch ? numberMatch[2] : project.name;
// 常量定义 - 模块内部使用的固定值
      const existingNumbers: number[] = [];

      // Check for pattern "(number) baseName" in existing projects
      savedProjects.forEach((p) => {
// 常量定义 - 模块内部使用的固定值
        const match = p.name.match(/^\((\d+)\)\s+(.+)$/);
        if (match && match[2] === baseName) {
          existingNumbers.push(parseInt(match[1], 10));
        }
      });

// 常量定义 - 模块内部使用的固定值
      const nextNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

// 常量定义 - 模块内部使用的固定值
      const newProject: TProject = {
        id: generateUUID(),
        name: `(${nextNumber}) ${baseName}`,
        thumbnail: project.thumbnail,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveProject(newProject);
      await get().loadAllProjects();
      return newProject.id;
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      toast.error("Failed to duplicate project", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
      throw error;
    }
  },

  updateProjectBackground: async (backgroundColor: string) => {
// 常量定义 - 模块内部使用的固定值
    const { activeProject } = get();
    if (!activeProject) return;

// 常量定义 - 模块内部使用的固定值
    const updatedProject = {
      ...activeProject,
      backgroundColor,
      updatedAt: new Date(),
    };

    try {
      await storageService.saveProject(updatedProject);
      // 设置状态 - 更新状态值

      set({ activeProject: updatedProject });
      await get().loadAllProjects(); // Refresh the list
    } catch (error) {
      console.error("Failed to update project background:", error);
      toast.error("Failed to update background", {
        description: "Please try again",
      });
    }
  },

  updateBackgroundType: async (
    type: "color" | "blur",
    options?: { backgroundColor?: string; blurIntensity?: number }
  ) => {
// 常量定义 - 模块内部使用的固定值
    const { activeProject } = get();
    if (!activeProject) return;

// 常量定义 - 模块内部使用的固定值
    const updatedProject = {
      ...activeProject,
      backgroundType: type,
      ...(options?.backgroundColor && {
        backgroundColor: options.backgroundColor,
      }),
      ...(options?.blurIntensity && { blurIntensity: options.blurIntensity }),
      updatedAt: new Date(),
    };

    try {
      await storageService.saveProject(updatedProject);
      // 设置状态 - 更新状态值

      set({ activeProject: updatedProject });
      await get().loadAllProjects(); // Refresh the list
    } catch (error) {
      console.error("Failed to update background type:", error);
      toast.error("Failed to update background", {
        description: "Please try again",
      });
    }
  },

  updateProjectFps: async (fps: number) => {
// 常量定义 - 模块内部使用的固定值
    const { activeProject } = get();
    if (!activeProject) return;

// 常量定义 - 模块内部使用的固定值
    const updatedProject = {
      ...activeProject,
      fps,
      updatedAt: new Date(),
    };

    try {
      await storageService.saveProject(updatedProject);
      // 设置状态 - 更新状态值

      set({ activeProject: updatedProject });
      await get().loadAllProjects(); // Refresh the list
    } catch (error) {
      console.error("Failed to update project FPS:", error);
      toast.error("Failed to update project FPS", {
        description: "Please try again",
      });
    }
  },

  getFilteredAndSortedProjects: (searchQuery: string, sortOption: string) => {
// 常量定义 - 模块内部使用的固定值
    const { savedProjects } = get();

    // Filter projects by search query
    const filteredProjects = savedProjects.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort filtered projects
    const sortedProjects = [...filteredProjects].sort((a, b) => {
// 常量定义 - 模块内部使用的固定值
      const [key, order] = sortOption.split("-");

      if (key !== "createdAt" && key !== "name") {
        console.warn(`Invalid sort key: ${key}`);
        return 0;
      }

// 常量定义 - 模块内部使用的固定值
      const aValue = a[key];
// 常量定义 - 模块内部使用的固定值
      const bValue = b[key];

      if (aValue === undefined || bValue === undefined) return 0;

      if (order === "asc") {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      } else {
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
        return 0;
      }
    });

    return sortedProjects;
  },
}));
