// middleware.ts - Next.js 中间件
// 此文件包含 next.js 中间件 的相关代码
// 文件路径: middleware.ts
// 最后更新: 2025/7/23

// middleware.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Next.js 相关模块
import { NextResponse } from "next/server";
// 导入 Next.js 相关模块
import type { NextRequest } from "next/server";

// middleware 函数
export async function middleware(request: NextRequest) {
  // Handle fuckcapcut.com domain redirect
  if (request.headers.get("host") === "fuckcapcut.com") {
    return NextResponse.redirect("https://opencut.app/why-not-capcut", 301);
  }

  return NextResponse.next();
}

// 导出常量对象 - 包含多个相关常量的对象
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
