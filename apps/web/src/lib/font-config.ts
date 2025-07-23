// font-config.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/font-config.ts
// 最后更新: 2025/7/23

// font-config.ts - 配置文件
// 此文件包含 配置文件 的相关代码

// 导入模块
import {
  Inter,
  Roboto,
  Open_Sans,
  Playfair_Display,
  Comic_Neue,
} from "next/font/google";

// Configure all fonts
const inter = Inter({ subsets: ["latin"] });
// 常量定义 - 模块内部使用的固定值
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });
// 常量定义 - 模块内部使用的固定值
const openSans = Open_Sans({ subsets: ["latin"] });
// 常量定义 - 模块内部使用的固定值
const playfairDisplay = Playfair_Display({ subsets: ["latin"] });
// 常量定义 - 模块内部使用的固定值
const comicNeue = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"] });

// Export font class mapping for use in components
export const FONT_CLASS_MAP = {
  Inter: inter.className,
  Roboto: roboto.className,
  "Open Sans": openSans.className,
  "Playfair Display": playfairDisplay.className,
  "Comic Neue": comicNeue.className,
  Arial: "",
  Helvetica: "",
  "Times New Roman": "",
  Georgia: "",
} as const;

// Export individual fonts for use in layout
export const fonts = {
  inter,
  roboto,
  openSans,
  playfairDisplay,
  comicNeue,
};

// Default font for the body
export const defaultFont = inter;
