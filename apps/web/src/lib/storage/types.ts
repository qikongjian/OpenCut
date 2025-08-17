import { TProject } from "@/types/project";
import { TimelineTrack } from "@/types/timeline";

export interface StorageAdapter<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

export interface MediaFileData {
  id: string;
  name: string;
  type: "image" | "video" | "audio";
  size?: number; // 远程视频可能没有size
  lastModified?: number; // 远程视频可能没有lastModified
  width?: number;
  height?: number;
  duration?: number;
  url?: string; // 远程视频的URL
  thumbnailUrl?: string; // 缩略图URL
  fps?: number; // 视频帧率
  isRemote?: boolean; // 标识是否为远程视频
  // File will be stored separately in OPFS (for local files)
}

export interface TimelineData {
  tracks: TimelineTrack[];
  lastModified: string;
}

export interface StorageConfig {
  projectsDb: string;
  mediaDb: string;
  timelineDb: string;
  savedSoundsDb: string;
  version: number;
}

// Helper type for serialization - converts Date objects to strings
export type SerializedProject = Omit<TProject, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  bookmarks?: number[];
};

// Extend FileSystemDirectoryHandle with missing async iterator methods
declare global {
  interface FileSystemDirectoryHandle {
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
}
