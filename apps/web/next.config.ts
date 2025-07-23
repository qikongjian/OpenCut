import type { NextConfig } from "next";

// Next.js 应用配置
const nextConfig: NextConfig = {
  // 编译器配置
  compiler: {
    // 生产环境移除 console 语句，减少打包体积
    removeConsole: process.env.NODE_ENV === "production",
  },
  // 启用 React 严格模式，帮助发现潜在问题
  reactStrictMode: true,
  // 生产环境生成源码映射，便于调试
  productionBrowserSourceMaps: true,
  // 输出模式：独立部署，包含所有依赖
  output: "standalone",
  // 图片配置
  images: {
    // 允许的远程图片域名
    remotePatterns: [
      // Unsplash 图片服务
      { protocol: "https", hostname: "images.unsplash.com" },
      // Google 用户头像服务
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
