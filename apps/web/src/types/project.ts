// project.ts - TypeScript 类型定义
// 此文件包含 typescript 类型定义 的相关代码
// 文件路径: types/project.ts
// 最后更新: 2025/7/23

// project.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 接口定义 - 定义对象的结构和属性类型
export interface TProject {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  mediaItems?: string[];
  backgroundColor?: string;
  backgroundType?: "color" | "blur";
  blurIntensity?: number; // in pixels (4, 8, 18)
  fps?: number;
}
