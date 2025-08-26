"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useMediaStore } from "@/stores/media-store";
import { storageService } from "@/lib/storage/storage-service";
import { runStorageDiagnostics, displayDiagnostics, attemptStorageFix } from "@/lib/storage/storage-diagnostics";
import { toast } from "sonner";

interface StorageContextType {
  isInitialized: boolean;
  isLoading: boolean;
  hasSupport: boolean;
  error: string | null;
}

const StorageContext = createContext<StorageContextType | null>(null);

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within StorageProvider");
  }
  return context;
}

interface StorageProviderProps {
  children: React.ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [status, setStatus] = useState<StorageContextType>({
    isInitialized: false,
    isLoading: true,
    hasSupport: false,
    error: null,
  });

  const loadAllProjects = useProjectStore((state) => state.loadAllProjects);

  useEffect(() => {
    const initializeStorage = async () => {
      setStatus((prev) => ({ ...prev, isLoading: true }));

      try {
        // 运行存储诊断
        const diagnostics = await runStorageDiagnostics();
        displayDiagnostics(diagnostics);

        // Check browser support
        const hasSupport = storageService.isFullySupported();

        if (!hasSupport || diagnostics.issues.length > 0) {
          console.warn('存储支持有限，尝试修复...');

          // 尝试修复存储问题
          const fixResult = await attemptStorageFix();

          if (fixResult.success) {
            toast.success("存储系统已优化", {
              description: "已应用兼容性修复"
            });
          } else {
            toast.warning("存储功能受限", {
              description: "某些功能可能无法正常工作，建议使用现代浏览器"
            });
          }
        }

        // Load saved projects (media will be loaded when a project is loaded)
        await loadAllProjects();

        setStatus({
          isInitialized: true,
          isLoading: false,
          hasSupport: hasSupport || diagnostics.issues.length === 0,
          error: null,
        });
      } catch (error) {
        console.error("Failed to initialize storage:", error);

        // 即使初始化失败，也尝试修复
        try {
          const fixResult = await attemptStorageFix();
          if (fixResult.success) {
            toast.info("存储系统已切换到兼容模式");
          }
        } catch (fixError) {
          console.error("存储修复也失败:", fixError);
        }

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
