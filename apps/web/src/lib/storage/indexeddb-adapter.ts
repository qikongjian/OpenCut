// indexeddb-adapter.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/storage/indexeddb-adapter.ts
// 最后更新: 2025/7/23

// indexeddb-adapter.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入本地模块
import { StorageAdapter } from "./types";

export class IndexedDBAdapter<T> implements StorageAdapter<T> {
  private dbName: string;
  private storeName: string;
  private version: number;

  constructor(dbName: string, storeName: string, version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
// db 函数
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async get(key: string): Promise<T | null> {
// 常量定义 - 模块内部使用的固定值
    const db = await this.getDB();
// 常量定义 - 模块内部使用的固定值
    const transaction = db.transaction([this.storeName], "readonly");
// 常量定义 - 模块内部使用的固定值
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set(key: string, value: T): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const db = await this.getDB();
// 常量定义 - 模块内部使用的固定值
    const transaction = db.transaction([this.storeName], "readwrite");
// 常量定义 - 模块内部使用的固定值
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
      const request = store.put({ id: key, ...value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key: string): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const db = await this.getDB();
// 常量定义 - 模块内部使用的固定值
    const transaction = db.transaction([this.storeName], "readwrite");
// 常量定义 - 模块内部使用的固定值
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async list(): Promise<string[]> {
// 常量定义 - 模块内部使用的固定值
    const db = await this.getDB();
// 常量定义 - 模块内部使用的固定值
    const transaction = db.transaction([this.storeName], "readonly");
// 常量定义 - 模块内部使用的固定值
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async clear(): Promise<void> {
// 常量定义 - 模块内部使用的固定值
    const db = await this.getDB();
// 常量定义 - 模块内部使用的固定值
    const transaction = db.transaction([this.storeName], "readwrite");
// 常量定义 - 模块内部使用的固定值
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
// 常量定义 - 模块内部使用的固定值
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
