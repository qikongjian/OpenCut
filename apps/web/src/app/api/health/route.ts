// route.ts - Next.js API 路由
// 此文件包含 next.js api 路由 的相关代码
// 文件路径: app/api/health/route.ts
// 最后更新: 2025/7/23

// route.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Next.js 相关模块
import { NextRequest } from "next/server";

// GET 函数
export async function GET(request: NextRequest) {
  return new Response("OK", { status: 200 });
}
