// media-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/media-store.ts
// 最后更新: 2025/7/23

// media-store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Zustand 状态管理库
import { create } from "zustand";
// 导入项目模块
import { storageService } from "@/lib/storage/storage-service";
// 导入本地模块
import { useTimelineStore } from "./timeline-store";
// 导入项目模块
import { generateUUID } from "@/lib/utils";

// 类型定义 - 创建类型别名或联合类型
export type MediaType = "image" | "video" | "audio";

// 接口定义 - 定义对象的结构和属性类型
export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  file: File;
  url?: string; // Object URL for preview
  thumbnailUrl?: string; // For video thumbnails
  duration?: number; // For video/audio duration
  width?: number; // For video/image width
  height?: number; // For video/image height
  fps?: number; // For video frame rate
  // Text-specific properties
  content?: string; // Text content
  fontSize?: number; // Font size
  fontFamily?: string; // Font family
  color?: string; // Text color
  backgroundColor?: string; // Background color
  textAlign?: "left" | "center" | "right"; // Text alignment
}

// MediaStore 接口定义
interface MediaStore {
  mediaItems: MediaItem[];
  isLoading: boolean;

  // Actions - now require projectId
  addMediaItem: (
    projectId: string,
    item: Omit<MediaItem, "id">
  ) => Promise<void>;
  removeMediaItem: (projectId: string, id: string) => Promise<void>;
  loadProjectMedia: (projectId: string) => Promise<void>;
  clearProjectMedia: (projectId: string) => Promise<void>;
  clearAllMedia: () => void; // Clear local state only
}

// to 函数
// Helper function to determine file type
export const getFileType = (file: File): MediaType | null => {
// 常量定义 - 模块内部使用的固定值
  const { type } = file;

  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }

  return null;
};

// to 函数
// Helper function to get image dimensions
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
    const img = new window.Image();

    img.addEventListener("load", () => {
// 常量定义 - 模块内部使用的固定值
      const width = img.naturalWidth;
// 常量定义 - 模块内部使用的固定值
      const height = img.naturalHeight;
      resolve({ width, height });
      img.remove();
    });

    img.addEventListener("error", () => {
      reject(new Error("Could not load image"));
      img.remove();
    });

    img.src = URL.createObjectURL(file);
  });
};

// to 函数
// Helper function to generate video thumbnail and get dimensions
export const generateVideoThumbnail = (
  file: File
): Promise<{ thumbnailUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
    const video = document.createElement("video") as HTMLVideoElement;
// 常量定义 - 模块内部使用的固定值
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
// 常量定义 - 模块内部使用的固定值
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to 1 second or 10% of duration, whichever is smaller
      video.currentTime = Math.min(1, video.duration * 0.1);
    });

    video.addEventListener("seeked", () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
// 常量定义 - 模块内部使用的固定值
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
// 常量定义 - 模块内部使用的固定值
      const width = video.videoWidth;
// 常量定义 - 模块内部使用的固定值
      const height = video.videoHeight;

      resolve({ thumbnailUrl, width, height });

      // Cleanup
      video.remove();
      canvas.remove();
    });

    video.addEventListener("error", () => {
      reject(new Error("Could not load video"));
      video.remove();
      canvas.remove();
    });

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// to 函数
// Helper function to get media duration
export const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
    const element = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio"
    ) as HTMLVideoElement;

    element.addEventListener("loadedmetadata", () => {
      resolve(element.duration);
      element.remove();
    });

    element.addEventListener("error", () => {
      reject(new Error("Could not load media"));
      element.remove();
    });

    element.src = URL.createObjectURL(file);
    element.load();
  });
};

// Helper to get aspect ratio from MediaItem
export const getMediaAspectRatio = (item: MediaItem): number => {
  if (item.width && item.height) {
    return item.width / item.height;
  }
  return 16 / 9; // Default aspect ratio
};

// 导出常量对象 - 包含多个相关常量的对象
export const useMediaStore = create<MediaStore>((set, get) => ({
  mediaItems: [],
  isLoading: false,

  addMediaItem: async (projectId, item) => {
// 常量定义 - 模块内部使用的固定值
    const newItem: MediaItem = {
      ...item,
      id: generateUUID(),
    };

    // Add to local state immediately for UI responsiveness
    // 设置状态 - 更新状态值
    set((state) => ({
      mediaItems: [...state.mediaItems, newItem],
    }));

    // Save to persistent storage in background
    try {
      await storageService.saveMediaItem(projectId, newItem);
    } catch (error) {
      console.error("Failed to save media item:", error);
      // Remove from local state if save failed
      // 设置状态 - 更新状态值
      set((state) => ({
        mediaItems: state.mediaItems.filter((media) => media.id !== newItem.id),
      }));
    }
  },

  removeMediaItem: async (projectId, id: string) => {
// 常量定义 - 模块内部使用的固定值
    const state = get();
// 常量定义 - 模块内部使用的固定值
    const item = state.mediaItems.find((media) => media.id === id);

    // Cleanup object URLs to prevent memory leaks
    if (item && item.url) {
      URL.revokeObjectURL(item.url);
      if (item.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    }

    // Remove from local state immediately
    // 设置状态 - 更新状态值
    set((state) => ({
      mediaItems: state.mediaItems.filter((media) => media.id !== id),
    }));

    // Remove from persistent storage
    try {
      await storageService.deleteMediaItem(projectId, id);
    } catch (error) {
      console.error("Failed to delete media item:", error);
    }
  },

  loadProjectMedia: async (projectId) => {
    // 设置状态 - 更新状态值
    set({ isLoading: true });

    try {
// 常量定义 - 模块内部使用的固定值
      const mediaItems = await storageService.loadAllMediaItems(projectId);

      // Regenerate thumbnails for video items
      const updatedMediaItems = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.type === "video" && item.file) {
            try {
// 常量定义 - 模块内部使用的固定值
              const { thumbnailUrl, width, height } = await generateVideoThumbnail(item.file);
              return {
                ...item,
                thumbnailUrl,
                width: width || item.width,
                height: height || item.height
              };
            } catch (error) {
              console.error(`Failed to regenerate thumbnail for video ${item.id}:`, error);
              return item;
            }
          }
          return item;
        })
      );

      // 设置状态 - 更新状态值

      set({ mediaItems: updatedMediaItems });
    } catch (error) {
      console.error("Failed to load media items:", error);
    } finally {
      // 设置状态 - 更新状态值
      set({ isLoading: false });
    }
  },

  clearProjectMedia: async (projectId) => {
// 常量定义 - 模块内部使用的固定值
    const state = get();

    // Cleanup all object URLs
    state.mediaItems.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
      if (item.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    });

    // Clear local state
    // 设置状态 - 更新状态值
    set({ mediaItems: [] });

    // Clear persistent storage
    try {
// 常量定义 - 模块内部使用的固定值
      const mediaIds = state.mediaItems.map((item) => item.id);
      await Promise.all(
        mediaIds.map((id) => storageService.deleteMediaItem(projectId, id))
      );
    } catch (error) {
      console.error("Failed to clear media items from storage:", error);
    }
  },

  clearAllMedia: () => {
// 常量定义 - 模块内部使用的固定值
    const state = get();

    // Cleanup all object URLs
    state.mediaItems.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
      if (item.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
    });

    // Clear local state
    // 设置状态 - 更新状态值
    set({ mediaItems: [] });
  },
}));
