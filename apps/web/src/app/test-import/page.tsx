"use client";

import { EnhancedMediaImport } from "@/components/enhanced-media-import";
import { useProjectStore } from "@/stores/project-store";
import { useMediaStore } from "@/stores/media-store";
import { useEffect } from "react";

export default function TestImportPage() {
  const { activeProject, createNewProject } = useProjectStore();
  const { mediaItems } = useMediaStore();

  // 创建测试项目
  useEffect(() => {
    if (!activeProject) {
      createNewProject("测试项目");
    }
  }, [activeProject, createNewProject]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">增强媒体导入测试</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 完整版导入组件 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">完整版导入</h2>
          <EnhancedMediaImport
            onImportComplete={(result) => {
              console.log("Import result:", result);
            }}
            maxFiles={100}
            showProgress={true}
          />
        </div>

        {/* 紧凑版导入组件 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">紧凑版导入</h2>
          <EnhancedMediaImport
            compact={true}
            onImportComplete={(result) => {
              console.log("Compact import result:", result);
            }}
            maxFiles={20}
            showProgress={true}
          />
        </div>
      </div>

      {/* 显示已导入的媒体 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">已导入的媒体 ({mediaItems.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-2">
              <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                {item.thumbnailUrl ? (
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-xs text-gray-500">{item.type}</span>
                )}
              </div>
              <p className="text-xs truncate">{item.name}</p>
              <p className="text-xs text-gray-500">{item.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 