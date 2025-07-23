// time.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/time.ts
// 最后更新: 2025/7/23

// time.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// Time-related utility functions

// to 函数
// Helper function to format time in various formats (MM:SS, HH:MM:SS, HH:MM:SS:CS, HH:MM:SS:FF)
export const formatTimeCode = (
  timeInSeconds: number,
  format: "MM:SS" | "HH:MM:SS" | "HH:MM:SS:CS" | "HH:MM:SS:FF" = "HH:MM:SS:CS",
  fps: number = 30
): string => {
// 常量定义 - 模块内部使用的固定值
  const hours = Math.floor(timeInSeconds / 3600);
// 常量定义 - 模块内部使用的固定值
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
// 常量定义 - 模块内部使用的固定值
  const seconds = Math.floor(timeInSeconds % 60);
// 常量定义 - 模块内部使用的固定值
  const centiseconds = Math.floor((timeInSeconds % 1) * 100);
// 常量定义 - 模块内部使用的固定值
  const frames = Math.floor((timeInSeconds % 1) * fps);

  switch (format) {
    case "MM:SS":
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    case "HH:MM:SS":
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    case "HH:MM:SS:CS":
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${centiseconds.toString().padStart(2, "0")}`;
    case "HH:MM:SS:FF":
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  }
};
