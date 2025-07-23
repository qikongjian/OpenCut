// types.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/storage/types.ts
// 最后更新: 2025/7/23

// types.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import { TProject } from "@/types/project";
// 导入项目模块
import { TimelineTrack } from "@/types/timeline";

// 导出接口 - 定义对象结构

// 接口定义 - 定义对象的结构和属性类型
export interface StorageAdapter<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

// 导出接口 - 定义对象结构

// 接口定义 - 定义对象的结构和属性类型
export interface MediaFileData {
  id: string;
  name: string;
  type: "image" | "video" | "audio";
  size: number;
  lastModified: number;
  width?: number;
  height?: number;
  duration?: number;
  // File will be stored separately in OPFS
}

// 导出接口 - 定义对象结构

// 接口定义 - 定义对象的结构和属性类型
export interface TimelineData {
  tracks: TimelineTrack[];
  lastModified: string;
}

// 导出接口 - 定义对象结构

// 接口定义 - 定义对象的结构和属性类型
export interface StorageConfig {
  projectsDb: string;
  mediaDb: string;
  timelineDb: string;
  version: number;
}

// Helper type for serialization - converts Date objects to strings
// 导出类型 - 定义类型别名
export type SerializedProject = Omit<TProject, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// Extend FileSystemDirectoryHandle with missing async iterator methods
declare global {
// FileSystemDirectoryHandle 接口定义
  interface FileSystemDirectoryHandle {
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
}
