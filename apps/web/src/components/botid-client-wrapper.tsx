"use client";

import dynamic from "next/dynamic";

// 动态导入机器人防护客户端组件，避免服务端渲染
const BotIdClient = dynamic(() => import("botid/client").then(mod => ({ default: mod.BotIdClient })), {
  ssr: false,
});

// 定义需要保护的 API 路由配置
// 这些路由将受到 BotId 的机器人防护
const protectedRoutes = [
  {
    path: "/api/waitlist", // 保护等待列表 API
    method: "POST", // 只保护 POST 请求
  },
];

// BotId 客户端包装组件
export function BotIdClientWrapper() {
  return <BotIdClient protect={protectedRoutes} />;
} 