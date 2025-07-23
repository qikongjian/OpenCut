// page.tsx - Next.js 页面组件
// 此文件包含 next.js 页面组件 的相关代码
// 文件路径: app/projects/page.tsx
// 最后更新: 2025/7/23

// page.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入模块
import {
  Calendar,
  ChevronLeft,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";
// 导入 Next.js 相关模块
import Image from "next/image";
// 导入 Next.js 相关模块
import Link from "next/link";
// 导入 Next.js 相关模块
import { useRouter } from "next/navigation";
// 导入 React 核心库
import { useCallback, useEffect, useState } from "react";
// 导入项目模块
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
// 导入项目模块
import { RenameProjectDialog } from "@/components/rename-project-dialog";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入项目模块
import { Card, CardContent } from "@/components/ui/card";
// 导入项目模块
import { Checkbox } from "@/components/ui/checkbox";
// 导入模块
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// 导入项目模块
import { Input } from "@/components/ui/input";
// 导入模块
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// 导入项目模块
import { Skeleton } from "@/components/ui/skeleton";
// 导入项目模块
import { useProjectStore } from "@/stores/project-store";
// 导入项目模块
import { useTimelineStore } from "@/stores/timeline-store";
// 导入项目模块
import type { TProject } from "@/types/project";

// ProjectsPage 组件
// 默认导出组件 - 页面或主要组件
export default function ProjectsPage() {
// 常量定义 - 模块内部使用的固定值
  const {
    savedProjects,
    isLoading,
    isInitialized,
    deleteProject,
    createNewProject,
    getFilteredAndSortedProjects,
  } = useProjectStore();
// 常量定义 - 模块内部使用的固定值
  const [thumbnailCache, setThumbnailCache] = useState<
    Record<string, string | null>
  >({});
// 常量定义 - 模块内部使用的固定值
  const [_loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(
    new Set()
  );
// 状态管理 - 创建和管理组件内部状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
// 常量定义 - 模块内部使用的固定值
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
// 状态管理 - 创建和管理组件内部状态
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [searchQuery, setSearchQuery] = useState("");
// 状态管理 - 创建和管理组件内部状态
  const [sortOption, setSortOption] = useState("createdAt-desc");
// 常量定义 - 模块内部使用的固定值
  const router = useRouter();

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
  const getProjectThumbnail = useCallback(
    async (projectId: string): Promise<string | null> => {
      if (thumbnailCache[projectId] !== undefined) {
        return thumbnailCache[projectId];
      }

      setLoadingThumbnails((prev) => new Set(prev).add(projectId));

      try {
// 常量定义 - 模块内部使用的固定值
        const thumbnail = await useTimelineStore
          .getState()
          .getProjectThumbnail(projectId);
        setThumbnailCache((prev) => ({ ...prev, [projectId]: thumbnail }));
        return thumbnail;
      } finally {
        setLoadingThumbnails((prev) => {
// 常量定义 - 模块内部使用的固定值
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }
    },
    [thumbnailCache]
  );

// 常量定义 - 模块内部使用的固定值
  const handleCreateProject = async () => {
// 常量定义 - 模块内部使用的固定值
    const projectId = await createNewProject("New Project");
    console.log("projectId", projectId);
    router.push(`/editor/${projectId}`);
  };

// handleSelectProject 函数
  const handleSelectProject = (projectId: string, checked: boolean) => {
// 常量定义 - 模块内部使用的固定值
    const newSelected = new Set(selectedProjects);
    if (checked) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    setSelectedProjects(newSelected);
  };

// handleSelectAll 函数
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(new Set(sortedProjects.map((p) => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

// handleCancelSelection 函数
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedProjects(new Set());
  };

// 常量定义 - 模块内部使用的固定值
  const handleBulkDelete = async () => {
    await Promise.all(
      Array.from(selectedProjects).map((projectId) => deleteProject(projectId))
    );
    setSelectedProjects(new Set());
    setIsSelectionMode(false);
    setIsBulkDeleteDialogOpen(false);
  };

// 常量定义 - 模块内部使用的固定值
  const sortedProjects = getFilteredAndSortedProjects(searchQuery, sortOption);

// 常量定义 - 模块内部使用的固定值
  const allSelected =
    sortedProjects.length > 0 &&
    selectedProjects.size === sortedProjects.length;
// 常量定义 - 模块内部使用的固定值
  const someSelected =
    selectedProjects.size > 0 && selectedProjects.size < sortedProjects.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-6 flex items-center justify-between w-full h-16">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
        >
          <ChevronLeft className="!size-5 shrink-0" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <div className="block md:hidden">
          {isSelectionMode ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelSelection}
              >
                <X className="!size-4" />
                Cancel
              </Button>
              {selectedProjects.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="!size-4" />
                  Delete ({selectedProjects.size})
                </Button>
              )}
            </div>
          ) : (
            <CreateButton onClick={handleCreateProject} />
          )}
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 pt-6 pb-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Your Projects
            </h1>
            <p className="text-muted-foreground">
              {savedProjects.length}{" "}
              {savedProjects.length === 1 ? "project" : "projects"}
              {isSelectionMode && selectedProjects.size > 0 && (
                <span className="ml-2 text-primary">
                  • {selectedProjects.size} selected
                </span>
              )}
            </p>
          </div>
          <div className="hidden md:block">
            {isSelectionMode ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCancelSelection}>
                  <X className="!size-4" />
                  Cancel
                </Button>
                {selectedProjects.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="!size-4" />
                    Delete Selected ({selectedProjects.size})
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSelectionMode(true)}
                  disabled={savedProjects.length === 0}
                >
                  Select Projects
                </Button>
                <CreateButton onClick={handleCreateProject} />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-72">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest to Oldest</SelectItem>
              <SelectItem value="createdAt-asc">Oldest to Newest</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSelectionMode && sortedProjects.length > 0 && (
          <button
            type="button"
            onClick={() => handleSelectAll(!allSelected)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelectAll(!allSelected);
              }
            }}
            className="w-full hover:cursor-pointer gap-2 mb-6 p-4 bg-muted/30 rounded-lg border items-center flex"
            tabIndex={0}
          >
            <Checkbox checked={someSelected ? "indeterminate" : allSelected} />
            <span className="text-sm font-medium">
              {allSelected ? "Deselect All" : "Select All"}
            </span>
            <span className="text-sm text-muted-foreground">
              ({selectedProjects.size} of {sortedProjects.length} selected)
            </span>
          </button>
        )}

        {isLoading || !isInitialized ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={`skeleton-${index}-${Date.now()}`}
                className="overflow-hidden bg-background border-none p-0"
              >
                <Skeleton className="aspect-square w-full bg-muted/50" />
                <div className="px-0 pt-5 flex flex-col gap-1">
                  <Skeleton className="h-4 w-3/4 bg-muted/50" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-4 bg-muted/50" />
                    <Skeleton className="h-4 w-24 bg-muted/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : savedProjects.length === 0 ? (
          <NoProjects onCreateProject={handleCreateProject} />
        ) : sortedProjects.length === 0 ? (
          <NoResults
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
          />
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelectionMode={isSelectionMode}
                isSelected={selectedProjects.has(project.id)}
                onSelect={handleSelectProject}
                getProjectThumbnail={getProjectThumbnail}
              />
            ))}
          </div>
        )}
      </main>

      <DeleteProjectDialog
        isOpen={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

// ProjectCardProps 接口定义
interface ProjectCardProps {
  project: TProject;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (projectId: string, checked: boolean) => void;
  getProjectThumbnail: (projectId: string) => Promise<string | null>;
}

// ProjectCard 函数
function ProjectCard({
  project,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  getProjectThumbnail,
}: ProjectCardProps) {
// 状态管理 - 创建和管理组件内部状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
// 状态管理 - 创建和管理组件内部状态
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
// 常量定义 - 模块内部使用的固定值
  const [dynamicThumbnail, setDynamicThumbnail] = useState<string | null>(null);
// 状态管理 - 创建和管理组件内部状态
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true);
// 常量定义 - 模块内部使用的固定值
  const { deleteProject, renameProject, duplicateProject } = useProjectStore();

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const loadThumbnail = async () => {
      setIsLoadingThumbnail(true);
      try {
// 常量定义 - 模块内部使用的固定值
        const thumbnail = await getProjectThumbnail(project.id);
        setDynamicThumbnail(thumbnail);
      } finally {
        setIsLoadingThumbnail(false);
      }
    };
    loadThumbnail();
  }, [project.id, getProjectThumbnail]);

// formatDate 函数
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

// 常量定义 - 模块内部使用的固定值
  const handleDeleteProject = async () => {
    await deleteProject(project.id);
    setIsDropdownOpen(false);
  };

// 常量定义 - 模块内部使用的固定值
  const handleRenameProject = async (newName: string) => {
    await renameProject(project.id, newName);
    setIsRenameDialogOpen(false);
  };

// 常量定义 - 模块内部使用的固定值
  const handleDuplicateProject = async () => {
    setIsDropdownOpen(false);
    await duplicateProject(project.id);
  };

// handleCardClick 函数
  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onSelect?.(project.id, !isSelected);
    }
  };

// handleCardKeyDown 函数
  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (isSelectionMode && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect?.(project.id, !isSelected);
    }
  };

// cardContent 函数
  const cardContent = (
    <Card
      className={`overflow-hidden bg-background border-none p-0 transition-all ${
        isSelectionMode && isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div
        className={`relative aspect-square bg-muted transition-opacity ${
          isDropdownOpen ? "opacity-65" : "opacity-100 group-hover:opacity-65"
        }`}
      >
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <div className="w-5 h-5 rounded bg-background/80 backdrop-blur-sm border flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect?.(project.id, checked as boolean)
                }
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4"
              />
            </div>
          </div>
        )}

        <div className="absolute inset-0">
          {isLoadingThumbnail ? (
            <div className="w-full h-full bg-muted/50 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            </div>
          ) : dynamicThumbnail ? (
            <Image
              src={dynamicThumbnail}
              alt="Project thumbnail"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted/50 flex items-center justify-center">
              <Video className="h-12 w-12 flex-shrink-0 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <CardContent className="px-0 pt-5 flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm leading-snug group-hover:text-foreground/90 transition-colors line-clamp-2">
            {project.name}
          </h3>
          {!isSelectionMode && (
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  size="sm"
                  className={`size-6 p-0 transition-all shrink-0 ml-2 ${
                    isDropdownOpen
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                    setIsRenameDialogOpen(true);
                  }}
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDuplicateProject();
                  }}
                >
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="!size-4" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {isSelectionMode ? (
        <button
          type="button"
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          className="block group cursor-pointer w-full text-left"
        >
          {cardContent}
        </button>
      ) : (
        <Link href={`/editor/${project.id}`} className="block group">
          {cardContent}
        </Link>
      )}
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProject}
      />
      <RenameProjectDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onConfirm={handleRenameProject}
        projectName={project.name}
      />
    </>
  );
}

// CreateButton 函数
function CreateButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button className="flex" onClick={onClick}>
      <Plus className="!size-4" />
      <span className="text-sm font-medium">New project</span>
    </Button>
  );
}

// NoProjects 函数
function NoProjects({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Video className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No projects yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start creating your first video project. Import media, edit, and export
        professional videos.
      </p>
      <Button size="lg" className="gap-2" onClick={onCreateProject}>
        <Plus className="h-4 w-4" />
        Create Your First Project
      </Button>
    </div>
  );
}

// NoResults 函数
function NoResults({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No results found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Your search for "{searchQuery}" did not return any results.
      </p>
      <Button onClick={onClearSearch} variant="outline">
        Clear Search
      </Button>
    </div>
  );
}
