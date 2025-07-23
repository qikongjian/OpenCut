// storage-provider.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/storage-provider.tsx
// 最后更新: 2025/7/23

// storage-provider.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { createContext, useContext, useEffect, useState } from "react";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入项目模块
import { useMediaStore } from "@/stores/media-store";
// 导入项目模块
import { storageService } from "@/lib/storage/storage-service";
// 导入 Sonner 通知组件
import { toast } from "sonner";

// StorageContextType 接口定义
interface StorageContextType {
  isInitialized: boolean;
  isLoading: boolean;
  hasSupport: boolean;
  error: string | null;
}

// 常量定义 - 模块内部使用的固定值
const StorageContext = createContext<StorageContextType | null>(null);

// useStorage 自定义钩子
// 导出组件 - 可复用的 UI 组件
export function useStorage() {
// 上下文消费 - 消费 React 上下文中的值
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within StorageProvider");
  }
  return context;
}

// StorageProviderProps 接口定义
interface StorageProviderProps {
  children: React.ReactNode;
}

// StorageProvider 函数
// 导出组件 - 可复用的 UI 组件
export function StorageProvider({ children }: StorageProviderProps) {
// 常量定义 - 模块内部使用的固定值
  const [status, setStatus] = useState<StorageContextType>({
    isInitialized: false,
    isLoading: true,
    hasSupport: false,
    error: null,
  });

// 常量定义 - 模块内部使用的固定值
  const loadAllProjects = useProjectStore((state) => state.loadAllProjects);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const initializeStorage = async () => {
      setStatus((prev) => ({ ...prev, isLoading: true }));

      try {
        // Check browser support
        const hasSupport = storageService.isFullySupported();

        if (!hasSupport) {
          toast.warning(
            "Storage not fully supported. Some features may not work."
          );
        }

        // Load saved projects (media will be loaded when a project is loaded)
        await loadAllProjects();

        setStatus({
          isInitialized: true,
          isLoading: false,
          hasSupport,
          error: null,
        });
      } catch (error) {
        console.error("Failed to initialize storage:", error);
        setStatus({
          isInitialized: false,
          isLoading: false,
          hasSupport: storageService.isFullySupported(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    initializeStorage();
  }, [loadAllProjects]);

  return (
    <StorageContext.Provider value={status}>{children}</StorageContext.Provider>
  );
}
