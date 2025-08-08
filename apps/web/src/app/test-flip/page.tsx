"use client";

import { Button } from "@/components/ui/button";
import { useTimelineStore } from "@/stores/timeline-store";
import { CustomFlipHorizontal } from "@/components/ui/icons";

export default function TestFlipPage() {
  const { flipSelectedElements, selectedElements, addTextToNewTrack } = useTimelineStore();

  const addTestText = () => {
    addTextToNewTrack({
      id: `text-${Date.now()}`,
      type: "text",
      name: "Test Text",
      content: "Hello World",
      duration: 5,
      startTime: 0,
      trimStart: 0,
      trimEnd: 0,
      fontSize: 48,
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "transparent",
      textAlign: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      horizontalFlip: false,
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">水平翻转功能测试</h1>
      
      <div className="space-y-4">
        <Button onClick={addTestText}>
          添加测试文本
        </Button>
        
        <Button 
          onClick={flipSelectedElements}
          disabled={selectedElements.length === 0}
          className="flex items-center gap-2"
        >
          <CustomFlipHorizontal className="h-4 w-4" />
          水平翻转选中元素
        </Button>
        
        <div className="text-sm text-muted-foreground">
          选中的元素数量: {selectedElements.length}
        </div>
        
        <div className="text-sm text-muted-foreground">
          快捷键: 按 H 键进行水平翻转
        </div>
      </div>
    </div>
  );
} 