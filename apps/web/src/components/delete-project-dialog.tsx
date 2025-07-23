// delete-project-dialog.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/delete-project-dialog.tsx
// 最后更新: 2025/7/23

// delete-project-dialog.tsx - React 组件文件
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
import { cn } from "@/lib/utils";

// DeleteProjectDialog 函数
// 导出组件 - 可复用的 UI 组件
export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  projectName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  projectName?: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {projectName ? (
              <>
                {"Delete '"}
                <span className="inline-block max-w-[300px] truncate align-bottom">
                  {projectName}
                </span>
                {"'?"}
              </>
            ) : (
              "Delete Project?"
            )}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this project? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
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
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
