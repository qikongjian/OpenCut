// transition-utils.ts - 转场处理工具函数
// 此文件包含 转场处理工具函数 的相关代码
// 文件路径: lib/transition-utils.ts
// 最后更新: 2025/7/23

import { TransitionType, TransitionDirection } from "@/types/timeline";
import React from "react";

// 转场参数接口
export interface TransitionParams {
  type: TransitionType;
  direction: TransitionDirection;
  duration: number; // 转场持续时间（秒）
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  intensity?: number; // 转场强度 (0-1)
  blur?: number; // 模糊程度 (0-1)
}

// 生成转场FFmpeg滤镜命令
export function generateTransitionFilter(
  fromVideo: string, // 起始视频文件路径
  toVideo: string,   // 目标视频文件路径
  params: TransitionParams
): string {
  const { type, direction, duration, easing, intensity = 1.0, blur = 0.0 } = params;
  
  switch (type) {
    case "fade":
      return generateFadeTransition(fromVideo, toVideo, params);
    case "slide":
      return generateSlideTransition(fromVideo, toVideo, params);
    case "zoom":
      return generateZoomTransition(fromVideo, toVideo, params);
    case "wipe":
      return generateWipeTransition(fromVideo, toVideo, params);
    case "dissolve":
      return generateDissolveTransition(fromVideo, toVideo, params);
    case "flash":
      return generateFlashTransition(fromVideo, toVideo, params);
    default:
      throw new Error(`不支持的转场类型: ${type}`);
  }
}

// 生成淡入淡出转场
function generateFadeTransition(
  fromVideo: string,
  toVideo: string,
  params: TransitionParams
): string {
  const { direction, duration, easing } = params;
  
  if (direction === "in") {
    // 淡入效果
    return `[0:v]fade=t=in:st=0:d=${duration}[fadein];[1:v]format=yuva420p[to];[fadein][to]overlay=format=yuv420p`;
  } else if (direction === "out") {
    // 淡出效果
    return `[0:v]fade=t=out:st=${duration}:d=${duration}[fadeout];[1:v]format=yuva420p[to];[fadeout][to]overlay=format=yuv420p`;
  } else {
    // 交叉淡入淡出
    return `[0:v]fade=t=out:st=${duration}:d=${duration}[fadeout];[1:v]fade=t=in:st=0:d=${duration}[fadein];[fadeout][fadein]overlay=format=yuv420p`;
  }
}

// 生成滑动转场
function generateSlideTransition(
  fromVideo: string,
  toVideo: string,
  params: TransitionParams
): string {
  const { direction, duration, easing } = params;
  
  // 根据方向生成滑动效果
  let slideDirection = "";
  switch (direction) {
    case "left":
      slideDirection = "slide=slide=left";
      break;
    case "right":
      slideDirection = "slide=slide=right";
      break;
    case "up":
      slideDirection = "slide=slide=up";
      break;
    case "down":
      slideDirection = "slide=slide=down";
      break;
    default:
      slideDirection = "slide=slide=left";
  }
  
  return `[0:v]${slideDirection}:duration=${duration}[slideout];[1:v]format=yuva420p[to];[slideout][to]overlay=format=yuv420p`;
}

// 生成缩放转场
function generateZoomTransition(
  fromVideo: string,
  toVideo: string,
  params: TransitionParams
): string {
  const { direction, duration, intensity } = params;
  
  if (direction === "in") {
    // 放大进入
    return `[0:v]scale=iw*${intensity}:ih*${intensity}:duration=${duration}[zoomin];[1:v]format=yuva420p[to];[zoomin][to]overlay=format=yuv420p`;
  } else {
    // 缩小退出
    return `[0:v]scale=iw/${intensity}:ih/${intensity}:duration=${duration}[zoomout];[1:v]format=yuva420p[to];[zoomout][to]overlay=format=yuv420p`;
  }
}

// 生成擦除转场
function generateWipeTransition(
  fromVideo: string,
  toVideo: string,
  params: TransitionParams
): string {
  const { direction, duration } = params;
  
  // 根据方向生成擦除效果
  let wipeDirection = "";
  switch (direction) {
    case "left":
      wipeDirection = "wipe=wipe=left";
      break;
    case "right":
      wipeDirection = "wipe=wipe=right";
      break;
    case "up":
      wipeDirection = "wipe=wipe=up";
      break;
    case "down":
      wipeDirection = "wipe=wipe=down";
      break;
    default:
      wipeDirection = "wipe=wipe=left";
  }
  
  return `[0:v]${wipeDirection}:duration=${duration}[wipeout];[1:v]format=yuva420p[to];[wipeout][to]overlay=format=yuv420p`;
}

// 生成溶解转场
function generateDissolveTransition(
  fromVideo: string,
  toVideo: string,
  params: TransitionParams
): string {
  const { duration, intensity = 1.0 } = params;

  // 叠化转场：两个画面整体透明度平滑渐变的溶解效果
  // 使用xfade的dissolve模式实现平滑的透明度渐变
  // offset设为0，让转场从第一个视频的结尾开始
  return `[0:v][1:v]xfade=transition=dissolve:duration=${duration}:offset=0[v]`;
}

// 生成闪黑/闪白转场
function generateFlashTransition(
  fromVideo: string,
  toVideo: string,
  params: TransitionParams
): string {
  const { direction, duration } = params;
  const flashDuration = duration; // 使用完整时长作为闪光时间

  if (direction === "in") {
    // 闪黑转场：画面快速切至全黑并回到新画面的过渡效果
    // 使用fade滤镜实现快速闪黑效果
    return `[0:v][1:v]xfade=transition=fadeblack:duration=${flashDuration}:offset=0[v]`;
  } else {
    // 闪白转场：画面快速切至全白并回到新画面的过渡效果
    // 使用fade滤镜实现快速闪白效果
    return `[0:v][1:v]xfade=transition=fadewhite:duration=${flashDuration}:offset=0[v]`;
  }
}

// 生成完整的转场FFmpeg命令
export function generateTransitionCommand(
  inputFiles: string[],
  outputFile: string,
  transitionParams: TransitionParams,
  videoSettings: {
    width: number;
    height: number;
    fps: number;
    duration: number;
  }
): string {
  const { width, height, fps, duration } = videoSettings;
  const { type, direction, duration: transitionDuration } = transitionParams;
  
  // 基础输入文件
  const inputs = inputFiles.map(file => `-i "${file}"`).join(" ");
  
  // 生成滤镜链
  const filterChain = generateTransitionFilter(
    inputFiles[0],
    inputFiles[1],
    transitionParams
  );
  
  // 输出设置
  const outputSettings = [
    `-vf "${filterChain}"`,
    `-c:v libx264`,
    `-preset fast`,
    `-crf 23`,
    `-pix_fmt yuv420p`,
    `-r ${fps}`,
    `-t ${duration}`,
    `-y "${outputFile}"`
  ].join(" ");
  
  return `ffmpeg ${inputs} ${outputSettings}`;
}

// 转场预览生成
export async function generateTransitionPreview(
  fromVideoUrl: string,
  toVideoUrl: string,
  params: TransitionParams
): Promise<string> {
  // TODO: 实现转场预览生成
  // 这里可以使用Canvas或WebGL生成转场预览
  console.log("生成转场预览:", params);
  return "";
}

// 验证转场参数
export function validateTransitionParams(params: TransitionParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 检查转场类型
  if (!["fade", "slide", "zoom", "wipe", "dissolve"].includes(params.type)) {
    errors.push("无效的转场类型");
  }
  
  // 检查方向
  if (!["left", "right", "up", "down", "in", "out"].includes(params.direction)) {
    errors.push("无效的转场方向");
  }
  
  // 检查持续时间
  if (params.duration <= 0 || params.duration > 10) {
    errors.push("转场持续时间必须在0-10秒之间");
  }
  
  // 检查缓动函数
  if (!["linear", "ease-in", "ease-out", "ease-in-out"].includes(params.easing)) {
    errors.push("无效的缓动函数");
  }
  
  // 检查强度
  if (params.intensity && (params.intensity < 0 || params.intensity > 1)) {
    errors.push("转场强度必须在0-1之间");
  }
  
  // 检查模糊
  if (params.blur && (params.blur < 0 || params.blur > 1)) {
    errors.push("模糊程度必须在0-1之间");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 获取转场默认参数
export function getDefaultTransitionParams(type: TransitionType): TransitionParams {
  const defaults: Record<TransitionType, TransitionParams> = {
    fade: {
      type: "fade",
      direction: "in",
      duration: 1.0,
      easing: "ease-in-out",
      intensity: 1.0,
      blur: 0.0
    },
    slide: {
      type: "slide",
      direction: "left",
      duration: 1.0,
      easing: "ease-out",
      intensity: 1.0,
      blur: 0.0
    },
    zoom: {
      type: "zoom",
      direction: "in",
      duration: 1.5,
      easing: "ease-out",
      intensity: 1.2,
      blur: 0.0
    },
    wipe: {
      type: "wipe",
      direction: "left",
      duration: 1.0,
      easing: "linear",
      intensity: 1.0,
      blur: 0.0
    },
    dissolve: {
      type: "dissolve",
      direction: "in",
      duration: 0.8, // 默认0.8秒，符合你的需求范围
      easing: "linear",
      intensity: 1.0,
      blur: 0.1
    },
    flash: {
      type: "flash",
      direction: "in", // "in" = 闪黑, "out" = 闪白
      duration: 0.2, // 默认0.2秒，符合你的需求范围
      easing: "linear",
      intensity: 1.0,
      blur: 0.0
    }
  };
  
  return defaults[type];
}

// 获取转场图标 - 专业的转场图标
export function getTransitionIcon(type: TransitionType, direction: TransitionDirection): React.ReactNode {
  // 使用简洁的Unicode符号，专业且清晰
  return React.createElement('span', {
    style: {
      fontSize: '10px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, '⇄'); // 双向箭头，表示转场效果
}

// 获取转场颜色类名 - 使用系统设计规范
export function getTransitionColor(type: TransitionType): string {
  const colors = {
    fade: "border-primary bg-primary/10",
    slide: "border-chart-2 bg-chart-2/10",
    zoom: "border-chart-3 bg-chart-3/10",
    wipe: "border-chart-5 bg-chart-5/10",
    dissolve: "border-chart-4 bg-chart-4/10",
    flash: "border-destructive bg-destructive/10"
  };

  return colors[type] || "border-border bg-muted/20";
}

// 获取转场名称
export function getTransitionName(type: TransitionType, direction: TransitionDirection): string {
  const names = {
    fade: direction === "in" ? "淡入" : direction === "out" ? "淡出" : "交叉淡入淡出",
    slide: `滑动${direction === "left" ? "向左" : direction === "right" ? "向右" : direction === "up" ? "向上" : "向下"}`,
    zoom: direction === "in" ? "放大进入" : "缩小退出",
    wipe: `擦除${direction === "left" ? "向左" : direction === "right" ? "向右" : direction === "up" ? "向上" : "向下"}`,
    dissolve: "叠化",
    flash: direction === "in" ? "闪黑" : "闪白"
  };

  return names[type] || "转场";
}
