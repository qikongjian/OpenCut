// layout.tsx - Next.js 根布局组件
// 此文件包含 next.js 根布局组件 的相关代码
// 文件路径: app/layout.tsx
// 最后更新: 2025/7/23

// 导入主题管理组件，用于深色/浅色模式切换
import { ThemeProvider } from "next-themes";
// 导入 Vercel 分析组件，用于网站访问统计
import { Analytics } from "@vercel/analytics/react";
// 导入 Next.js 脚本组件，用于加载外部脚本
import Script from "next/script";
// 导入全局样式文件
import "./globals.css";
// 导入 Toast 通知组件
import { Toaster } from "../components/ui/sonner";
// 导入工具提示提供者组件
import { TooltipProvider } from "../components/ui/tooltip";
// 导入存储提供者组件，用于管理本地存储
import { StorageProvider } from "../components/storage-provider";
// 导入基础元数据配置
import { baseMetaData } from "./metadata";
// 导入默认字体配置
import { defaultFont } from "../lib/font-config";
// 导入机器人防护客户端包装组件，用于保护 API 路由
import { BotIdClientWrapper } from "../components/botid-client-wrapper";
// 导入环境变量配置
import { env } from "@/env";

// 导出元数据，用于 SEO 和页面信息
export const metadata = baseMetaData;



// 根布局组件，这是 Next.js 应用的顶层布局
// 默认导出组件 - 页面或主要组件
export default function RootLayout({
  children, // 子组件，即页面内容
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // HTML 根元素，设置语言为英文，禁用水合警告
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 机器人防护客户端，保护指定的 API 路由 */}
        <BotIdClientWrapper />
      </head>
      {/* 主体元素，应用默认字体和样式 */}
      <body className={`${defaultFont.className} font-sans antialiased`}>
        {/* 主题提供者，强制使用深色主题 */}
        <ThemeProvider attribute="class" forcedTheme="dark">
          {/* 工具提示提供者，为整个应用提供工具提示功能 */}
          <TooltipProvider>
            {/* 存储提供者，管理本地存储状态 */}
            <StorageProvider>{children}</StorageProvider>
            {/* Vercel 分析组件，收集网站访问数据 */}
            <Analytics />
            {/* Toast 通知组件，显示临时消息 */}
            <Toaster />
            {/* 数据统计脚本，用于网站分析 */}
            <Script
              src="https://cdn.databuddy.cc/databuddy.js"
              strategy="afterInteractive" // 在页面交互后加载
              async // 异步加载
              data-client-id="UP-Wcoy5arxFeK7oyjMMZ" // 客户端 ID
              data-disabled={env.NODE_ENV === "development"} // 开发环境禁用
              data-track-attributes={false} // 不跟踪属性
              data-track-errors={true} // 跟踪错误
              data-track-outgoing-links={false} // 不跟踪外链
              data-track-web-vitals={false} // 不跟踪网页性能指标
              data-track-sessions={false} // 不跟踪会话
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
