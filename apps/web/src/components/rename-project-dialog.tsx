// rename-project-dialog.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/rename-project-dialog.tsx
// 最后更新: 2025/7/23

// rename-project-dialog.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入模块
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// 导入项目模块
import { Input } from "@/components/ui/input";
// 导入 React 核心库
import { useState } from "react";

// RenameProjectDialog 函数
// 导出组件 - 可复用的 UI 组件
export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  projectName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  projectName: string;
}) {
// 状态管理 - 创建和管理组件内部状态
  const [name, setName] = useState(projectName);

  // Reset the name when dialog opens - this is better UX than syncing with every prop change
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(projectName);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Enter a new name for your project.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onConfirm(name);
            }
          }}
          placeholder="Enter a new name"
          className="mt-4"
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => onConfirm(name)}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
