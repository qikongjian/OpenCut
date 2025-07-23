// media-processing.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/media-processing.ts
// 最后更新: 2025/7/23

// media-processing.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Sonner 通知组件
import { toast } from "sonner";
// 导入模块
import {
  getFileType,
  generateVideoThumbnail,
  getMediaDuration,
  getImageDimensions,
// MediaItem 类型定义
  type MediaItem,
} from "@/stores/media-store";
// 导入 FFmpeg 视频处理库
import { generateThumbnail, getVideoInfo } from "./ffmpeg-utils";

// 接口定义 - 定义对象的结构和属性类型
export interface ProcessedMediaItem extends Omit<MediaItem, "id"> {}

// processMediaFiles 函数
export async function processMediaFiles(
  files: FileList | File[],
  onProgress?: (progress: number) => void
): Promise<ProcessedMediaItem[]> {
// 常量定义 - 模块内部使用的固定值
  const fileArray = Array.from(files);
// 常量定义 - 模块内部使用的固定值
  const processedItems: ProcessedMediaItem[] = [];

// 常量定义 - 模块内部使用的固定值
  const total = fileArray.length;
  let completed = 0;

  for (const file of fileArray) {
// 常量定义 - 模块内部使用的固定值
    const fileType = getFileType(file);

    if (!fileType) {
      toast.error(`Unsupported file type: ${file.name}`);
      continue;
    }

// 常量定义 - 模块内部使用的固定值
    const url = URL.createObjectURL(file);
    let thumbnailUrl: string | undefined;
    let duration: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let fps: number | undefined;

    try {
      if (fileType === "image") {
        // Get image dimensions
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      } else if (fileType === "video") {
        try {
          // Use FFmpeg for comprehensive video info extraction
          const videoInfo = await getVideoInfo(file);
          duration = videoInfo.duration;
          width = videoInfo.width;
          height = videoInfo.height;
          fps = videoInfo.fps;

          // Generate thumbnail using FFmpeg
          thumbnailUrl = await generateThumbnail(file, 1);
        } catch (error) {
          console.warn(
            "FFmpeg processing failed, falling back to basic processing:",
            error
          );
          // Fallback to basic processing
          const videoResult = await generateVideoThumbnail(file);
          thumbnailUrl = videoResult.thumbnailUrl;
          width = videoResult.width;
          height = videoResult.height;
          duration = await getMediaDuration(file);
          // FPS will remain undefined for fallback
        }
      } else if (fileType === "audio") {
        // For audio, we don't set width/height/fps (they'll be undefined)
        duration = await getMediaDuration(file);
      }

      processedItems.push({
        name: file.name,
        type: fileType,
        file,
        url,
        thumbnailUrl,
        duration,
        width,
        height,
        fps,
      });

      // Yield back to the event loop to keep the UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));

      completed += 1;
      if (onProgress) {
// 常量定义 - 模块内部使用的固定值
        const percent = Math.round((completed / total) * 100);
        onProgress(percent);
      }
    } catch (error) {
      console.error("Error processing file:", file.name, error);
      toast.error(`Failed to process ${file.name}`);
      URL.revokeObjectURL(url); // Clean up on error
    }
  }

  return processedItems;
}
