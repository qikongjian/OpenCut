// opfs-adapter.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/storage/opfs-adapter.ts
// 最后更新: 2025/7/23

// opfs-adapter.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入本地模块
import { StorageAdapter } from "./types";

export class OPFSAdapter implements StorageAdapter<File> {
  private directoryName: string;

  constructor(directoryName: string = "media") {
    this.directoryName = directoryName;
  }

  private async getDirectory(): Promise<FileSystemDirectoryHandle> {
// 常量定义 - 模块内部使用的固定值
    const opfsRoot = await navigator.storage.getDirectory();
    return await opfsRoot.getDirectoryHandle(this.directoryName, {
      create: true,
    });
  }

  async get(key: string): Promise<File | null> {
    try {
// 常量定义 - 模块内部使用的固定值
      const directory = await this.getDirectory();
// 常量定义 - 模块内部使用的固定值
      const fileHandle = await directory.getFileHandle(key);
      return await fileHandle.getFile();
    } catch (error) {
      if ((error as Error).name === "NotFoundError") {
        return null;
      }
      throw error;
    }
  }

  async set(key: string, file: File): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const directory = await this.getDirectory();
// 常量定义 - 模块内部使用的固定值
    const fileHandle = await directory.getFileHandle(key, { create: true });
// 常量定义 - 模块内部使用的固定值
    const writable = await fileHandle.createWritable();

    await writable.write(file);
    await writable.close();
  }

  async remove(key: string): Promise<void> {
    try {
// 常量定义 - 模块内部使用的固定值
      const directory = await this.getDirectory();
      await directory.removeEntry(key);
    } catch (error) {
      if ((error as Error).name !== "NotFoundError") {
        throw error;
      }
    }
  }

  async list(): Promise<string[]> {
// 常量定义 - 模块内部使用的固定值
    const directory = await this.getDirectory();
// 常量定义 - 模块内部使用的固定值
    const keys: string[] = [];

    for await (const name of directory.keys()) {
      keys.push(name);
    }

    return keys;
  }

  async clear(): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const directory = await this.getDirectory();

    for await (const name of directory.keys()) {
      await directory.removeEntry(name);
    }
  }

  // Helper method to check OPFS support
  static isSupported(): boolean {
    return "storage" in navigator && "getDirectory" in navigator.storage;
  }
}
