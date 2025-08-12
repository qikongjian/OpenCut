// timeline-store.ts - Zustand 状态管理存储
// 此文件包含 zustand 状态管理存储 的相关代码
// 文件路径: stores/timeline-store.ts
// 最后更新: 2025/7/23

// timeline-store.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Zustand 状态管理库
import { create } from "zustand";
// 导入模块
import {
  TrackType,
  TimelineElement,
  CreateTimelineElement,
  TimelineTrack,
  TextElement,
  MediaElement,
  DragData,
  sortTracksByOrder,
  ensureMainTrack,
  validateElementTrackCompatibility,
  CreateTransitionElement,
  TransitionType,
  TransitionDirection,
} from "@/types/timeline";
// 导入本地模块
import { useEditorStore } from "./editor-store";
// 导入模块
import { usePlaybackStore } from "./playback-store";
// 导入模块
import {
  useMediaStore,
  getMediaAspectRatio,
// MediaItem 类型定义
  type MediaItem,
} from "./media-store";
// 导入项目模块
import { storageService } from "@/lib/storage/storage-service";
// 导入本地模块
import { useProjectStore } from "./project-store";
// 导入项目模块
import { generateUUID } from "@/lib/utils";

/**
 * 🚀 修复：恢复媒体元素的文件引用
 * 在时间轴加载时，确保媒体元素能够正确引用存储中的文件
 */
async function restoreMediaElementReferences(
  tracks: TimelineTrack[],
  projectId: string
): Promise<TimelineTrack[]> {
  const mediaStore = useMediaStore.getState();

  // 确保媒体库已加载
  if (mediaStore.mediaItems.length === 0) {
    console.log("📥 媒体库为空，安排延迟恢复...");

    // 安排延迟恢复：等待媒体库加载完成后再恢复文件引用
    setTimeout(async () => {
      console.log("🔄 开始延迟恢复媒体文件引用...");
      const updatedMediaStore = useMediaStore.getState();
      if (updatedMediaStore.mediaItems.length > 0) {
        const timelineStore = useTimelineStore.getState();
        await timelineStore.restoreMediaReferences(projectId);
      }
    }, 1000); // 1秒后尝试恢复

    return tracks; // 返回原始轨道，稍后会恢复
  }

  const restoredTracks = await Promise.all(
    tracks.map(async (track) => {
      const restoredElements = await Promise.all(
        track.elements.map(async (element) => {
          // 只处理媒体元素
          if (element.type !== "media") {
            return element;
          }

          const mediaElement = element as MediaElement;

          // 如果元素已经有有效的文件引用，跳过
          if (mediaElement.mediaFile && mediaElement.mediaUrl) {
            return element;
          }

          // 从媒体库中查找对应的媒体项
          const mediaItem = mediaStore.mediaItems.find(
            (item) => item.id === mediaElement.mediaId
          );

          if (mediaItem) {
            console.log(`🔄 恢复媒体元素文件引用: ${mediaElement.name} -> ${mediaItem.name}`);
            console.log(`🔄 媒体项详情:`, {
              id: mediaItem.id,
              name: mediaItem.name,
              hasFile: !!mediaItem.file,
              hasUrl: !!mediaItem.url,
              url: mediaItem.url?.substring(0, 50) + '...',
              fileSize: mediaItem.file?.size
            });

            // 恢复文件引用
            const restoredElement = {
              ...mediaElement,
              mediaFile: mediaItem.file,
              mediaUrl: mediaItem.url,
              thumbnailUrl: mediaItem.thumbnailUrl,
              mediaType: mediaItem.type,
              mediaWidth: mediaItem.width,
              mediaHeight: mediaItem.height,
              mediaFps: mediaItem.fps,
            } as MediaElement;

            console.log(`✅ 恢复后的元素:`, {
              id: restoredElement.id,
              name: restoredElement.name,
              hasMediaFile: !!restoredElement.mediaFile,
              hasMediaUrl: !!restoredElement.mediaUrl,
              mediaUrl: restoredElement.mediaUrl?.substring(0, 50) + '...'
            });

            return restoredElement;
          } else {
            console.warn(`⚠️ 未找到媒体项: ${mediaElement.mediaId} for element ${mediaElement.name}`);
            return element;
          }
        })
      );

      return {
        ...track,
        elements: restoredElements,
      };
    })
  );

  return restoredTracks;
}
// 导入项目模块
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入项目模块
import { checkElementOverlaps, resolveElementOverlaps } from "@/lib/timeline";
// 导入蒙板工具
import { MaskConfig } from "@/types/timeline";

// to 函数
// Helper function to manage element naming with suffixes
const getElementNameWithSuffix = (
  originalName: string,
  suffix: string
): string => {
  // Remove existing suffixes to prevent accumulation
  const baseName = originalName
    .replace(/ \(left\)$/, "")
    .replace(/ \(right\)$/, "")
    .replace(/ \(audio\)$/, "")
    .replace(/ \(split \d+\)$/, "");

  return `${baseName} (${suffix})`;
};

// TimelineStore 接口定义
interface TimelineStore {
  // Private track storage
  _tracks: TimelineTrack[];
  history: TimelineTrack[][];
  redoStack: TimelineTrack[][];

  // Always returns properly ordered tracks with main track ensured
  tracks: TimelineTrack[];

  // Manual method if you need to force recomputation
  getSortedTracks: () => TimelineTrack[];

  // Snapping settings
  snappingEnabled: boolean;

  // Auto-scaling settings
  autoScaleEnabled: boolean;

  // Snapping actions
  toggleSnapping: () => void;

  // Auto-scaling actions
  toggleAutoScale: () => void;

  // Ripple editing mode
  rippleEditingEnabled: boolean;
  toggleRippleEditing: () => void;

  // Multi-selection
  selectedElements: { trackId: string; elementId: string }[];
  selectElement: (trackId: string, elementId: string, multi?: boolean) => void;
  deselectElement: (trackId: string, elementId: string) => void;
  clearSelectedElements: () => void;
  setSelectedElements: (
    elements: { trackId: string; elementId: string }[]
  ) => void;

  // Drag state
  dragState: {
    isDragging: boolean;
    elementId: string | null;
    trackId: string | null;
    startMouseX: number;
    startElementTime: number;
    clickOffsetTime: number;
    currentTime: number;
  };
  
  // 新增已添加媒体跟踪
  addedMediaItems: Set<string>;
  isMediaAddedToTimeline: (mediaId: string) => boolean;
  setDragState: (dragState: Partial<TimelineStore["dragState"]>) => void;
  startDrag: (
    elementId: string,
    trackId: string,
    startMouseX: number,
    startElementTime: number,
    clickOffsetTime: number
  ) => void;
  updateDragTime: (currentTime: number) => void;
  endDrag: () => void;

  // 导出状态管理
  isExporting: boolean;
  setExporting: (exporting: boolean) => void;

  // Actions
  addTrack: (type: TrackType) => string;
  insertTrackAt: (type: TrackType, index: number) => string;
  removeTrack: (trackId: string) => void;
  removeTrackWithRipple: (trackId: string) => void;
  addElementToTrack: (trackId: string, element: CreateTimelineElement) => void;
  removeElementFromTrack: (trackId: string, elementId: string) => void;
  moveElementToTrack: (
    fromTrackId: string,
    toTrackId: string,
    elementId: string
  ) => void;
  updateElementTrim: (
    trackId: string,
    elementId: string,
    trimStart: number,
    trimEnd: number,
    pushHistory?: boolean
  ) => void;
  updateElementDuration: (
    trackId: string,
    elementId: string,
    duration: number,
    pushHistory?: boolean
  ) => void;
  updateElementStartTime: (
    trackId: string,
    elementId: string,
    startTime: number,
    pushHistory?: boolean
  ) => void;
  toggleTrackMute: (trackId: string) => void;

  // Split operations for elements
  splitElement: (
    trackId: string,
    elementId: string,
    splitTime: number
  ) => string | null;
  splitAndKeepLeft: (
    trackId: string,
    elementId: string,
    splitTime: number
  ) => void;
  splitAndKeepRight: (
    trackId: string,
    elementId: string,
    splitTime: number
  ) => void;
  separateAudio: (trackId: string, elementId: string) => string | null;

  // Replace media for an element
  replaceElementMedia: (
    trackId: string,
    elementId: string,
    newFile: File
  ) => Promise<boolean>;

  // Ripple editing functions
  updateElementStartTimeWithRipple: (
    trackId: string,
    elementId: string,
    newStartTime: number
  ) => void;
  removeElementFromTrackWithRipple: (
    trackId: string,
    elementId: string
  ) => void;

  // Computed values
  getTotalDuration: () => number;
  getProjectThumbnail: (projectId: string) => Promise<string | null>;

  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Persistence actions
  loadProjectTimeline: (projectId: string) => Promise<void>;
  saveProjectTimeline: (projectId: string) => Promise<void>;
  clearTimeline: () => void;
  // 🚀 新增：恢复媒体文件引用的公共方法
  restoreMediaReferences: (projectId: string) => Promise<void>;
  updateTextElement: (
    trackId: string,
    elementId: string,
    updates: Partial<
      Pick<
        TextElement,
        | "content"
        | "fontSize"
        | "fontFamily"
        | "color"
        | "backgroundColor"
        | "textAlign"
        | "fontWeight"
        | "fontStyle"
        | "textDecoration"
        | "x"
        | "y"
        | "rotation"
        | "opacity"
        | "horizontalFlip"
      >
    >
  ) => void;
  checkElementOverlap: (
    trackId: string,
    startTime: number,
    duration: number,
    excludeElementId?: string
  ) => boolean;
  findOrCreateTrack: (trackType: TrackType) => string;
  addMediaAtTime: (item: MediaItem, currentTime?: number) => boolean;
  addTextAtTime: (item: TextElement, currentTime?: number) => boolean;
  addMediaToNewTrack: (item: MediaItem) => boolean;
  addTextToNewTrack: (item: TextElement | DragData) => boolean;
  
  // 转场相关功能
  addTransitionBetweenElements: (
    fromTrackId: string,
    fromElementId: string,
    toTrackId: string,
    toElementId: string,
    transitionType: TransitionType,
    transitionParams: {
      direction: TransitionDirection;
      duration: number;
      easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
      intensity?: number;
      blur?: number;
    }
  ) => string | null;
  
  updateTransitionElement: (
    trackId: string,
    elementId: string,
    updates: Partial<{
      transitionType: TransitionType;
      direction: TransitionDirection;
      easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
      intensity: number;
      blur: number;
      duration: number;
    }>
  ) => void;
  
  // 水平翻转功能
  flipSelectedElements: () => void;

  // 蒙板管理功能
  addMaskToElement: (trackId: string, elementId: string, maskConfig: MaskConfig) => void;
  removeMaskFromElement: (trackId: string, elementId: string, maskId: string) => void;
  updateElementMask: (trackId: string, elementId: string, maskId: string, updates: Partial<MaskConfig>) => void;
  getMasksByElement: (trackId: string, elementId: string) => MaskConfig[];
}

// 导出常量对象 - 包含多个相关常量的对象
export const useTimelineStore = create<TimelineStore>((set, get) => {
  // Helper to update tracks and maintain ordering
  const updateTracks = (newTracks: TimelineTrack[]) => {
// 常量定义 - 模块内部使用的固定值
    const tracksWithMain = ensureMainTrack(newTracks);
// 常量定义 - 模块内部使用的固定值
    const sortedTracks = sortTracksByOrder(tracksWithMain);
    // 设置状态 - 更新状态值
    set({
      _tracks: tracksWithMain,
      tracks: sortedTracks,
    });
  };

  // Helper to auto-save timeline changes
  const autoSaveTimeline = async () => {
    const activeProject = useProjectStore.getState().activeProject;
    // 检查是否在导出中，如果是则跳过自动保存
    const isExporting = get().isExporting;
    if (activeProject && !isExporting) {
      try {
        await storageService.saveTimeline(activeProject.id, get()._tracks);
      } catch (error) {
        console.error("Failed to auto-save timeline:", error);
      }
    }
  };

  // Helper to update tracks and auto-save
  const updateTracksAndSave = (newTracks: TimelineTrack[]) => {
    updateTracks(newTracks);
    // Auto-save in background
    setTimeout(autoSaveTimeline, 100);
  };

  // Initialize with proper track ordering
  const initialTracks = ensureMainTrack([]);
// 常量定义 - 模块内部使用的固定值
  const sortedInitialTracks = sortTracksByOrder(initialTracks);

  return {
    _tracks: initialTracks,
    tracks: sortedInitialTracks,
    history: [],
    redoStack: [],
    selectedElements: [],
    rippleEditingEnabled: false,

    // Snapping settings defaults
    snappingEnabled: true,

  // Auto-scaling settings
  autoScaleEnabled: true,
    
    // 新增已添加媒体跟踪
    addedMediaItems: new Set<string>(),
    
    isMediaAddedToTimeline: (mediaId: string) => {
      return get().addedMediaItems.has(mediaId);
    },

    getSortedTracks: () => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const tracksWithMain = ensureMainTrack(_tracks);
      return sortTracksByOrder(tracksWithMain);
    },

    pushHistory: () => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks, history } = get();
      // 设置状态 - 更新状态值
      set({
        history: [...history, JSON.parse(JSON.stringify(_tracks))],
        redoStack: [],
      });
    },

    undo: () => {
// 常量定义 - 模块内部使用的固定值
      const { history, redoStack, _tracks } = get();
      if (history.length === 0) return;
// 常量定义 - 模块内部使用的固定值
      const prev = history[history.length - 1];
      updateTracksAndSave(prev);
      // 设置状态 - 更新状态值
      set({
        history: history.slice(0, -1),
        redoStack: [...redoStack, JSON.parse(JSON.stringify(_tracks))],
      });
    },

    selectElement: (trackId, elementId, multi = false) => {
      // 设置状态 - 更新状态值
      set((state) => {
// 常量定义 - 模块内部使用的固定值
        const exists = state.selectedElements.some(
          (c) => c.trackId === trackId && c.elementId === elementId
        );
        if (multi) {
          return exists
            ? {
                selectedElements: state.selectedElements.filter(
                  (c) => !(c.trackId === trackId && c.elementId === elementId)
                ),
              }
            : {
                selectedElements: [
                  ...state.selectedElements,
                  { trackId, elementId },
                ],
              };
        } else {
          return { selectedElements: [{ trackId, elementId }] };
        }
      });
    },

    deselectElement: (trackId, elementId) => {
      // 设置状态 - 更新状态值
      set((state) => ({
        selectedElements: state.selectedElements.filter(
          (c) => !(c.trackId === trackId && c.elementId === elementId)
        ),
      }));
    },

    clearSelectedElements: () => {
      // 设置状态 - 更新状态值
      set({ selectedElements: [] });
    },

    setSelectedElements: (elements) => set({ selectedElements: elements }),

    addTrack: (type) => {
      // 获取状态 - 读取状态值
      get().pushHistory();

      // Generate proper track name based on type
      const trackName =
// 类型定义
        type === "media"
          ? "Media Track"
          : type === "text"
            ? "Text Track"
            : type === "audio"
              ? "Audio Track"
              : "Track";

// 常量定义 - 模块内部使用的固定值
      const newTrack: TimelineTrack = {
        id: generateUUID(),
        name: trackName,
        type,
        elements: [],
        muted: false,
      };

      updateTracksAndSave([...get()._tracks, newTrack]);
      return newTrack.id;
    },

    insertTrackAt: (type, index) => {
      // 获取状态 - 读取状态值
      get().pushHistory();

      // Generate proper track name based on type
      const trackName =
// 类型定义
        type === "media"
          ? "Media Track"
          : type === "text"
            ? "Text Track"
            : type === "audio"
              ? "Audio Track"
              : "Track";

// 常量定义 - 模块内部使用的固定值
      const newTrack: TimelineTrack = {
        id: generateUUID(),
        name: trackName,
        type,
        elements: [],
        muted: false,
      };

// 常量定义 - 模块内部使用的固定值
      const newTracks = [...get()._tracks];
      newTracks.splice(index, 0, newTrack);
      updateTracksAndSave(newTracks);
      return newTrack.id;
    },

    removeTrack: (trackId) => {
// 常量定义 - 模块内部使用的固定值
      const { rippleEditingEnabled } = get();

      if (rippleEditingEnabled) {
        // 获取状态 - 读取状态值
        get().removeTrackWithRipple(trackId);
      } else {
        // 获取状态 - 读取状态值
        get().pushHistory();
        updateTracksAndSave(
          // 获取状态 - 读取状态值
          get()._tracks.filter((track) => track.id !== trackId)
        );
      }
    },

    removeTrackWithRipple: (trackId) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const trackToRemove = _tracks.find((t) => t.id === trackId);

      if (!trackToRemove) return;

      // 获取状态 - 读取状态值

      get().pushHistory();

      // If track has no elements, just remove it normally
      if (trackToRemove.elements.length === 0) {
        updateTracksAndSave(_tracks.filter((track) => track.id !== trackId));
        return;
      }

      // Find all the time ranges occupied by elements in the track being removed
      const occupiedRanges = trackToRemove.elements.map((element) => ({
        startTime: element.startTime,
        endTime:
          element.startTime +
          (element.duration - element.trimStart - element.trimEnd),
      }));

      // Sort ranges by start time
      occupiedRanges.sort((a, b) => a.startTime - b.startTime);

      // Merge overlapping ranges to get consolidated gaps
      const mergedRanges: Array<{
        startTime: number;
        endTime: number;
        duration: number;
      }> = [];

      for (const range of occupiedRanges) {
        if (mergedRanges.length === 0) {
          mergedRanges.push({
            startTime: range.startTime,
            endTime: range.endTime,
            duration: range.endTime - range.startTime,
          });
        } else {
// 常量定义 - 模块内部使用的固定值
          const lastRange = mergedRanges[mergedRanges.length - 1];
          if (range.startTime <= lastRange.endTime) {
            // Overlapping or adjacent ranges, merge them
            lastRange.endTime = Math.max(lastRange.endTime, range.endTime);
            lastRange.duration = lastRange.endTime - lastRange.startTime;
          } else {
            // Non-overlapping range, add as new
            mergedRanges.push({
              startTime: range.startTime,
              endTime: range.endTime,
              duration: range.endTime - range.startTime,
            });
          }
        }
      }

      // Remove the track and apply ripple effects to remaining tracks
      const updatedTracks = _tracks
        .filter((track) => track.id !== trackId)
        .map((track) => {
// 常量定义 - 模块内部使用的固定值
          const updatedElements = track.elements.map((element) => {
            let newStartTime = element.startTime;

            // Process gaps from right to left (latest to earliest) to avoid cumulative shifts
            for (let i = mergedRanges.length - 1; i >= 0; i--) {
// 常量定义 - 模块内部使用的固定值
              const gap = mergedRanges[i];
              // If this element starts after the gap, shift it left by the gap duration
              if (newStartTime >= gap.endTime) {
                newStartTime -= gap.duration;
              }
            }

            return {
              ...element,
              startTime: Math.max(0, newStartTime),
            };
          });

          // Check for overlaps and resolve them if necessary
          const hasOverlaps = checkElementOverlaps(updatedElements);
          if (hasOverlaps) {
// 常量定义 - 模块内部使用的固定值
            const resolvedElements = resolveElementOverlaps(updatedElements);
            return { ...track, elements: resolvedElements };
          }

          return { ...track, elements: updatedElements };
        });

      updateTracksAndSave(updatedTracks);
    },

    addElementToTrack: (trackId, elementData) => {
      // 获取状态 - 读取状态值
      get().pushHistory();

      // Validate element type matches track type
      const track = get()._tracks.find((t) => t.id === trackId);
      if (!track) {
        console.error("Track not found:", trackId);
        return;
      }

// for 函数
      // Use utility function for validation
      const validation = validateElementTrackCompatibility(elementData, track);
      if (!validation.isValid) {
        console.error(validation.errorMessage);
        return;
      }

      // For media elements, validate mediaId exists
      if (elementData.type === "media" && !elementData.mediaId) {
        console.error("Media element must have mediaId");
        return;
      }

      // For text elements, validate required text properties
      if (elementData.type === "text" && !elementData.content) {
        console.error("Text element must have content");
        return;
      }

      // Check if this is the first element being added to the timeline
      const currentState = get();
// 常量定义 - 模块内部使用的固定值
      const totalElementsInTimeline = currentState._tracks.reduce(
        (total, track) => total + track.elements.length,
        0
      );
// 常量定义 - 模块内部使用的固定值
      const isFirstElement = totalElementsInTimeline === 0;

      // 常量定义 - 模块内部使用的固定值
      const newElement: TimelineElement = {
        ...elementData,
        id: generateUUID(),
        startTime: elementData.startTime || 0,
        trimStart: elementData.trimStart || 0,  // 🚀 修复：保留元素的trimStart设置
        trimEnd: elementData.trimEnd || 0,      // 🚀 修复：保留元素的trimEnd设置
      } as TimelineElement; // Type assertion since we trust the caller passes valid data

      // If this is the first element and it's a media element, automatically set the project canvas size
      // to match the media's aspect ratio and FPS (for videos)
      if (isFirstElement && newElement.type === "media") {
// 常量定义 - 模块内部使用的固定值
        const mediaStore = useMediaStore.getState();
// 常量定义 - 模块内部使用的固定值
        const mediaItem = mediaStore.mediaItems.find(
          (item) => item.id === newElement.mediaId
        );

        if (
          mediaItem &&
          (mediaItem.type === "image" || mediaItem.type === "video")
        ) {
// 常量定义 - 模块内部使用的固定值
          const editorStore = useEditorStore.getState();
          editorStore.setCanvasSizeFromAspectRatio(
            getMediaAspectRatio(mediaItem)
          );
        }

        // Set project FPS from the first video element
        if (mediaItem && mediaItem.type === "video" && mediaItem.fps) {
// 常量定义 - 模块内部使用的固定值
          const projectStore = useProjectStore.getState();
          if (projectStore.activeProject) {
            projectStore.updateProjectFps(mediaItem.fps);
          }
        }
      }

      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? { ...track, elements: [...track.elements, newElement] }
            : track
        )
      );

      // 新增：记录媒体已添加到时间轴
      if (newElement.type === 'media' && newElement.mediaId) {
        set((state) => ({
          addedMediaItems: new Set([...state.addedMediaItems, newElement.mediaId])
        }));
        
        // 触发状态更新事件
        window.dispatchEvent(new CustomEvent('media-added-to-timeline', {
          detail: { mediaId: newElement.mediaId }
        }));
      }

      // 获取状态 - 读取状态值

      get().selectElement(trackId, newElement.id);
    },

    removeElementFromTrack: (trackId, elementId) => {
// 常量定义 - 模块内部使用的固定值
      const { rippleEditingEnabled } = get();

      // 获取要删除的元素信息
      const track = get()._tracks.find(t => t.id === trackId);
      const element = track?.elements.find(e => e.id === elementId);

      if (rippleEditingEnabled) {
        // 获取状态 - 读取状态值
        get().removeElementFromTrackWithRipple(trackId, elementId);
      } else {
        // 获取状态 - 读取状态值
        get().pushHistory();
        updateTracksAndSave(
          // 获取状态 - 读取状态值
          get()
            ._tracks.map((track) =>
              track.id === trackId
                ? {
                    ...track,
                    elements: track.elements.filter(
                      (element) => element.id !== elementId
                    ),
                  }
                : track
            )
            .filter((track) => track.elements.length > 0)
        );
      }

      // 新增：如果删除的是媒体元素，更新媒体状态
      if (element && element.type === 'media' && element.mediaId) {
        // 检查该媒体是否还在时间轴中的其他地方
        const remainingTracks = get()._tracks;
        const mediaStillExists = remainingTracks.some(track =>
          track.elements.some(el => el.type === 'media' && el.mediaId === element.mediaId)
        );

        if (!mediaStillExists) {
          // 如果媒体不再存在于时间轴中，从已添加列表中移除
          set((state) => ({
            addedMediaItems: new Set([...state.addedMediaItems].filter(id => id !== element.mediaId))
          }));
          
          // 触发状态更新事件
          window.dispatchEvent(new CustomEvent('media-removed-from-timeline', {
            detail: { mediaId: element.mediaId }
          }));
        }
      }
    },

    removeElementFromTrackWithRipple: (trackId, elementId) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks, rippleEditingEnabled } = get();

      if (!rippleEditingEnabled) {
        // If ripple editing is disabled, use regular removal
        // 获取状态 - 读取状态值
        get().removeElementFromTrack(trackId, elementId);
        return;
      }

// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((e) => e.id === elementId);

      if (!element || !track) return;

      // 获取状态 - 读取状态值

      get().pushHistory();

// 常量定义 - 模块内部使用的固定值
      const elementStartTime = element.startTime;
// 常量定义 - 模块内部使用的固定值
      const elementDuration =
        element.duration - element.trimStart - element.trimEnd;
// 常量定义 - 模块内部使用的固定值
      const elementEndTime = elementStartTime + elementDuration;

      // Remove the element and shift all elements that come after it
      const updatedTracks = _tracks
        .map((currentTrack) => {
          // Only apply ripple effects to the same track unless multi-track ripple is enabled
          const shouldApplyRipple = currentTrack.id === trackId;

// 常量定义 - 模块内部使用的固定值
          const updatedElements = currentTrack.elements
            .filter((currentElement) => {
              // Remove the target element
              if (
                currentElement.id === elementId &&
                currentTrack.id === trackId
              ) {
                return false;
              }
              return true;
            })
            .map((currentElement) => {
              // Only apply ripple effects if we should process this track
              if (!shouldApplyRipple) {
                return currentElement;
              }

              // Shift elements that start after the removed element
              if (currentElement.startTime >= elementEndTime) {
                return {
                  ...currentElement,
                  startTime: Math.max(
                    0,
                    currentElement.startTime - elementDuration
                  ),
                };
              }
              return currentElement;
            });

          // Check for overlaps and resolve them if necessary
          const hasOverlaps = checkElementOverlaps(updatedElements);
          if (hasOverlaps) {
            // Resolve overlaps by adjusting element positions
            const resolvedElements = resolveElementOverlaps(updatedElements);
            return { ...currentTrack, elements: resolvedElements };
          }

          return { ...currentTrack, elements: updatedElements };
        })
        .filter((track) => track.elements.length > 0 || track.isMain);

      updateTracksAndSave(updatedTracks);

      // 新增：如果删除的是媒体元素，更新媒体状态
      if (element && element.type === 'media' && element.mediaId) {
        // 检查该媒体是否还在时间轴中的其他地方
        const remainingTracks = get()._tracks;
        const mediaStillExists = remainingTracks.some(track =>
          track.elements.some(el => el.type === 'media' && el.mediaId === element.mediaId)
        );

        if (!mediaStillExists) {
          // 如果媒体不再存在于时间轴中，从已添加列表中移除
          set((state) => ({
            addedMediaItems: new Set([...state.addedMediaItems].filter(id => id !== element.mediaId))
          }));
          
          // 触发状态更新事件
          window.dispatchEvent(new CustomEvent('media-removed-from-timeline', {
            detail: { mediaId: element.mediaId }
          }));
        }
      }
    },

    moveElementToTrack: (fromTrackId, toTrackId, elementId) => {
      // 获取状态 - 读取状态值
      get().pushHistory();

// 常量定义 - 模块内部使用的固定值
      const fromTrack = get()._tracks.find((track) => track.id === fromTrackId);
// 常量定义 - 模块内部使用的固定值
      const toTrack = get()._tracks.find((track) => track.id === toTrackId);
// 常量定义 - 模块内部使用的固定值
      const elementToMove = fromTrack?.elements.find(
        (element) => element.id === elementId
      );

      if (!elementToMove || !toTrack) return;

      // Validate element type compatibility with target track
      const validation = validateElementTrackCompatibility(
        elementToMove,
        toTrack
      );
      if (!validation.isValid) {
        console.error(validation.errorMessage);
        return;
      }

// 常量定义 - 模块内部使用的固定值
      const newTracks = get()
        ._tracks.map((track) => {
          if (track.id === fromTrackId) {
            return {
              ...track,
              elements: track.elements.filter(
                (element) => element.id !== elementId
              ),
            };
          } else if (track.id === toTrackId) {
            return {
              ...track,
              elements: [...track.elements, elementToMove],
            };
          }
          return track;
        })
        .filter((track) => track.elements.length > 0);

      updateTracksAndSave(newTracks);
    },

    updateElementTrim: (
      trackId,
      elementId,
      trimStart,
      trimEnd,
      pushHistory = true
    ) => {
      if (pushHistory) get().pushHistory();
      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId
                    ? { ...element, trimStart, trimEnd }
                    : element
                ),
              }
            : track
        )
      );
    },

    updateElementDuration: (
      trackId,
      elementId,
      duration,
      pushHistory = true
    ) => {
      if (pushHistory) get().pushHistory();
      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId ? { ...element, duration } : element
                ),
              }
            : track
        )
      );
    },

    updateElementStartTime: (
      trackId,
      elementId,
      startTime,
      pushHistory = true
    ) => {
      if (pushHistory) get().pushHistory();
      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId ? { ...element, startTime } : element
                ),
              }
            : track
        )
      );
    },

    updateElementStartTimeWithRipple: (trackId, elementId, newStartTime) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks, rippleEditingEnabled } = get();

      if (!rippleEditingEnabled) {
        // If ripple editing is disabled, use regular update
        // 获取状态 - 读取状态值
        get().updateElementStartTime(trackId, elementId, newStartTime);
        return;
      }

// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((e) => e.id === elementId);

      if (!element || !track) return;

      // 获取状态 - 读取状态值

      get().pushHistory();

// 常量定义 - 模块内部使用的固定值
      const oldStartTime = element.startTime;
// 常量定义 - 模块内部使用的固定值
      const oldEndTime =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd);
// 常量定义 - 模块内部使用的固定值
      const newEndTime =
        newStartTime + (element.duration - element.trimStart - element.trimEnd);
// 常量定义 - 模块内部使用的固定值
      const timeDelta = newStartTime - oldStartTime;

      // Update tracks based on multi-track ripple setting
      const updatedTracks = _tracks.map((currentTrack) => {
        // Only apply ripple effects to the same track unless multi-track ripple is enabled
        const shouldApplyRipple = currentTrack.id === trackId;

// 常量定义 - 模块内部使用的固定值
        const updatedElements = currentTrack.elements.map((currentElement) => {
          if (currentElement.id === elementId && currentTrack.id === trackId) {
            // Update the moved element
            return { ...currentElement, startTime: newStartTime };
          }

          // Only apply ripple effects if we should process this track
          if (!shouldApplyRipple) {
            return currentElement;
          }

          // For ripple editing, we need to move elements that come after the moved element
          const currentElementStart = currentElement.startTime;
// 常量定义 - 模块内部使用的固定值
          const currentElementEnd =
            currentElement.startTime +
            (currentElement.duration -
              currentElement.trimStart -
              currentElement.trimEnd);

          // If moving element to the right (positive delta)
          if (timeDelta > 0) {
            // Move elements that start after the original position of the moved element
            if (currentElementStart >= oldEndTime) {
              return {
                ...currentElement,
                startTime: currentElementStart + timeDelta,
              };
            }
          }
          // If moving element to the left (negative delta)
          else if (timeDelta < 0) {
            // Move elements that start after the new position of the moved element
            if (
              currentElementStart >= newEndTime &&
              currentElementStart >= oldStartTime
            ) {
              return {
                ...currentElement,
                startTime: Math.max(0, currentElementStart + timeDelta),
              };
            }
          }

          return currentElement;
        });

        // Check for overlaps and resolve them if necessary
        const hasOverlaps = checkElementOverlaps(updatedElements);
        if (hasOverlaps) {
          // Resolve overlaps by adjusting element positions
          const resolvedElements = resolveElementOverlaps(updatedElements);
          return { ...currentTrack, elements: resolvedElements };
        }

        return { ...currentTrack, elements: updatedElements };
      });

      updateTracksAndSave(updatedTracks);
    },

    toggleTrackMute: (trackId) => {
      // 获取状态 - 读取状态值
      get().pushHistory();
      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId ? { ...track, muted: !track.muted } : track
        )
      );
    },

    updateTextElement: (trackId, elementId, updates) => {
      // 获取状态 - 读取状态值
      get().pushHistory();
      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId && element.type === "text"
                    ? { ...element, ...updates }
                    : element
                ),
              }
            : track
        )
      );
    },

    splitElement: (trackId, elementId, splitTime) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((c) => c.id === elementId);

      if (!element) return null;

// 常量定义 - 模块内部使用的固定值
      const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
      const effectiveEnd =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd);

      if (splitTime <= effectiveStart || splitTime >= effectiveEnd) return null;

      // 获取状态 - 读取状态值

      get().pushHistory();

// 常量定义 - 模块内部使用的固定值
      const relativeTime = splitTime - element.startTime;
// 常量定义 - 模块内部使用的固定值
      const firstDuration = relativeTime;
// 常量定义 - 模块内部使用的固定值
      const secondDuration =
        element.duration - element.trimStart - element.trimEnd - relativeTime;

// 常量定义 - 模块内部使用的固定值
      const secondElementId = generateUUID();

      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.flatMap((c) =>
                  c.id === elementId
                    ? [
                        {
                          ...c,
                          trimEnd: c.trimEnd + secondDuration,
                          name: getElementNameWithSuffix(c.name, "left"),
                        },
                        {
                          ...c,
                          id: secondElementId,
                          startTime: splitTime,
                          trimStart: c.trimStart + firstDuration,
                          name: getElementNameWithSuffix(c.name, "right"),
                        },
                      ]
                    : [c]
                ),
              }
            : track
        )
      );

      return secondElementId;
    },

    // Split element and keep only the left portion
    splitAndKeepLeft: (trackId, elementId, splitTime) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((c) => c.id === elementId);

      if (!element) return;

// 常量定义 - 模块内部使用的固定值
      const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
      const effectiveEnd =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd);

      if (splitTime <= effectiveStart || splitTime >= effectiveEnd) return;

      // 获取状态 - 读取状态值

      get().pushHistory();

// 常量定义 - 模块内部使用的固定值
      const relativeTime = splitTime - element.startTime;
// 常量定义 - 模块内部使用的固定值
      const durationToRemove =
        element.duration - element.trimStart - element.trimEnd - relativeTime;

      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((c) =>
                  c.id === elementId
                    ? {
                        ...c,
                        trimEnd: c.trimEnd + durationToRemove,
                        name: getElementNameWithSuffix(c.name, "left"),
                      }
                    : c
                ),
              }
            : track
        )
      );
    },

    // Split element and keep only the right portion
    splitAndKeepRight: (trackId, elementId, splitTime) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((c) => c.id === elementId);

      if (!element) return;

// 常量定义 - 模块内部使用的固定值
      const effectiveStart = element.startTime;
// 常量定义 - 模块内部使用的固定值
      const effectiveEnd =
        element.startTime +
        (element.duration - element.trimStart - element.trimEnd);

      if (splitTime <= effectiveStart || splitTime >= effectiveEnd) return;

      // 获取状态 - 读取状态值

      get().pushHistory();

// 常量定义 - 模块内部使用的固定值
      const relativeTime = splitTime - element.startTime;

      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((c) =>
                  c.id === elementId
                    ? {
                        ...c,
                        startTime: splitTime,
                        trimStart: c.trimStart + relativeTime,
                        name: getElementNameWithSuffix(c.name, "right"),
                      }
                    : c
                ),
              }
            : track
        )
      );
    },

    // Extract audio from video element to an audio track
    separateAudio: (trackId, elementId) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((c) => c.id === elementId);

      if (!element || track?.type !== "media") return null;

      // 获取状态 - 读取状态值

      get().pushHistory();

      // Find existing audio track or prepare to create one
      const existingAudioTrack = _tracks.find((t) => t.type === "audio");
// 常量定义 - 模块内部使用的固定值
      const audioElementId = generateUUID();

      if (existingAudioTrack) {
        // Add audio element to existing audio track
        updateTracksAndSave(
          // 获取状态 - 读取状态值
          get()._tracks.map((track) =>
            track.id === existingAudioTrack.id
              ? {
                  ...track,
                  elements: [
                    ...track.elements,
                    {
                      ...element,
                      id: audioElementId,
                      name: getElementNameWithSuffix(element.name, "audio"),
                    },
                  ],
                }
              : track
          )
        );
      } else {
        // Create new audio track with the audio element in a single atomic update
        const newAudioTrack: TimelineTrack = {
          id: generateUUID(),
          name: "Audio Track",
          type: "audio",
          elements: [
            {
              ...element,
              id: audioElementId,
              name: getElementNameWithSuffix(element.name, "audio"),
            },
          ],
          muted: false,
        };

        updateTracksAndSave([...get()._tracks, newAudioTrack]);
      }

      return audioElementId;
    },

    // Replace media for an element
    replaceElementMedia: async (trackId, elementId, newFile) => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
// 常量定义 - 模块内部使用的固定值
      const track = _tracks.find((t) => t.id === trackId);
// 常量定义 - 模块内部使用的固定值
      const element = track?.elements.find((c) => c.id === elementId);

      if (!element || element.type !== "media") return false;

      try {
// 常量定义 - 模块内部使用的固定值
        const mediaStore = useMediaStore.getState();
// 常量定义 - 模块内部使用的固定值
        const projectStore = useProjectStore.getState();

        if (!projectStore.activeProject) return false;

        // Import required media processing functions
        const {
          getFileType,
          getImageDimensions,
          generateVideoThumbnail,
          getMediaDuration,
        } = await import("./media-store");

// 常量定义 - 模块内部使用的固定值
        const fileType = getFileType(newFile);
        if (!fileType) return false;

        // Process the new media file
        let mediaData: any = {
          name: newFile.name,
          type: fileType,
          file: newFile,
          url: URL.createObjectURL(newFile),
        };

        // Get media-specific metadata
        if (fileType === "image") {
// 常量定义 - 模块内部使用的固定值
          const { width, height } = await getImageDimensions(newFile);
          mediaData.width = width;
          mediaData.height = height;
        } else if (fileType === "video") {
// 常量定义 - 模块内部使用的固定值
          const [duration, { thumbnailUrl, width, height }] = await Promise.all(
            [getMediaDuration(newFile), generateVideoThumbnail(newFile)]
          );
          mediaData.duration = duration;
          mediaData.thumbnailUrl = thumbnailUrl;
          mediaData.width = width;
          mediaData.height = height;
        } else if (fileType === "audio") {
          mediaData.duration = await getMediaDuration(newFile);
        }

        // Add new media item to store
        await mediaStore.addMediaItem(projectStore.activeProject.id, mediaData);

        // Find the newly created media item
        const newMediaItem = mediaStore.mediaItems.find(
          (item) => item.file === newFile
        );

        if (!newMediaItem) return false;

        // 获取状态 - 读取状态值

        get().pushHistory();

        // Update the timeline element to reference the new media
        updateTracksAndSave(
          _tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  elements: track.elements.map((c) =>
                    c.id === elementId
                      ? {
                          ...c,
                          mediaId: newMediaItem.id,
                          name: newMediaItem.name,
                          // Update duration if the new media has a different duration
                          duration: newMediaItem.duration || c.duration,
                        }
                      : c
                  ),
                }
              : track
          )
        );

        return true;
      } catch (error) {
        console.log(
          JSON.stringify({
            error: "Failed to replace element media",
            details: error,
          })
        );
        return false;
      }
    },

    getTotalDuration: () => {
// 常量定义 - 模块内部使用的固定值
      const { _tracks } = get();
      if (_tracks.length === 0) return 0;

// 常量定义 - 模块内部使用的固定值
      const trackEndTimes = _tracks.map((track) =>
        track.elements.reduce((maxEnd, element) => {
// 常量定义 - 模块内部使用的固定值
          const elementEnd =
            element.startTime +
            element.duration -
            element.trimStart -
            element.trimEnd;
          return Math.max(maxEnd, elementEnd);
        }, 0)
      );

      return Math.max(...trackEndTimes, 0);
    },

    getProjectThumbnail: async (projectId) => {
      try {
// 常量定义 - 模块内部使用的固定值
        const tracks = await storageService.loadTimeline(projectId);
// 常量定义 - 模块内部使用的固定值
        const mediaItems = await storageService.loadAllMediaItems(projectId);

        if (!tracks || !mediaItems.length) return null;

// 常量定义 - 模块内部使用的固定值
        const firstMediaElement = tracks
          .flatMap((track) => track.elements)
          .filter((element) => element.type === "media")
          .sort((a, b) => a.startTime - b.startTime)[0];

        if (!firstMediaElement) return null;

// 常量定义 - 模块内部使用的固定值
        const mediaItem = mediaItems.find(
          (item) => item.id === firstMediaElement.mediaId
        );
        if (!mediaItem) return null;

        if (mediaItem.type === "video" && mediaItem.file) {
// 常量定义 - 模块内部使用的固定值
          const { generateVideoThumbnail } = await import(
            "@/stores/media-store"
          );
// 常量定义 - 模块内部使用的固定值
          const { thumbnailUrl } = await generateVideoThumbnail(mediaItem.file);
          return thumbnailUrl;
        } else if (mediaItem.type === "image" && mediaItem.url) {
          return mediaItem.url;
        }

        return null;
      } catch (error) {
        console.error("Failed to get project thumbnail:", error);
        return null;
      }
    },

    redo: () => {
// 常量定义 - 模块内部使用的固定值
      const { redoStack } = get();
      if (redoStack.length === 0) return;
// 常量定义 - 模块内部使用的固定值
      const next = redoStack[redoStack.length - 1];
      updateTracksAndSave(next);
      // 设置状态 - 更新状态值
      set({ redoStack: redoStack.slice(0, -1) });
    },

    dragState: {
      isDragging: false,
      elementId: null,
      trackId: null,
      startMouseX: 0,
      startElementTime: 0,
      clickOffsetTime: 0,
      currentTime: 0,
    },

    setDragState: (dragState) =>
      // 设置状态 - 更新状态值
      set((state) => ({
        dragState: { ...state.dragState, ...dragState },
      })),

    startDrag: (
      elementId,
      trackId,
      startMouseX,
      startElementTime,
      clickOffsetTime
    ) => {
      // 设置状态 - 更新状态值
      set({
        dragState: {
          isDragging: true,
          elementId,
          trackId,
          startMouseX,
          startElementTime,
          clickOffsetTime,
          currentTime: startElementTime,
        },
      });
    },

    updateDragTime: (currentTime) => {
      // 设置状态 - 更新状态值
      set((state) => ({
        dragState: {
          ...state.dragState,
          currentTime,
        },
      }));
    },

    endDrag: () => {
      // 设置状态 - 更新状态值
      set({
        dragState: {
          isDragging: false,
          elementId: null,
          trackId: null,
          startMouseX: 0,
          startElementTime: 0,
          clickOffsetTime: 0,
          currentTime: 0,
        },
      });
    },

    // Persistence methods
    loadProjectTimeline: async (projectId) => {
      try {
// 常量定义 - 模块内部使用的固定值
        const tracks = await storageService.loadTimeline(projectId);
        if (tracks) {
          // 🚀 修复：恢复媒体元素的文件引用
          const restoredTracks = await restoreMediaElementReferences(tracks, projectId);
          updateTracks(restoredTracks);

          // 🚀 修复：设置播放头到第一个视频元素的开始位置
          const playbackStore = usePlaybackStore.getState();
          const firstVideoElement = restoredTracks
            .flatMap(track => track.elements)
            .filter(element => element.type === 'media')
            .sort((a, b) => a.startTime - b.startTime)[0];

          if (firstVideoElement && playbackStore.currentTime === 0) {
            console.log(`🎬 设置播放头到第一个视频元素: ${firstVideoElement.startTime}s`);
            playbackStore.setCurrentTime(firstVideoElement.startTime);
          }
        } else {
          // No timeline saved yet, initialize with default
          const defaultTracks = ensureMainTrack([]);
          updateTracks(defaultTracks);
        }
        // Clear history when loading a project
        // 设置状态 - 更新状态值
        set({ history: [], redoStack: [] });
      } catch (error) {
        console.error("Failed to load timeline:", error);
        // Initialize with default on error
        const defaultTracks = ensureMainTrack([]);
        updateTracks(defaultTracks);
        // 设置状态 - 更新状态值
        set({ history: [], redoStack: [] });
      }
    },

    saveProjectTimeline: async (projectId) => {
      try {
        await storageService.saveTimeline(projectId, get()._tracks);
      } catch (error) {
        console.error("Failed to save timeline:", error);
      }
    },

    clearTimeline: () => {
// 常量定义 - 模块内部使用的固定值
      const defaultTracks = ensureMainTrack([]);
      updateTracks(defaultTracks);
      // 设置状态 - 更新状态值
      set({
        history: [],
        redoStack: [],
        selectedElements: [],
        addedMediaItems: new Set() // 清空已添加媒体状态
      });
    },

    // 🚀 新增：恢复媒体文件引用的公共方法
    restoreMediaReferences: async (projectId: string) => {
      const currentTracks = get()._tracks;
      const restoredTracks = await restoreMediaElementReferences(currentTracks, projectId);
      updateTracks(restoredTracks);
      console.log("✅ 媒体文件引用恢复完成");
    },

    // Snapping actions
    toggleSnapping: () => {
      // 设置状态 - 更新状态值
      set((state) => ({ snappingEnabled: !state.snappingEnabled }));
    },

    // Auto-scaling actions
    toggleAutoScale: () => {
      // 设置状态 - 更新状态值
      set((state) => ({ autoScaleEnabled: !state.autoScaleEnabled }));
    },

    // Ripple editing functions
    toggleRippleEditing: () => {
      // 设置状态 - 更新状态值
      set((state) => ({
        rippleEditingEnabled: !state.rippleEditingEnabled,
      }));
    },

    checkElementOverlap: (trackId, startTime, duration, excludeElementId) => {
// 常量定义 - 模块内部使用的固定值
      const track = get()._tracks.find((t) => t.id === trackId);
      if (!track) return false;

// 常量定义 - 模块内部使用的固定值
      const overlap = track.elements.some((element) => {
// 常量定义 - 模块内部使用的固定值
        const elementEnd =
          element.startTime +
          element.duration -
          element.trimStart -
          element.trimEnd;

        if (element.id === excludeElementId) {
          return false;
        }

        return (
          (startTime >= element.startTime && startTime < elementEnd) ||
          (startTime + duration > element.startTime &&
            startTime + duration <= elementEnd) ||
          (startTime < element.startTime && startTime + duration > elementEnd)
        );
      });
      return overlap;
    },

    findOrCreateTrack: (trackType) => {
      // Always create new text track to allow multiple text elements
      // Insert text tracks at the top
      if (trackType === "text") {
        return get().insertTrackAt(trackType, 0);
      }

// 常量定义 - 模块内部使用的固定值
      const existingTrack = get()._tracks.find((t) => t.type === trackType);
      if (existingTrack) {
        return existingTrack.id;
      }

      return get().addTrack(trackType);
    },

    addMediaAtTime: (item, currentTime = 0) => {
// 常量定义 - 模块内部使用的固定值
      const trackType = item.type === "audio" ? "audio" : "media";
// 常量定义 - 模块内部使用的固定值
      const targetTrackId = get().findOrCreateTrack(trackType);

// 常量定义 - 模块内部使用的固定值
      const duration =
        item.duration || TIMELINE_CONSTANTS.DEFAULT_IMAGE_DURATION;

      if (get().checkElementOverlap(targetTrackId, currentTime, duration)) {
        toast.error(
          "Cannot place element here - it would overlap with existing elements"
        );
        return false;
      }

      // 获取状态 - 读取状态值

      get().addElementToTrack(targetTrackId, {
        type: "media",
        mediaId: item.id,
        name: item.name,
        duration,
        startTime: currentTime,
        trimStart: 0,
        trimEnd: 0,
        // 创建媒体文件副本，确保时间轴元素独立于媒体库
        mediaFile: item.file,
        mediaUrl: item.url,
        thumbnailUrl: item.thumbnailUrl,
        mediaType: item.type,
        mediaWidth: item.width,
        mediaHeight: item.height,
        mediaFps: item.fps,
        horizontalFlip: false,
      });
      return true;
    },

    addTextAtTime: (item, currentTime = 0) => {
// 常量定义 - 模块内部使用的固定值
      const targetTrackId = get().insertTrackAt("text", 0); // Always create new text track at the top

      // 获取状态 - 读取状态值

      get().addElementToTrack(targetTrackId, {
        type: "text",
        name: item.name || "Text",
        content: item.content || "Default Text",
        duration: item.duration || TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
        startTime: currentTime,
        trimStart: 0,
        trimEnd: 0,
        fontSize: item.fontSize || 48,
        fontFamily: item.fontFamily || "Arial",
        color: item.color || "#ffffff",
        backgroundColor: item.backgroundColor || "transparent",
        textAlign: item.textAlign || "center",
        fontWeight: item.fontWeight || "normal",
        fontStyle: item.fontStyle || "normal",
        textDecoration: item.textDecoration || "none",
        x: item.x || 0,
        y: item.y || 0,
        rotation: item.rotation || 0,
        opacity: item.opacity !== undefined ? item.opacity : 1,
        horizontalFlip: false,
      });
      return true;
    },

    addMediaToNewTrack: (item) => {
// 常量定义 - 模块内部使用的固定值
      const trackType = item.type === "audio" ? "audio" : "media";
// 常量定义 - 模块内部使用的固定值
      const targetTrackId = get().findOrCreateTrack(trackType);

      // 获取状态 - 读取状态值

      get().addElementToTrack(targetTrackId, {
        type: "media",
        mediaId: item.id,
        name: item.name,
        duration: item.duration || TIMELINE_CONSTANTS.DEFAULT_IMAGE_DURATION,
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        // 创建媒体文件副本，确保时间轴元素独立于媒体库
        mediaFile: item.file,
        mediaUrl: item.url,
        thumbnailUrl: item.thumbnailUrl,
        mediaType: item.type,
        mediaWidth: item.width,
        mediaHeight: item.height,
        mediaFps: item.fps,
        horizontalFlip: false,
      });
      return true;
    },

    addTextToNewTrack: (item) => {
// 常量定义 - 模块内部使用的固定值
      const targetTrackId = get().insertTrackAt("text", 0); // Always create new text track at the top

      // 获取状态 - 读取状态值

      get().addElementToTrack(targetTrackId, {
        type: "text",
        name: item.name || "Text",
        content:
          ("content" in item ? item.content : "Default Text") || "Default Text",
        duration: TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
        startTime: 0,
        trimStart: 0,
        trimEnd: 0,
        fontSize: ("fontSize" in item ? item.fontSize : 48) || 48,
        fontFamily:
          ("fontFamily" in item ? item.fontFamily : "Arial") || "Arial",
        color: ("color" in item ? item.color : "#ffffff") || "#ffffff",
        backgroundColor:
          ("backgroundColor" in item ? item.backgroundColor : "transparent") ||
          "transparent",
        textAlign:
          ("textAlign" in item ? item.textAlign : "center") || "center",
        fontWeight:
          ("fontWeight" in item ? item.fontWeight : "normal") || "normal",
        fontStyle:
          ("fontStyle" in item ? item.fontStyle : "normal") || "normal",
        textDecoration:
          ("textDecoration" in item ? item.textDecoration : "none") || "none",
        x: ("x" in item ? item.x : 0) || 0,
        y: ("y" in item ? item.y : 0) || 0,
        rotation: ("rotation" in item ? item.rotation : 0) || 0,
        opacity:
          "opacity" in item && item.opacity !== undefined ? item.opacity : 1,
        horizontalFlip: false,
      });
      return true;
    },
    
    // 转场相关功能
    addTransitionBetweenElements: (
      fromTrackId: string,
      fromElementId: string,
      toTrackId: string,
      toElementId: string,
      transitionType: TransitionType,
      transitionParams: {
        direction: TransitionDirection;
        duration: number;
        easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
        intensity?: number;
        blur?: number;
      }
    ) => {
      // 获取状态 - 读取状态值
      get().pushHistory();

      // 获取要添加转场的元素信息
      const fromTrack = get()._tracks.find(t => t.id === fromTrackId);
      const fromElement = fromTrack?.elements.find(e => e.id === fromElementId);
      const toTrack = get()._tracks.find(t => t.id === toTrackId);
      const toElement = toTrack?.elements.find(e => e.id === toElementId);

      if (!fromElement || !toElement) return null;

      // 检查是否已经存在转场
      const existingTransition = get()._tracks.some(track => 
        track.elements.some(element => 
          element.type === "transition" &&
          element.fromElementId === fromElementId &&
          element.toElementId === toElementId
        )
      );

      if (existingTransition) {
        toast.error("这两个元素之间已经存在转场");
        return null;
      }

      // 创建转场元素
      const transitionElement: CreateTransitionElement = {
        name: `${transitionType} 转场`,
        type: "transition",
        transitionType,
        direction: transitionParams.direction,
        easing: transitionParams.easing,
        duration: transitionParams.duration,
        // 🚀 修复：正确计算转场位置，放在两个视频片段之间
        // 第一个视频的实际结束时间 - 转场时长的一半 = 转场开始时间
        startTime: fromElement.startTime + (fromElement.duration - fromElement.trimStart - fromElement.trimEnd) - transitionParams.duration / 2,
        trimStart: 0,
        trimEnd: 0,
        fromElementId,
        toElementId,
        fromTrackId,
        toTrackId,
        intensity: transitionParams.intensity || 1.0,
        blur: transitionParams.blur || 0.0,
      };

      // 将转场添加到起始元素的轨道上（同一轨道显示）
      const newTracks = get()._tracks.map(track => 
        track.id === fromTrackId
          ? {
              ...track,
              elements: [...track.elements, { ...transitionElement, id: generateUUID() }]
            }
          : track
      );

      updateTracksAndSave(newTracks);
      return generateUUID();
    },

    updateTransitionElement: (
      trackId: string,
      elementId: string,
      updates: Partial<{
        transitionType: TransitionType;
        direction: TransitionDirection;
        easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
        intensity: number;
        blur: number;
        duration: number;
      }>
    ) => {
      // 获取状态 - 读取状态值
      updateTracksAndSave(
        // 获取状态 - 读取状态值
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId && element.type === "transition"
                    ? {
                        ...element,
                        ...updates,
                      }
                    : element
                ),
              }
            : track
        )
      );
    },
    
    // 水平翻转选中的元素
    flipSelectedElements: () => {
      const selectedElements = get().selectedElements;
      if (selectedElements.length === 0) {
        toast.info("No elements selected to flip.");
        return;
      }

      const selectedElementIds = selectedElements.map(
        (item) => `${item.trackId}-${item.elementId}`
      );

      updateTracksAndSave(
        get()._tracks.map((track) => ({
          ...track,
          elements: track.elements.map((element) => {
            if (selectedElementIds.includes(`${track.id}-${element.id}`)) {
              if (element.type === "text") {
                return {
                  ...element,
                  horizontalFlip: !(element as TextElement).horizontalFlip,
                };
              } else if (element.type === "media") {
                return {
                  ...element,
                  horizontalFlip: !(element as any).horizontalFlip,
                };
              }
            }
            return element;
          }),
        }))
      );
      
      window.dispatchEvent(new CustomEvent("elements-flipped", { 
        detail: { elementIds: selectedElementIds } 
      }));
    },
    
    // 导出状态管理
    isExporting: false,
    setExporting: (exporting: boolean) => {
      set({ isExporting: exporting });
    },

    // 蒙板管理方法
    addMaskToElement: (trackId: string, elementId: string, maskConfig: MaskConfig) => {
      get().pushHistory();

      updateTracksAndSave(
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId
                    ? {
                        ...element,
                        masks: [...(element.masks || []), maskConfig],
                      }
                    : element
                ),
              }
            : track
        )
      );

      toast.success("蒙板已添加");
    },

    removeMaskFromElement: (trackId: string, elementId: string, maskId: string) => {
      get().pushHistory();

      updateTracksAndSave(
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId
                    ? {
                        ...element,
                        masks: (element.masks || []).filter(mask => mask.id !== maskId),
                      }
                    : element
                ),
              }
            : track
        )
      );

      toast.success("蒙板已删除");
    },

    updateElementMask: (trackId: string, elementId: string, maskId: string, updates: Partial<MaskConfig>) => {
      updateTracksAndSave(
        get()._tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                elements: track.elements.map((element) =>
                  element.id === elementId
                    ? {
                        ...element,
                        masks: (element.masks || []).map(mask =>
                          mask.id === maskId
                            ? { ...mask, ...updates }
                            : mask
                        ),
                      }
                    : element
                ),
              }
            : track
        )
      );
    },

    getMasksByElement: (trackId: string, elementId: string): MaskConfig[] => {
      const track = get()._tracks.find(t => t.id === trackId);
      if (!track) return [];

      const element = track.elements.find(e => e.id === elementId);
      return element?.masks || [];
    },
  };
});
