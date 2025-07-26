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
// 导入 Sonner 通知组件
import { toast } from "sonner";

// 类型定义 - 创建类型别名或联合类型
export type MediaType = "image" | "video" | "audio";

// 支持的文件格式配置
export const SUPPORTED_FORMATS = {
  video: ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'],
  audio: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff']
} as const;

// 导入进度接口
export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentFileName: string;
  status: 'processing' | 'completed' | 'error';
}

// 批量导入结果接口
export interface BatchImportResult {
  successful: MediaItem[];
  failed: { file: File; error: string }[];
  duplicates: string[];
}

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
  // 新增：导入进度状态
  importProgress: ImportProgress | null;
  isImporting: boolean;

  // Actions - now require projectId
  addMediaItem: (
    projectId: string,
    item: Omit<MediaItem, "id">
  ) => Promise<void>;
  removeMediaItem: (projectId: string, id: string) => Promise<void>;
  loadProjectMedia: (projectId: string) => Promise<void>;
  clearProjectMedia: (projectId: string) => Promise<void>;
  clearAllMedia: () => void; // Clear local state only
  
  // 新增：批量导入功能
  batchImportFiles: (
    projectId: string,
    files: File[],
    onProgress?: (progress: ImportProgress) => void
  ) => Promise<BatchImportResult>;
  
  // 新增：文件夹拖拽导入
  importFromDataTransfer: (
    projectId: string,
    dataTransfer: DataTransfer,
    onProgress?: (progress: ImportProgress) => void
  ) => Promise<BatchImportResult>;
  
  // 新增：文件格式验证
  validateFileFormat: (file: File) => { isValid: boolean; type?: MediaType; error?: string };
  
  // 新增：取消导入
  cancelImport: () => void;
  
  // 新增：清除导入进度
  clearImportProgress: () => void;
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

// 新增：文件扩展名验证函数
export const validateFileByExtension = (fileName: string): { isValid: boolean; type?: MediaType; error?: string } => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (SUPPORTED_FORMATS.video.includes(extension as any)) {
    return { isValid: true, type: 'video' };
  }
  if (SUPPORTED_FORMATS.audio.includes(extension as any)) {
    return { isValid: true, type: 'audio' };
  }
  if (SUPPORTED_FORMATS.image.includes(extension as any)) {
    return { isValid: true, type: 'image' };
  }
  
  return { 
    isValid: false, 
    error: `不支持的文件格式: ${extension}。支持的格式: ${[
      ...SUPPORTED_FORMATS.video,
      ...SUPPORTED_FORMATS.audio,
      ...SUPPORTED_FORMATS.image
    ].join(', ')}` 
  };
};

// 新增：从DataTransfer中提取文件（支持文件夹）
export const extractFilesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<File[]> => {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);
  
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await processEntry(entry, files);
      }
    }
  }
  
  return files;
};

// 递归处理文件夹条目
const processEntry = async (entry: FileSystemEntry, files: File[]): Promise<void> => {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    });
    files.push(file);
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    
    for (const childEntry of entries) {
      await processEntry(childEntry, files);
    }
  }
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
  importProgress: null,
  isImporting: false,

  addMediaItem: async (projectId, item) => {
// 常量定义 - 模块内部使用的固定值
    const existingItems = get().mediaItems;
    
    // 检查重复媒体
    const isDuplicate = existingItems.some(existingItem => 
      existingItem.name === item.name && 
      existingItem.file.size === item.file.size
    );
    
    if (isDuplicate) {
      toast.warning(`媒体文件 "${item.name}" 已存在，跳过添加`);
      return;
    }

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

  // 新增：批量导入文件
  batchImportFiles: async (projectId, files, onProgress) => {
    set({ isImporting: true, importProgress: null });
    
    const result: BatchImportResult = {
      successful: [],
      failed: [],
      duplicates: []
    };
    
    const existingItems = get().mediaItems;
    let processedCount = 0;
    
    try {
      for (const file of files) {
        // 更新进度
        const progress: ImportProgress = {
          current: processedCount + 1,
          total: files.length,
          percentage: Math.round(((processedCount + 1) / files.length) * 100),
          currentFileName: file.name,
          status: 'processing'
        };
        
        set({ importProgress: progress });
        if (onProgress) onProgress(progress);
        
        // 验证文件格式
        const validation = get().validateFileFormat(file);
        if (!validation.isValid) {
          result.failed.push({ file, error: validation.error || '未支持的文件格式' });
          processedCount++;
          continue;
        }
        
        // 检查重复文件
        const isDuplicate = existingItems.some(existingItem => 
          existingItem.name === file.name && 
          existingItem.file.size === file.size
        );
        
        if (isDuplicate) {
          result.duplicates.push(file.name);
          processedCount++;
          continue;
        }
        
        try {
          // 处理媒体文件
          const processedItems = await import('@/lib/media-processing').then(module => 
            module.processMediaFiles([file])
          );
          
          if (processedItems.length > 0) {
            const processedItem = processedItems[0];
            const newItem: MediaItem = {
              ...processedItem,
              id: generateUUID(),
            };
            
            // 添加到本地状态
            set((state) => ({
              mediaItems: [...state.mediaItems, newItem],
            }));
            
            // 保存到持久化存储
            await storageService.saveMediaItem(projectId, newItem);
            
            result.successful.push(newItem);
          }
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
          result.failed.push({ 
            file, 
            error: error instanceof Error ? error.message : '处理文件时发生错误' 
          });
        }
        
        processedCount++;
        // 短暂延迟以保持UI响应性
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // 完成导入
      const finalProgress: ImportProgress = {
        current: files.length,
        total: files.length,
        percentage: 100,
        currentFileName: '',
        status: 'completed'
      };
      
      set({ importProgress: finalProgress, isImporting: false });
      if (onProgress) onProgress(finalProgress);
      
      // 显示导入结果
      if (result.successful.length > 0) {
        toast.success(`成功导入 ${result.successful.length} 个文件`);
      }
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} 个文件导入失败`);
      }
      if (result.duplicates.length > 0) {
        toast.warning(`跳过 ${result.duplicates.length} 个重复文件`);
      }
      
    } catch (error) {
      console.error('Batch import failed:', error);
      set({ 
        importProgress: { 
          current: processedCount, 
          total: files.length, 
          percentage: 0, 
          currentFileName: '', 
          status: 'error' 
        },
        isImporting: false 
      });
      toast.error('批量导入失败');
    }
    
    return result;
  },

  // 新增：从DataTransfer导入（支持文件夹拖拽）
  importFromDataTransfer: async (projectId, dataTransfer, onProgress) => {
    try {
      const files = await extractFilesFromDataTransfer(dataTransfer);
      return await get().batchImportFiles(projectId, files, onProgress);
    } catch (error) {
      console.error('Failed to extract files from data transfer:', error);
      toast.error('文件夹导入失败');
      return { successful: [], failed: [], duplicates: [] };
    }
  },

  // 新增：文件格式验证
  validateFileFormat: (file) => {
    // 优先使用MIME类型验证
    const mimeType = getFileType(file);
    if (mimeType) {
      return { isValid: true, type: mimeType };
    }
    
    // 回退到文件扩展名验证
    return validateFileByExtension(file.name);
  },

  // 新增：取消导入
  cancelImport: () => {
    set({ 
      isImporting: false, 
      importProgress: null 
    });
    toast.info('导入已取消');
  },

  // 新增：清除导入进度
  clearImportProgress: () => {
    set({ importProgress: null });
  },
}));
