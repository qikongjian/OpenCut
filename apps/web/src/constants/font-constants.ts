// font-constants.ts - 常量定义和配置
// 此文件包含 常量定义和配置 的相关代码
// 文件路径: constants/font-constants.ts
// 最后更新: 2025/7/23

// font-constants.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 接口定义 - 定义对象的结构和属性类型
export interface FontOption {
  value: string;
  label: string;
  category: "system" | "google" | "custom";
  weights?: number[];
  hasClassName?: boolean;
}

// 导出常量对象 - 包含多个相关常量的对象


// 导出常量对象 - 包含多个相关常量的对象
export const FONT_OPTIONS: FontOption[] = [
  // System fonts (always available)
  { value: "Arial", label: "Arial", category: "system", hasClassName: false },
  {
    value: "Helvetica",
    label: "Helvetica",
    category: "system",
    hasClassName: false,
  },
  {
    value: "Times New Roman",
    label: "Times New Roman",
    category: "system",
    hasClassName: false,
  },
  {
    value: "Georgia",
    label: "Georgia",
    category: "system",
    hasClassName: false,
  },

  // Google Fonts (loaded in layout.tsx)
  {
    value: "Inter",
    label: "Inter",
    category: "google",
    weights: [400, 700],
    hasClassName: true,
  },
  {
    value: "Roboto",
    label: "Roboto",
    category: "google",
    weights: [400, 700],
    hasClassName: true,
  },
  {
    value: "Open Sans",
    label: "Open Sans",
    category: "google",
    hasClassName: true,
  },
  {
    value: "Playfair Display",
    label: "Playfair Display",
    category: "google",
    hasClassName: true,
  },
  {
    value: "Comic Neue",
    label: "Comic Neue",
    category: "google",
    hasClassName: false,
  },
] as const;

// 导出常量对象 - 包含多个相关常量的对象


// 导出常量对象 - 包含多个相关常量的对象
export const DEFAULT_FONT = "Arial";

// Type-safe font family union
export type FontFamily = (typeof FONT_OPTIONS)[number]["value"];

// Helper functions
// 导出常量对象 - 包含多个相关常量的对象

// getFontByValue 函数 - 使用箭头函数定义的函数
export const getFontByValue = (value: string): FontOption | undefined =>
  FONT_OPTIONS.find((font) => font.value === value);

// getGoogleFonts 函数
// 导出常量对象 - 包含多个相关常量的对象
export const getGoogleFonts = (): FontOption[] =>
  FONT_OPTIONS.filter((font) => font.category === "google");

// getSystemFonts 函数
// 导出常量对象 - 包含多个相关常量的对象
export const getSystemFonts = (): FontOption[] =>
  FONT_OPTIONS.filter((font) => font.category === "system");
