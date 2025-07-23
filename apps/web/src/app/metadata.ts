// metadata.ts - Next.js 元数据配置
// 此文件包含 next.js 元数据配置 的相关代码
// 文件路径: app/metadata.ts
// 最后更新: 2025/7/23

// metadata.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Next.js 相关模块
import { Metadata } from "next";

// 常量定义 - 模块内部使用的固定值
const title = "OpenCut";
// 常量定义 - 模块内部使用的固定值
const description =
  "A simple but powerful video editor that gets the job done. In your browser.";
// 常量定义 - 模块内部使用的固定值
const openGraphImageUrl = "https://opencut.app/open-graph/default.jpg";
// 常量定义 - 模块内部使用的固定值
const twitterImageUrl = "/open-graph/default.jpg";

// 导出常量对象 - 包含多个相关常量的对象
export const baseMetaData: Metadata = {
  metadataBase: new URL("https://opencut.app"),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description,
    url: "https://opencut.app",
    siteName: "OpenCut",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: openGraphImageUrl,
        width: 1200,
        height: 630,
        alt: "OpenCut",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    description: description,
    creator: "@opencutapp",
    images: [twitterImageUrl],
  },
  pinterest: {
    richPin: false,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/icons/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/icons/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      {
        url: "/icons/apple-icon-114x114.png",
        sizes: "114x114",
        type: "image/png",
      },
      {
        url: "/icons/apple-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/icons/apple-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/icons/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/icons/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    title: title,
  },
  manifest: "/manifest.json",
  other: {
    "msapplication-config": "/browserconfig.xml",
  },
};
