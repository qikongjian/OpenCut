// storage-service.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/storage/storage-service.ts
// 最后更新: 2025/7/23

// storage-service.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import { TProject } from "@/types/project";
// 导入项目模块
import { MediaItem } from "@/stores/media-store";
// 导入本地模块
import { IndexedDBAdapter } from "./indexeddb-adapter";
// 导入本地模块
import { OPFSAdapter } from "./opfs-adapter";
// 导入模块
import {
  MediaFileData,
  StorageConfig,
  SerializedProject,
  TimelineData,
} from "./types";
// 导入项目模块
import { TimelineTrack } from "@/types/timeline";

class StorageService {
  private projectsAdapter: IndexedDBAdapter<SerializedProject>;
  private config: StorageConfig;

  constructor() {
    this.config = {
      projectsDb: "video-editor-projects",
      mediaDb: "video-editor-media",
      timelineDb: "video-editor-timelines",
      version: 1,
    };

    this.projectsAdapter = new IndexedDBAdapter<SerializedProject>(
      this.config.projectsDb,
      "projects",
      this.config.version
    );
  }

  // Helper to get project-specific media adapters
  private getProjectMediaAdapters(projectId: string) {
// 常量定义 - 模块内部使用的固定值
    const mediaMetadataAdapter = new IndexedDBAdapter<MediaFileData>(
      `${this.config.mediaDb}-${projectId}`,
      "media-metadata",
      this.config.version
    );

// 常量定义 - 模块内部使用的固定值
    const mediaFilesAdapter = new OPFSAdapter(`media-files-${projectId}`);

    return { mediaMetadataAdapter, mediaFilesAdapter };
  }

  // Helper to get project-specific timeline adapter
  private getProjectTimelineAdapter(projectId: string) {
    return new IndexedDBAdapter<TimelineData>(
      `${this.config.timelineDb}-${projectId}`,
      "timeline",
      this.config.version
    );
  }

  // Project operations
  async saveProject(project: TProject): Promise<void> {
    // Convert TProject to serializable format
    const serializedProject: SerializedProject = {
      id: project.id,
      name: project.name,
      thumbnail: project.thumbnail,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      backgroundColor: project.backgroundColor,
      backgroundType: project.backgroundType,
      blurIntensity: project.blurIntensity,
    };

    await this.projectsAdapter.set(project.id, serializedProject);
  }

  async loadProject(id: string): Promise<TProject | null> {
// 常量定义 - 模块内部使用的固定值
    const serializedProject = await this.projectsAdapter.get(id);

    if (!serializedProject) return null;

    // Convert back to TProject format
    return {
      id: serializedProject.id,
      name: serializedProject.name,
      thumbnail: serializedProject.thumbnail,
      createdAt: new Date(serializedProject.createdAt),
      updatedAt: new Date(serializedProject.updatedAt),
      backgroundColor: serializedProject.backgroundColor,
      backgroundType: serializedProject.backgroundType,
      blurIntensity: serializedProject.blurIntensity,
    };
  }

  async loadAllProjects(): Promise<TProject[]> {
// 常量定义 - 模块内部使用的固定值
    const projectIds = await this.projectsAdapter.list();
// 常量定义 - 模块内部使用的固定值
    const projects: TProject[] = [];

    for (const id of projectIds) {
// 常量定义 - 模块内部使用的固定值
      const project = await this.loadProject(id);
      if (project) {
        projects.push(project);
      }
    }

    // Sort by last updated (most recent first)
    return projects.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async deleteProject(id: string): Promise<void> {
    await this.projectsAdapter.remove(id);
  }

  // Media operations - now project-specific
  async saveMediaItem(projectId: string, mediaItem: MediaItem): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const { mediaMetadataAdapter, mediaFilesAdapter } =
      this.getProjectMediaAdapters(projectId);

    // Save file to project-specific OPFS
    await mediaFilesAdapter.set(mediaItem.id, mediaItem.file);

    // Save metadata to project-specific IndexedDB
    const metadata: MediaFileData = {
      id: mediaItem.id,
      name: mediaItem.name,
      type: mediaItem.type,
      size: mediaItem.file.size,
      lastModified: mediaItem.file.lastModified,
      width: mediaItem.width,
      height: mediaItem.height,
      duration: mediaItem.duration,
    };

    await mediaMetadataAdapter.set(mediaItem.id, metadata);
  }

  async loadMediaItem(
    projectId: string,
    id: string
  ): Promise<MediaItem | null> {
// 常量定义 - 模块内部使用的固定值
    const { mediaMetadataAdapter, mediaFilesAdapter } =
      this.getProjectMediaAdapters(projectId);

// 常量定义 - 模块内部使用的固定值
    const [file, metadata] = await Promise.all([
      mediaFilesAdapter.get(id),
      mediaMetadataAdapter.get(id),
    ]);

    if (!file || !metadata) return null;

    // Create new object URL for the file
    const url = URL.createObjectURL(file);

    return {
      id: metadata.id,
      name: metadata.name,
      type: metadata.type,
      file,
      url,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      // thumbnailUrl would need to be regenerated or cached separately
    };
  }

  async loadAllMediaItems(projectId: string): Promise<MediaItem[]> {
// 常量定义 - 模块内部使用的固定值
    const { mediaMetadataAdapter } = this.getProjectMediaAdapters(projectId);

// 常量定义 - 模块内部使用的固定值
    const mediaIds = await mediaMetadataAdapter.list();
// 常量定义 - 模块内部使用的固定值
    const mediaItems: MediaItem[] = [];

    for (const id of mediaIds) {
// 常量定义 - 模块内部使用的固定值
      const item = await this.loadMediaItem(projectId, id);
      if (item) {
        mediaItems.push(item);
      }
    }

    return mediaItems;
  }

  async deleteMediaItem(projectId: string, id: string): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const { mediaMetadataAdapter, mediaFilesAdapter } =
      this.getProjectMediaAdapters(projectId);

    await Promise.all([
      mediaFilesAdapter.remove(id),
      mediaMetadataAdapter.remove(id),
    ]);
  }

  async deleteProjectMedia(projectId: string): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const { mediaMetadataAdapter, mediaFilesAdapter } =
      this.getProjectMediaAdapters(projectId);

    await Promise.all([
      mediaMetadataAdapter.clear(),
      mediaFilesAdapter.clear(),
    ]);
  }

  // Timeline operations - now project-specific
  async saveTimeline(
    projectId: string,
    tracks: TimelineTrack[]
  ): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const timelineAdapter = this.getProjectTimelineAdapter(projectId);
// 常量定义 - 模块内部使用的固定值
    const timelineData: TimelineData = {
      tracks,
      lastModified: new Date().toISOString(),
    };
    await timelineAdapter.set("timeline", timelineData);
  }

  async loadTimeline(projectId: string): Promise<TimelineTrack[] | null> {
// 常量定义 - 模块内部使用的固定值
    const timelineAdapter = this.getProjectTimelineAdapter(projectId);
// 常量定义 - 模块内部使用的固定值
    const timelineData = await timelineAdapter.get("timeline");
    return timelineData ? timelineData.tracks : null;
  }

  async deleteProjectTimeline(projectId: string): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const timelineAdapter = this.getProjectTimelineAdapter(projectId);
    await timelineAdapter.remove("timeline");
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    // Clear all projects
    await this.projectsAdapter.clear();

    // Note: Project-specific media and timelines will be cleaned up when projects are deleted
  }

  async getStorageInfo(): Promise<{
    projects: number;
    isOPFSSupported: boolean;
    isIndexedDBSupported: boolean;
  }> {
// 常量定义 - 模块内部使用的固定值
    const projectIds = await this.projectsAdapter.list();

    return {
      projects: projectIds.length,
      isOPFSSupported: this.isOPFSSupported(),
      isIndexedDBSupported: this.isIndexedDBSupported(),
    };
  }

  async getProjectStorageInfo(projectId: string): Promise<{
    mediaItems: number;
    hasTimeline: boolean;
  }> {
// 常量定义 - 模块内部使用的固定值
    const { mediaMetadataAdapter } = this.getProjectMediaAdapters(projectId);
// 常量定义 - 模块内部使用的固定值
    const timelineAdapter = this.getProjectTimelineAdapter(projectId);

// 常量定义 - 模块内部使用的固定值
    const [mediaIds, timelineData] = await Promise.all([
      mediaMetadataAdapter.list(),
      timelineAdapter.get("timeline"),
    ]);

    return {
      mediaItems: mediaIds.length,
      hasTimeline: !!timelineData,
    };
  }

  // Check browser support
  isOPFSSupported(): boolean {
    return OPFSAdapter.isSupported();
  }

  isIndexedDBSupported(): boolean {
    return "indexedDB" in window;
  }

  isFullySupported(): boolean {
    return this.isIndexedDBSupported() && this.isOPFSSupported();
  }
}

// Export singleton instance
export const storageService = new StorageService();
export { StorageService };
